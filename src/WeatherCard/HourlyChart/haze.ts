// ============================================================================
// Haze
// ----------------------------------------------------------------------------
// Haze is low-lying atmospheric murk — moisture and aerosols you look *through*
// rather than discrete clouds you look *at*. It doesn't form shapes; it whitens
// and desaturates the sky, and because you look through more of it toward the
// horizon, it piles up at the bottom of the sky and thins with altitude.
//
// We infer an amount per forecast hour from dew point (temperature + humidity,
// so warm muggy air reads hazy while the same humidity in cold air stays clear)
// and the fog/hazy conditions, then paint a vertical wash that is densest right
// above the temperature-line horizon and fades upward. Amount also drives how
// high the wash climbs, so a muggy day is a faint band hugging the ridge and
// fog is a tall near-white-out.
// ============================================================================

import type { SunTimes, WeatherForecast } from '../WeatherContext';
import { createTemperaturePositioner } from './canvasHelpers';
import type { TemperatureUnit } from './colors';
import { makeCoverageInterpolator } from './coverageEnvelope';
import { getDaylightIntervals } from './sky';

// ============================================================================
// Inference
// ============================================================================

export interface HazeForecastEntry {
  condition?: string;
  humidity?: number;
  temperature?: number;
  /**
   * Optional, in the weather entity's `visibility_unit`. The hourly forecast
   * does not carry visibility, so this is normally undefined; it is here so a
   * current-conditions reading (or future per-hour data) can slot in. Lower
   * visibility → more haze. Thresholds below assume miles.
   */
  visibility?: number;
}

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

const toCelsius = (t: number, unit: TemperatureUnit): number =>
  unit === '°C' ? t : ((t - 32) * 5) / 9;

const celsiusToFahrenheit = (c: number): number => (c * 9) / 5 + 32;

/**
 * Dew point (°C) from air temperature (°C) and relative humidity (%), via the
 * Magnus approximation. Dew point — not bare RH — is what tracks how much water
 * is actually in the air: the same 65% RH is a muggy 77°F dew point at 90°F but
 * a crisp 39°F at 50°F, which is why haze scales with temperature.
 */
function dewPointC(tempC: number, rh: number): number {
  const a = 17.625;
  const b = 243.04;
  const gamma = Math.log(Math.max(1, rh) / 100) + (a * tempC) / (b + tempC);
  return (b * gamma) / (a - gamma);
}

// Moisture haze keyed on dew point (°F). Below CLEAR the air is crisp; by THICK
// it is oppressive, tropical murk. A muggy-but-clear afternoon (e.g. ~73°F dew
// point) should already read as visibly hazy, not just a faint tint, so THICK
// sits closer to a typical humid summer day than to extreme tropical murk.
const DEWPOINT_CLEAR_F = 50;
const DEWPOINT_THICK_F = 75;
const MOIST_MAX = 0.92;

// Fallback when temperature is missing: a gentler ramp on bare RH.
const HUMIDITY_START = 55;
const HUMIDITY_SATURATED = 100;
const HUMIDITY_MAX = 0.7;

// Condition floors: these skies are hazy regardless of the moisture numbers.
const CONDITION_HAZE: Record<string, number> = {
  fog: 1,
  foggy: 1,
  hazy: 0.85,
};

// Storm ceilings: an active storm scrubs the air — its moisture is falling as
// rain, not hanging as murk — and the pale horizon wash would otherwise bleach
// the cumulonimbus tower into a white blob exactly when it should loom.
const STORM_HAZE_CAP: Record<string, number> = {
  lightning: 0.25,
  'lightning-rainy': 0.25,
  hail: 0.25,
  pouring: 0.35,
  exceptional: 0.35,
};

// Visibility → haze, used only when `visibility` is supplied (see the field
// doc). Clear well above CLEAR, thick murk at/below MURK.
const VIS_CLEAR = 10;
const VIS_MURK = 1;

/**
 * Amount of haze for a single forecast hour, 0 (clear) to 1 (thick). Takes the
 * strongest of the moisture, condition, and (if present) visibility signals.
 * Moisture uses dew point (temperature + humidity) so hot, humid air reads as
 * hazy while the same humidity in cold air stays clear; if temperature is
 * missing it falls back to a plain humidity ramp.
 */
export function hazeAmount(entry: HazeForecastEntry, unit: TemperatureUnit = '°F'): number {
  const rh = entry.humidity ?? 0;

  let moist: number;
  if (entry.temperature !== undefined && rh > 0) {
    const tdF = celsiusToFahrenheit(dewPointC(toCelsius(entry.temperature, unit), rh));
    const t = clamp01((tdF - DEWPOINT_CLEAR_F) / (DEWPOINT_THICK_F - DEWPOINT_CLEAR_F));
    moist = t ** 1.2 * MOIST_MAX;
  } else {
    moist =
      clamp01((rh - HUMIDITY_START) / (HUMIDITY_SATURATED - HUMIDITY_START)) ** 1.3 * HUMIDITY_MAX;
  }

  const cond = CONDITION_HAZE[entry.condition ?? ''] ?? 0;

  let amount = Math.max(moist, cond);

  if (entry.visibility !== undefined) {
    const vis = clamp01((VIS_CLEAR - entry.visibility) / (VIS_CLEAR - VIS_MURK));
    amount = Math.max(amount, vis);
  }

  const cap = STORM_HAZE_CAP[entry.condition ?? ''];
  if (cap !== undefined) amount = Math.min(amount, cap);

  return clamp01(amount);
}

// ============================================================================
// Rendering
// ============================================================================

// Haze colours. Day: a pale sky-white that washes the bright cyan toward
// milky. Night: a dim desaturated murk, lighter than the deep indigo sky so a
// foggy night reads as a lifted, glowing horizon rather than a darker one.
const DAY_HAZE = '226, 238, 246';
const NIGHT_HAZE = '128, 122, 148';

// Peak opacity at the horizon, scaled by amount. Day haze is allowed to climb
// close to a white-out for fog; night stays more restrained.
const DAY_MAX_ALPHA = 0.95;
const NIGHT_MAX_ALPHA = 0.7;

// How tall the wash rises above the horizon, as a fraction of canvas height:
// BAND_MIN at the faintest haze, BAND_MIN + BAND_SPAN at full fog.
const BAND_MIN = 0.4;
const BAND_SPAN = 0.6;

// Below this the hour contributes no visible haze; skip it.
const MIN_VISIBLE = 0.02;

/**
 * Paint the haze wash over the sky. Densest just above the temperature-line
 * horizon, fading upward; colour and strength follow the day/night bands so the
 * transition stays as sharp as the sky's own day/night line. Meant to run after
 * the clouds and before the temperature terrain, so it washes out low horizon
 * cloud but is covered below the ridge by the terrain fill.
 */
export function drawHaze(
  canvas: HTMLCanvasElement,
  forecast: WeatherForecast[],
  sunTimes: SunTimes,
  pixelsPerDegree: number,
  temperatureUnit: TemperatureUnit = '°F',
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx || !forecast || forecast.length === 0) return;

  const dpr = window.devicePixelRatio || 1;
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;

  // Same timestamp-based x positioning as the sky/clouds so the haze envelope
  // lines up with the hours and the sun boundaries.
  const firstTime = new Date(forecast[0].datetime).getTime();
  const lastTime = new Date(forecast[forecast.length - 1].datetime).getTime();
  const timeRange = lastTime - firstTime;
  if (timeRange === 0) return;
  const hourX = (i: number): number =>
    ((new Date(forecast[i].datetime).getTime() - firstTime) / timeRange) * width;

  // Haze envelope across the strip, interpolated between hours.
  const envelope = forecast.map((hour, i) => ({
    x: hourX(i),
    v: hazeAmount(hour, temperatureUnit),
  }));
  const hazeAt = makeCoverageInterpolator(envelope);
  if (envelope.every((p) => p.v < MIN_VISIBLE)) return;

  // Horizon = the temperature line, interpolated the same piecewise-linear way
  // the clouds read their floor, so the wash tucks against the same ridge.
  const { getTempY } = createTemperaturePositioner(forecast, height, pixelsPerDegree);
  const tempYs = forecast.map((h) => getTempY(h.temperature ?? 0));
  const floorAt = (x: number): number => {
    const fi = (x / width) * (forecast.length - 1);
    const i = Math.max(0, Math.min(forecast.length - 2, Math.floor(fi)));
    const t = Math.max(0, Math.min(1, fi - i));
    return tempYs[i] + t * (tempYs[i + 1] - tempYs[i]);
  };

  const dayIntervals = getDaylightIntervals(forecast, sunTimes, width);
  const isDayAtX = (x: number): boolean => dayIntervals.some((d) => x >= d.start && x < d.end);

  // One 1px-wide vertical gradient per column. amount and floor both vary
  // smoothly across x, so adjacent columns differ minutely and the strips read
  // as one continuous wash.
  for (let x = 0; x < width; x++) {
    const amount = hazeAt(x + 0.5);
    if (amount < MIN_VISIBLE) continue;

    const day = isDayAtX(x + 0.5);
    const color = day ? DAY_HAZE : NIGHT_HAZE;
    const peak = (day ? DAY_MAX_ALPHA : NIGHT_MAX_ALPHA) * amount;

    const floorY = floorAt(x + 0.5);
    const top = Math.max(0, floorY - height * (BAND_MIN + BAND_SPAN * amount));
    if (floorY <= top) continue;

    const grad = ctx.createLinearGradient(0, top, 0, floorY);
    grad.addColorStop(0, `rgba(${color}, 0)`);
    grad.addColorStop(0.35, `rgba(${color}, ${peak * 0.45})`);
    grad.addColorStop(1, `rgba(${color}, ${peak})`);
    ctx.fillStyle = grad;
    ctx.fillRect(x, top, 1, floorY - top);
  }
}
