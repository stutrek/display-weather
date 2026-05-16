// ============================================================================
// Canvas Helpers for DailyChart
// Functions for drawing temperature bars
// ============================================================================

import type { WeatherForecast } from '../WeatherContext';

// ============================================================================
// Temperature Bar Positioning
// ============================================================================

/**
 * Create a temperature bar positioner for consistent positioning
 * Used by both canvas drawing and React overlays
 */
export function createBarPositioner(forecast: WeatherForecast[], canvasHeight: number) {
  // Find global temperature range
  const allTemps: number[] = [];
  forecast.forEach((day) => {
    if (day.temperature !== undefined) allTemps.push(day.temperature);
    if (day.templow !== undefined) allTemps.push(day.templow);
  });

  const minTemp = Math.min(...allTemps);
  const maxTemp = Math.max(...allTemps);
  const tempRange = maxTemp - minTemp;

  // Add padding to prevent bars from touching edges
  const padding = 20;
  const availableHeight = canvasHeight - padding * 2;

  return {
    /**
     * Get Y position for a given temperature
     */
    getTempY: (temp: number): number => {
      if (tempRange === 0) return canvasHeight / 2;
      const normalized = (temp - minTemp) / tempRange;
      return padding + (1 - normalized) * availableHeight;
    },
    minTemp,
    maxTemp,
    tempRange,
    padding,
    availableHeight,
  };
}

// ============================================================================
// Temperature Bar Drawing
// ============================================================================

/**
 * Draw vertical temperature bars with gradients for each day
 */
export function drawTemperatureBars(
  canvas: HTMLCanvasElement,
  forecast: WeatherForecast[],
  columnWidth: number,
  logicalHeight: number,
  colorFn: (temp: number) => string,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx || !forecast || forecast.length === 0) return;

  // Create positioner for consistent bar positioning
  const positioner = createBarPositioner(forecast, logicalHeight);

  // Calculate bar width (70% of column width)
  const barWidth = columnWidth * 0.7;

  // Draw each day's bar
  forecast.forEach((day, index) => {
    const highTemp = day.temperature ?? positioner.maxTemp;
    const lowTemp = day.templow ?? positioner.minTemp;

    // Calculate bar position using positioner
    const columnX = index * columnWidth;
    const barX = columnX + (columnWidth - barWidth) / 2;

    const barTop = positioner.getTempY(highTemp);
    const barBottom = positioner.getTempY(lowTemp);
    const barHeight = barBottom - barTop;

    // Create vertical gradient from high temp to low temp
    const gradient = ctx.createLinearGradient(0, barTop, 0, barBottom);
    gradient.addColorStop(0, colorFn(highTemp));
    gradient.addColorStop(1, colorFn(lowTemp));

    // Draw rounded bar
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(barX, barTop, barWidth, barHeight, 8);
    ctx.fill();
  });
}
