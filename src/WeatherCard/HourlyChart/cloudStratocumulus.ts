/**
 * Stratocumulus: a low, extensive layer of larger organized cloud masses —
 * the classic "grey blanket with lumps." Cells are 2–3× the size of stratus
 * elements, puffier and more distinct, forming loose clumps with heavier
 * undersides and wider gaps between groups.
 *
 * Same F–S dithering backbone as stratus but with a coarser grid, more lobes
 * per cluster, stronger underside shading, and reduced perspective recession
 * (stratocumulus sits in a flat layer rather than receding steeply).
 */

import { sampleCoverageStats } from './coverageEnvelope';

// Slightly greyer sky-family tint so the heavier undersides read as substantial.
const SHADE = '100, 175, 220';

interface Puff {
  cx: number;
  cy: number;
  r: number;
}

export function drawStratocumulus(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  coverageAt: (x: number) => number,
  rng: () => number,
  floorAt?: (x: number) => number,
): void {
  const { mean: meanCov } = sampleCoverageStats(coverageAt, width);
  if (meanCov < 0.005) return;

  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;
  const off = offscreen.getContext('2d');
  if (!off) return;

  let bottomY = height;
  if (floorAt) {
    let minFloor = height;
    const n = Math.max(8, Math.round(width / 24));
    for (let i = 0; i < n; i++) minFloor = Math.min(minFloor, floorAt(((i + 0.5) / n) * width));
    bottomY = minFloor * 0.94;
  }

  // Larger base cell → fewer, bigger clouds per unit area.
  const baseCell = Math.max(16, height * 0.38);
  const puffs: Puff[] = [];

  const spawnCloudlet = (cx: number, cy: number, radius: number): void => {
    const lobeCount = 5 + Math.floor(rng() * 4); // 5–8: wider, blobby masses
    for (let l = 0; l < lobeCount; l++) {
      const ang = rng() * Math.PI * 2;
      const dist = radius * 0.55 * Math.sqrt(rng());
      const lx = cx + Math.cos(ang) * dist;
      // More horizontal squash → flat slab shape
      const ly = cy + Math.sin(ang) * dist * 0.6;
      const lr = radius * (0.45 + rng() * 0.32);
      puffs.push({ cx: lx, cy: ly, r: lr });
    }
  };

  const g = Math.max(5, baseCell * 0.6);
  const gridCols = Math.ceil(width / g) + 1;
  const gridRows = Math.ceil((bottomY + baseCell) / g) + 1;
  // Higher GAIN → more cells fire at the same coverage level (cells are bigger
  // so fewer are needed to fill the strip, but we want them to appear at lower coverage).
  const GAIN = 0.22;
  let errCurr = new Float32Array(gridCols + 2);
  let errNext = new Float32Array(gridCols + 2);

  for (let ry = 0; ry < gridRows; ry++) {
    const y = ry * g;
    // Shallower perspective: stratocumulus is a layer, not a receding field.
    const depth = Math.max(0, Math.min(1, y / bottomY));
    const persp = 1.15 - 0.35 * depth;
    errNext.fill(0);
    for (let cx = 0; cx < gridCols; cx++) {
      const x = cx * g;
      const sampleX = Math.max(0, Math.min(width - 1, x));
      const localCov = coverageAt(sampleX);
      const value = Math.min(1, localCov * GAIN) + errCurr[cx + 1];
      const fired = value >= 0.5 ? 1 : 0;
      const err = value - fired;
      errCurr[cx + 2] += err * (10 / 16);
      errNext[cx] += err * (2 / 16);
      errNext[cx + 1] += err * (3 / 16);
      errNext[cx + 2] += err * (1 / 16);
      if (fired) {
        const jx = x + (rng() - 0.5) * g * 0.7;
        const jy = y + (rng() - 0.5) * g * 0.35;
        const radius = baseCell * persp * (0.6 + 0.28 * localCov) * (0.8 + rng() * 0.4);
        spawnCloudlet(jx, jy, radius);
      }
    }
    const swap = errCurr;
    errCurr = errNext;
    errNext = swap;
  }

  for (const p of puffs.reverse()) {
    off.save();
    off.beginPath();
    off.arc(p.cx, p.cy, p.r, 0, Math.PI * 2);
    off.clip();
    const lin = off.createLinearGradient(p.cx, p.cy - p.r, p.cx, p.cy + p.r);
    lin.addColorStop(0, 'rgba(255, 255, 255, 1)');
    // Shading starts earlier and hits harder than stratus → heavier underside.
    lin.addColorStop(0.35, 'rgba(255, 255, 255, 1)');
    lin.addColorStop(1, `rgba(${SHADE}, 0.6)`);
    off.fillStyle = lin;
    off.fillRect(p.cx - p.r, p.cy - p.r, p.r * 2, p.r * 2);
    off.restore();

    const vig = off.createRadialGradient(p.cx, p.cy, 0, p.cx, p.cy, p.r);
    vig.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
    vig.addColorStop(0.2, 'rgba(255, 255, 255, 0.15)');
    vig.addColorStop(1, 'rgba(255, 255, 255, 0)');
    off.beginPath();
    off.arc(p.cx, p.cy, p.r, 0, Math.PI * 2);
    off.fillStyle = vig;
    off.fill();
  }

  ctx.drawImage(offscreen, 0, 0);
}
