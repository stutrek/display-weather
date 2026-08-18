/**
 * Stratus: long, soft horizontal veils stacked through the sky band — the
 * flat, featureless drizzle layer. Coverage opens more veil layers and closes
 * the gaps within each, going from a few broken wisps to a near-continuous
 * sheet with thin blue cracks.
 *
 * Each veil is a run of overlapping squashed ellipses merged into one
 * silhouette on its own layer canvas, then shaded once top-to-bottom
 * (source-atop) so the layer reads as a single body with a dusky underside —
 * never per-puff shading, which reads as beads/noise from across the room.
 *
 * The underside is cut flat, as in cumulus and stratocumulus: a layer sits at
 * an altitude, and a run of rounded bellies reads as lozenges adrift instead.
 * The cut follows only a fraction of the veil's wobble, so the base is flatter
 * than the top, and it is erased through a soft ramp rather than a hard edge —
 * on a veil this thin a crisp cut reads as a ruler laid across the sky. The
 * shading ramp then ends on that base line, so the whole underside carries full
 * shade instead of reaching it only at the veil's single lowest point.
 */

import { CLOUD_SHADE_RGB } from './colors';
import { makeCoverageInvCdf, sampleCoverageStats } from './coverageEnvelope';

const SHADE = CLOUD_SHADE_RGB;

// Veil layers top to bottom, given as the fraction of the sky band each one's
// *base* sits at — the puffs hang above it. A layer only appears where local
// coverage exceeds its threshold, so low coverage shows one broken wisp line
// and full coverage stacks all three into a sheet.
const LAYERS = [
  { yFrac: 0.34, threshold: 0 },
  { yFrac: 0.6, threshold: 0.3 },
  { yFrac: 0.84, threshold: 0.55 },
];

/**
 * Smooth 1-D noise: uniform values on a coarse grid, smoothstep-interpolated.
 * Drives gap placement and edge wobble so veils break into long runs rather
 * than per-pixel speckle.
 */
function makeSmoothNoise(rng: () => number, width: number, cell: number): (x: number) => number {
  const n = Math.ceil(width / cell) + 2;
  const vals = new Float32Array(n);
  for (let i = 0; i < n; i++) vals[i] = rng();
  return (x: number): number => {
    const t = Math.max(0, Math.min(n - 1.001, x / cell));
    const i = Math.floor(t);
    const f = t - i;
    const u = f * f * (3 - 2 * f);
    return vals[i] + (vals[i + 1] - vals[i]) * u;
  };
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

  let bottomY = height * 0.96;
  if (floorAt) {
    let minFloor = height;
    const n = Math.max(8, Math.round(width / 24));
    for (let i = 0; i < n; i++) minFloor = Math.min(minFloor, floorAt(((i + 0.5) / n) * width));
    bottomY = minFloor * 0.94;
  }

  const baseRy = Math.max(4, bottomY * 0.14);
  let anyDrawn = false;

  // Draw a veil run of merged ellipses centred on cy(x), with thickness
  // scaled by profile(x) ∈ [0,1] (0 skips the puff), then shade the whole
  // layer once. Top layers first so lower (nearer) veils overlap them.
  const drawVeil = (
    baseAt: (x: number) => number,
    ry: (x: number) => number,
    profile: (x: number) => number,
  ): void => {
    const layer = document.createElement('canvas');
    layer.width = width;
    layer.height = height;
    const l = layer.getContext('2d');
    if (!l) return;

    const puffs: Array<{ x: number; ecy: number; erx: number; ery: number }> = [];
    let yTop = Number.POSITIVE_INFINITY;
    let yBot = Number.NEGATIVE_INFINITY;
    const step = Math.max(4, baseRy * 0.7);
    for (let x = -baseRy; x <= width + baseRy; x += step) {
      const p = profile(x);
      if (p <= 0) continue;
      // Per-puff jitter roughens the veil contour — without it the merged
      // ellipses read as perfectly smooth sausages
      const ery = ry(x) * p * (0.85 + rng() * 0.3);
      if (ery <= 0.5) continue;
      // Hang each puff below the base line, as cumulus hangs its puffs below
      // its baseline, so the cut below takes the belly off every one of them
      // and the veil ends in one edge instead of a row of rounded bottoms.
      const ecy = baseAt(x) - ery * (0.45 + rng() * 0.25);
      yTop = Math.min(yTop, ecy - ery);
      yBot = Math.max(yBot, ecy + ery);
      const erx = ery * (2.2 + rng() * 1.4);
      // Squashed circle-gradient puff: solid body, slightly soft rim
      l.save();
      l.translate(x, ecy);
      l.scale(1, ery / erx);
      const puff = l.createRadialGradient(0, 0, 0, 0, 0, erx);
      puff.addColorStop(0, 'rgba(255, 255, 255, 1)');
      puff.addColorStop(0.92, 'rgba(255, 255, 255, 0.98)');
      puff.addColorStop(1, 'rgba(255, 255, 255, 0)');
      l.beginPath();
      l.arc(0, 0, erx, 0, Math.PI * 2);
      l.fillStyle = puff;
      l.fill();
      l.restore();
      puffs.push({ x, ecy, erx, ery });
    }
    if (puffs.length === 0) return;

    // Flat base, erased in narrow columns so the cut can follow the veil's
    // gentle wobble while each column fades out over a few pixels. Thin
    // stretches sit entirely above the line and keep their rounded bellies;
    // only the fat ones get flattened, which is what keeps the base alive.
    const soft = Math.max(1, baseRy * 0.18);
    const colStep = 3;
    let baseMin = Number.POSITIVE_INFINITY;
    l.globalCompositeOperation = 'destination-out';
    for (let x = 0; x < width; x += colStep) {
      const b = baseAt(x + colStep / 2);
      baseMin = Math.min(baseMin, b);
      const cut = l.createLinearGradient(0, b - soft, 0, b + soft);
      cut.addColorStop(0, 'rgba(0, 0, 0, 0)');
      cut.addColorStop(1, 'rgba(0, 0, 0, 1)');
      l.fillStyle = cut;
      l.fillRect(x, b - soft, colStep, height - b + soft);
    }
    l.globalCompositeOperation = 'source-over';
    // The ramp below ends at the *highest* the base ever rides, so every
    // column carries full shade along its underside rather than only the
    // column where the base happens to sit lowest.
    const shadeEnd = Number.isFinite(baseMin) ? baseMin : yBot;

    // Light per-puff under-shading gives the veil interior a soft puffy
    // grain (same trick as stratocumulus, applied more gently). Done as a
    // second pass over the finished silhouette — the puffs overlap so much
    // that inline shading would be painted over by the next puff.
    l.globalCompositeOperation = 'source-atop';
    for (const pf of puffs) {
      l.save();
      l.translate(pf.x, pf.ecy);
      l.scale(1, pf.ery / pf.erx);
      const puffShade = l.createLinearGradient(0, -pf.erx, 0, pf.erx);
      puffShade.addColorStop(0, `rgba(${SHADE}, 0)`);
      puffShade.addColorStop(0.6, `rgba(${SHADE}, 0)`);
      puffShade.addColorStop(1, `rgba(${SHADE}, 0.12)`);
      l.beginPath();
      l.arc(0, 0, pf.erx, 0, Math.PI * 2);
      l.clip();
      l.fillStyle = puffShade;
      l.fillRect(-pf.erx, -pf.erx, pf.erx * 2, pf.erx * 2);
      l.restore();
    }

    // One shading gradient across the whole veil: lit top, dusky underside.
    // Anchored to the base line rather than the lowest pixel drawn, so full
    // shade lands along the whole underside instead of only where the veil
    // happens to dip furthest.
    const shade = l.createLinearGradient(0, yTop, 0, shadeEnd);
    shade.addColorStop(0, `rgba(${SHADE}, 0)`);
    shade.addColorStop(0.45, `rgba(${SHADE}, 0.1)`);
    shade.addColorStop(1, `rgba(${SHADE}, 0.5)`);
    l.fillStyle = shade;
    l.fillRect(0, 0, width, height);
    l.globalCompositeOperation = 'source-over';

    off.drawImage(layer, 0, 0);
    anyDrawn = true;
  };

  for (const def of LAYERS) {
    const layerY = def.yFrac * bottomY;
    const gate = makeSmoothNoise(rng, width, Math.max(48, height * 0.9));
    const wobble = makeSmoothNoise(rng, width, Math.max(60, height * 1.2));
    const thick = makeSmoothNoise(rng, width, Math.max(40, height * 0.8));

    // Fill fraction of this layer from local coverage: 0 at the layer's
    // threshold, saturating past it so full coverage closes every gap.
    // Deeper layers require *sustained* coverage — they take the minimum over
    // a neighborhood — so a brief spike yields one wisp, not a stack of
    // pancakes from every layer firing in the same narrow window.
    const reach = def.threshold > 0 ? height * (0.9 + def.threshold) : 0;
    const covAt = (x: number): number => coverageAt(Math.max(0, Math.min(width - 1, x)));
    const fillAt = (x: number): number => {
      const cov = reach ? Math.min(covAt(x - reach), covAt(x), covAt(x + reach)) : covAt(x);
      return Math.max(0, Math.min(1, ((cov - def.threshold) / (1 - def.threshold)) * 1.45));
    };

    const wobbleAt = (x: number): number => (wobble(x) - 0.5) * bottomY * 0.12;

    drawVeil(
      // The base tracks only a third of the wobble, so it stays flatter than
      // the crown — which undulates freely as the thickness noise varies
      (x) => layerY + wobbleAt(x) * 0.35,
      (x) => {
        const f = fillAt(x);
        // Scaled up against the old centred layout: the cut takes roughly a
        // quarter of each puff, so the crown has to start higher to leave the
        // veil the same visible depth.
        return baseRy * 1.15 * (0.55 + 0.45 * f) * (0.7 + 0.6 * thick(x));
      },
      (x) => {
        // Smooth noise vs fill fraction → long on/off runs whose covered
        // share tracks f; near-full fill never gaps. Thickness follows how
        // far the noise sits below the threshold, so runs taper to thin
        // tips at their ends instead of stopping as blunt lozenges — and a
        // full sheet undulates rather than holding constant thickness.
        const f = fillAt(x);
        if (f <= 0) return 0;
        const m = gate(x);
        if (f < 0.99 && m >= f) return 0;
        return 0.35 + 0.65 * Math.min(1, Math.max(0, (f - m) / 0.35));
      },
    );
  }

  // Very low coverage can gate out every run — guarantee one short wisp at
  // the coverage centroid so the layer never renders empty
  if (!anyDrawn) {
    const invCdf = makeCoverageInvCdf(coverageAt, width);
    const cx0 = invCdf(0.5);
    const halfSpan = baseRy * (3 + rng() * 2);
    const layerY = LAYERS[0].yFrac * bottomY;
    const wobble = makeSmoothNoise(rng, width, Math.max(60, height * 1.2));
    const wobbleAt = (x: number): number => (wobble(x) - 0.5) * bottomY * 0.12;
    drawVeil(
      (x) => layerY + wobbleAt(x) * 0.35,
      () => baseRy * 1.05,
      (x) => {
        // Taper the wisp toward its ends
        const d = Math.abs(x - cx0) / halfSpan;
        return d >= 1 ? 0 : Math.sqrt(1 - d * d);
      },
    );
  }

  ctx.drawImage(offscreen, 0, 0);
}
