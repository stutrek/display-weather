// ============================================================================
// Coverage envelopes for cloud rendering
// Each cloud type renders as one continuous field whose density follows a
// per-type coverage envelope across the strip. These helpers turn envelope
// points into an interpolated coverage function and into coverage-weighted
// placement (inverse CDF), so clouds appear where coverage is and fade where
// it isn't.
// ============================================================================

export interface CoveragePoint {
  x: number;
  v: number;
}

/**
 * Linear interpolation over coverage points, clamped flat at both ends.
 * Operates in the same x space as the points; callers compose any
 * local→world offset.
 */
export function makeCoverageInterpolator(points: CoveragePoint[]): (x: number) => number {
  return (x: number): number => {
    if (points.length === 0) return 0;
    if (points.length === 1) return points[0].v;
    if (x <= points[0].x) return points[0].v;
    if (x >= points[points.length - 1].x) return points[points.length - 1].v;
    for (let j = 0; j < points.length - 1; j++) {
      if (x <= points[j + 1].x) {
        const t = (x - points[j].x) / (points[j + 1].x - points[j].x);
        return points[j].v + t * (points[j + 1].v - points[j].v);
      }
    }
    return points[points.length - 1].v;
  };
}

function sampleCount(width: number): number {
  return Math.max(16, Math.round(width / 8));
}

/**
 * Mean and max of a coverage function sampled at evenly spaced midpoints.
 * Replaces single-point midCov reads; equal to them at constant coverage.
 */
export function sampleCoverageStats(
  coverageAt: (x: number) => number,
  width: number,
): { mean: number; max: number } {
  const n = sampleCount(width);
  let sum = 0;
  let max = 0;
  for (let i = 0; i < n; i++) {
    const v = coverageAt(((i + 0.5) / n) * width);
    sum += v;
    if (v > max) max = v;
  }
  return { mean: sum / n, max };
}

/**
 * Inverse CDF over the coverage function: maps u ∈ [0,1] to an x position
 * with density proportional to coverage, so cloud placement follows the
 * envelope — no clouds land in zero-coverage regions, and a narrow coverage
 * spike still receives its share. At constant coverage this is the identity
 * (u → u·width), which keeps placement identical to uniform/stratified
 * slots; a zero envelope falls back to the identity too.
 */
export function makeCoverageInvCdf(
  coverageAt: (x: number) => number,
  width: number,
): (u: number) => number {
  const n = sampleCount(width);
  const cdf = new Array<number>(n + 1);
  cdf[0] = 0;
  for (let i = 0; i < n; i++) {
    cdf[i + 1] = cdf[i] + Math.max(0, coverageAt(((i + 0.5) / n) * width));
  }
  const total = cdf[n];
  if (total < 1e-6) return (u: number) => u * width;

  return (u: number): number => {
    const target = Math.max(0, Math.min(1, u)) * total;
    // Smallest bin whose cumulative mass reaches the target
    let lo = 0;
    let hi = n - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cdf[mid + 1] < target) lo = mid + 1;
      else hi = mid;
    }
    const binMass = cdf[lo + 1] - cdf[lo];
    const frac = binMass > 0 ? (target - cdf[lo]) / binMass : 0.5;
    return ((lo + frac) / n) * width;
  };
}
