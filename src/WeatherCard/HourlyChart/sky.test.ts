import { describe, expect, it } from 'vitest';
import type { SunTimes, WeatherForecast } from '../WeatherContext';
import { getDaylightIntervals } from './sky';

const WIDTH = 1200;

/** Build an hourly forecast starting at a local datetime string. */
function hourly(start: string, hours: number): WeatherForecast[] {
  const first = new Date(start).getTime();
  return Array.from({ length: hours }, (_, i) => ({
    datetime: new Date(first + i * 3600000).toISOString(),
    temperature: 20,
  })) as WeatherForecast[];
}

function sun(sunrise?: string, sunset?: string): SunTimes {
  return {
    sunrise: sunrise ? new Date(sunrise) : undefined,
    sunset: sunset ? new Date(sunset) : undefined,
  } as SunTimes;
}

describe('getDaylightIntervals', () => {
  it('splits an evening window containing sunset then the next sunrise', () => {
    // 18:00 → 06:00; day at both ends, night in the middle
    const forecast = hourly('2026-06-10T18:00:00', 13);
    const sunTimes = sun('2026-06-11T05:45:00', '2026-06-10T20:30:00');

    const intervals = getDaylightIntervals(forecast, sunTimes, WIDTH);

    // sunset 2.5h in → x=250; sunrise 11.75h in → x=1175
    expect(intervals).toEqual([
      { start: 0, end: 250 },
      { start: 1175, end: WIDTH },
    ]);
  });

  it('returns no daylight for an all-night window with both events out of range', () => {
    // 19:00 → 07:00 in winter; next_rising 07:15 and next_setting 16:31 both outside
    const forecast = hourly('2026-01-15T19:00:00', 13);
    const sunTimes = sun('2026-01-16T07:15:00', '2026-01-16T16:31:00');

    expect(getDaylightIntervals(forecast, sunTimes, WIDTH)).toEqual([]);
  });

  it('returns full daylight for an all-day window with both events out of range', () => {
    // 08:00 → 16:00 in winter; sunrise already passed, sunset after the window
    const forecast = hourly('2026-01-15T08:00:00', 9);
    const sunTimes = sun('2026-01-16T07:00:00', '2026-01-15T16:31:00');

    expect(getDaylightIntervals(forecast, sunTimes, WIDTH)).toEqual([{ start: 0, end: WIDTH }]);
  });

  it('handles a single sun event in range (morning window)', () => {
    // 00:00 → 12:00; sunrise 06:00 in range, sunset outside
    const forecast = hourly('2026-06-10T00:00:00', 13);
    const sunTimes = sun('2026-06-10T06:00:00', '2026-06-10T20:30:00');

    expect(getDaylightIntervals(forecast, sunTimes, WIDTH)).toEqual([{ start: 600, end: WIDTH }]);
  });

  it('falls back to a segment-midpoint boundary when sun data is missing', () => {
    // 14:00 → 02:00 with no sun times; fallback day is 06:00–18:00, so the
    // flip between the 17:00 and 18:00 hours lands at the segment midpoint
    const forecast = hourly('2026-06-10T14:00:00', 13);
    const sunTimes = sun();

    expect(getDaylightIntervals(forecast, sunTimes, WIDTH)).toEqual([{ start: 0, end: 350 }]);
  });
});
