import { describe, expect, it } from 'vitest';
import { hazeAmount } from './haze';

describe('hazeAmount', () => {
  it('scales with temperature: the same humidity is hazy when hot, clear when cold', () => {
    // 65% RH at ~90°F is a ~77°F dew point — oppressive, very hazy.
    const hot = hazeAmount({ humidity: 65, temperature: 90 });
    // The same 65% RH at 50°F is a ~39°F dew point — crisp and clear.
    const cold = hazeAmount({ humidity: 65, temperature: 50 });
    expect(hot).toBeGreaterThan(0.7);
    expect(cold).toBe(0);
  });

  it('works in Celsius', () => {
    // 32°C ≈ 90°F, so this matches the hot Fahrenheit case above.
    const hotC = hazeAmount({ humidity: 65, temperature: 32 }, '°C');
    expect(hotC).toBeGreaterThan(0.7);
  });

  it('is zero when no signal is present', () => {
    expect(hazeAmount({})).toBe(0);
  });

  it('falls back to a plain humidity ramp when temperature is missing', () => {
    expect(hazeAmount({ humidity: 40 })).toBe(0);
    expect(hazeAmount({ humidity: 55 })).toBe(0);
    const muggy = hazeAmount({ humidity: 85 });
    expect(muggy).toBeGreaterThan(0);
    expect(muggy).toBeLessThan(0.7);
    expect(hazeAmount({ humidity: 95 })).toBeGreaterThan(muggy);
  });

  it('treats fog and hazy conditions as thick regardless of moisture', () => {
    expect(hazeAmount({ condition: 'fog', humidity: 20, temperature: 40 })).toBe(1);
    expect(hazeAmount({ condition: 'foggy', humidity: 20, temperature: 40 })).toBe(1);
    expect(hazeAmount({ condition: 'hazy', humidity: 20, temperature: 40 })).toBeCloseTo(0.85);
  });

  it('takes the strongest of moisture and condition', () => {
    // A hazy condition wins over a cool, clear dew point.
    expect(hazeAmount({ condition: 'hazy', humidity: 40, temperature: 50 })).toBeCloseTo(0.85);
  });

  it('uses visibility when supplied, more haze for lower visibility', () => {
    expect(hazeAmount({ visibility: 10 })).toBe(0);
    expect(hazeAmount({ visibility: 1 })).toBe(1);
    // Between the thresholds, and stronger than a cold, clear dew point.
    expect(hazeAmount({ visibility: 4, humidity: 30, temperature: 50 })).toBeCloseTo(2 / 3);
  });
});
