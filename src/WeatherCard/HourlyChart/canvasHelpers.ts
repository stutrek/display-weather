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

  // Reserve margin so the line never clips at the canvas edge, and scale
  // pixelsPerDegree down if the range would otherwise overflow.
  const MARGIN = 12;
  const usableHeight = canvasHeight - MARGIN * 2;
  const effectivePpd =
    tempRange > 0 ? Math.min(pixelsPerDegree, usableHeight / tempRange) : pixelsPerDegree;

  const heightNeeded = tempRange * effectivePpd;
  const verticalPadding = (canvasHeight - heightNeeded) / 2;

  return {
    getTempY: (temp: number): number => {
      if (tempRange === 0) return canvasHeight / 2;
      return verticalPadding + (maxTemp - temp) * effectivePpd;
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

/**
 * Draw the temperature line with gradient fill underneath
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

  // Build the path for the area below the temperature line.
  // We fill this polygon directly with ctx.fill() rather than clipping +
  // fillRect — iOS Safari < 16 has unreliable behavior combining a linear
  // gradient fillStyle with a clip established from an open-then-closed path,
  // and that combination was producing an invisible gradient on iOS 15.5.
  const fillPath = new Path2D();
  fillPath.moveTo(0, height);
  forecast.forEach((hour, index) => {
    fillPath.lineTo(getHourX(index), getTempY(hour.temperature ?? 0));
  });
  fillPath.lineTo(width, height);
  fillPath.closePath();

  // Create horizontal gradient for temperature colors
  const tempGradient = ctx.createLinearGradient(0, 0, width, 0);
  forecast.forEach((hour, index) => {
    const position = index / (forecast.length - 1);
    const color = colorFn(hour.temperature ?? 0);
    tempGradient.addColorStop(position, color);
  });

  ctx.fillStyle = tempGradient;
  ctx.fill(fillPath);

  // Draw the temperature line on top
  const linePath = new Path2D();
  forecast.forEach((hour, index) => {
    const x = getHourX(index);
    const y = getTempY(hour.temperature ?? 0);
    if (index === 0) {
      linePath.moveTo(x, y);
    } else {
      linePath.lineTo(x, y);
    }
  });

  // Create gradient for line stroke
  const lineGradient = ctx.createLinearGradient(0, 0, width, 0);
  forecast.forEach((hour, index) => {
    const position = index / (forecast.length - 1);
    const color = colorFn(hour.temperature ?? 0);
    lineGradient.addColorStop(position, color);
  });

  // Style and stroke the line
  ctx.strokeStyle = lineGradient;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke(linePath);
}
