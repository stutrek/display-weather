import { describe, expect, it } from 'vitest';
import {
  makeCoverageInterpolator,
  makeCoverageInvCdf,
  sampleCoverageStats,
} from './coverageEnvelope';

describe('makeCoverageInterpolator', () => {
  it('clamps flat before the first and after the last point', () => {
    const interp = makeCoverageInterpolator([
      { x: 100, v: 0.2 },
      { x: 200, v: 0.8 },
    ]);
    expect(interp(0)).toBe(0.2);
    expect(interp(300)).toBe(0.8);
  });

  it('interpolates linearly between points', () => {
    const interp = makeCoverageInterpolator([
      { x: 0, v: 0 },
      { x: 100, v: 1 },
    ]);
    expect(interp(25)).toBeCloseTo(0.25);
    expect(interp(50)).toBeCloseTo(0.5);
  });
});

describe('sampleCoverageStats', () => {
  it('returns the constant for constant coverage', () => {
    const { mean, max } = sampleCoverageStats(() => 0.6, 360);
    expect(mean).toBeCloseTo(0.6);
    expect(max).toBeCloseTo(0.6);
  });
});

describe('makeCoverageInvCdf', () => {
  // This identity is what keeps cumulus/cumulonimbus placement in the
  // CloudAlgorithms story (constant coverage) identical to stratified slots
  it('is the identity at constant coverage', () => {
    const inv = makeCoverageInvCdf(() => 0.6, 360);
    for (const u of [0, 0.1, 0.25, 0.5, 0.9, 1]) {
      expect(inv(u)).toBeCloseTo(u * 360, 6);
    }
  });

  it('falls back to the identity for a zero envelope', () => {
    const inv = makeCoverageInvCdf(() => 0, 500);
    expect(inv(0.3)).toBeCloseTo(150);
  });

  it('concentrates placement inside a coverage spike', () => {
    const spike = (x: number): number => (Math.abs(x - 360) < 30 ? 0.9 : 0);
    const inv = makeCoverageInvCdf(spike, 720);
    for (const u of [0.05, 0.5, 0.95]) {
      expect(Math.abs(inv(u) - 360)).toBeLessThanOrEqual(35);
    }
  });
});
