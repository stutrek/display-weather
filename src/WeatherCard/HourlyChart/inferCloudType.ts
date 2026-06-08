export type CloudType =
  | 'cumulus'
  | 'stratocumulus'
  | 'stratus'
  | 'cirrus'
  | 'cumulonimbus'
  | 'none';

export interface CloudForecastEntry {
  condition?: string;
  cloud_coverage?: number;
  humidity?: number;
  precipitation?: number;
  uv_index?: number;
  temperature?: number;
}

/**
 * Returns an ordered list of cloud layers to render, back (high altitude) → front (low altitude).
 * Empty array means clear sky.
 *
 * Five explicit combinations:
 *   ['cirrus']                 — overcast, rain, fog, or low-coverage wisps
 *   ['cumulus']                — fair-weather scattered/broken cumulus
 *   ['cirrus', 'cumulus']      — dry fair weather with high-altitude ice cloud above
 *   ['cumulonimbus']           — (reserved, rare — storm without anvil)
 *   ['cirrus', 'cumulonimbus'] — thunderstorm with anvil cirrus spreading above
 */
export function inferCloudLayers(
  f: CloudForecastEntry,
  isNight = false,
): Exclude<CloudType, 'none'>[] {
  if (isNight) return [];
  const condition = f.condition ?? '';
  const coverage = (f.cloud_coverage ?? 50) / 100;
  const humidity = f.humidity ?? 60;
  const precip = f.precipitation ?? 0;
  const uv = f.uv_index ?? 4;

  if (coverage < 0.01) return [];
  if (
    (condition === 'sunny' || condition === 'clear' || condition === 'clear-night') &&
    coverage < 0.15
  )
    return [];

  if (['fog', 'hazy', 'foggy'].includes(condition)) return ['cirrus'];
  if (['lightning-rainy', 'exceptional', 'pouring', 'hail'].includes(condition))
    return ['cirrus', 'cumulonimbus'];
  if (['rainy', 'snowy', 'snowy-rainy'].includes(condition) || precip > 0.3) return ['cirrus'];

  // Overcast / near-total coverage → flat cirrus layer
  if (coverage >= 0.8 || condition === 'overcast') return ['cirrus'];

  // Very low coverage (scattered wisps)
  if (coverage < 0.15) return ['cirrus'];

  // Cirrus layer: dry upper air + strong UV → ice crystals visible above cumulus
  const hasCirrusLayer = humidity < 50 && uv > 6;

  return hasCirrusLayer ? ['cirrus', 'cumulus'] : ['cumulus'];
}
