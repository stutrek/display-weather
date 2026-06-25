// ============================================================================
// Cloud inference
// ----------------------------------------------------------------------------
// The sky is decomposed into independent altitude bands. Each band is decided
// separately and may be empty or hold one cloud genus; the bands then stack
// back-to-front when rendered. Decisions use the current hour AND a forward
// look at the coming hours — high cloud is frequently the *harbinger* of
// weather still to come (cirrus creeping in hours before a front), while the
// low/mid band is the weather that is here now.
//
// We classify into the ten canonical genera (richer, well-defined vocabulary)
// and then map each genus down to one of the five renderers we actually draw.
// ============================================================================

export type CloudType =
  | 'cumulus'
  | 'stratocumulus'
  | 'stratus'
  | 'cirrus'
  | 'cumulonimbus'
  | 'none';

type RenderedCloudType = Exclude<CloudType, 'none'>;

export interface CloudForecastEntry {
  condition?: string;
  cloud_coverage?: number;
  humidity?: number;
  precipitation?: number;
  uv_index?: number;
  temperature?: number;
}

export type CloudLayerCoverage = Partial<Record<RenderedCloudType, number>>;

// Render order: back (high altitude) → front (low altitude).
const LAYER_ORDER: RenderedCloudType[] = [
  'cirrus',
  'stratus',
  'stratocumulus',
  'cumulus',
  'cumulonimbus',
];

// The ten canonical genera. We never draw these directly — each maps to one of
// the five renderers below.
export type CloudGenus =
  | 'cirrus'
  | 'cirrocumulus'
  | 'cirrostratus'
  | 'altocumulus'
  | 'altostratus'
  | 'nimbostratus'
  | 'stratus'
  | 'stratocumulus'
  | 'cumulus'
  | 'cumulonimbus';

// Genus → renderer. High genera collapse to the cirrus renderer; the flat-grey
// and steady-rain genera collapse to stratus; the lumpy ones to stratocumulus.
const GENUS_TO_RENDERER: Record<CloudGenus, RenderedCloudType> = {
  cirrus: 'cirrus',
  cirrocumulus: 'cirrus',
  cirrostratus: 'cirrus',
  altocumulus: 'stratocumulus',
  altostratus: 'stratus',
  nimbostratus: 'stratus',
  stratus: 'stratus',
  stratocumulus: 'stratocumulus',
  cumulus: 'cumulus',
  cumulonimbus: 'cumulonimbus',
};

// Coverage breakpoints, aligned with the WMO okta sky-cover categories:
//   FEW 1–2 oktas ≈ 0.15 · SCATTERED 3–4 ≈ 0.45 · BROKEN 5–7 ≈ 0.65 ·
//   OVERCAST 8 ≈ 0.9.
const COV_FEW = 0.15;
const COV_SCATTERED = 0.45;
const COV_BROKEN = 0.65;
const COV_OVERCAST = 0.9;

// Forward window (hours) used to detect approaching weather.
const LOOKAHEAD_HOURS = 6;

const STORM_CONDITIONS = ['lightning', 'lightning-rainy', 'exceptional', 'pouring', 'hail'];
const PRECIP_CONDITIONS = ['rainy', 'snowy', 'snowy-rainy'];
const FOG_CONDITIONS = ['fog', 'hazy', 'foggy'];
const CLOUDY_CONDITIONS = ['cloudy', 'partlycloudy', 'partly-cloudy'];

// Light steady precipitation (inches/h) that still marks an hour as "wet".
const WET_PRECIP = 0.05;

const isStorm = (e: CloudForecastEntry): boolean => STORM_CONDITIONS.includes(e.condition ?? '');

const isFog = (e: CloudForecastEntry): boolean => FOG_CONDITIONS.includes(e.condition ?? '');

// Wet = producing precipitation now: a rain/snow condition, an active storm, or
// measurable precip regardless of the condition string.
const isWet = (e: CloudForecastEntry): boolean =>
  isStorm(e) ||
  PRECIP_CONDITIONS.includes(e.condition ?? '') ||
  (e.precipitation ?? 0) >= WET_PRECIP;

interface Ahead {
  rainComing: boolean;
  // Hours until the first wet hour in the window (Infinity if none).
  rainETA: number;
  stormComing: boolean;
}

// Summarise the coming hours: how soon does weather deteriorate?
function summarizeAhead(forecast: CloudForecastEntry[], index: number): Ahead {
  let rainETA = Number.POSITIVE_INFINITY;
  let stormComing = false;
  const end = Math.min(forecast.length - 1, index + LOOKAHEAD_HOURS);
  for (let j = index + 1; j <= end; j++) {
    const e = forecast[j];
    if (isWet(e) && rainETA === Number.POSITIVE_INFINITY) rainETA = j - index;
    if (isStorm(e)) stormComing = true;
  }
  return { rainComing: rainETA !== Number.POSITIVE_INFINITY, rainETA, stormComing };
}

interface BandCloud {
  genus: CloudGenus;
  coverage: number;
}

// --------------------------------------------------------------------------
// Primary band: the dominant weather feature that is here *now* — the low/mid
// deck or the convective tower. Carries most of the observed coverage. May
// return a second element for a broken deck (lumpy sheet with cumulus through
// it). `hasDryCirrus` suppresses the lumpy deck when high ice cloud already
// owns a thin, dry sky.
// --------------------------------------------------------------------------
function decidePrimary(
  current: CloudForecastEntry,
  ahead: Ahead,
  hasDryCirrus: boolean,
): BandCloud[] {
  const cov = (current.cloud_coverage ?? 50) / 100;
  const humidity = current.humidity ?? 60;
  const isCloudy = CLOUDY_CONDITIONS.includes(current.condition ?? '');

  // Active storm → convective tower.
  if (isStorm(current)) return [{ genus: 'cumulonimbus', coverage: cov }];

  // Steady (non-convective) precipitation → continuous-rain layer.
  if (isWet(current)) return [{ genus: 'nimbostratus', coverage: cov }];

  // Fog / haze → ground-hugging flat layer.
  if (isFog(current)) return [{ genus: 'stratus', coverage: cov }];

  // Overcast and dry: lowering ahead of a front reads as altostratus; an
  // overcast that stays dry is a benign stratocumulus deck.
  if (cov >= COV_OVERCAST) {
    return ahead.rainComing
      ? [{ genus: 'altostratus', coverage: cov }]
      : [{ genus: 'stratocumulus', coverage: cov }];
  }

  // Below "few": no meaningful low cloud (the high band may still add wisps).
  if (cov < COV_FEW) return [];

  // Lumpy low deck needs moist or explicitly cloudy air; otherwise the same
  // coverage reads as drier, more detached cumulus. Dry high-UV skies with a
  // cirrus layer suppress the lumpy deck until it is genuinely broken+.
  const lumpy = (humidity >= 60 || isCloudy) && !(hasDryCirrus && cov < COV_BROKEN);

  if (cov >= COV_BROKEN) {
    return lumpy
      ? [{ genus: 'stratocumulus', coverage: cov }]
      : [{ genus: 'cumulus', coverage: cov }];
  }

  if (cov >= COV_SCATTERED) {
    // Broken deck: a lumpy sheet with detached cumulus pushing through it.
    return lumpy
      ? [
          { genus: 'stratocumulus', coverage: cov * 0.75 },
          { genus: 'cumulus', coverage: cov * 0.4 },
        ]
      : [{ genus: 'cumulus', coverage: cov }];
  }

  // Scattered fair-weather cloud.
  return [{ genus: 'cumulus', coverage: cov }];
}

// --------------------------------------------------------------------------
// High band: the cirrus-family layer. Present as a harbinger when a front is
// approaching a sky that is not already wet or overcast, as dry high-UV ice
// cloud over fair weather, or simply as thin wisps when that is all there is.
// --------------------------------------------------------------------------
function decideHigh(
  current: CloudForecastEntry,
  ahead: Ahead,
  hasDryCirrus: boolean,
): BandCloud | null {
  const cov = (current.cloud_coverage ?? 50) / 100;

  // High cloud is hidden behind a wet or fully overcast sky.
  if (isWet(current) || cov >= COV_OVERCAST) return null;

  // Harbinger: deterioration ahead. The nearer the front, the more of the sky
  // the veil claims; a close front shows the thicker cirrostratus veil, a
  // distant one shows scattered cirrus. Fires even over an otherwise clear sky.
  if (ahead.rainComing) {
    const eta = ahead.rainETA;
    const coverage = Math.max(0.35, Math.min(0.65, 0.65 - 0.05 * (eta - 1)));
    return { genus: eta <= 4 ? 'cirrostratus' : 'cirrus', coverage };
  }

  // Genuinely clear sky with nothing coming → no high cloud either.
  if (cov < 0.05) return null;

  // Dry, bright, high-UV air → prominent ice cloud above fair-weather cloud.
  if (hasDryCirrus) {
    return { genus: 'cirrus', coverage: Math.max(0.4, cov * 0.6) };
  }

  // Baseline: cirrus is usually present in a daytime sky. Thin it out as lower
  // cloud fills in and begins to hide it.
  return { genus: 'cirrus', coverage: 0.4 * (1 - cov) };
}

/**
 * Returns per-renderer cloud coverage for a single forecast hour.
 * Values are the coverage envelope for that renderer, not normalized shares.
 * `forecast`/`index` give the deciders a forward look at the coming hours.
 */
export function inferCloudLayerCoverage(
  forecast: CloudForecastEntry[],
  index: number,
  isNight = false,
): CloudLayerCoverage {
  if (isNight) return {};
  const current = forecast[index];
  if (!current) return {};

  const layers: CloudLayerCoverage = {};
  // Overlapping layers are a union, not a sum: keep the largest coverage that
  // lands on each renderer so the sky never reads as more than full.
  const addGenus = (genus: CloudGenus, coverage: number): void => {
    if (coverage <= 0.005) return;
    const renderer = GENUS_TO_RENDERER[genus];
    layers[renderer] = Math.max(layers[renderer] ?? 0, Math.min(1, coverage));
  };

  const ahead = summarizeAhead(forecast, index);
  const humidity = current.humidity ?? 60;
  const uv = current.uv_index ?? 4;
  const hasDryCirrus = humidity < 50 && uv > 6;

  const primary = decidePrimary(current, ahead, hasDryCirrus);
  for (const layer of primary) addGenus(layer.genus, layer.coverage);

  const high = decideHigh(current, ahead, hasDryCirrus);
  if (high) addGenus(high.genus, high.coverage);

  // Anvil cirrus spreads above a convective tower.
  if (primary.some((p) => p.genus === 'cumulonimbus')) {
    addGenus('cirrus', ((current.cloud_coverage ?? 50) / 100) * 0.45);
  }

  return layers;
}

/**
 * Returns the ordered list of renderers to draw for a single forecast hour,
 * back (high altitude) → front (low altitude). Empty array means clear sky.
 */
export function inferCloudLayers(
  forecast: CloudForecastEntry[],
  index: number,
  isNight = false,
): RenderedCloudType[] {
  const layerCoverage = inferCloudLayerCoverage(forecast, index, isNight);
  return LAYER_ORDER.filter((type) => (layerCoverage[type] ?? 0) > 0);
}
