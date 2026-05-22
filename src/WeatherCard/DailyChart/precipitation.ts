// ============================================================================
// Precipitation Visualization for Daily Chart
// Draw rain and snow particles using Voronoi relaxation in vertical columns
// ============================================================================

import { type Bounds, generatePoints } from '../HourlyChart/generatePoints';
import { createRng } from '../HourlyChart/random';
import type { WeatherForecast } from '../WeatherContext';

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
function getParticleCount(precipitation: number, columnArea: number, isSnow: boolean): number {
  if (precipitation <= 0) return 0;

  // Base calculation: scale with area (smaller columns = fewer particles)
  const areaFactor = columnArea / 10000; // Normalize to a standard area

  // Different multipliers for rain vs snow
  // Snow is less dense because it takes more accumulation for same visual impact
  if (isSnow) {
    // Snow: 0.1" = 2-3, 3" = 15-25, 8" = 40-60
    const snowMultiplier = 5;
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
 * horizontal lean offset per unit of vertical drop. Capped at ±0.7.
 */
function windLean(bearing: number | undefined, speed: number | undefined): number {
  if (bearing === undefined || speed === undefined || speed === 0) return 0.25;
  const toRad = ((bearing + 180) % 360) * (Math.PI / 180);
  const eastComponent = Math.sin(toRad);
  const lean = eastComponent * Math.min(speed / 30, 1) * 0.7;
  return Math.max(-0.7, Math.min(0.7, lean));
}

/**
 * Draw rain streaks as diagonal lines. All streaks are batched into one stroke call.
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
    const length = 20 + rng() * 8;
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
 * Draw precipitation particles in vertical columns
 * Each column fills the full height of the canvas
 */
export function drawPrecipitation(
  canvas: HTMLCanvasElement,
  forecast: WeatherForecast[],
  columnWidth: number,
  logicalHeight: number,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx || !forecast || forecast.length === 0) return;

  // Process each day's column independently
  forecast.forEach((day, index) => {
    const precipitation = day.precipitation ?? 0;
    if (precipitation <= 0) return;

    // Determine precipitation type
    const isRain = hasRain(day.condition);
    const isSnow = hasSnow(day.condition);

    if (!isRain && !isSnow) return;

    // Create seeded RNG for this day (consistent across re-renders)
    const rng = createRng(`${day.datetime}-daily-precip`);

    // Calculate column bounds - FULL HEIGHT from top to bottom
    const columnBounds: Bounds = {
      x: index * columnWidth,
      y: 0,
      width: columnWidth,
      height: logicalHeight, // Full canvas height
    };

    // Calculate particle count based on column area and precipitation type
    const columnArea = columnWidth * logicalHeight;
    const particleCount = getParticleCount(precipitation, columnArea, isSnow);

    if (particleCount === 0) return;

    // Generate evenly-distributed points using Poisson disk sampling
    const areaPerParticle = columnArea / particleCount;
    const minDistance = Math.sqrt(areaPerParticle) * 0.9;
    const points = generatePoints(particleCount, columnBounds, minDistance, 30, rng);

    const lean = windLean(day.wind_bearing, day.wind_speed);

    if (isRain && isSnow) {
      const rainPoints = points.filter(() => rng() < 0.5);
      const snowPoints = points.filter((p) => !rainPoints.includes(p));
      drawRainStreaks(ctx, rainPoints, rng, lean);
      snowPoints.forEach((point) => drawEmoji(ctx, '❄️', point.x, point.y, 10));
    } else if (isSnow) {
      points.forEach((point) => drawEmoji(ctx, '❄️', point.x, point.y, 10));
    } else {
      drawRainStreaks(ctx, points, rng, lean);
    }
  });
}
