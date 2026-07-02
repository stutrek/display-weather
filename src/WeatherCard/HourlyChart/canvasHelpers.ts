// ============================================================================
// Canvas Helpers for WeatherCard2
// Functions for drawing weather visualizations on canvas
// ============================================================================

import type { SunTimes, WeatherForecast } from '../WeatherContext';

// ============================================================================
// Weather Icon Mapping
// ============================================================================

const WEATHER_ICONS: Record<string, string> = {
  sunny: 'mdi:weather-sunny',
  'clear-night': 'mdi:weather-night',
  cloudy: 'mdi:weather-cloudy',
  partlycloudy: 'mdi:weather-partly-cloudy',
  'partlycloudy-night': 'mdi:weather-night-partly-cloudy',
  rainy: 'mdi:weather-rainy',
  pouring: 'mdi:weather-pouring',
  snowy: 'mdi:weather-snowy',
  'snowy-rainy': 'mdi:weather-snowy-rainy',
  fog: 'mdi:weather-fog',
  hail: 'mdi:weather-hail',
  lightning: 'mdi:weather-lightning',
  'lightning-rainy': 'mdi:weather-lightning-rainy',
  windy: 'mdi:weather-windy',
  'windy-variant': 'mdi:weather-windy-variant',
  exceptional: 'mdi:alert-circle-outline',
  clear: 'mdi:weather-sunny',
};

/**
 * Get MDI weather icon name for a condition
 */
export function getWeatherIcon(condition: string | undefined): string {
  if (!condition) return 'mdi:weather-cloudy';
  return WEATHER_ICONS[condition] ?? 'mdi:weather-cloudy';
}

/**
 * Get MDI weather icon name for a condition at a specific time
 * Automatically uses night variants when available
 */
export function getWeatherIconForTime(
  condition: string | undefined,
  datetime: string,
  sunTimes: SunTimes,
): string {
  if (!condition) return 'mdi:weather-cloudy';

  // Check if it's nighttime
  const isNight = !isDaytime(datetime, sunTimes);

  // If nighttime, check for a -night variant in the map
  if (isNight) {
    const nightVariant = `${condition}-night`;
    if (WEATHER_ICONS[nightVariant]) {
      return WEATHER_ICONS[nightVariant];
    }
  }

  // Fall back to regular icon
  return WEATHER_ICONS[condition] ?? 'mdi:weather-cloudy';
}

// ============================================================================
// Temperature Position Calculator
// ============================================================================

/**
 * Create a temperature positioning utility that can be shared between
 * canvas drawing and React component positioning
 */
export function createTemperaturePositioner(
  forecast: WeatherForecast[],
  canvasHeight: number,
  pixelsPerDegree: number,
) {
  const temps = forecast.map((f) => f.temperature ?? 0);
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  const tempRange = maxTemp - minTemp;

  // Reserve sky space above the ridge for cloud rendering: the hottest point
  // of the line should only reach ~60% of the way up the canvas, not crowd
  // the top edge. A small bottom margin keeps the line off the floor too.
  const SKY_FRACTION = 0.4;
  const BOTTOM_MARGIN = 12;
  const topPadding = canvasHeight * SKY_FRACTION;
  const usableHeight = canvasHeight - topPadding - BOTTOM_MARGIN;
  const effectivePpd =
    tempRange > 0 ? Math.min(pixelsPerDegree, usableHeight / tempRange) : pixelsPerDegree;

  return {
    getTempY: (temp: number): number => {
      if (tempRange === 0) return canvasHeight / 2;
      return topPadding + (maxTemp - temp) * effectivePpd;
    },
    minTemp,
    maxTemp,
    tempRange,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Determine if a given datetime is during daytime based on sunrise/sunset
 * Only compares time-of-day (hours/minutes/seconds), not the full date
 */
export function isDaytime(datetime: string, sunTimes: SunTimes): boolean {
  const date = new Date(datetime);

  // Default to daytime if sun times not available
  if (!sunTimes.sunrise || !sunTimes.sunset) {
    const hour = date.getHours();
    return hour >= 6 && hour < 18;
  }

  // Extract time-of-day components (hours, minutes, seconds, milliseconds)
  const timeOfDay =
    date.getHours() * 3600000 +
    date.getMinutes() * 60000 +
    date.getSeconds() * 1000 +
    date.getMilliseconds();
  const sunriseTime =
    sunTimes.sunrise.getHours() * 3600000 +
    sunTimes.sunrise.getMinutes() * 60000 +
    sunTimes.sunrise.getSeconds() * 1000 +
    sunTimes.sunrise.getMilliseconds();
  const sunsetTime =
    sunTimes.sunset.getHours() * 3600000 +
    sunTimes.sunset.getMinutes() * 60000 +
    sunTimes.sunset.getSeconds() * 1000 +
    sunTimes.sunset.getMilliseconds();

  return timeOfDay >= sunriseTime && timeOfDay < sunsetTime;
}

// ============================================================================
// Main Drawing Functions
// ============================================================================

// Smoothing factor for the temperature ridge. ~1/6 is a standard Catmull-Rom
// spline; a touch higher rounds the hour-to-hour angles into rolling land
// without noticeable overshoot.
export const RIDGE_SMOOTHING = 0.2;

interface Point {
  x: number;
  y: number;
}

/**
 * Append a smooth curve through `pts`, assuming the current point is already at
 * pts[0]. Expressed as a Catmull-Rom spline in cubic Béziers, so the curve
 * passes through every point — temperature labels still sit on the ridge —
 * while the joins between hours are rounded rather than hard angles. Works with
 * any sink exposing bezierCurveTo/lineTo (Path2D or a canvas context).
 */
export function appendSmoothCurve(
  sink: Pick<Path2D, 'bezierCurveTo' | 'lineTo'>,
  pts: Point[],
  smoothing = RIDGE_SMOOTHING,
): void {
  if (pts.length < 2) return;
  if (pts.length === 2) {
    sink.lineTo(pts[1].x, pts[1].y);
    return;
  }
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? pts[i + 1];
    const cp1x = p1.x + (p2.x - p0.x) * smoothing;
    const cp1y = p1.y + (p2.y - p0.y) * smoothing;
    const cp2x = p2.x - (p3.x - p1.x) * smoothing;
    const cp2y = p2.y - (p3.y - p1.y) * smoothing;
    sink.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
  }
}

/**
 * Add densely-sampled colour stops to a horizontal gradient by interpolating
 * temperature between the hourly points and colouring each sub-step. This lets
 * the perceptually-smooth palette ramp render faithfully, instead of the
 * browser re-blending in sRGB across sparse per-hour stops (which reintroduces
 * the muddy band the OKLCH palette is designed to avoid).
 */
function addTemperatureStops(
  gradient: CanvasGradient,
  forecast: WeatherForecast[],
  colorFn: (temp: number) => string,
  steps = 64,
): void {
  const n = forecast.length;
  const temps = forecast.map((h) => h.temperature ?? 0);
  const tempAt = (p: number): number => {
    if (n === 1) return temps[0];
    const f = p * (n - 1);
    const i = Math.max(0, Math.min(n - 2, Math.floor(f)));
    return temps[i] + (temps[i + 1] - temps[i]) * (f - i);
  };
  for (let k = 0; k <= steps; k++) {
    const p = k / steps;
    gradient.addColorStop(p, colorFn(tempAt(p)));
  }
}

/**
 * Draw the temperature "terrain": the area below the temperature line is
 * painted as ground (biome colour across the day, sinking into shadow toward
 * the bottom) with a single smooth temperature line as the horizon.
 */
export function drawTemperatureLine(
  canvas: HTMLCanvasElement,
  forecast: WeatherForecast[],
  pixelsPerDegree: number,
  colorFn: (temp: number) => string,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx || !forecast || forecast.length === 0) return;

  // Get device pixel ratio and logical dimensions
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;

  // Use shared temperature positioner
  const { getTempY } = createTemperaturePositioner(forecast, height, pixelsPerDegree);

  // Calculate x position for each hour
  const getHourX = (index: number): number => {
    return (index / (forecast.length - 1)) * width;
  };

  // Ridge points (one per hour). The terrain top and the horizon stroke are
  // both smooth curves through these, so hour-to-hour joins read as rolling
  // land instead of a hard polyline.
  const ridgePts = forecast.map((hour, index) => ({
    x: getHourX(index),
    y: getTempY(hour.temperature ?? 0),
  }));

  // Build the path for the area below the temperature line.
  // We fill this polygon directly with ctx.fill() rather than clipping +
  // fillRect — iOS Safari < 16 has unreliable behavior combining a linear
  // gradient fillStyle with a clip established from an open-then-closed path,
  // and that combination was producing an invisible gradient on iOS 15.5.
  const fillPath = new Path2D();
  fillPath.moveTo(0, height);
  fillPath.lineTo(ridgePts[0].x, ridgePts[0].y);
  appendSmoothCurve(fillPath, ridgePts);
  fillPath.lineTo(width, height);
  fillPath.closePath();

  // Horizontal gradient: the biome colour across the day (cold → hot, left to
  // right). This is the base colour of the ground. Sampled densely so the
  // smooth OKLCH ramp survives the browser's own sRGB blend between stops.
  const tempGradient = ctx.createLinearGradient(0, 0, width, 0);
  addTemperatureStops(tempGradient, forecast, colorFn);
  ctx.fillStyle = tempGradient;
  ctx.fill(fillPath);

  // Vertical depth shade: the ground sinks into shadow toward the bottom of the
  // card so it reads as a solid mass with volume instead of a flat area fill.
  // Filling the same polygon again (rather than clipping) sidesteps the iOS 15
  // gradient+clip bug noted above.
  const depthGradient = ctx.createLinearGradient(0, 0, 0, height);
  depthGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  depthGradient.addColorStop(0.55, 'rgba(0, 0, 0, 0.06)');
  depthGradient.addColorStop(1, 'rgba(0, 0, 0, 0.42)');
  ctx.fillStyle = depthGradient;
  ctx.fill(fillPath);

  // The horizon path (the temperature line itself), smoothed through the same
  // ridge points as the fill so the stroke and the terrain edge coincide.
  const linePath = new Path2D();
  linePath.moveTo(ridgePts[0].x, ridgePts[0].y);
  appendSmoothCurve(linePath, ridgePts);

  // Single temperature line in the biome gradient — the original plain stroke,
  // no rim or directional shading.
  const lineGradient = ctx.createLinearGradient(0, 0, width, 0);
  addTemperatureStops(lineGradient, forecast, colorFn);
  ctx.strokeStyle = lineGradient;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke(linePath);
}
