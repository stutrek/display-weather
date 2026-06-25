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
export function hasRain(condition: string | undefined): boolean {
  if (!condition) return false;
  const rainConditions = ['rainy', 'pouring', 'lightning-rainy', 'snowy-rainy'];
  return rainConditions.some((c) => condition.includes(c));
}

/**
 * Check if condition indicates snow
 */
export function hasSnow(condition: string | undefined): boolean {
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
export function getParticleCount(
  precipitation: number,
  segmentArea: number,
  isSnow: boolean,
): number {
  if (precipitation <= 0) return 0;

  // Base calculation: scale with area (smaller segments = fewer particles)
  const areaFactor = segmentArea / 10000; // Normalize to a standard area

  // Different multipliers for rain vs snow
  // Snow is less dense because it takes more accumulation for same visual impact
  if (isSnow) {
    const snowMultiplier = 60;
    return Math.max(1, Math.round(precipitation * snowMultiplier * areaFactor));
  }
  // Rain: denser curtain of thin streaks
  const rainMultiplier = 30;
  return Math.max(1, Math.round(precipitation * rainMultiplier * areaFactor));
}

/**
 * Draw an emoji at a specific point
 */
export function drawEmoji(
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
 * Horizontal lean offset per unit of vertical drop, based on wind speed alone.
 *
 * Rain always leans the same way (left→right): wind bearing carries no legible
 * meaning at this scale, so we drop direction entirely and use speed only. A
 * gentle non-zero baseline keeps calm-air rain from looking pasted-on vertical;
 * lean grows with speed toward a 0.7 cap so streaks never go fully horizontal.
 */
export function windLean(speed: number | undefined): number {
  const base = 0.15;
  if (!speed) return base;
  return base + Math.min(speed / 30, 1) * (0.7 - base);
}

/**
 * Draw rain as falling drops for a set of points.
 *
 * Each drop is rendered individually so it can carry depth and motion:
 * - A per-drop `depth` (0 = far, 1 = near) drives length, width and opacity, so
 *   the curtain reads with real front-to-back depth instead of a flat sheet.
 * - An along-streak gradient fades the tail (top) to transparent and keeps the
 *   leading drop (bottom) bright — the "comet" motion-blur of a falling drop.
 * - Near drops get a small bright head at the leading edge for sparkle.
 *
 * The lean is shared across every drop in the segment (no per-drop jitter, which
 * would read as chaos). `intensity` (0..1) scales length and width so heavier
 * precipitation reads heavier per drop, not just denser.
 */
export function drawRainStreaks(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  rng: () => number,
  lean: number,
  intensity: number,
): void {
  ctx.save();
  ctx.lineCap = 'round';

  // Per-drop depth, so we can draw far drops first and near drops on top.
  const drops = points.map((point) => ({ point, depth: rng() })).sort((a, b) => a.depth - b.depth);

  const lenScale = 0.85 + 0.3 * intensity;
  const widthScale = 0.9 + 0.3 * intensity;

  for (const { point, depth } of drops) {
    // Far → near: longer, wider, more opaque.
    const length = (14 + depth * 16) * lenScale * (0.9 + rng() * 0.2);
    const width = (0.6 + depth * 1.0) * widthScale;
    const opacity = 0.35 + depth * 0.6;

    const dy = length / Math.sqrt(1 + lean * lean);
    const dx = lean * dy;
    const x2 = point.x + dx;
    const y2 = point.y + dy;

    // Gradient runs tail (start) → leading drop (end): the streak stays mostly
    // solid blue, fading only gently toward the tail so it reads as a falling
    // line rather than a comet.
    const grad = ctx.createLinearGradient(point.x, point.y, x2, y2);
    grad.addColorStop(0, `rgba(110, 175, 255, ${opacity * 0.4})`);
    grad.addColorStop(0.5, `rgba(120, 185, 255, ${opacity * 0.8})`);
    grad.addColorStop(1, `rgba(140, 200, 255, ${opacity})`);

    ctx.strokeStyle = grad;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
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

    const lean = windLean(hour.wind_speed);
    // Normalized 0..1 heaviness; ~2"/hr saturates. Makes each drop read heavier
    // (longer/wider), independent of how many drops getParticleCount produced.
    const intensity = Math.min(precipitation / 2, 1);

    if (isRain && isSnow) {
      // Mixed: rain streaks for half, snowflakes for the other half
      const rainPoints = points.filter(() => rng() < 0.5);
      const snowPoints = points.filter((p) => !rainPoints.includes(p));
      drawRainStreaks(ctx, rainPoints, rng, lean, intensity);
      snowPoints.forEach((point) => drawEmoji(ctx, '❄️', point.x, point.y, 10));
    } else if (isSnow) {
      points.forEach((point) => drawEmoji(ctx, '❄️', point.x, point.y, 10));
    } else {
      // Pure rain: diagonal streaks
      drawRainStreaks(ctx, points, rng, lean, intensity);
    }
  });
}
