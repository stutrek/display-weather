// ============================================================================
// Fill-to-coverage placement
// ----------------------------------------------------------------------------
// Renderers used to turn a coverage number into a body count and a size, and
// hope the pixels came out right — they didn't: a 100% sky painted 60–85% and
// left the band above the horizon blue. Here placement is measured instead.
// Every body is stamped into a coverage mask as it is placed, and the next one
// goes wherever the sky band is furthest below its target: the most starved
// column bin, at the emptiest height within it. Placement stops once every
// bin is within tolerance, so the painted share tracks the target on any
// canvas size and fills the whole band, top to horizon.
// ============================================================================

export interface FillSlot {
  /** Column to centre the body on */
  x: number;
  /** Height the body's visible mass should centre on */
  y: number;
  /** Local sky depth (the floor) at x */
  floor: number;
}

export interface FillOptions<B> {
  width: number;
  height: number;
  /** Top of the terrain at x — only pixels above it count as sky */
  floorAt: (x: number) => number;
  /** Target share of sky pixels covered at x, 0..1 */
  targetAt: (x: number) => number;
  rng: () => number;
  /**
   * Coverage mask the size of the canvas. May arrive pre-filled with the
   * layers behind this one, so a front layer only tops up what they left.
   */
  mask: CanvasRenderingContext2D;
  /** Build a body for a slot; null skips the slot */
  build: (slot: FillSlot) => B | null;
  /** Draw a body's silhouette into the mask; returns its x extent */
  stamp: (mask: CanvasRenderingContext2D, body: B) => { x0: number; x1: number };
  maxBodies: number;
  /** Stop once every bin is within this of its target (default 0.03) */
  tolerance?: number;
}

const BANDS = 4;
const ALPHA_HIT = 127;

export function fillToCoverage<B>(opts: FillOptions<B>): B[] {
  const { width, height, floorAt, targetAt, rng, mask, build, stamp, maxBodies } = opts;
  const tolerance = opts.tolerance ?? 0.03;
  const bodies: B[] = [];
  if (width <= 0 || height <= 0) return bodies;

  const floors = new Float32Array(width);
  let floorSum = 0;
  for (let x = 0; x < width; x++) {
    floors[x] = Math.max(1, Math.min(height, floorAt(x + 0.5)));
    floorSum += floors[x];
  }
  // Bins about one sky-depth wide: coarse enough that a single body can
  // satisfy one, fine enough to keep gaps from hiding between them.
  const binW = Math.max(16, Math.min(160, floorSum / width));
  const binCount = Math.max(1, Math.round(width / binW));
  const binX0 = (b: number): number => Math.floor((b * width) / binCount);
  const binX1 = (b: number): number => Math.floor(((b + 1) * width) / binCount);

  const target = new Float32Array(binCount);
  for (let b = 0; b < binCount; b++) {
    let sum = 0;
    for (let x = binX0(b); x < binX1(b); x++) sum += targetAt(x + 0.5);
    target[b] = sum / Math.max(1, binX1(b) - binX0(b));
  }

  // Per-bin, per-band covered fraction, refreshed only where a body landed.
  const covered = new Float32Array(binCount);
  const bandCov = new Float32Array(binCount * BANDS);
  const measure = (b0: number, b1: number): void => {
    const x0 = binX0(b0);
    const x1 = binX1(b1);
    const data = mask.getImageData(x0, 0, x1 - x0, height).data;
    const rowW = x1 - x0;
    for (let b = b0; b <= b1; b++) {
      let sky = 0;
      let hit = 0;
      const bandSky = new Float32Array(BANDS);
      const bandHit = new Float32Array(BANDS);
      for (let x = binX0(b); x < binX1(b); x++) {
        const floor = floors[x];
        const col = x - x0;
        for (let y = 0; y < floor; y++) {
          const band = Math.min(BANDS - 1, Math.floor((y / floor) * BANDS));
          const h = data[(y * rowW + col) * 4 + 3] > ALPHA_HIT ? 1 : 0;
          sky++;
          hit += h;
          bandSky[band]++;
          bandHit[band] += h;
        }
      }
      covered[b] = sky ? hit / sky : 1;
      for (let k = 0; k < BANDS; k++) {
        bandCov[b * BANDS + k] = bandSky[k] ? bandHit[k] / bandSky[k] : 1;
      }
    }
  };
  measure(0, binCount - 1);

  // Deficit over a three-bin window, so one large body can satisfy its
  // neighbours too — without it every bin gets its own body and a sparse sky
  // turns into an evenly spaced row.
  const windowDeficit = (b: number): number => {
    let d = 0;
    let n = 0;
    for (let k = Math.max(0, b - 1); k <= Math.min(binCount - 1, b + 1); k++) {
      d += target[k] - covered[k];
      n++;
    }
    return d / n;
  };

  // Bins where placements stop helping (a body clamped away from an interval
  // edge, say) drop out after a couple of tries instead of spinning the loop.
  const stalls = new Uint8Array(binCount);
  let attempts = 0;
  while (bodies.length < maxBodies && attempts < maxBodies * 3) {
    attempts++;
    const weights = new Float32Array(binCount);
    let total = 0;
    let worst = 0;
    for (let b = 0; b < binCount; b++) {
      const own = target[b] - covered[b];
      const d = Math.min(own, windowDeficit(b));
      if (stalls[b] >= 2) continue;
      worst = Math.max(worst, own);
      if (d > tolerance / 2) {
        weights[b] = d * d;
        total += weights[b];
      }
    }
    if (worst <= tolerance || total <= 0) break;

    // Random pick weighted by squared deficit: the most starved bins win
    // most often without every placement landing in a predictable order.
    let pick = rng() * total;
    let bin = 0;
    for (; bin < binCount - 1; bin++) {
      pick -= weights[bin];
      if (pick <= 0) break;
    }

    // Emptiest band in the bin, weighted so near-ties still vary.
    let bandPick = 0;
    let bandTotal = 0;
    const bandWeights: number[] = [];
    for (let k = 0; k < BANDS; k++) {
      const w = (1 - bandCov[bin * BANDS + k]) ** 3 + 1e-4;
      bandWeights.push(w);
      bandTotal += w;
    }
    let r = rng() * bandTotal;
    for (; bandPick < BANDS - 1; bandPick++) {
      r -= bandWeights[bandPick];
      if (r <= 0) break;
    }

    const x = binX0(bin) + rng() * (binX1(bin) - binX0(bin));
    const floor = floors[Math.max(0, Math.min(width - 1, Math.floor(x)))];
    const y = ((bandPick + 0.2 + rng() * 0.6) / BANDS) * floor;

    const body = build({ x, y, floor });
    if (!body) {
      stalls[bin]++;
      continue;
    }
    const before = covered[bin];
    const extent = stamp(mask, body);
    const b0 = Math.max(0, Math.floor((Math.max(0, extent.x0) / width) * binCount) - 1);
    const b1 = Math.min(
      binCount - 1,
      Math.floor((Math.min(width - 1, extent.x1) / width) * binCount) + 1,
    );
    measure(b0, b1);
    bodies.push(body);
    stalls[bin] = covered[bin] - before < 0.005 ? stalls[bin] + 1 : 0;
  }

  return bodies;
}

/** A blank coverage mask the size of the canvas, tuned for readback. */
export function createMask(width: number, height: number): CanvasRenderingContext2D | null {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(width));
  canvas.height = Math.max(1, Math.ceil(height));
  return canvas.getContext('2d', { willReadFrequently: true });
}
