import { describe, expect, it } from 'vitest';
import { targetPixelCoverage } from './coverageEnvelope';
import { lowCloudTotal } from './inferCloudType';

describe('targetPixelCoverage', () => {
  it('paints nothing for a clear sky and everything for overcast', () => {
    expect(targetPixelCoverage(0)).toBe(0);
    expect(targetPixelCoverage(0.95)).toBeCloseTo(1, 5);
    expect(targetPixelCoverage(1)).toBe(1);
  });

  it('paints a sparse sky exactly as reported', () => {
    expect(targetPixelCoverage(0.1)).toBeCloseTo(0.1, 5);
    expect(targetPixelCoverage(0.2)).toBeCloseTo(0.2, 5);
  });

  it('paints more than the reported share through the broken range', () => {
    for (const c of [0.25, 0.5, 0.75]) {
      expect(targetPixelCoverage(c)).toBeGreaterThan(c);
    }
    expect(targetPixelCoverage(0.5)).toBeLessThan(0.65);
  });

  it('rises monotonically', () => {
    let prev = -1;
    for (let c = 0; c <= 1.0001; c += 0.01) {
      const v = targetPixelCoverage(c);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });
});

describe('lowCloudTotal', () => {
  it('is the full reported coverage for an overcast hour', () => {
    expect(lowCloudTotal({ condition: 'cloudy', cloud_coverage: 95 })).toBeCloseTo(0.95, 5);
    expect(lowCloudTotal({ condition: 'rainy', cloud_coverage: 100 })).toBe(1);
  });

  it('fades out toward a clear sky', () => {
    expect(lowCloudTotal({ condition: 'partlycloudy', cloud_coverage: 3 })).toBe(0);
    expect(lowCloudTotal({ condition: 'partlycloudy', cloud_coverage: 10 })).toBeLessThan(0.1);
  });

  it('is zero for a clear condition', () => {
    expect(lowCloudTotal({ condition: 'sunny', cloud_coverage: 25 })).toBe(0);
    expect(lowCloudTotal({ condition: 'clear-night', cloud_coverage: 15 })).toBe(0);
  });
});
