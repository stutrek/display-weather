import { describe, expect, it } from 'vitest';
import {
  type CloudForecastEntry,
  inferCloudLayerCoverage,
  inferCloudLayers,
} from './inferCloudType';

// Most cases only depend on the current hour; wrap a single entry so the
// forward look sees no approaching weather.
const only = (entry: CloudForecastEntry): [CloudForecastEntry[], number] => [[entry], 0];

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
    expect(
      inferCloudLayerCoverage(
        ...only({
          condition: 'partlycloudy',
          cloud_coverage: 50,
          humidity: 70,
          precipitation: 0,
          uv_index: 4,
        }),
      ),
    ).toEqual({
      cirrus: 0.2,
      stratocumulus: 0.375,
      cumulus: 0.2,
    });
  });

  it('infers stratocumulus under baseline cirrus from broad low-cloud coverage', () => {
    expect(
      inferCloudLayers(
        ...only({
          cloud_coverage: 65,
          humidity: 75,
          precipitation: 0,
          uv_index: 4,
        }),
      ),
    ).toEqual(['cirrus', 'stratocumulus']);
  });

  it('keeps drier scattered fair-weather clouds as cumulus under baseline cirrus', () => {
    expect(
      inferCloudLayers(
        ...only({
          condition: 'partlycloudy',
          cloud_coverage: 35,
          humidity: 55,
          precipitation: 0,
          uv_index: 5,
        }),
      ),
    ).toEqual(['cirrus', 'cumulus']);
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

describe('forward look (approaching weather)', () => {
  it('paints high cirrus harbinger over a fair sky when rain is hours away', () => {
    const forecast: CloudForecastEntry[] = [
      { condition: 'sunny', cloud_coverage: 10, humidity: 55, precipitation: 0, uv_index: 6 },
      { condition: 'partlycloudy', cloud_coverage: 30, humidity: 60, precipitation: 0 },
      { condition: 'cloudy', cloud_coverage: 70, humidity: 70, precipitation: 0 },
      { condition: 'cloudy', cloud_coverage: 90, humidity: 80, precipitation: 0 },
      { condition: 'rainy', cloud_coverage: 100, humidity: 90, precipitation: 0.2 },
    ];
    // Far front (4 hours out) → scattered cirrus, no low cloud yet.
    expect(inferCloudLayers(forecast, 0)).toEqual(['cirrus']);
  });

  it('thickens the harbinger to a cirrostratus veil as the front nears', () => {
    const forecast: CloudForecastEntry[] = [
      { condition: 'sunny', cloud_coverage: 10, humidity: 60, precipitation: 0 },
      { condition: 'rainy', cloud_coverage: 100, humidity: 90, precipitation: 0.3 },
    ];
    // Front next hour → cirrostratus veil (still the cirrus renderer), denser.
    const cov = inferCloudLayerCoverage(forecast, 0);
    expect(Object.keys(cov)).toEqual(['cirrus']);
    expect(cov.cirrus).toBeGreaterThan(0.4);
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

  it('draws nothing at night', () => {
    const forecast: CloudForecastEntry[] = [
      { condition: 'cloudy', cloud_coverage: 95, humidity: 80, precipitation: 0 },
    ];
    expect(inferCloudLayers(forecast, 0, true)).toEqual([]);
  });
});
