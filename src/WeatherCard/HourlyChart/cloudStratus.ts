/**
 * Stratus: a low, even layer of many small dappled cloudlets packed across the
 * sky with blue gaps between them — fog-adjacent, drizzle-sky look.
 *
 * Placement from Floyd–Steinberg dithering of the coverage field: a
 * deliberately non-serpentine dither whose directional error smear strings
 * cloudlets into broken horizontal ripples instead of a mechanical grid.
 * Cloudlets shrink toward the bottom of the band (perspective recession).
 * Each cloudlet is an irregular cluster of sub-puffs; every sub-puff is
 * a shaded bead so crevices read as shadowed and rims fade to clear sky.
 */

import { sampleCoverageStats } from './coverageEnvelope';

// Sky-family shadow tint so shading reads as sky light, not dark shadow.
const SHADE = '80, 195, 240';

interface Puff {
  cx: number;
  cy: number;
  r: number;
}

export function drawStratus(
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

  const baseCell = Math.max(9, height * 0.2);
  const puffs: Puff[] = [];

  const spawnCloudlet = (cx: number, cy: number, radius: number): void => {
    const lobeCount = 3 + Math.floor(rng() * 3); // 3–5
    for (let l = 0; l < lobeCount; l++) {
      const ang = rng() * Math.PI * 2;
      const dist = radius * 0.5 * Math.sqrt(rng());
      const lx = cx + Math.cos(ang) * dist;
      const ly = cy + Math.sin(ang) * dist * 0.75;
      const lr = radius * (0.42 + rng() * 0.3);
      puffs.push({ cx: lx, cy: ly, r: lr });
    }
  };

  const g = Math.max(3, baseCell * 0.5);
  const gridCols = Math.ceil(width / g) + 1;
  const gridRows = Math.ceil((bottomY + baseCell) / g) + 1;
  const GAIN = 0.15;
  let errCurr = new Float32Array(gridCols + 2);
  let errNext = new Float32Array(gridCols + 2);

  for (let ry = 0; ry < gridRows; ry++) {
    const y = ry * g;
    const depth = Math.max(0, Math.min(1, y / bottomY));
    const persp = 1.35 - 0.85 * depth;
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
        const jx = x + (rng() - 0.5) * g;
        const jy = y + (rng() - 0.5) * g * 0.45;
        const radius = baseCell * persp * (0.55 + 0.3 * localCov) * (0.82 + rng() * 0.36);
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
    lin.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
    lin.addColorStop(1, `rgba(${SHADE}, 0.45)`);
    off.fillStyle = lin;
    off.fillRect(p.cx - p.r, p.cy - p.r, p.r * 2, p.r * 2);
    off.restore();

    const vig = off.createRadialGradient(p.cx, p.cy, 0, p.cx, p.cy, p.r);
    vig.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    vig.addColorStop(0.15, 'rgba(255, 255, 255, 0.2)');
    vig.addColorStop(1, 'rgba(255, 255, 255, 0)');
    off.beginPath();
    off.arc(p.cx, p.cy, p.r, 0, Math.PI * 2);
    off.fillStyle = vig;
    off.fill();
  }

  ctx.drawImage(offscreen, 0, 0);
}
