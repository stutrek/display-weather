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

    // Determine emoji for each particle (deterministic for mixed precipitation)
    const getEmoji = (): string => {
      if (isRain && isSnow) {
        // Mixed: deterministically choose
        return rng() < 0.5 ? '💧' : '❄️';
      }
      if (isSnow) return '❄️';
      return '💧';
    };

    // Draw emoji at each point
    points.forEach((point) => {
      const emoji = getEmoji();
      drawEmoji(ctx, emoji, point.x, point.y, 10);
    });
  });
}
