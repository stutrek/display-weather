/**
 * Cumulus: distinct fair-weather clouds — a row of overlapping puffs whose
 * radii peak mid-cloud, cut flat along a base line, with a single
 * top-to-bottom shading gradient per cloud rather than per puff.
 */

// Shadow tone for cloud undersides — a deepened sky blue rather than slate
const SHADE = '70, 155, 195';

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

    // Soft per-puff under-shading gives the interior form — kept well below
    // the strength that made the old renderer read as bubble wrap
    const puffShade = t.createLinearGradient(px, py - r, px, py + r);
    puffShade.addColorStop(0, `rgba(${SHADE}, 0)`);
    puffShade.addColorStop(0.55, `rgba(${SHADE}, 0)`);
    puffShade.addColorStop(1, `rgba(${SHADE}, 0.15)`);
    t.save();
    t.beginPath();
    t.arc(px, py, r, 0, Math.PI * 2);
    t.clip();
    t.fillStyle = puffShade;
    t.fillRect(px - r, py - r, r * 2, r * 2);
    t.restore();
  }

  // One shading gradient across the whole cloud: bright dome, dusky base.
  // Confined to the lower portion so the body stays white.
  t.globalCompositeOperation = 'source-atop';
  const shade = t.createLinearGradient(0, 0, 0, baseLine);
  shade.addColorStop(0, `rgba(${SHADE}, 0)`);
  shade.addColorStop(0.65, `rgba(${SHADE}, 0.04)`);
  shade.addColorStop(1, `rgba(${SHADE}, 0.26)`);
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
): void {
  const midCov = coverageAt(width / 2);

  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;
  const off = offscreen.getContext('2d');
  if (!off) return;

  // Fewer, larger clouds — small ones read as dots from across the room.
  // Count scales with width and coverage; cloud size with local coverage.
  const count = Math.max(2, Math.round((width / 70) * (0.4 + midCov * 2.4)));

  const clouds: Array<{ cx: number; baseY: number; cloudW: number }> = [];
  for (let i = 0; i < count; i++) {
    // Stratified placement: one slot per cloud with jitter, so high coverage
    // fills the strip instead of clumping clouds on top of each other
    const cx = ((i + 0.5 + (rng() - 0.5) * 0.9) / count) * width;
    const localCov = coverageAt(Math.max(0, Math.min(width - 1, cx)));

    // Thin out clouds in low-coverage regions — controls density, not brightness
    if (rng() > localCov + 0.4) continue;

    const cloudW = Math.min((40 + rng() * 55) * (0.6 + localCov * 0.6), height * 1.1);
    const baseY = height * (0.4 + rng() * 0.25);
    clouds.push({ cx, baseY, cloudW });
  }

  // Draw back-to-front: higher (further) clouds first, so lower clouds always
  // overlap them — random stacking makes the overlaps look off
  clouds.sort((a, b) => a.baseY - b.baseY);
  for (const c of clouds) {
    drawOneCloud(off, c.cx, c.baseY, c.cloudW, rng);
  }

  ctx.drawImage(offscreen, 0, 0);
}
