// ============================================================================
// Precipitation Visualization
// Draw rain and snow particles using point distribution algorithms
// ============================================================================

import type { WeatherForecast } from '../WeatherContext';
import { type Bounds, generatePoints } from './generatePoints';
import { createRng } from './random';
// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if condition indicates rain
 */
function hasRain(condition: string | undefined): boolean {
  if (!condition) return false;
  const rainConditions = ['rainy', 'pouring', 'lightning-rainy', 'snowy-rainy'];
  return rainConditions.some((c) => condition.includes(c));
}

/**
 * Check if condition indicates snow
 */
function hasSnow(condition: string | undefined): boolean {
  if (!condition) return false;
  const snowConditions = ['snowy', 'snowy-rainy'];
  return snowConditions.some((c) => condition.includes(c));
}

/**
 * Calculate number of particles based on precipitation amount and type
 *
 * Rain: 0.1" = few drops, 3" = many drops
 * Snow: 0.1" = very few flakes, 3" = bunch, 8" = ton
 */
function getParticleCount(precipitation: number, segmentArea: number, isSnow: boolean): number {
  if (precipitation <= 0) return 0;

  // Base calculation: scale with area (smaller segments = fewer particles)
  const areaFactor = segmentArea / 10000; // Normalize to a standard area

  // Different multipliers for rain vs snow
  // Snow is less dense because it takes more accumulation for same visual impact
  if (isSnow) {
    const snowMultiplier = 60;
    return Math.max(1, Math.round(precipitation * snowMultiplier * areaFactor));
  }
  // Rain: 0.1" = 3-5, 3" = 30-50
  const rainMultiplier = 15;
  return Math.max(1, Math.round(precipitation * rainMultiplier * areaFactor));
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
  ctx.font = `${size}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'white';
  ctx.fillText(emoji, x, y);
  ctx.restore();
}

/**
 * Convert wind bearing (meteorological degrees, 0=N, 90=E) and speed to a
 * horizontal lean offset per unit of vertical drop.
 *
 * Wind bearing describes where the wind is coming FROM, so a 270° (westerly)
 * wind blows eastward → streaks lean right (positive dx).
 * Lean is capped at ±0.7 so streaks never go fully horizontal.
 */
function windLean(bearing: number | undefined, speed: number | undefined): number {
  if (bearing === undefined || speed === undefined || speed === 0) return 0.25;
  // Convert: wind FROM bearing → wind blows TO bearing+180
  const toRad = ((bearing + 180) % 360) * (Math.PI / 180);
  // East component of wind direction (positive = rightward lean)
  const eastComponent = Math.sin(toRad);
  // Scale by speed — clamp lean between -0.7 and 0.7
  const lean = eastComponent * Math.min(speed / 30, 1) * 0.7;
  return Math.max(-0.7, Math.min(0.7, lean));
}

/**
 * Draw rain streaks as diagonal lines for a set of points.
 * All streaks for a segment are batched into a single stroke call.
 */
function drawRainStreaks(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  rng: () => number,
  lean: number,
): void {
  ctx.save();
  ctx.strokeStyle = 'rgba(180, 220, 255, 1)';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';

  ctx.beginPath();
  for (const point of points) {
    const length = 20 + rng() * 8; // 12–20px
    const dy = length / Math.sqrt(1 + lean * lean);
    const dx = lean * dy;
    ctx.moveTo(point.x, point.y);
    ctx.lineTo(point.x + dx, point.y + dy);
  }
  ctx.stroke();
  ctx.restore();
}

// ============================================================================
// Main Drawing Function
// ============================================================================

/**
 * Draw precipitation particles across the canvas
 */
export function drawPrecipitation(canvas: HTMLCanvasElement, forecast: WeatherForecast[]): void {
  const ctx = canvas.getContext('2d');
  if (!ctx || !forecast || forecast.length === 0) return;

  // Get device pixel ratio and logical dimensions
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;
  const segmentWidth = width / forecast.length;

  // Process each hour independently
  forecast.forEach((hour, index) => {
    const precipitation = hour.precipitation ?? 0;
    if (precipitation <= 0) return;

    // Determine precipitation type
    const isRain = hasRain(hour.condition);
    const isSnow = hasSnow(hour.condition);

    if (!isRain && !isSnow) return;

    // Create seeded RNG for this hour segment (consistent across re-renders)
    const rng = createRng(`${hour.datetime}-precip`);

    // Calculate segment bounds
    const segmentBounds: Bounds = {
      x: index * segmentWidth,
      y: 0,
      width: segmentWidth,
      height: height,
    };

    // Calculate particle count based on precipitation type
    const segmentArea = segmentWidth * height;
    const particleCount = getParticleCount(precipitation, segmentArea, isSnow);

    if (particleCount === 0) return;

    // Generate evenly-distributed points using Poisson disk sampling
    const areaPerParticle = segmentArea / particleCount;
    const calculatedDistance = Math.sqrt(areaPerParticle) * 0.9;
    const minDistance = Math.max(8, Math.min(20, calculatedDistance));
    const points = generatePoints(particleCount, segmentBounds, minDistance, 30, rng);

    const lean = windLean(hour.wind_bearing, hour.wind_speed);

    if (isRain && isSnow) {
      // Mixed: rain streaks for half, snowflakes for the other half
      const rainPoints = points.filter(() => rng() < 0.5);
      const snowPoints = points.filter((p) => !rainPoints.includes(p));
      drawRainStreaks(ctx, rainPoints, rng, lean);
      snowPoints.forEach((point) => drawEmoji(ctx, '❄️', point.x, point.y, 10));
    } else if (isSnow) {
      points.forEach((point) => drawEmoji(ctx, '❄️', point.x, point.y, 10));
    } else {
      // Pure rain: diagonal streaks
      drawRainStreaks(ctx, points, rng, lean);
    }
  });
}
