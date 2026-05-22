// ============================================================================
// Daily Weather Sample Data for Storybook
// Sample data for testing DailyChart component
// ============================================================================

import type { SunTimes, WeatherForecast } from '../WeatherCard/WeatherContext';

// ============================================================================
// Sun Times
// ============================================================================

export const defaultSunTimes: SunTimes = {
  sunrise: new Date('2026-01-24T06:00:00'),
  sunset: new Date('2026-01-24T18:00:00'),
  dawn: new Date('2026-01-24T05:30:00'),
  dusk: new Date('2026-01-24T18:30:00'),
};

// ============================================================================
// Helper Functions
// ============================================================================

function generateDailyForecast(
  startDate: Date,
  days: number,
  conditions: string[],
  highTemps: number[],
  lowTemps: number[],
  precipAmounts: number[],
  windSpeeds: number[] = [],
  windBearings: number[] = [],
): WeatherForecast[] {
  const forecast: WeatherForecast[] = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    forecast.push({
      datetime: date.toISOString(),
      condition: conditions[i % conditions.length],
      temperature: highTemps[i % highTemps.length],
      templow: lowTemps[i % lowTemps.length],
      precipitation: precipAmounts[i % precipAmounts.length],
      cloud_coverage: conditions[i % conditions.length].includes('cloudy') ? 80 : 20,
      wind_speed: windSpeeds.length ? windSpeeds[i % windSpeeds.length] : undefined,
      wind_bearing: windBearings.length ? windBearings[i % windBearings.length] : undefined,
    });
  }

  return forecast;
}

// ============================================================================
// Sample Forecasts
// ============================================================================

const baseDate = new Date('2026-01-25T12:00:00');

// Sunny week - hot
export const sunnyWeekHot: WeatherForecast[] = generateDailyForecast(
  baseDate,
  7,
  ['sunny', 'sunny', 'sunny', 'partlycloudy', 'sunny', 'sunny', 'sunny'],
  [95, 98, 100, 96, 94, 92, 90],
  [72, 75, 78, 74, 70, 68, 66],
  [0, 0, 0, 0, 0, 0, 0],
);

// Mixed weather - moderate temps, SW wind during rain days
export const mixedWeek: WeatherForecast[] = generateDailyForecast(
  baseDate,
  7,
  ['sunny', 'partlycloudy', 'cloudy', 'rainy', 'rainy', 'partlycloudy', 'sunny'],
  [75, 72, 68, 65, 66, 70, 74],
  [58, 56, 54, 52, 53, 55, 58],
  [0, 0, 0, 0.5, 0.8, 0.2, 0],
  [8, 10, 12, 18, 22, 14, 8],
  [180, 200, 220, 250, 260, 240, 180],
);

// Rainy week - cool, persistent westerly wind
export const rainyWeek: WeatherForecast[] = generateDailyForecast(
  baseDate,
  7,
  ['rainy', 'pouring', 'rainy', 'rainy', 'cloudy', 'rainy', 'rainy'],
  [62, 60, 58, 59, 62, 61, 60],
  [48, 46, 44, 45, 48, 47, 46],
  [0.1, 3.0, 0.5, 1.2, 0.05, 0.8, 0.3],
  [14, 28, 16, 20, 10, 18, 15],
  [260, 270, 255, 265, 180, 275, 260],
);

// Snowy week - cold
export const snowyWeek: WeatherForecast[] = generateDailyForecast(
  baseDate,
  7,
  ['snowy', 'snowy', 'snowy', 'snowy-rainy', 'cloudy', 'snowy', 'partlycloudy'],
  [32, 28, 26, 30, 35, 30, 34],
  [18, 15, 12, 16, 20, 18, 22],
  [0.1, 3.0, 8.0, 0.5, 0.05, 2.0, 0],
);

// Variable week - wide temp range, easterly on rain day, westerly on snow day
export const variableWeek: WeatherForecast[] = generateDailyForecast(
  baseDate,
  7,
  ['sunny', 'cloudy', 'rainy', 'snowy', 'partlycloudy', 'sunny', 'clear'],
  [85, 72, 55, 32, 48, 78, 88],
  [65, 58, 42, 18, 30, 56, 68],
  [0, 0, 0.6, 0.4, 0.1, 0, 0],
  [5, 8, 15, 12, 6, 4, 5],
  [180, 200, 100, 290, 180, 180, 180],
);

// Fewer days (3 days)
export const threeDayForecast: WeatherForecast[] = generateDailyForecast(
  baseDate,
  3,
  ['sunny', 'partlycloudy', 'rainy'],
  [78, 75, 70],
  [60, 58, 55],
  [0, 0, 0.5],
);

// More days (14 days), wind shifts westerly on storm days
export const twoWeekForecast: WeatherForecast[] = generateDailyForecast(
  baseDate,
  14,
  ['sunny', 'partlycloudy', 'cloudy', 'rainy', 'rainy', 'partlycloudy', 'sunny'],
  [80, 78, 75, 72, 70, 73, 77, 80, 82, 85, 87, 86, 84, 82],
  [62, 60, 58, 56, 54, 57, 60, 63, 65, 68, 70, 69, 67, 65],
  [0, 0, 0, 0.3, 0.6, 0.2, 0, 0, 0, 0, 0, 0.1, 0.2, 0],
  [6, 8, 12, 20, 25, 14, 7, 6, 5, 7, 8, 12, 15, 8],
  [180, 190, 210, 255, 270, 230, 180, 180, 180, 180, 190, 240, 260, 200],
);
