// ============================================================================
// Sky Rendering for Hourly Chart
// Draws sky background with vertical fade, stars (night), and clouds (day)
// ============================================================================

import type { SunTimes, WeatherForecast } from '../WeatherContext';
import { blurCanvasInPlace, supportsNativeBlur } from './blur';
import { appendSmoothCurve, createTemperaturePositioner } from './canvasHelpers';
import { drawCirrus } from './cloudCirrus';
import { drawCumulonimbus } from './cloudCumulonimbus';
import { drawCumulus } from './cloudCumulus';
import { drawStratocumulus } from './cloudStratocumulus';
import { drawStratus } from './cloudStratus';
import {
  type CoveragePoint,
  makeCoverageInterpolator,
  sampleCoverageStats,
} from './coverageEnvelope';
import { type Bounds, generatePoints } from './generatePoints';
import { type CloudType, inferCloudLayerCoverage } from './inferCloudType';
import { createRng } from './random';
// ============================================================================
// Constants
// ============================================================================

const COLORS = {
  dayClear: '#44DAFF',
  nightClear: '#2D1B4E',
};

// Blur radius for temperature mask (in pixels)
const MASK_BLUR_RADIUS = 12;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Determine if a given datetime is during daytime based on sunrise/sunset
 * Only compares time-of-day (hours/minutes/seconds), not the full date
 */
function isDaytime(datetime: string | number, sunTimes: SunTimes): boolean {
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

/**
 * Draw an emoji at a specific point
 */
function drawEmoji(
  ctx: CanvasRenderingContext2D,
  emoji: string,
  x: number,
  y: number,
  size: number,
): void {
  ctx.save();
  ctx.fillStyle = 'white';
  ctx.font = `${size}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, x, y);
  ctx.restore();
}

/**
 * Transform points to be denser near the top of the bounds
 * Uses a power function to compress Y coordinates toward the top
 *
 * @param points - Array of points to transform
 * @param bounds - Bounding box for the transformation
 * @param exponent - Power function exponent (default: 2.5, higher = more compression)
 * @returns Transformed points with compressed Y coordinates
 */
function transformPointsDenserAtTop(
  points: Array<{ x: number; y: number }>,
  bounds: Bounds,
  exponent = 2.5,
): Array<{ x: number; y: number }> {
  return points.map((point) => {
    // Normalize y to 0-1 range relative to bounds
    const normalizedY = (point.y - bounds.y) / bounds.height;
    // Apply power function to compress toward top
    // Higher exponent = more compression at top
    const compressedY = normalizedY ** exponent;
    // Scale back to actual coordinates
    return {
      x: point.x,
      y: bounds.y + compressedY * bounds.height,
    };
  });
}

interface Interval {
  start: number;
  end: number;
}

/**
 * Compute the daylight intervals along the canvas x axis, in the same
 * timestamp-based coordinate space as the sky gradient.
 *
 * A window can contain zero, one, or two sun events in any order — an evening
 * window holds sunset then the next sunrise, an all-night window holds
 * neither. Spans between boundaries are classified by sampling isDaytime at
 * their midpoint, so windows with no sun event in range resolve to all-day or
 * all-night correctly instead of defaulting to daytime.
 */
export function getDaylightIntervals(
  forecast: WeatherForecast[],
  sunTimes: SunTimes,
  width: number,
): Interval[] {
  const firstTime = new Date(forecast[0].datetime).getTime();
  const lastTime = new Date(forecast[forecast.length - 1].datetime).getTime();
  const timeRange = lastTime - firstTime;

  const eventX = (sunTime: Date | undefined): number | null => {
    if (!sunTime || timeRange === 0) return null;
    let t = sunTime.getTime();
    if (t < firstTime) t += 86400000; // use tomorrow's event if it already passed
    if (t < firstTime || t > lastTime) return null;
    return ((t - firstTime) / timeRange) * width;
  };

  const hourX = (i: number): number =>
    timeRange === 0
      ? 0
      : ((new Date(forecast[i].datetime).getTime() - firstTime) / timeRange) * width;

  const eventXs = [eventX(sunTimes.sunrise), eventX(sunTimes.sunset)].filter(
    (x): x is number => x !== null,
  );

  // Span boundaries: canvas edges plus sun events inside the window. If
  // adjacent hours flip day/night without a sun event between them (missing
  // sun data, or an event just outside the window), insert a boundary at the
  // segment midpoint so the flip still gets a border.
  const boundaries = [0, width, ...eventXs];
  for (let i = 0; i < forecast.length - 1; i++) {
    const flips =
      isDaytime(forecast[i].datetime, sunTimes) !== isDaytime(forecast[i + 1].datetime, sunTimes);
    if (!flips) continue;
    const gapStart = hourX(i);
    const gapEnd = hourX(i + 1);
    if (!eventXs.some((x) => x >= gapStart && x <= gapEnd)) {
      boundaries.push((gapStart + gapEnd) / 2);
    }
  }
  boundaries.sort((a, b) => a - b);

  // Keep the spans whose midpoint falls in daylight
  const intervals: Interval[] = [];
  for (let i = 0; i < boundaries.length - 1; i++) {
    const start = boundaries[i];
    const end = boundaries[i + 1];
    if (end <= start) continue;
    const midTime = firstTime + ((start + end) / 2 / width) * timeRange;
    if (isDaytime(midTime, sunTimes)) {
      intervals.push({ start, end });
    }
  }
  return intervals;
}

// ============================================================================
// Main Drawing Functions
// ============================================================================

/**
 * Draw the sky background with horizontal color gradient
 * Preserves sunrise/sunset positioning - mask is applied separately
 */
export function drawSkyBackground(
  canvas: HTMLCanvasElement,
  forecast: WeatherForecast[],
  sunTimes: SunTimes,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx || !forecast || forecast.length === 0) return;

  // Get device pixel ratio and logical dimensions
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Create horizontal linear gradient (preserves sunrise/sunset positioning)
  const gradient = ctx.createLinearGradient(0, 0, width, 0);

  // Paint the sky as sharp day/night bands taken from the same daylight
  // intervals the clouds and stars use. Deriving both from getDaylightIntervals
  // keeps every sunrise/sunset across the whole window abrupt — including the
  // second day of a 48h forecast, and events the sun entity only reports as a
  // single stale next_rising/next_setting timestamp. (The old per-event logic
  // nudged one sunrise and one sunset by at most +24h, so a boundary more than
  // a day past the stale sun time silently fell back to an hour-long fade.)
  const dayIntervals = getDaylightIntervals(forecast, sunTimes, width);
  const clamp01 = (p: number): number => Math.min(1, Math.max(0, p));
  const isDayAtX = (x: number): boolean => dayIntervals.some((d) => x >= d.start && x < d.end);

  // Small offset (in gradient position space) that turns each boundary into a
  // ~1px hard edge instead of a linear ramp between adjacent stops.
  const offset = 0.001;

  interface ColorStop {
    position: number;
    color: string;
  }
  // Sample the right anchor a hair inside the canvas: the interval check is
  // half-open, so a view that ends in daylight has an interval ending exactly
  // at `width` and isDayAtX(width) read as night — fading the final daytime
  // hours toward the night colour instead of holding day to the edge.
  const colorStops: ColorStop[] = [
    { position: 0, color: isDayAtX(0) ? COLORS.dayClear : COLORS.nightClear },
    { position: 1, color: isDayAtX(width - 1e-3) ? COLORS.dayClear : COLORS.nightClear },
  ];

  // Every interval edge that falls inside the strip is a day/night crossing.
  for (const interval of dayIntervals) {
    for (const [edge, becomesDay] of [
      [interval.start, true],
      [interval.end, false],
    ] as const) {
      if (edge <= 0 || edge >= width) continue; // canvas edges handled by anchors above
      const pos = edge / width;
      colorStops.push({
        position: clamp01(pos - offset),
        color: becomesDay ? COLORS.nightClear : COLORS.dayClear,
      });
      colorStops.push({
        position: clamp01(pos + offset),
        color: becomesDay ? COLORS.dayClear : COLORS.nightClear,
      });
    }
  }

  // Sort color stops by position
  colorStops.sort((a, b) => a.position - b.position);

  // Add all color stops to gradient
  colorStops.forEach((stop) => {
    gradient.addColorStop(stop.position, stop.color);
  });

  // Fill the entire canvas with the horizontal gradient
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Apply a blurred mask based on the temperature line to fade the sky
 * Creates a soft transition that follows the temperature line contour
 * Drawing the mask multiple times makes the fade more aggressive
 */
export function applyTemperatureMask(
  canvas: HTMLCanvasElement,
  forecast: WeatherForecast[],
  pixelsPerDegree: number,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx || !forecast || forecast.length === 0) return;

  // Get device pixel ratio and actual canvas dimensions
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.width / dpr; // Logical width
  const height = canvas.height / dpr; // Logical height

  // Use the temperature positioner to get line positions
  const { getTempY } = createTemperaturePositioner(forecast, height, pixelsPerDegree);

  // Calculate x position for each hour
  const getHourX = (index: number): number => {
    return (index / (forecast.length - 1)) * width;
  };

  // Create offscreen canvas for the shape (account for device pixel ratio)
  const shapeCanvas = document.createElement('canvas');
  const shapeWidth = (width + MASK_BLUR_RADIUS * 2) * dpr;
  const shapeHeight = height * dpr;
  shapeCanvas.width = shapeWidth;
  shapeCanvas.height = shapeHeight;
  const shapeCtx = shapeCanvas.getContext('2d');
  if (!shapeCtx) return;
  // Don't scale - draw directly in physical pixel coordinates

  // Follow the temperature line as a smooth curve through the same ridge points
  // the terrain uses, so the sky-fade edge coincides with the terrain top
  // instead of fading along a straight chord near peaks and valleys.
  const maskPts = forecast.map((hour, index) => {
    let x = (getHourX(index) + MASK_BLUR_RADIUS) * dpr;
    if (index === 0) x -= MASK_BLUR_RADIUS * dpr;
    if (index === forecast.length - 1) x += MASK_BLUR_RADIUS * dpr;
    return { x, y: getTempY(hour.temperature ?? 0) * dpr };
  });

  // Draw the temperature fill shape (area from temp line to bottom)
  shapeCtx.beginPath();
  shapeCtx.moveTo(0, height * dpr); // Start at bottom-left (physical pixels)
  shapeCtx.lineTo(maskPts[0].x, maskPts[0].y);
  appendSmoothCurve(shapeCtx, maskPts);

  // Complete the shape to bottom-right (using full extended width) and back
  shapeCtx.lineTo(shapeWidth, height * dpr);
  shapeCtx.closePath();

  // Fill with solid white
  shapeCtx.fillStyle = 'white';
  shapeCtx.fill();

  // Create second offscreen canvas for the blurred mask (account for device pixel ratio)
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = width * dpr;
  maskCanvas.height = height * dpr;
  const maskCtx = maskCanvas.getContext('2d');
  if (!maskCtx) return;

  const blurRadius = Math.round(MASK_BLUR_RADIUS * dpr);

  if (supportsNativeBlur) {
    // Native filter: apply blur DURING the draw operation
    // This correctly blurs the off-canvas portions before they're clipped
    maskCtx.filter = `blur(${blurRadius}px)`;
    maskCtx.drawImage(shapeCanvas, -MASK_BLUR_RADIUS * dpr, 0);
    maskCtx.drawImage(shapeCanvas, -MASK_BLUR_RADIUS * dpr, 0);
    maskCtx.drawImage(shapeCanvas, -MASK_BLUR_RADIUS * dpr, 0);
    maskCtx.filter = 'none';
  } else {
    // Safari fallback: blur the shape canvas first, then draw. blurRadius is
    // already in physical pixels — multiplying by dpr again quadrupled the
    // fade band on retina displays.
    blurCanvasInPlace(shapeCtx, shapeCanvas.width, shapeCanvas.height, blurRadius);
    // only two because this code path is more aggressive
    maskCtx.drawImage(shapeCanvas, -MASK_BLUR_RADIUS * dpr, 0);
    maskCtx.drawImage(shapeCanvas, -MASK_BLUR_RADIUS * dpr, 0);
  }

  // Draw the blurred mask onto main canvas with destination-out
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.drawImage(maskCanvas, 0, 0, width, height);
  ctx.restore();
}

/**
 * Draw stars for nighttime hours
 * Stars are small white dots distributed using voronoi relaxation
 */
export function drawStars(
  canvas: HTMLCanvasElement,
  forecast: WeatherForecast[],
  sunTimes: SunTimes,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx || !forecast || forecast.length === 0) return;

  const dpr = window.devicePixelRatio || 1;
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;

  // Same timestamp-based positioning as drawSkyBackground and drawClouds so
  // star segments line up with the hours and the sun boundaries.
  const firstTime = new Date(forecast[0].datetime).getTime();
  const lastTime = new Date(forecast[forecast.length - 1].datetime).getTime();
  const timeRange = lastTime - firstTime;
  const hourX = (i: number): number =>
    timeRange === 0
      ? 0
      : ((new Date(forecast[i].datetime).getTime() - firstTime) / timeRange) * width;
  const segStartX = (i: number): number => (i === 0 ? 0 : (hourX(i - 1) + hourX(i)) / 2);
  const segEndX = (i: number): number =>
    i === forecast.length - 1 ? width : (hourX(i) + hourX(i + 1)) / 2;

  // Clip drawing to the night regions: the complement of the daylight intervals
  const dayIntervals = getDaylightIntervals(forecast, sunTimes, width);
  ctx.save();
  ctx.beginPath();
  let cursor = 0;
  for (const day of dayIntervals) {
    if (day.start > cursor) ctx.rect(cursor, 0, day.start - cursor, height);
    cursor = day.end;
  }
  if (cursor < width) ctx.rect(cursor, 0, width - cursor, height);
  ctx.clip();

  forecast.forEach((hour, index) => {
    const rng = createRng(`${hour.datetime}-stars`);
    const cloudCoverage = hour.cloud_coverage ?? 50;
    const clearness = 1 - cloudCoverage / 100;

    const segmentBounds: Bounds = {
      x: segStartX(index),
      y: 0,
      width: segEndX(index) - segStartX(index),
      height,
    };

    const segmentArea = segmentBounds.width * height;
    const baseStarDensity = 0.03;
    const starCount = Math.max(1, Math.round(segmentArea * baseStarDensity * clearness));

    const points = generatePoints(starCount, segmentBounds, undefined, 30, rng);
    const transformedPoints = transformPointsDenserAtTop(points, segmentBounds, 4);

    ctx.fillStyle = 'white';
    transformedPoints.forEach((point) => {
      const radius = 0.25 + rng() / 2;
      const opacity = 0.4 + rng() * 0.6;
      // Clamp: canvas ignores out-of-range globalAlpha assignments, so a
      // negative value would silently keep the previous star's alpha
      ctx.globalAlpha = Math.max(0, opacity - 0.5 + clearness * 0.5);
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
  });

  ctx.restore();
}

const CLOUD_DRAW_FNS: Record<
  Exclude<CloudType, 'none'>,
  (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    coverageAt: (x: number) => number,
    rng: () => number,
    floorAt?: (x: number) => number,
  ) => void
> = {
  cumulus: drawCumulus,
  stratocumulus: drawStratocumulus,
  stratus: drawStratus,
  cirrus: drawCirrus,
  cumulonimbus: drawCumulonimbus,
};

// Back (high altitude) → front (low altitude).
const RENDER_ORDER: Exclude<CloudType, 'none'>[] = [
  'cirrus',
  'stratus',
  'stratocumulus',
  'cumulus',
  'cumulonimbus',
];

export function drawClouds(
  canvas: HTMLCanvasElement,
  forecast: WeatherForecast[],
  sunTimes: SunTimes,
  pixelsPerDegree: number,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx || !forecast || forecast.length === 0) return;

  const dpr = window.devicePixelRatio || 1;
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;
  // Use the same timestamp-based positioning as drawSkyBackground so cloud
  // boundaries align exactly with the sky colour transition.
  const firstTime = new Date(forecast[0].datetime).getTime();
  const lastTime = new Date(forecast[forecast.length - 1].datetime).getTime();
  const timeRange = lastTime - firstTime;

  if (timeRange === 0) return;

  // Map each hour's timestamp to a canvas x position (same formula as sky
  // background) so cloud positions align with the sky colour transition.
  const hourX = (i: number): number => {
    const t = new Date(forecast[i].datetime).getTime();
    return ((t - firstTime) / timeRange) * width;
  };

  // One coverage envelope per cloud type across the whole strip: each hour
  // contributes that type's inferred coverage, or 0 if absent. Night hours
  // included — they feed correct interpolation right up to the sun boundary.
  // Each type then renders once as a continuous field, so changing weather
  // reads as layers waxing and waning rather than per-condition blocks.
  const envelopes = new Map<Exclude<CloudType, 'none'>, CoveragePoint[]>();
  for (const type of RENDER_ORDER) envelopes.set(type, []);
  for (let i = 0; i < forecast.length; i++) {
    const layerCoverage = inferCloudLayerCoverage(forecast, i, false);
    const x = hourX(i);
    for (const type of RENDER_ORDER) {
      envelopes.get(type)?.push({ x, v: layerCoverage[type] ?? 0 });
    }
  }

  const dayIntervals = getDaylightIntervals(forecast, sunTimes, width);

  // Sky floor: the temperature line. The temperature area is painted over
  // the clouds, so renderers that take a floor keep their cloud bases tucked
  // just below the line with the domes visible above it.
  const { getTempY } = createTemperaturePositioner(forecast, height, pixelsPerDegree);
  const tempYs = forecast.map((h) => getTempY(h.temperature ?? 0));
  const floorAtWorld = (x: number): number => {
    const fi = (x / width) * (forecast.length - 1);
    const i = Math.max(0, Math.min(forecast.length - 2, Math.floor(fi)));
    const t = Math.max(0, Math.min(1, fi - i));
    return tempYs[i] + t * (tempYs[i + 1] - tempYs[i]);
  };

  // One render per daylight interval per type, back to front. Clouds cut hard
  // at the sun boundaries — matching the sky's sharp day/night line — because
  // the offscreen is sized to the interval. Canvas edges run off-screen.
  for (let di = 0; di < dayIntervals.length; di++) {
    const day = dayIntervals[di];
    const intervalW = Math.ceil(day.end - day.start);
    const intervalH = Math.ceil(height);
    if (intervalW <= 0) continue;

    const offscreen = document.createElement('canvas');
    offscreen.width = intervalW;
    offscreen.height = intervalH;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) continue;

    for (const type of RENDER_ORDER) {
      const interp = makeCoverageInterpolator(envelopes.get(type) ?? []);
      const coverageAt = (localX: number): number => interp(localX + day.start);
      if (sampleCoverageStats(coverageAt, intervalW).max < 0.01) continue;

      // Seed by the interval's ordinal, not its pixel bounds: a full-day
      // interval has day.end === width, so a width-based seed re-randomised
      // the entire cloud field on every pixel of a resize (clouds visibly
      // popping in and out). The ordinal is width-independent, so resizing
      // now just rescales the same clouds.
      const rng = createRng(`clouds-${type}-${di}`);
      const floorAt = (localX: number): number => floorAtWorld(localX + day.start);
      CLOUD_DRAW_FNS[type](offCtx, intervalW, intervalH, coverageAt, rng, floorAt);
    }

    ctx.drawImage(offscreen, day.start, 0);
  }
}
