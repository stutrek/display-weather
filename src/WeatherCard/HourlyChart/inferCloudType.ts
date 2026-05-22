export type CloudType = 'cumulus' | 'stratocumulus' | 'stratus' | 'cirrus' | 'none';

export interface CloudForecastEntry {
  condition?: string;
  cloud_coverage?: number;
  humidity?: number;
  precipitation?: number;
  uv_index?: number;
  temperature?: number;
}

/**
 * Infer the dominant cloud type from an hourly forecast entry.
 *
 * Uses a weighted scoring approach across condition, cloud coverage, humidity,
 * precipitation, and UV index. Returns 'none' when the sky is essentially clear.
 *
 * Mapping to our four rendered types:
 *   cirrus        — high, wispy, thin ice cloud; low humidity, low coverage, no precip
 *   cumulus       — fair-weather puffy clouds; moderate coverage, good UV, dry
 *   stratocumulus — low lumpy layers; moderate–high coverage, little precip
 *   stratus       — flat uniform overcast or fog; high humidity, possible drizzle
 */
export function inferCloudType(f: CloudForecastEntry, isNight = false): CloudType {
  if (isNight) return 'none';
  const condition = f.condition ?? '';
  const coverage = (f.cloud_coverage ?? 50) / 100;
  const humidity = f.humidity ?? 60;
  const precip = f.precipitation ?? 0;
  const uv = f.uv_index ?? 4;

  // Clear sky — nothing to render
  if (coverage < 0.08) return 'none';
  if (condition === 'sunny' || condition === 'clear-night' || condition === 'clear') {
    if (coverage < 0.15) return 'none';
  }

  // Fog always reads as stratus
  if (condition === 'fog' || condition === 'hazy' || condition === 'foggy') return 'stratus';

  // Precipitation conditions → stratus (nimbostratus / cumulonimbus base layer)
  if (
    ['rainy', 'pouring', 'snowy', 'snowy-rainy', 'hail', 'lightning-rainy', 'exceptional'].includes(
      condition,
    )
  )
    return 'stratus';

  // Score each type
  let cumulus = 0;
  let stratocumulus = 0;
  let stratus = 0;
  let cirrus = 0;

  // --- Cloud coverage ---
  if (coverage < 0.25) cirrus += 2;
  if (coverage >= 0.15 && coverage < 0.65) cumulus += 2;
  if (coverage >= 0.45 && coverage < 0.88) stratocumulus += 2;
  if (coverage >= 0.78) stratus += 2;
  // Near-total overcast (cloudy/partlycloudy but solid cover) reads as stratus
  if (
    coverage >= 0.92 &&
    (condition === 'cloudy' || condition === 'partlycloudy' || condition === 'overcast')
  )
    stratus += 2;

  // --- Humidity ---
  // Cirrus forms at altitude in dry upper air; surface humidity stays low
  if (humidity < 45) cirrus += 1.5;
  else if (humidity < 65) cumulus += 1;
  else if (humidity < 82) stratocumulus += 1;
  else stratus += 1.5;

  // --- Precipitation ---
  if (precip === 0) {
    cumulus += 0.5;
    cirrus += 0.5;
  } else if (precip < 0.3) {
    stratocumulus += 1;
  } else {
    stratus += 2;
  }

  // --- UV index ---
  // High UV means thin or broken cloud (cirrus lets most through; cumulus gaps)
  if (uv > 7) cirrus += 1;
  else if (uv > 3) cumulus += 0.5;
  else if (uv <= 1) stratus += 0.5;

  // --- Condition hint ---
  if (condition === 'partlycloudy') {
    cumulus += 1;
    stratocumulus += 0.5;
  } else if (condition === 'cloudy') {
    stratocumulus += 1.5;
    stratus += 0.5;
  } else if (condition === 'overcast') {
    stratus += 2;
  } else if (condition === 'sunny' || condition === 'clear-night') {
    cumulus += 1.5;
  }

  const scores: Record<CloudType, number> = { cumulus, stratocumulus, stratus, cirrus, none: 0 };
  return Object.entries(scores).sort(([, a], [, b]) => b - a)[0][0] as CloudType;
}
