/**
 * Cumulus: distinct fair-weather clouds — a row of overlapping puffs whose
 * radii peak mid-cloud, cut flat along a base line, with a single
 * top-to-bottom shading gradient per cloud rather than per puff.
 */

import { CLOUD_SHADE_RGB } from './colors';
import { makeCoverageInvCdf, sampleCoverageStats } from './coverageEnvelope';

const SHADE = CLOUD_SHADE_RGB;

function drawOneCloud(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  cloudW: number,
  rng: () => number,
): void {
  const maxR = cloudW * 0.26;
  const pad = Math.ceil(maxR);
  const tempW = Math.ceil(cloudW + pad * 2);
  const tempH = Math.ceil(maxR * 2 + pad);
  const baseLine = tempH - 1; // flat base sits at the bottom of the temp canvas

  const temp = document.createElement('canvas');
  temp.width = tempW;
  temp.height = tempH;
  const t = temp.getContext('2d');
  if (!t) return;

  // Puffs along the base; envelope peaks in the middle for a domed silhouette.
  // Centers sit low so the solid part of each puff crosses the canvas bottom,
  // which clips into the crisp flat base.
  const puffCount = 4 + Math.round(rng() * 3);
  const puffs: Array<{ px: number; py: number; r: number }> = [];
  for (let i = 0; i < puffCount; i++) {
    const ft = i / (puffCount - 1);
    const env = 0.5 + 0.5 * Math.sin(Math.PI * (0.12 + 0.76 * ft));
    const r = maxR * env * (0.85 + rng() * 0.3);
    const px = pad + ft * cloudW + (rng() - 0.5) * maxR * 0.4;
    // Some puffs ride higher so their rounded undersides hang above the flat
    // cut — scallops the base so it doesn't read as a ruler line
    const lift = rng() < 0.35 ? r * 0.35 : 0;
    const py = baseLine - r * (0.4 + rng() * 0.3) - lift;

    const puff = t.createRadialGradient(px, py, 0, px, py, r);
    puff.addColorStop(0, 'rgba(255, 255, 255, 1)');
    puff.addColorStop(0.95, 'rgba(255, 255, 255, 0.98)');
    puff.addColorStop(1, 'rgba(255, 255, 255, 0)');
    t.beginPath();
    t.arc(px, py, r, 0, Math.PI * 2);
    t.fillStyle = puff;
    t.fill();
    puffs.push({ px, py, r });
  }

  // Soft per-puff under-shading gives the interior form — kept well below
  // the strength that made the old renderer read as bubble wrap. Done as a
  // second pass over the finished silhouette: inline shading gets painted
  // over by the next puff, flattening the interior to plain white.
  t.globalCompositeOperation = 'source-atop';
  for (const pf of puffs) {
    const puffShade = t.createLinearGradient(pf.px, pf.py - pf.r, pf.px, pf.py + pf.r);
    puffShade.addColorStop(0, `rgba(${SHADE}, 0)`);
    puffShade.addColorStop(0.55, `rgba(${SHADE}, 0)`);
    puffShade.addColorStop(1, `rgba(${SHADE}, 0.15)`);
    t.save();
    t.beginPath();
    t.arc(pf.px, pf.py, pf.r, 0, Math.PI * 2);
    t.clip();
    t.fillStyle = puffShade;
    t.fillRect(pf.px - pf.r, pf.py - pf.r, pf.r * 2, pf.r * 2);
    t.restore();
  }

  // One shading gradient across the whole cloud: bright dome, dusky base.
  // Confined to the lower portion so the body stays white.
  const shade = t.createLinearGradient(0, 0, 0, baseLine);
  shade.addColorStop(0, `rgba(${SHADE}, 0)`);
  shade.addColorStop(0.6, `rgba(${SHADE}, 0.05)`);
  shade.addColorStop(1, `rgba(${SHADE}, 0.32)`);
  t.fillStyle = shade;
  t.fillRect(0, 0, tempW, tempH);
  t.globalCompositeOperation = 'source-over';

  ctx.drawImage(temp, Math.round(cx - cloudW / 2 - pad), Math.round(baseY - baseLine));
}

export function drawCumulus(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  coverageAt: (x: number) => number,
  rng: () => number,
  floorAt?: (x: number) => number,
): void {
  const { mean: meanCov } = sampleCoverageStats(coverageAt, width);
  const invCdf = makeCoverageInvCdf(coverageAt, width);

  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;
  const off = offscreen.getContext('2d');
  if (!off) return;

  // Fewer, larger clouds — small ones read as dots from across the room.
  // Count scales with width and coverage; cloud size with local coverage.
  // Narrow canvases (a short daylight sliver at dawn/dusk) drop the 2-cloud
  // minimum — forcing 2 center-clamped clouds into ~40px stacks them into
  // one oversized blob.
  const count = Math.max(width >= 160 ? 2 : 1, Math.round((width / 70) * (0.4 + meanCov * 2.4)));

  // Size and place a single cloud centred near cx. Factored out so the
  // guaranteed-cloud fallback below takes the exact same path as the loop.
  const buildCloudAt = (cx: number): { cx: number; baseY: number; cloudW: number } => {
    const localCov = coverageAt(Math.max(0, Math.min(width - 1, cx)));
    // Size from the local sky depth (the band above the temperature line, or
    // the full canvas height without a floor), never the width: the depth is
    // constant while width changes, so a depth-driven cloud looks identical
    // whether the card is narrow or wide. Full-height sizing made puffs span
    // a third of the card when the terrain squeezed the sky band.
    const skyH = floorAt ? floorAt(Math.max(0, Math.min(width - 1, cx))) : height;
    let cloudW = skyH * (0.8 + localCov * 0.45) * (0.85 + rng() * 0.3);
    const baseRoll = rng();
    let baseY = height * (0.4 + baseRoll * 0.25);
    if (floorAt) {
      // Scatter bases through the sky band above the temperature line. Capped
      // below 1.0× the floor so the flat base always stays above the horizon —
      // higher rolls used to push baseY past the line (up to 1.1×), dropping
      // the cloud down behind the terrain.
      baseY = skyH * (0.4 + baseRoll * 0.5);
      // Shrink only when space is truly tight — let domes ride high and clip
      // slightly at the canvas top rather than shrinking with the mound
      cloudW = Math.min(cloudW, Math.max(20, baseY * 2.1));
    }

    // Clamp only so a cloud can't overflow a narrow daylight sliver
    // (sunrise/sunset); on normal widths this never binds.
    cloudW = Math.min(cloudW, width * 0.72);

    // Keep whole clouds inside the canvas: a cloud chopped at an interval
    // edge (sunrise/sunset) reads as a vertical bar
    const halfSpan = cloudW * 0.76;
    const clampedCx =
      width >= halfSpan * 2 ? Math.max(halfSpan, Math.min(width - halfSpan, cx)) : width / 2;
    return { cx: clampedCx, baseY, cloudW };
  };

  const clouds: Array<{ cx: number; baseY: number; cloudW: number }> = [];
  for (let i = 0; i < count; i++) {
    // Stratified slots with jitter, mapped through the coverage inverse-CDF
    // so cloud density follows the envelope (identity at constant coverage)
    const cx = invCdf((i + 0.5 + (rng() - 0.5) * 0.9) / count);
    const localCov = coverageAt(Math.max(0, Math.min(width - 1, cx)));

    // Thin out clouds in low-coverage regions — controls density, not brightness
    if (rng() > localCov + 0.4) continue;

    clouds.push(buildCloudAt(cx));
  }

  // The caller only invokes this renderer when coverage is non-trivial, so the
  // cumulus layer must never end up empty. A low cloud count plus unlucky
  // thinning rolls can drop every cloud — which read as clouds vanishing
  // entirely while resizing. Guarantee one at the coverage centroid.
  if (clouds.length === 0) {
    clouds.push(buildCloudAt(invCdf(0.5)));
  }

  // Draw back-to-front: higher (further) clouds first, so lower clouds always
  // overlap them — random stacking makes the overlaps look off
  clouds.sort((a, b) => a.baseY - b.baseY);
  for (const c of clouds) {
    drawOneCloud(off, c.cx, c.baseY, c.cloudW, rng);
  }

  ctx.drawImage(offscreen, 0, 0);
}
