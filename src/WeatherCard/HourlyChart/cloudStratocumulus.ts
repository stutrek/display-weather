/**
 * Stratocumulus: a layer of many small, fairly flat cloudlets packed across the
 * sky with blue gaps between them — the dappled / mackerel sky.
 *
 * Placement comes from Floyd–Steinberg dithering of the coverage field: a
 * deliberately mediocre, non-serpentine dither whose directional error smear
 * strings the cloudlets out into broken horizontal ripples — the stratocumulus
 * stripes — rather than a mechanical grid. Cloudlets shrink toward the bottom of
 * the band so they read as smaller and more numerous receding to the horizon.
 * Each cloudlet is an irregular cluster of sub-puffs (not a circle). Every
 * sub-puff is drawn as a shaded 3D bead — bright highlight toward the light, far
 * side falling off to a sky-blue SHADE — so the field gets one-sided form with
 * bright spots scattered through it (tops and low lobes alike) and shaded
 * crevices between lobes, while the rims still fade to clear sky.
 */

import { sampleCoverageStats } from './coverageEnvelope';

// Sky-family shadow tint for the shaded side of each cloudlet — a muted
// periwinkle, not grey, so shading stays in the sky's colour family.
const SHADE = '150, 170, 205';

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

  // Bottom of the band: stay above the terrain horizon when one is given,
  // otherwise fill the whole strip.
  let bottomY = height;
  if (floorAt) {
    let minFloor = height;
    const n = Math.max(8, Math.round(width / 24));
    for (let i = 0; i < n; i++) minFloor = Math.min(minFloor, floorAt(((i + 0.5) / n) * width));
    bottomY = minFloor * 0.94;
  }

  // Cell size driven by the constant chart height (never width) so the dapple
  // looks identical whether the card is narrow or wide. Small ⇒ many cloudlets.
  const baseCell = Math.max(9, height * 0.2);

  const puffs: Puff[] = [];
  // Spawn one irregular cloudlet — a cluster of 3–5 overlapping sub-puffs, so
  // the silhouette is lumpy and unique rather than a circle.
  const spawnCloudlet = (cx: number, cy: number, radius: number): void => {
    const lobeCount = 3 + Math.floor(rng() * 3); // 3–5
    for (let l = 0; l < lobeCount; l++) {
      const ang = rng() * Math.PI * 2;
      const dist = radius * 0.5 * Math.sqrt(rng());
      const lx = cx + Math.cos(ang) * dist;
      const ly = cy + Math.sin(ang) * dist * 0.75; // squashed: wider than tall
      const lr = radius * (0.42 + rng() * 0.3);
      puffs.push({ cx: lx, cy: ly, r: lr });
    }
  };

  // Placement by Floyd–Steinberg dithering of the coverage field on a grid
  // finer than a cloudlet. A plain left-to-right pass with no serpentine flip
  // is a deliberately mediocre dither: its error always smears the same way, so
  // fired cells string out into broken horizontal ripples — the stratocumulus
  // stripes — instead of the mechanical rows a regular grid gives. Each fired
  // cell is jittered within its cell, so the grid itself never shows.
  const g = Math.max(3, baseCell * 0.5);
  const gridCols = Math.ceil(width / g) + 1;
  const gridRows = Math.ceil((bottomY + baseCell) / g) + 1;
  const GAIN = 0.3; // peak fraction of cells fired, at full coverage
  let errCurr = new Float32Array(gridCols + 2);
  let errNext = new Float32Array(gridCols + 2);

  for (let ry = 0; ry < gridRows; ry++) {
    const y = ry * g;
    const depth = Math.max(0, Math.min(1, y / bottomY)); // 0 top → 1 bottom
    const persp = 1.35 - 0.85 * depth; // cloudlets shrink toward the horizon
    errNext.fill(0);
    for (let cx = 0; cx < gridCols; cx++) {
      const x = cx * g;
      const sampleX = Math.max(0, Math.min(width - 1, x));
      const localCov = coverageAt(sampleX);
      const value = Math.min(1, localCov * GAIN) + errCurr[cx + 1];
      const fired = value >= 0.5 ? 1 : 0;
      const err = value - fired;
      // Weights skewed hard to the right (vs the usual 7/3/5/1): error rides
      // along the row, so fired cells string into horizontal runs and the gaps
      // line up into ripple lanes — the stripes — instead of an even blob field.
      errCurr[cx + 2] += err * (10 / 16); // → right (same row)
      errNext[cx] += err * (2 / 16); // ↙ next row
      errNext[cx + 1] += err * (3 / 16); // ↓ next row
      errNext[cx + 2] += err * (1 / 16); // ↘ next row
      if (fired) {
        const jx = x + (rng() - 0.5) * g;
        const jy = y + (rng() - 0.5) * g * 0.45; // light vertical jitter keeps lanes coherent
        const radius = baseCell * persp * (0.55 + 0.3 * localCov) * (0.82 + rng() * 0.36);
        spawnCloudlet(jx, jy, radius);
      }
    }
    const swap = errCurr;
    errCurr = errNext;
    errNext = swap;
  }

  // Each sub-puff is a shaded 3D bead, not a flat disc: a bright highlight
  // offset toward the light (upper-left) and a far side that falls off toward
  // SHADE. Overlapping beads therefore leave a bright spot on every lobe —
  // including the lobes at a cloudlet's base, so there are light spots low down,
  // not just a dark underside — with shaded crevices where they meet. The rim
  // fades to transparent so neighbouring cloudlets still melt together and the
  // cracks read as clear sky.
  for (const p of puffs.reverse()) {
    // Pass 1: linear top-to-bottom shading clipped to the circle.
    // Top is pure white, bottom fades to sky-blue shade. No shading at the top.
    off.save();
    off.beginPath();
    off.arc(p.cx, p.cy, p.r, 0, Math.PI * 2);
    off.clip();
    const lin = off.createLinearGradient(p.cx, p.cy - p.r, p.cx, p.cy + p.r);
    lin.addColorStop(0, 'rgba(255, 255, 255, 1)');
    lin.addColorStop(0.15, 'rgba(255, 255, 255, 1)');
    lin.addColorStop(1, `rgba(${SHADE}, 0.05)`);
    off.fillStyle = lin;
    off.fillRect(p.cx - p.r, p.cy - p.r, p.r * 2, p.r * 2);
    off.restore();

    // Pass 2: center-full-to-edge-transparent overlay brightens the middle and
    // softens the rim so neighbouring cloudlets bleed into each other.
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
