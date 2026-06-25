// ============================================================================
// Precipitation Visualization for Daily Chart
// Draws rain and snow in full-height columns using the same per-drop streak
// renderer as the hourly chart, so rain looks identical in both views.
// ============================================================================

import { type Bounds, generatePoints } from '../HourlyChart/generatePoints';
import {
  drawEmoji,
  drawRainStreaks,
  getParticleCount,
  hasRain,
  hasSnow,
  windLean,
} from '../HourlyChart/precipitation';
import { createRng } from '../HourlyChart/random';
import type { WeatherForecast } from '../WeatherContext';

// ============================================================================
// Main Drawing Function
// ============================================================================

/**
 * Draw precipitation particles in vertical columns.
 * Each column fills the full height of the canvas.
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

    const lean = windLean(day.wind_speed);
    // Normalized 0..1 heaviness; ~2"/hr saturates. Makes each drop read heavier
    // (longer/wider), independent of how many drops getParticleCount produced.
    const intensity = Math.min(precipitation / 2, 1);

    if (isRain && isSnow) {
      const rainPoints = points.filter(() => rng() < 0.5);
      const snowPoints = points.filter((p) => !rainPoints.includes(p));
      drawRainStreaks(ctx, rainPoints, rng, lean, intensity);
      snowPoints.forEach((point) => drawEmoji(ctx, '❄️', point.x, point.y, 10));
    } else if (isSnow) {
      points.forEach((point) => drawEmoji(ctx, '❄️', point.x, point.y, 10));
    } else {
      drawRainStreaks(ctx, points, rng, lean, intensity);
    }
  });
}
