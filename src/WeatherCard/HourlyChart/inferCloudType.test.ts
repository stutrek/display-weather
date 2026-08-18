import { describe, expect, it } from 'vitest';
import {
  type CloudForecastEntry,
  type CloudLayerCoverage,
  inferCloudLayerCoverage,
  inferCloudLayers,
} from './inferCloudType';

// Most cases only depend on the current hour; wrap a single entry so the
// forward and backward looks see no surrounding weather.
const only = (entry: CloudForecastEntry): [CloudForecastEntry[], number] => [[entry], 0];

const coverageOf = (layers: CloudLayerCoverage, type: keyof CloudLayerCoverage): number =>
  layers[type] ?? 0;

describe('inferCloudLayers', () => {
  it('infers baseline cirrus over stratocumulus and cumulus for humid broken cloud cover', () => {
    expect(
      inferCloudLayers(
        ...only({
          condition: 'partlycloudy',
          cloud_coverage: 50,
          humidity: 70,
          precipitation: 0,
          uv_index: 4,
        }),
      ),
    ).toEqual(['cirrus', 'stratocumulus', 'cumulus']);
  });

  it('weights stratocumulus and cumulus separately under the baseline cirrus', () => {
    const cov = inferCloudLayerCoverage(
      ...only({
        condition: 'partlycloudy',
        cloud_coverage: 50,
        humidity: 70,
        precipitation: 0,
        uv_index: 4,
      }),
    );
    expect(coverageOf(cov, 'cirrus')).toBeCloseTo(0.2, 2);
    expect(coverageOf(cov, 'stratocumulus')).toBeCloseTo(0.25, 2);
    expect(coverageOf(cov, 'cumulus')).toBeCloseTo(0.16, 2);
  });

  it('makes stratocumulus dominant for humid broad low-cloud coverage', () => {
    const cov = inferCloudLayerCoverage(
      ...only({
        cloud_coverage: 65,
        humidity: 75,
        precipitation: 0,
        uv_index: 4,
      }),
    );
    // The lumpy deck owns the sky; cumulus pokes through it, smaller.
    expect(coverageOf(cov, 'stratocumulus')).toBeGreaterThan(0.4);
    expect(coverageOf(cov, 'cumulus')).toBeLessThan(coverageOf(cov, 'stratocumulus') / 2);
  });

  it('keeps drier scattered fair-weather clouds mostly cumulus under baseline cirrus', () => {
    const cov = inferCloudLayerCoverage(
      ...only({
        condition: 'partlycloudy',
        cloud_coverage: 35,
        humidity: 55,
        precipitation: 0,
        uv_index: 5,
      }),
    );
    expect(coverageOf(cov, 'cirrus')).toBeGreaterThan(0.1);
    // Crossfade, not a switch: a whisper of deck may remain, but cumulus
    // clearly dominates the dry scattered sky.
    expect(coverageOf(cov, 'cumulus')).toBeGreaterThan(coverageOf(cov, 'stratocumulus') * 4);
  });

  it('keeps dry high-UV fair weather as cirrus over cumulus', () => {
    expect(
      inferCloudLayers(
        ...only({
          condition: 'partlycloudy',
          cloud_coverage: 55,
          humidity: 45,
          precipitation: 0,
          uv_index: 8,
        }),
      ),
    ).toEqual(['cirrus', 'cumulus']);
  });

  it('infers stratus for fog', () => {
    expect(
      inferCloudLayers(
        ...only({
          condition: 'fog',
          cloud_coverage: 100,
          humidity: 95,
          precipitation: 0,
          uv_index: 1,
        }),
      ),
    ).toEqual(['stratus']);
  });

  it('infers stratus (nimbostratus) for steady precipitation', () => {
    expect(
      inferCloudLayers(
        ...only({
          condition: 'rainy',
          cloud_coverage: 65,
          humidity: 90,
          precipitation: 0.4,
          uv_index: 1,
        }),
      ),
    ).toEqual(['stratus']);
  });

  it('adds anvil cirrus over cumulonimbus for thunderstorms', () => {
    expect(
      inferCloudLayers(
        ...only({
          condition: 'lightning',
          cloud_coverage: 100,
          humidity: 88,
          precipitation: 0.1,
          uv_index: 2,
        }),
      ),
    ).toEqual(['cirrus', 'cumulonimbus']);
  });

  it('weights storm anvil cirrus below the cumulonimbus field', () => {
    expect(
      inferCloudLayerCoverage(
        ...only({
          condition: 'lightning',
          cloud_coverage: 100,
          humidity: 88,
          precipitation: 0.1,
          uv_index: 2,
        }),
      ),
    ).toEqual({
      cirrus: 0.45,
      cumulonimbus: 1,
    });
  });
});

describe('coverage prior from condition', () => {
  it('reads a sunny hour with missing cloud_coverage as near-clear', () => {
    const cov = inferCloudLayerCoverage(...only({ condition: 'sunny', humidity: 50 }));
    // The old flat 50% fallback painted half a sky of cloud here.
    expect(coverageOf(cov, 'cumulus')).toBe(0);
    expect(coverageOf(cov, 'stratocumulus')).toBe(0);
    expect(coverageOf(cov, 'stratus')).toBe(0);
    expect(coverageOf(cov, 'cirrus')).toBeLessThan(0.1);
  });

  it('reads a cloudy hour with missing cloud_coverage as a substantial deck', () => {
    const cov = inferCloudLayerCoverage(...only({ condition: 'cloudy', humidity: 75 }));
    expect(coverageOf(cov, 'stratocumulus')).toBeGreaterThan(0.5);
  });

  it('caps baseline cirrus at the reported sky cover on a fair day', () => {
    // The baseline term 0.4·(1−cov) peaks on the clearest skies — uncapped it
    // painted a 0.36 cirrus veil over a 10%-coverage day.
    const cov = inferCloudLayerCoverage(
      ...only({ condition: 'sunny', cloud_coverage: 12, humidity: 40, precipitation: 0 }),
    );
    expect(coverageOf(cov, 'cirrus')).toBeLessThanOrEqual(0.12);
  });
});

describe('forward look (approaching weather)', () => {
  it('paints a high cirrus harbinger over a fair sky when rain is hours away', () => {
    const forecast: CloudForecastEntry[] = [
      { condition: 'sunny', cloud_coverage: 10, humidity: 55, precipitation: 0, uv_index: 6 },
      { condition: 'partlycloudy', cloud_coverage: 30, humidity: 60, precipitation: 0 },
      { condition: 'cloudy', cloud_coverage: 70, humidity: 70, precipitation: 0 },
      { condition: 'cloudy', cloud_coverage: 90, humidity: 80, precipitation: 0 },
      { condition: 'rainy', cloud_coverage: 100, humidity: 90, precipitation: 0.2 },
    ];
    // Far front (4 hours out): high cloud, no meaningful low cloud yet.
    const cov = inferCloudLayerCoverage(forecast, 0);
    expect(coverageOf(cov, 'cirrus')).toBeGreaterThan(0.3);
    // A dry, near-clear sky hands the whole low band to cumulus, so what is
    // left is just the reported 10% cover faded down — a few small puffs.
    expect(coverageOf(cov, 'cumulus')).toBeCloseTo(0.05, 2);
    expect(coverageOf(cov, 'stratocumulus')).toBe(0);
  });

  it('thickens the harbinger to a cirrostratus veil as the front nears', () => {
    const forecast: CloudForecastEntry[] = [
      { condition: 'sunny', cloud_coverage: 10, humidity: 60, precipitation: 0 },
      { condition: 'rainy', cloud_coverage: 100, humidity: 90, precipitation: 0.3 },
    ];
    // Front next hour → dense veil dominating the sky.
    const cov = inferCloudLayerCoverage(forecast, 0);
    expect(coverageOf(cov, 'cirrus')).toBeGreaterThan(0.4);
  });

  it('raises the harbinger from precipitation probability before any wet condition', () => {
    const forecast: CloudForecastEntry[] = [
      { condition: 'sunny', cloud_coverage: 10, humidity: 55, precipitation: 0 },
      { condition: 'partlycloudy', cloud_coverage: 30, precipitation_probability: 80 },
    ];
    const cov = inferCloudLayerCoverage(forecast, 0);
    expect(coverageOf(cov, 'cirrus')).toBeGreaterThan(0.4);
  });

  it('lowers a dry overcast to altostratus (stratus) ahead of rain', () => {
    const forecast: CloudForecastEntry[] = [
      { condition: 'cloudy', cloud_coverage: 95, humidity: 80, precipitation: 0 },
      { condition: 'rainy', cloud_coverage: 100, humidity: 92, precipitation: 0.2 },
    ];
    expect(inferCloudLayers(forecast, 0)).toEqual(['stratus']);
  });

  it('keeps a dry overcast as stratocumulus when nothing is coming', () => {
    const forecast: CloudForecastEntry[] = [
      { condition: 'cloudy', cloud_coverage: 95, humidity: 80, precipitation: 0 },
    ];
    expect(inferCloudLayers(forecast, 0)).toEqual(['stratocumulus']);
  });

  it('escalates cumulus and feathers in the tower just before a storm', () => {
    const forecast: CloudForecastEntry[] = [
      { condition: 'partlycloudy', cloud_coverage: 50, humidity: 60, precipitation: 0 },
      { condition: 'lightning', cloud_coverage: 100, humidity: 88, precipitation: 0.1 },
    ];
    const cov = inferCloudLayerCoverage(forecast, 0);
    // Towering congestus + anvil blowoff + the tower's leading edge.
    expect(coverageOf(cov, 'cumulus')).toBeGreaterThanOrEqual(0.35);
    expect(coverageOf(cov, 'cumulonimbus')).toBeCloseTo(0.25, 2);
    expect(coverageOf(cov, 'cirrus')).toBeGreaterThan(0.4);
  });

  it('draws nothing at night', () => {
    const forecast: CloudForecastEntry[] = [
      { condition: 'cloudy', cloud_coverage: 95, humidity: 80, precipitation: 0 },
    ];
    expect(inferCloudLayers(forecast, 0, true)).toEqual([]);
  });
});

describe('backward look (clearing after rain)', () => {
  const dryHour: CloudForecastEntry = {
    condition: 'partlycloudy',
    cloud_coverage: 40,
    humidity: 50,
    precipitation: 0,
  };
  const wetHour: CloudForecastEntry = {
    condition: 'rainy',
    cloud_coverage: 90,
    humidity: 90,
    precipitation: 0.2,
  };

  it('keeps a stratocumulus deck in the hour right after rain ends', () => {
    const forecast = [wetHour, dryHour];
    const cov = inferCloudLayerCoverage(forecast, 1);
    expect(coverageOf(cov, 'stratocumulus')).toBeGreaterThanOrEqual(0.3);
  });

  it('decays the leftover deck as the rain recedes into the past', () => {
    const forecast = [wetHour, dryHour, dryHour, dryHour];
    const justAfter = coverageOf(inferCloudLayerCoverage(forecast, 1), 'stratocumulus');
    const later = coverageOf(inferCloudLayerCoverage(forecast, 3), 'stratocumulus');
    expect(later).toBeLessThan(justAfter);
  });
});

describe('diurnal cycle', () => {
  const at = (datetime: string): CloudForecastEntry => ({
    datetime,
    condition: 'partlycloudy',
    cloud_coverage: 50,
    humidity: 60,
    precipitation: 0,
    uv_index: 4,
  });

  it('leans lumpy deck in the morning and detached cumulus in the afternoon', () => {
    const morning = inferCloudLayerCoverage(...only(at('2026-07-02T07:00:00')));
    const afternoon = inferCloudLayerCoverage(...only(at('2026-07-02T15:00:00')));
    expect(coverageOf(morning, 'stratocumulus')).toBeGreaterThan(
      coverageOf(afternoon, 'stratocumulus'),
    );
    expect(coverageOf(afternoon, 'cumulus')).toBeGreaterThan(coverageOf(morning, 'cumulus'));
  });
});

describe('low-band form (deck vs detached puffs)', () => {
  const afternoon = (over: Partial<CloudForecastEntry>): CloudForecastEntry => ({
    condition: 'partlycloudy',
    cloud_coverage: 40,
    humidity: 60,
    precipitation: 0,
    uv_index: 4,
    datetime: '2026-07-02T14:00:00',
    ...over,
  });

  it('does not let humidity alone turn a scattered afternoon into a deck', () => {
    // Surface RH sits above 65% on plenty of textbook cumulus afternoons; it
    // used to be the switch that decided the low band on its own.
    const humid = inferCloudLayerCoverage(...only(afternoon({ humidity: 85 })));
    expect(coverageOf(humid, 'cumulus')).toBeGreaterThan(coverageOf(humid, 'stratocumulus'));
  });

  it('turns the same afternoon into a deck once the sky closes up', () => {
    const closing = inferCloudLayerCoverage(...only(afternoon({ cloud_coverage: 80 })));
    expect(coverageOf(closing, 'stratocumulus')).toBeGreaterThan(coverageOf(closing, 'cumulus'));
  });

  it('drops the losing form instead of drawing both low genera', () => {
    const scattered = inferCloudLayerCoverage(...only(afternoon({ cloud_coverage: 30 })));
    expect(coverageOf(scattered, 'cumulus')).toBeGreaterThan(0.2);
    expect(coverageOf(scattered, 'stratocumulus')).toBe(0);
  });
});

describe('wind', () => {
  it('pushes the same sky toward the lumpy deck as wind rises', () => {
    const base: CloudForecastEntry = {
      condition: 'partlycloudy',
      cloud_coverage: 50,
      humidity: 60,
      precipitation: 0,
    };
    const calm = inferCloudLayerCoverage(...only({ ...base, wind_speed: 2 }));
    const windy = inferCloudLayerCoverage(...only({ ...base, wind_speed: 30 }));
    expect(coverageOf(windy, 'stratocumulus')).toBeGreaterThan(coverageOf(calm, 'stratocumulus'));
  });
});

describe('continuity (anti-popping)', () => {
  it('keeps per-layer coverage close across the old humidity threshold', () => {
    const hour = (humidity: number): CloudForecastEntry => ({
      condition: 'partlycloudy',
      cloud_coverage: 50,
      humidity,
      precipitation: 0,
      uv_index: 4,
    });
    // Humidity 59 vs 61 used to flip the boolean "lumpy" decision, swapping
    // which genus owned the coverage between adjacent hours.
    const below = inferCloudLayerCoverage(...only(hour(59)));
    const above = inferCloudLayerCoverage(...only(hour(61)));
    for (const type of ['cirrus', 'stratus', 'stratocumulus', 'cumulus'] as const) {
      expect(Math.abs(coverageOf(below, type) - coverageOf(above, type))).toBeLessThan(0.1);
    }
  });

  it('keeps per-layer coverage close across the old broken-coverage breakpoint', () => {
    const hour = (cloud_coverage: number): CloudForecastEntry => ({
      condition: 'partlycloudy',
      cloud_coverage,
      humidity: 70,
      precipitation: 0,
      uv_index: 4,
    });
    const below = inferCloudLayerCoverage(...only(hour(63)));
    const above = inferCloudLayerCoverage(...only(hour(67)));
    for (const type of ['cirrus', 'stratus', 'stratocumulus', 'cumulus'] as const) {
      expect(Math.abs(coverageOf(below, type) - coverageOf(above, type))).toBeLessThan(0.1);
    }
  });
});
