// ============================================================================
// Temperature Color Utilities
// Functions for mapping temperatures to colors
// ============================================================================

// Color stops for temperature visualization (0°F to 104°F)
const TEMP_COLOR_STOPS = [
  { temp: 0, color: '#6666cc' }, // Deep purple
  { temp: 10, color: '#8888ff' }, // Freezing purple
  { temp: 20, color: '#6677ff' }, // Ice blue
  { temp: 30, color: '#66aaff' }, // Cold blue
  { temp: 40, color: '#44bbff' }, // Cool blue
  { temp: 50, color: '#66cc99' }, // Cool green
  { temp: 60, color: '#88dd88' }, // Mild green
  { temp: 70, color: '#ffee44' }, // Warm yellow
  { temp: 80, color: '#ffbb44' }, // Mild orange
  { temp: 90, color: '#ff8844' }, // Warm orange
  { temp: 100, color: '#ff4444' }, // Hot red
  { temp: 104, color: '#cc0000' }, // Deep red
];

const PALETTE_MIN = TEMP_COLOR_STOPS[0].temp;
const PALETTE_MAX = TEMP_COLOR_STOPS[TEMP_COLOR_STOPS.length - 1].temp;

// ============================================================================
// Color Interpolation Helpers
// ============================================================================

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: Number.parseInt(result[1], 16),
        g: Number.parseInt(result[2], 16),
        b: Number.parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

function interpolateColor(color1: string, color2: string, factor: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);

  const r = Math.round(c1.r + (c2.r - c1.r) * factor);
  const g = Math.round(c1.g + (c2.g - c1.g) * factor);
  const b = Math.round(c1.b + (c2.b - c1.b) * factor);

  return rgbToHex(r, g, b);
}

/**
 * Get color for a palette temperature (internal helper)
 */
function getColorForPaletteTemp(paletteTemp: number): string {
  // Clamp to palette bounds
  if (paletteTemp <= PALETTE_MIN) {
    return TEMP_COLOR_STOPS[0].color;
  }
  if (paletteTemp >= PALETTE_MAX) {
    return TEMP_COLOR_STOPS[TEMP_COLOR_STOPS.length - 1].color;
  }

  // Find the two color stops to interpolate between
  for (let i = 0; i < TEMP_COLOR_STOPS.length - 1; i++) {
    const lower = TEMP_COLOR_STOPS[i];
    const upper = TEMP_COLOR_STOPS[i + 1];

    if (paletteTemp >= lower.temp && paletteTemp <= upper.temp) {
      const factor = (paletteTemp - lower.temp) / (upper.temp - lower.temp);
      return interpolateColor(lower.color, upper.color, factor);
    }
  }

  return TEMP_COLOR_STOPS[0].color;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Get color for a temperature value (0°F to 104°F fixed range)
 * Uses smooth interpolation between key temperature points
 * @deprecated Use createAdaptiveTemperatureColorFn for better color differentiation
 */
export function getTemperatureColor(temp: number): string {
  return getColorForPaletteTemp(temp);
}

/**
 * Create an adaptive temperature color function based on a specific temperature range
 * Maps the forecast range to an expanded portion of the color palette,
 * clamped to stay within palette bounds (0-104°F)
 *
 * Example: forecast 20-40°F with padding 10°F → uses colors from 10-50°F of palette
 *   - 20°F maps to color at 10°F
 *   - 30°F maps to color at 30°F
 *   - 40°F maps to color at 50°F
 *
 * Clamping examples:
 *   - forecast -10 to 0°F with padding 10°F → colors 0-30°F (shifted to fit)
 *   - forecast 100-110°F with padding 10°F → colors 74-104°F (shifted to fit)
 *
 * @param minTemp - Minimum temperature in the forecast
 * @param maxTemp - Maximum temperature in the forecast
 * @param padding - Degrees to expand color range on each side (default 10°F)
 * @returns A function that maps temperature to color
 */
export function createAdaptiveTemperatureColorFn(
  minTemp: number,
  maxTemp: number,
  padding = 10,
): (temp: number) => string {
  const tempRange = maxTemp - minTemp;

  // Desired color range with padding
  let colorRangeStart = minTemp - padding;
  let colorRangeEnd = maxTemp + padding;
  const colorRangeSize = colorRangeEnd - colorRangeStart;

  // Clamp to palette bounds, shifting if necessary
  if (colorRangeStart < PALETTE_MIN) {
    // Shift range up to fit
    colorRangeStart = PALETTE_MIN;
    colorRangeEnd = Math.min(PALETTE_MIN + colorRangeSize, PALETTE_MAX);
  }
  if (colorRangeEnd > PALETTE_MAX) {
    // Shift range down to fit
    colorRangeEnd = PALETTE_MAX;
    colorRangeStart = Math.max(PALETTE_MAX - colorRangeSize, PALETTE_MIN);
  }

  const actualColorRange = colorRangeEnd - colorRangeStart;

  return (temp: number): string => {
    // Map temp to a position in the forecast range (0 to 1)
    let normalizedPosition: number;
    if (tempRange === 0) {
      normalizedPosition = 0.5; // If no range, use middle
    } else {
      normalizedPosition = (temp - minTemp) / tempRange;
    }

    // Clamp to 0-1
    normalizedPosition = Math.max(0, Math.min(1, normalizedPosition));

    // Map to clamped color range
    const paletteTemp = colorRangeStart + normalizedPosition * actualColorRange;

    return getColorForPaletteTemp(paletteTemp);
  };
}
