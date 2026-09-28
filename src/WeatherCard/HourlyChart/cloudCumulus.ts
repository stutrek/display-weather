/**
 * Cumulus: distinct fair-weather clouds — a row of overlapping puffs whose
 * radii peak mid-cloud, cut flat along a base line, with a single
 * top-to-bottom shading gradient per cloud rather than per puff.
 */

import { CLOUD_SHADE_RGB } from './colors';
import { makeCoverageInvCdf, sampleCoverageStats, targetPixelCoverage } from './coverageEnvelope';
import { createMask, fillToCoverage } from './coverageFill';

const SHADE = CLOUD_SHADE_RGB;

interface Cloud {
  cx: number;
  baseY: number;
  cloudW: number;
  puffs: Array<{ px: number; py: number; r: number }>;
  pad: number;
  tempW: number;
  tempH: number;
  baseLine: number;
}

/** Lay out one cloud's puffs. Geometry only, so it can be stamped and drawn. */
function buildCloud(cx: number, baseY: number, cloudW: number, rng: () => number): Cloud {
  const maxR = cloudW * 0.26;
  const pad = Math.ceil(maxR);
  const tempW = Math.ceil(cloudW + pad * 2);
  const tempH = Math.ceil(maxR * 2 + pad);
  const baseLine = tempH - 1; // flat base sits at the bottom of the temp canvas

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
    puffs.push({ px, py, r });
  }
  return { cx, baseY, cloudW, puffs, pad, tempW, tempH, baseLine };
}

function drawOneCloud(ctx: CanvasRenderingContext2D, cloud: Cloud): void {
  const { puffs, tempW, tempH, baseLine } = cloud;
  const temp = document.createElement('canvas');
  temp.width = tempW;
  temp.height = tempH;
  const t = temp.getContext('2d');
  if (!t) return;

  for (const { px, py, r } of puffs) {
    const puff = t.createRadialGradient(px, py, 0, px, py, r);
    puff.addColorStop(0, 'rgba(255, 255, 255, 1)');
    puff.addColorStop(0.95, 'rgba(255, 255, 255, 0.98)');
    puff.addColorStop(1, 'rgba(255, 255, 255, 0)');
    t.beginPath();
    t.arc(px, py, r, 0, Math.PI * 2);
    t.fillStyle = puff;
    t.fill();
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

  ctx.drawImage(
    temp,
    Math.round(cloud.cx - cloud.cloudW / 2 - cloud.pad),
    Math.round(cloud.baseY - baseLine),
  );
}

export interface CloudFillOptions {
  /** Shared coverage mask holding the layers already drawn behind this one */
  mask?: CanvasRenderingContext2D;
  /** Target share of sky pixels covered at x; defaults from coverageAt */
  targetAt?: (x: number) => number;
}

export function drawCumulus(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  coverageAt: (x: number) => number,
  rng: () => number,
  floorAt?: (x: number) => number,
  fill: CloudFillOptions = {},
): void {
  const { max: maxCov } = sampleCoverageStats(coverageAt, width);
  if (maxCov < 0.005) return;
  const floor = (x: number): number =>
    floorAt ? floorAt(Math.max(0, Math.min(width - 1, x))) : height;
  const mask = fill.mask ?? createMask(width, height);
  if (!mask) return;

  // Size and place a single cloud whose visible mass centres on (x, y).
  const buildAt = (x: number, y: number, skyH: number): Cloud => {
    const localCov = coverageAt(Math.max(0, Math.min(width - 1, x)));
    // Size from the local sky depth, never the width, so a cloud looks the
    // same on a narrow or wide card. Perspective: clouds overhead (high in the
    // band) are nearer and larger, those at the horizon distant and small —
    // which also packs the low band that a uniform size left blue.
    const alt = 1 - Math.max(0, Math.min(1, y / skyH));
    const perspective = 0.6 + 0.6 * alt;
    let cloudW = skyH * (0.8 + localCov * 0.45) * (0.85 + rng() * 0.3) * perspective;
    // Clamp only so a cloud can't overflow a narrow daylight sliver
    // (sunrise/sunset); on normal widths this never binds.
    cloudW = Math.min(cloudW, width * 0.72);
    // Visible dome is about a third of the width; hang the base below the
    // requested centre, but never past the horizon — a base behind the
    // terrain drops the whole cloud out of sight.
    const baseY = Math.min(skyH, y + cloudW * 0.16);

    // Keep whole clouds inside the canvas: a cloud chopped at an interval
    // edge (sunrise/sunset) reads as a vertical bar
    const halfSpan = cloudW * 0.76;
    const cx =
      width >= halfSpan * 2 ? Math.max(halfSpan, Math.min(width - halfSpan, x)) : width / 2;
    return buildCloud(cx, baseY, cloudW, rng);
  };

  const clouds = fillToCoverage<Cloud>({
    width,
    height,
    floorAt: floor,
    targetAt: fill.targetAt ?? ((x) => targetPixelCoverage(coverageAt(x))),
    rng,
    mask,
    build: ({ x, y, floor: skyH }) => buildAt(x, y, skyH),
    stamp: (m, c) => {
      drawOneCloud(m, c);
      return { x0: c.cx - c.cloudW, x1: c.cx + c.cloudW };
    },
    maxBodies: Math.max(4, Math.round(width / 12)),
  });

  // The caller only invokes this renderer when coverage is non-trivial, so the
  // layer must never end up empty (a front layer can be fully topped up by
  // the ones behind it — then it has nothing to add, which is fine).
  if (clouds.length === 0 && !fill.mask) {
    const x = makeCoverageInvCdf(coverageAt, width)(0.5);
    clouds.push(buildAt(x, floor(x) * 0.6, floor(x)));
  }

  // Draw back-to-front: higher (further) clouds first, so lower clouds always
  // overlap them — random stacking makes the overlaps look off
  clouds.sort((a, b) => a.baseY - b.baseY);
  for (const c of clouds) drawOneCloud(ctx, c);
}
