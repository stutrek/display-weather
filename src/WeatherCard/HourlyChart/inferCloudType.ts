// ============================================================================
// Cloud inference
// ----------------------------------------------------------------------------
// The sky is decomposed into independent altitude bands. Each band is decided
// separately and may be empty or hold one cloud genus; the bands then stack
// back-to-front when rendered. Decisions use the current hour AND a forward
// look at the coming hours — high cloud is frequently the *harbinger* of
// weather still to come (cirrus creeping in hours before a front), while the
// low/mid band is the weather that is here now — plus a backward look, because
// a sky clears gradually after rain rather than snapping to fair weather.
//
// Every decision here is a continuous score, never a hard threshold. The
// renderer interpolates one coverage envelope per cloud type across the whole
// strip, so any boolean flip in this file reads on screen as a layer popping
// in or out between hours. Instead, coverage is *split* between genera in
// proportion to smooth 0..1 scores (lumpiness, harbinger strength, sheet
// closure), so layers wax and wane.
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
  datetime?: string;
  condition?: string;
  cloud_coverage?: number;
  humidity?: number;
  precipitation?: number;
  precipitation_probability?: number;
  uv_index?: number;
  temperature?: number;
  wind_speed?: number;
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

// Coverage ramp edges, aligned with the WMO okta sky-cover categories:
//   FEW 1–2 oktas ≈ 0.15 · SCATTERED 3–4 ≈ 0.45 · BROKEN 5–7 ≈ 0.65 ·
//   OVERCAST 8 ≈ 0.9.
const COV_FEW = 0.15;
const COV_SCATTERED = 0.45;
const COV_BROKEN = 0.65;
const COV_OVERCAST = 0.9;

// Forward window (hours) used to detect approaching weather, and backward
// window used to keep a decaying deck after rain ends.
const LOOKAHEAD_HOURS = 6;
const LOOKBEHIND_HOURS = 3;

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

// Hermite smoothstep: 0 at/below e0, 1 at/above e1, smooth ramp between.
function smoothstep(x: number, e0: number, e1: number): number {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
}

const STORM_CONDITIONS = ['lightning', 'lightning-rainy', 'exceptional', 'pouring', 'hail'];
const PRECIP_CONDITIONS = ['rainy', 'snowy', 'snowy-rainy'];
const FOG_CONDITIONS = ['fog', 'hazy', 'foggy'];
const CLOUDY_CONDITIONS = ['cloudy', 'partlycloudy', 'partly-cloudy'];

// Coverage prior by condition, used when the provider omits cloud_coverage.
// (A flat 50% fallback puts a half-covered sky on a "sunny" hour.)
const CONDITION_COVERAGE_PRIOR: Record<string, number> = {
  sunny: 0.05,
  'clear-night': 0.05,
  windy: 0.25,
  partlycloudy: 0.4,
  'partly-cloudy': 0.4,
  'windy-variant': 0.6,
  cloudy: 0.8,
  hazy: 0.9,
  fog: 0.95,
  foggy: 0.95,
  rainy: 0.95,
  snowy: 0.95,
  'snowy-rainy': 0.95,
  pouring: 1,
  lightning: 1,
  'lightning-rainy': 1,
  hail: 1,
  exceptional: 1,
};

const effectiveCoverage = (e: CloudForecastEntry): number =>
  e.cloud_coverage != null
    ? clamp01(e.cloud_coverage / 100)
    : (CONDITION_COVERAGE_PRIOR[e.condition ?? ''] ?? 0.5);

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

// Likelihood 0..1 that an hour is wet: certain when actually raining, else a
// ramp on precipitation probability (30% → 0, 80% → 1) so approaching fronts
// register hours before the first wet condition string.
const wetness = (e: CloudForecastEntry): number =>
  isWet(e) ? 1 : clamp01(((e.precipitation_probability ?? 0) - 30) / 50);

interface Ahead {
  // Strength 0..1 of approaching rain: wetness × proximity over the window.
  harbinger: number;
  // Hours until rain first becomes likely (Infinity if never in the window).
  rainETA: number;
  // Strength 0..1 of an approaching storm, proximity-weighted over the window.
  stormAhead: number;
  // 0..1 ramp for a storm only 1–2 hours out — towering-cumulus territory.
  stormSoon: number;
}

// Summarise the coming hours: how soon, and how surely, does weather turn?
function summarizeAhead(forecast: CloudForecastEntry[], index: number): Ahead {
  let harbinger = 0;
  let rainETA = Number.POSITIVE_INFINITY;
  let stormAhead = 0;
  let stormSoon = 0;
  const end = Math.min(forecast.length - 1, index + LOOKAHEAD_HOURS);
  for (let j = index + 1; j <= end; j++) {
    const dist = j - index;
    const proximity = (LOOKAHEAD_HOURS + 1 - dist) / LOOKAHEAD_HOURS;
    const w = wetness(forecast[j]);
    harbinger = Math.max(harbinger, clamp01(w * proximity));
    if (w >= 0.5 && rainETA === Number.POSITIVE_INFINITY) rainETA = dist;
    if (isStorm(forecast[j])) {
      stormAhead = Math.max(stormAhead, clamp01(proximity));
      if (dist <= 2) stormSoon = Math.max(stormSoon, (3 - dist) / 2);
    }
  }
  return { harbinger, rainETA, stormAhead, stormSoon };
}

// Rain in the recent past, decaying to 0 over LOOKBEHIND_HOURS: right after
// rain ends the sky is still a broken deck, not fair-weather cumulus.
function summarizeBehind(forecast: CloudForecastEntry[], index: number): number {
  let recent = 0;
  const start = Math.max(0, index - LOOKBEHIND_HOURS);
  for (let j = start; j < index; j++) {
    if (!isWet(forecast[j])) continue;
    recent = Math.max(recent, 1 - (index - j - 1) / LOOKBEHIND_HOURS);
  }
  return recent;
}

// Convective factor over the day: cumulus is a surface-heating cloud — it
// forms mid-morning, peaks mid-afternoon and dissolves by evening. Neutral
// (0.5) when the hour is unknown.
function convectiveFactor(datetime?: string): number {
  if (!datetime) return 0.5;
  const d = new Date(datetime);
  if (Number.isNaN(d.getTime())) return 0.5;
  const h = d.getHours() + d.getMinutes() / 60;
  if (h < 9 || h > 20) return 0;
  return Math.sin((Math.PI * (h - 9)) / 11);
}

// The per-hour inputs, reduced to smooth 0..1 signals the deciders share.
interface HourSignals {
  entry: CloudForecastEntry;
  cov: number;
  // Dry, bright, high-UV air 0..1 — favours detached cumulus under ice cloud.
  dry: number;
  convective: number;
  ahead: Ahead;
  recentRain: number;
}

interface BandCloud {
  genus: CloudGenus;
  coverage: number;
}

// --------------------------------------------------------------------------
// Primary band: the low/mid deck and the convective tower — the weather that
// is here now. Wet and foggy hours are categorical; every dry hour is a
// proportional split of the observed coverage between altostratus (the sheet
// lowering ahead of a front), stratocumulus (the lumpy deck) and cumulus
// (detached puffs), driven by continuous scores.
// --------------------------------------------------------------------------
function decidePrimary(sig: HourSignals): BandCloud[] {
  const { entry, cov, ahead } = sig;

  // Active storm → convective tower.
  if (isStorm(entry)) return [{ genus: 'cumulonimbus', coverage: cov }];

  // Steady (non-convective) precipitation → continuous-rain layer.
  if (isWet(entry)) return [{ genus: 'nimbostratus', coverage: cov }];

  // Fog / haze → ground-hugging flat layer.
  if (isFog(entry)) return [{ genus: 'stratus', coverage: cov }];

  const humidity = entry.humidity ?? 60;
  const isCloudy = CLOUDY_CONDITIONS.includes(entry.condition ?? '');

  // Fades all low cloud out as the sky approaches clear.
  const fade = smoothstep(cov, 0.05, COV_FEW);
  // Detached puffs close up into one continuous deck as coverage rises.
  const sheet = smoothstep(cov, COV_SCATTERED, COV_OVERCAST);
  // Wind mixes a flat layer into rolls and favours the lumpy deck.
  const windMix = smoothstep(entry.wind_speed ?? 0, 10, 25);

  // Lumpiness 0..1: how much the low cloud reads as a stratocumulus deck
  // versus detached cumulus. Moist air, cloudy conditions and wind push
  // lumpy; dry bright air and afternoon convection push detached. Mornings
  // lean lumpy (overnight deck not yet burned off), afternoons lean cumulus.
  const lumpiness = clamp01(
    smoothstep(humidity, 50, 75) +
      (isCloudy ? 0.1 : 0) +
      windMix * 0.2 +
      (0.5 - sig.convective) * 0.3 -
      sig.dry * (1 - sheet) * 0.5,
  );

  // Altostratus: the sheet portion lowers and greys ahead of a front.
  const altostratus = cov * sheet * ahead.harbinger;

  // Stratocumulus: the lumpy share of the deck, ceding to altostratus as the
  // front nears; floored by the decaying deck left behind by recent rain.
  let stratocumulus = cov * lumpiness * (0.75 + 0.25 * sheet) * (1 - ahead.harbinger * sheet);
  stratocumulus = Math.max(stratocumulus, sig.recentRain * cov * 0.9);

  // Cumulus: the detached share. A broken deck keeps some cumulus pushing
  // through it (the 0.4 floor); towers up (congestus) just ahead of a storm.
  let cumulus = cov * (1 - sheet) * Math.max(1 - lumpiness, 0.4);
  cumulus = Math.max(cumulus, ahead.stormSoon * cov * 0.7);

  // The tower feathers in ahead of the storm hour instead of jumping 0→1.
  const cumulonimbus = ahead.stormSoon * cov * 0.5;

  return [
    { genus: 'altostratus', coverage: altostratus * fade },
    { genus: 'stratocumulus', coverage: stratocumulus * fade },
    { genus: 'cumulus', coverage: cumulus * fade },
    { genus: 'cumulonimbus', coverage: cumulonimbus * fade },
  ];
}

// --------------------------------------------------------------------------
// High band: the cirrus-family layer. Present as a harbinger fading in ahead
// of a front, as anvil blowoff running ahead of a storm, as dry high-UV ice
// cloud over fair weather, or simply as thin wisps when that is all there is.
// --------------------------------------------------------------------------
function decideHigh(sig: HourSignals): BandCloud | null {
  const { entry, cov, ahead } = sig;

  // High cloud hides behind a wet sky, and fades as the low deck closes up.
  if (isWet(entry)) return null;
  const visibility = 1 - smoothstep(cov, COV_BROKEN, COV_OVERCAST);
  if (visibility <= 0) return null;

  // Harbinger: fades in from nothing as the front approaches.
  const veil = ahead.harbinger * 0.65;
  // Anvil blowoff runs hours ahead of a storm.
  const anvil = ahead.stormAhead * 0.5;
  // Dry, bright, high-UV air → prominent ice cloud above fair-weather cloud.
  const dryIce = sig.dry * Math.max(0.4, cov * 0.6);
  // Baseline: cirrus is usually present in a daytime sky. Thin it out as
  // lower cloud fills in and begins to hide it.
  const base = 0.4 * (1 - cov);
  // Ice cloud that exists *today* is part of the reported total sky cover —
  // a 10%-coverage day must read near-clear, not carry a 0.36 cirrus veil.
  // The veil and anvil are exempt: they announce weather the coverage number
  // doesn't include yet.
  const fairIce = Math.min(Math.max(dryIce, base), cov * 0.8);

  const coverage = Math.max(veil, anvil, fairIce) * visibility;
  if (coverage <= 0.005) return null;

  // A near front shows the thicker cirrostratus veil, a distant one scattered
  // cirrus (both collapse to the cirrus renderer).
  const genus: CloudGenus = ahead.rainETA <= 4 ? 'cirrostratus' : 'cirrus';
  return { genus, coverage };
}

/**
 * Returns per-renderer cloud coverage for a single forecast hour.
 * Values are the coverage envelope for that renderer, not normalized shares.
 * `forecast`/`index` give the deciders a forward and backward look at the
 * surrounding hours.
 */
export function inferCloudLayerCoverage(
  forecast: CloudForecastEntry[],
  index: number,
  isNight = false,
): CloudLayerCoverage {
  if (isNight) return {};
  const current = forecast[index];
  if (!current) return {};

  const humidity = current.humidity ?? 60;
  const uv = current.uv_index ?? 4;
  const sig: HourSignals = {
    entry: current,
    cov: effectiveCoverage(current),
    dry: (1 - smoothstep(humidity, 40, 55)) * smoothstep(uv, 5, 7),
    convective: convectiveFactor(current.datetime),
    ahead: summarizeAhead(forecast, index),
    recentRain: summarizeBehind(forecast, index),
  };

  const layers: CloudLayerCoverage = {};
  // Overlapping layers are a union, not a sum: keep the largest coverage that
  // lands on each renderer so the sky never reads as more than full.
  const addGenus = (genus: CloudGenus, coverage: number): void => {
    if (coverage <= 0.005) return;
    const renderer = GENUS_TO_RENDERER[genus];
    layers[renderer] = Math.max(layers[renderer] ?? 0, Math.min(1, coverage));
  };

  for (const layer of decidePrimary(sig)) addGenus(layer.genus, layer.coverage);

  const high = decideHigh(sig);
  if (high) addGenus(high.genus, high.coverage);

  // Anvil cirrus spreads above an active convective tower.
  if (isStorm(current)) addGenus('cirrus', sig.cov * 0.45);

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
