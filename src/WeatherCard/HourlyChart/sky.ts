// ============================================================================
// Sky Rendering for Hourly Chart
// Draws sky background with vertical fade, stars (night), and clouds (day)
// ============================================================================

import type { SunTimes, WeatherForecast } from '../WeatherContext';
import { blurCanvasInPlace, supportsNativeBlur } from './blur';
import { createTemperaturePositioner } from './canvasHelpers';
import { drawCirrus } from './cloudCirrus';
import { drawCumulonimbus } from './cloudCumulonimbus';
import { drawCumulus } from './cloudCumulus';
import { drawStratocumulus } from './cloudStratocumulus';
import { drawStratus } from './cloudStratus';
import { type Bounds, generatePoints } from './generatePoints';
import { type CloudType, inferCloudLayers } from './inferCloudType';
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
function isDaytime(datetime: string, sunTimes: SunTimes): boolean {
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
 * Get the color for a specific hour based on day/night
 */
function getHourColor(datetime: string, sunTimes: SunTimes): string {
  return isDaytime(datetime, sunTimes) ? COLORS.dayClear : COLORS.nightClear;
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

  // Get timeframe boundaries
  const firstTime = new Date(forecast[0].datetime).getTime();
  const lastTime = new Date(forecast[forecast.length - 1].datetime).getTime();
  const timeRange = lastTime - firstTime;

  // Helper to convert timestamp to gradient position (0-1)
  const getGradientPosition = (timestamp: number): number => {
    if (timeRange === 0) return 0;
    return (timestamp - firstTime) / timeRange;
  };

  // Collect all color stops
  interface ColorStop {
    position: number;
    color: string;
    isSunEvent?: boolean;
    isAfterSun?: boolean;
  }

  const colorStops: ColorStop[] = [];

  // Add color stops for each hour
  forecast.forEach((hour, index) => {
    const position = index / (forecast.length - 1);
    const color = getHourColor(hour.datetime, sunTimes);
    colorStops.push({ position, color });
  });
  // Add sunrise transition if within range
  if (sunTimes.sunrise) {
    let sunriseTime = sunTimes.sunrise.getTime();

    // If sunrise is in the past (before forecast start), add 24 hours to get tomorrow's sunrise
    if (sunriseTime < firstTime) {
      sunriseTime += 24 * 60 * 60 * 1000; // Add 24 hours in milliseconds
    }

    if (sunriseTime >= firstTime && sunriseTime <= lastTime) {
      const sunrisePos = getGradientPosition(sunriseTime);
      const offset = 0.001; // Small offset for sharp transition

      colorStops.push({
        position: Math.max(0, sunrisePos - offset),
        color: COLORS.nightClear,
        isSunEvent: true,
      });

      colorStops.push({
        position: Math.min(1, sunrisePos + offset),
        color: COLORS.dayClear,
        isSunEvent: true,
        isAfterSun: true,
      });
    }
  }

  // Add sunset transition if within range
  if (sunTimes.sunset) {
    let sunsetTime = sunTimes.sunset.getTime();

    // If sunset is in the past (before forecast start), add 24 hours to get tomorrow's sunset
    if (sunsetTime < firstTime) {
      sunsetTime += 24 * 60 * 60 * 1000; // Add 24 hours in milliseconds
    }

    if (sunsetTime >= firstTime && sunsetTime <= lastTime) {
      const sunsetPos = getGradientPosition(sunsetTime);
      const offset = 0.001; // Small offset for sharp transition

      colorStops.push({
        position: Math.max(0, sunsetPos - offset),
        color: COLORS.dayClear,
        isSunEvent: true,
      });

      colorStops.push({
        position: Math.min(1, sunsetPos + offset),
        color: COLORS.nightClear,
        isSunEvent: true,
        isAfterSun: true,
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

  // Draw the temperature fill shape (area from temp line to bottom)
  shapeCtx.beginPath();
  shapeCtx.moveTo(0, height * dpr); // Start at bottom-left (physical pixels)

  // Follow temperature line
  forecast.forEach((hour, index) => {
    let x = (getHourX(index) + MASK_BLUR_RADIUS) * dpr;
    const y = getTempY(hour.temperature ?? 0) * dpr;
    if (index === 0) {
      x -= MASK_BLUR_RADIUS * dpr;
    }
    if (index === forecast.length - 1) {
      x += MASK_BLUR_RADIUS * dpr;
    }
    shapeCtx.lineTo(x, y);
  });

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
    // Safari fallback: blur the shape canvas first, then draw
    blurCanvasInPlace(shapeCtx, shapeCanvas.width, shapeCanvas.height, blurRadius * dpr);
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
  const segmentWidth = width / forecast.length;

  // Same timestamp-based positioning as drawSkyBackground and drawClouds
  const firstTime = new Date(forecast[0].datetime).getTime();
  const lastTime = new Date(forecast[forecast.length - 1].datetime).getTime();
  const timeRange = lastTime - firstTime;

  const sunEventX = (sunTime: Date | undefined): number | null => {
    if (!sunTime || timeRange === 0) return null;
    let t = sunTime.getTime();
    if (t < firstTime) t += 86400000;
    if (t < firstTime || t > lastTime) return null;
    return ((t - firstTime) / timeRange) * width;
  };

  const sunriseX = sunEventX(sunTimes.sunrise ?? undefined) ?? 0;
  const sunsetX = sunEventX(sunTimes.sunset ?? undefined) ?? width;

  // Clip drawing to night regions: [0, sunriseX] and [sunsetX, width]
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, sunriseX, height);
  ctx.rect(sunsetX, 0, width - sunsetX, height);
  ctx.clip();

  forecast.forEach((hour, index) => {
    const rng = createRng(`${hour.datetime}-stars`);
    const cloudCoverage = hour.cloud_coverage ?? 50;
    const clearness = 1 - cloudCoverage / 100;

    const segmentBounds: Bounds = {
      x: index * segmentWidth,
      y: 0,
      width: segmentWidth,
      height,
    };

    const segmentArea = segmentWidth * height;
    const baseStarDensity = 0.03;
    const starCount = Math.max(1, Math.round(segmentArea * baseStarDensity * clearness));

    const points = generatePoints(starCount, segmentBounds, undefined, 30, rng);
    const transformedPoints = transformPointsDenserAtTop(points, segmentBounds, 4);

    ctx.fillStyle = 'white';
    transformedPoints.forEach((point) => {
      const radius = 0.25 + rng() / 2;
      const opacity = 0.4 + rng() * 0.6;
      ctx.globalAlpha = opacity - 0.5 + clearness * 0.5;
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
  ) => void
> = {
  cumulus: drawCumulus,
  stratocumulus: drawCirrus,
  stratus: drawCirrus,
  cirrus: drawCirrus,
  cumulonimbus: drawCumulonimbus,
};

export function drawClouds(
  canvas: HTMLCanvasElement,
  forecast: WeatherForecast[],
  sunTimes: SunTimes,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx || !forecast || forecast.length === 0) return;

  const dpr = window.devicePixelRatio || 1;
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;
  const segmentWidth = width / forecast.length;

  // Use the same timestamp-based positioning as drawSkyBackground so cloud
  // boundaries align exactly with the sky colour transition.
  const firstTime = new Date(forecast[0].datetime).getTime();
  const lastTime = new Date(forecast[forecast.length - 1].datetime).getTime();
  const timeRange = lastTime - firstTime;

  const sunEventX = (sunTime: Date | undefined): number | null => {
    if (!sunTime || timeRange === 0) return null;
    let t = sunTime.getTime();
    if (t < firstTime) t += 86400000; // use tomorrow's event if it already passed
    if (t < firstTime || t > lastTime) return null;
    return ((t - firstTime) / timeRange) * width;
  };

  const sunriseX = sunEventX(sunTimes.sunrise ?? undefined) ?? 0;
  const sunsetX = sunEventX(sunTimes.sunset ?? undefined) ?? width;

  // Build runs of consecutive same-layer hours, ignoring day/night.
  // Daylight clamping (below) handles the sun boundaries.
  interface Run {
    layers: Exclude<CloudType, 'none'>[];
    startX: number;
    endX: number;
    coveragePoints: { x: number; v: number }[];
  }
  const runs: Run[] = [];

  for (let i = 0; i < forecast.length; i++) {
    const hour = forecast[i];
    const layers = inferCloudLayers(hour, false);
    if (layers.length === 0) continue;

    const startX = i * segmentWidth;
    const endX = (i + 1) * segmentWidth;
    const coverage = (hour.cloud_coverage ?? 50) / 100;
    const centerX = startX + segmentWidth / 2;

    const last = runs[runs.length - 1];
    if (last && last.layers.join(',') === layers.join(',') && last.endX === startX) {
      last.endX = endX;
      last.coveragePoints.push({ x: centerX, v: coverage });
    } else {
      runs.push({ layers, startX, endX, coveragePoints: [{ x: centerX, v: coverage }] });
    }
  }

  const blendW = segmentWidth * 1.5;

  for (let ri = 0; ri < runs.length; ri++) {
    const run = runs[ri];

    // Clamp run to daylight
    const clampStart = Math.max(run.startX, sunriseX);
    const clampEnd = Math.min(run.endX, sunsetX);
    if (clampStart >= clampEnd) continue;

    // Blend at cloud-type transitions within daylight; hard cut at sun boundaries
    const leftBlend = ri > 0 && clampStart === run.startX ? blendW : 0;
    const rightBlend = ri < runs.length - 1 && clampEnd === run.endX ? blendW : 0;

    const drawStart = Math.max(clampStart - leftBlend, 0);
    const drawEnd = Math.min(clampEnd + rightBlend, width);
    const totalW = Math.ceil(drawEnd - drawStart);
    const totalH = Math.ceil(height);

    const offscreen = document.createElement('canvas');
    offscreen.width = totalW;
    offscreen.height = totalH;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) continue;

    // Build coverageAt mapping local offscreen x → interpolated 0–1 coverage
    const points = run.coveragePoints;
    const coverageAt = (localX: number): number => {
      const worldX = localX + drawStart;
      if (points.length === 1) return points[0].v;
      if (worldX <= points[0].x) return points[0].v;
      if (worldX >= points[points.length - 1].x) return points[points.length - 1].v;
      for (let j = 0; j < points.length - 1; j++) {
        if (worldX <= points[j + 1].x) {
          const t = (worldX - points[j].x) / (points[j + 1].x - points[j].x);
          return points[j].v + t * (points[j + 1].v - points[j].v);
        }
      }
      return points[points.length - 1].v;
    };

    for (const layer of run.layers) {
      const rng = createRng(`clouds-${layer}-${run.startX}`);
      CLOUD_DRAW_FNS[layer](offCtx, totalW, totalH, coverageAt, rng);
    }

    // Fade left edge for blend with previous run
    if (leftBlend > 0) {
      const grad = offCtx.createLinearGradient(0, 0, leftBlend, 0);
      grad.addColorStop(0, 'rgba(0,0,0,1)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      offCtx.globalCompositeOperation = 'destination-out';
      offCtx.fillStyle = grad;
      offCtx.fillRect(0, 0, leftBlend, totalH);
      offCtx.globalCompositeOperation = 'source-over';
    }

    // Fade right edge for blend with next run
    if (rightBlend > 0) {
      const grad = offCtx.createLinearGradient(totalW - rightBlend, 0, totalW, 0);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,1)');
      offCtx.globalCompositeOperation = 'destination-out';
      offCtx.fillStyle = grad;
      offCtx.fillRect(totalW - rightBlend, 0, rightBlend, totalH);
      offCtx.globalCompositeOperation = 'source-over';
    }

    ctx.drawImage(offscreen, drawStart, 0);
  }
}
