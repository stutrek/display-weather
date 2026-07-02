// ============================================================================
// Temperature Color Utilities
// Functions for mapping temperatures to colors
// ============================================================================

export type TemperatureUnit = '°F' | '°C';
export type TemperaturePalette = 'ember' | 'mutedThermal';

type ColorStop = { temp: number; color: string };

// Ember — earthy "biome" story: the colour of the land at that temperature.
// frost → cold teal → sage → green → wheat → amber → terracotta → ember. The
// cold end is kept off the sky's blue (only the freezing extreme is a pale
// frost) so the ground doesn't blend into the sky; the hot end glows rather
// than muddying to brown, so it stays legible on a dark night sky.
const EMBER_STOPS: ColorStop[] = [
  { temp: 0, color: '#cfe0e2' }, // pale frost
  { temp: 20, color: '#9bbdb8' }, // frosty steel-teal
  { temp: 34, color: '#74a692' }, // cold teal
  { temp: 52, color: '#5fa177' }, // sage
  { temp: 68, color: '#4fa657' }, // fresh green — prime comfortable weather
  { temp: 76, color: '#a4a740' }, // straw, drying
  { temp: 84, color: '#c6a23a' }, // golden wheat
  { temp: 91, color: '#c8812f' }, // amber
  { temp: 98, color: '#b25030' }, // terracotta
  { temp: 104, color: '#99301f' }, // ember
];

// Muted thermal — the familiar cold→warm heatmap ordering, just desaturated and
// dusty rather than primary/saturated. Keeps the mental model everyone reads.
const MUTED_THERMAL_STOPS: ColorStop[] = [
  { temp: 0, color: '#5a5eac' }, // dusty indigo
  { temp: 20, color: '#5d8ac0' }, // cold blue
  { temp: 40, color: '#61a3bd' }, // cool blue
  { temp: 55, color: '#63a98c' }, // cool green
  { temp: 68, color: '#7eae5e' }, // mild green
  { temp: 78, color: '#c5b65f' }, // warm wheat
  { temp: 88, color: '#c2904f' }, // mild amber
  { temp: 98, color: '#b86545' }, // warm clay
  { temp: 104, color: '#a8473a' }, // dusty red
];

const PALETTES: Record<TemperaturePalette, ColorStop[]> = {
  ember: EMBER_STOPS,
  mutedThermal: MUTED_THERMAL_STOPS,
};

export const DEFAULT_TEMPERATURE_PALETTE: TemperaturePalette = 'ember';

// Every palette shares the same 0–104°F domain, so the clamp bounds are shared.
const PALETTE_MIN = EMBER_STOPS[0].temp;
const PALETTE_MAX = EMBER_STOPS[EMBER_STOPS.length - 1].temp;

function celsiusToFahrenheit(c: number): number {
  return (c * 9) / 5 + 32;
}

function toPaletteTemp(temp: number, unit: TemperatureUnit): number {
  return unit === '°C' ? celsiusToFahrenheit(temp) : temp;
}

// ============================================================================
// Cloud Shading
// ============================================================================

// Shadow tone shared by most cloud renderers for undersides/interior
// shading — a deepened sky blue rather than slate. Cumulonimbus uses its own
// much darker storm tone instead, since it needs to read as heavy weather.
export const CLOUD_SHADE_RGB = '81, 190, 241';

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

// --- OKLab / OKLCH (Björn Ottosson). Perceptually-uniform colour space: equal
// numeric steps look like equal visual steps, so interpolating here avoids both
// the muddy midpoints of sRGB and the lightness spikes of HSL. ---

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
}

function rgbToOklch({ r, g, b }: { r: number; g: number; b: number }): {
  L: number;
  C: number;
  h: number;
} {
  const lr = srgbToLinear(r / 255);
  const lg = srgbToLinear(g / 255);
  const lb = srgbToLinear(b / 255);
  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const bb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  return { L, C: Math.hypot(a, bb), h: (Math.atan2(bb, a) * 180) / Math.PI };
}

function oklchToRgb(L: number, C: number, h: number): { r: number; g: number; b: number } {
  const hr = (h * Math.PI) / 180;
  const a = C * Math.cos(hr);
  const bb = C * Math.sin(hr);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * bb;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * bb;
  const s_ = L - 0.0894841775 * a - 1.291485548 * bb;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  const lr = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(linearToSrgb(v) * 255)));
  return { r: ch(lr), g: ch(lg), b: ch(lb) };
}

/**
 * Interpolate between two hex colours in OKLCH, rotating hue along the shortest
 * arc. Because the space is perceptually uniform, wide-hue ramps (green → gold)
 * change at a constant visual rate — no muddy sRGB midpoint, no HSL lightness
 * spike — so they read as smooth gradients instead of hard bands.
 */
function interpolateColor(color1: string, color2: string, factor: number): string {
  const a = rgbToOklch(hexToRgb(color1));
  const b = rgbToOklch(hexToRgb(color2));
  let dh = b.h - a.h;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  const L = a.L + (b.L - a.L) * factor;
  const C = a.C + (b.C - a.C) * factor;
  const h = a.h + dh * factor;
  const { r, g, b: bl } = oklchToRgb(L, C, h);
  return rgbToHex(r, g, bl);
}

/**
 * Get color for a palette temperature (internal helper)
 */
function getColorForPaletteTemp(paletteTemp: number, stops: ColorStop[]): string {
  // Clamp to palette bounds
  if (paletteTemp <= PALETTE_MIN) {
    return stops[0].color;
  }
  if (paletteTemp >= PALETTE_MAX) {
    return stops[stops.length - 1].color;
  }

  // Find the two color stops to interpolate between
  for (let i = 0; i < stops.length - 1; i++) {
    const lower = stops[i];
    const upper = stops[i + 1];

    if (paletteTemp >= lower.temp && paletteTemp <= upper.temp) {
      const factor = (paletteTemp - lower.temp) / (upper.temp - lower.temp);
      return interpolateColor(lower.color, upper.color, factor);
    }
  }

  return stops[0].color;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Get color for a temperature value (0°F to 104°F fixed range)
 * Uses smooth interpolation between key temperature points
 * @deprecated Use createAdaptiveTemperatureColorFn for better color differentiation
 */
export function getTemperatureColor(
  temp: number,
  unit: TemperatureUnit = '°F',
  palette: TemperaturePalette = DEFAULT_TEMPERATURE_PALETTE,
): string {
  return getColorForPaletteTemp(toPaletteTemp(temp, unit), PALETTES[palette]);
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
 * @param padding - Degrees to expand the color range past the forecast. A
 *   number pads both sides equally; `{low, high}` pads the cool and warm ends
 *   separately (e.g. expand cool more than warm).
 * @returns A function that maps temperature to color
 */
export function createAdaptiveTemperatureColorFn(
  minTemp: number,
  maxTemp: number,
  padding: number | { low: number; high: number } = 10,
  unit: TemperatureUnit = '°F',
  palette: TemperaturePalette = DEFAULT_TEMPERATURE_PALETTE,
): (temp: number) => string {
  const stops = PALETTES[palette];
  const padLow = typeof padding === 'number' ? padding : padding.low;
  const padHigh = typeof padding === 'number' ? padding : padding.high;

  // Convert caller's range to palette units (°F) once.
  // The closure also converts each incoming temp below.
  const minPalette = toPaletteTemp(minTemp, unit);
  const maxPalette = toPaletteTemp(maxTemp, unit);
  const tempRange = maxPalette - minPalette;

  // Desired color range with padding (palette degrees)
  let colorRangeStart = minPalette - padLow;
  let colorRangeEnd = maxPalette + padHigh;
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
    const paletteInput = toPaletteTemp(temp, unit);
    // Map temp to a position in the forecast range (0 to 1)
    let normalizedPosition: number;
    if (tempRange === 0) {
      normalizedPosition = 0.5; // If no range, use middle
    } else {
      normalizedPosition = (paletteInput - minPalette) / tempRange;
    }

    // Clamp to 0-1
    normalizedPosition = Math.max(0, Math.min(1, normalizedPosition));

    // Map to clamped color range
    const paletteTemp = colorRangeStart + normalizedPosition * actualColorRange;

    return getColorForPaletteTemp(paletteTemp, stops);
  };
}
