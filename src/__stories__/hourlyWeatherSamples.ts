// ============================================================================
// Hourly Weather Sample Data
// 10 realistic hand-crafted day patterns with temperature variations
// ============================================================================

import type { WeatherForecast } from '../WeatherCard/WeatherContext';

// ============================================================================
// Types
// ============================================================================

/** Base hourly data without temperature (temperature is applied per-season) */
interface BaseHourData {
  condition: string;
  cloud_coverage: number;
  precipitation: number;
  precipitation_probability: number;
  wind_speed: number;
  wind_bearing?: number; // meteorological degrees (0=N, 90=E); defaults to 180 (S)
  humidity: number;
}

/** Sun times for day/night determination */
interface SunTimes {
  sunrise: Date | undefined;
  sunset: Date | undefined;
  dawn: Date | undefined;
  dusk: Date | undefined;
}

/** Temperature range configuration */
interface TempConfig {
  range: [number, number];
  date: string; // ISO date string for representative date
}

// ============================================================================
// Temperature Configurations (6 seasons)
// ============================================================================

const TEMP_CONFIGS: Record<string, TempConfig> = {
  winter: { range: [25, 38], date: '2026-01-15' },
  earlySpring: { range: [40, 55], date: '2026-03-20' },
  lateSpring: { range: [55, 70], date: '2026-05-10' },
  summer: { range: [75, 90], date: '2026-07-15' },
  earlyFall: { range: [60, 75], date: '2026-09-25' },
  lateFall: { range: [38, 50], date: '2026-11-10' },
};

// ============================================================================
// Helper: Apply Temperature Range to Base Pattern
// ============================================================================

/**
 * Applies a realistic diurnal temperature curve to a base 24-hour pattern.
 * Temperature minimum around 5-6am, maximum around 2-4pm.
 */
function applyTemperatureRange(
  basePattern: BaseHourData[],
  tempRange: [number, number],
  dateString: string,
): WeatherForecast[] {
  const [minTemp, maxTemp] = tempRange;
  const baseDate = new Date(`${dateString}T00:00:00`);

  return basePattern.map((hour, index) => {
    // Diurnal temperature curve: min at 5am, max at 3pm
    // Using sine wave: sin((hour - 5) / 24 * 2π) shifted and scaled
    const normalizedHour = (index - 5) / 24;
    const tempFactor = Math.sin(normalizedHour * 2 * Math.PI);
    const normalizedFactor = (tempFactor + 1) / 2; // 0 to 1
    const temperature = Math.round(minTemp + (maxTemp - minTemp) * normalizedFactor);

    const datetime = new Date(baseDate);
    datetime.setHours(index);

    // UV index is 0 at night (before 6am or after 7pm)
    const isNight = index < 6 || index >= 19;
    const uv_index = isNight ? 0 : Math.min(10, Math.round((1 - hour.cloud_coverage / 100) * 8));

    return {
      datetime: datetime.toISOString(),
      condition: hour.condition,
      temperature,
      cloud_coverage: hour.cloud_coverage,
      precipitation: hour.precipitation,
      precipitation_probability: hour.precipitation_probability,
      wind_speed: hour.wind_speed,
      wind_bearing: hour.wind_bearing ?? 180,
      humidity: hour.humidity,
      uv_index,
    };
  });
}

/**
 * Creates all 6 temperature variations for a base pattern.
 */
function createAllVariations(basePattern: BaseHourData[]): Record<string, WeatherForecast[]> {
  return {
    winter: applyTemperatureRange(basePattern, TEMP_CONFIGS.winter.range, TEMP_CONFIGS.winter.date),
    earlySpring: applyTemperatureRange(
      basePattern,
      TEMP_CONFIGS.earlySpring.range,
      TEMP_CONFIGS.earlySpring.date,
    ),
    lateSpring: applyTemperatureRange(
      basePattern,
      TEMP_CONFIGS.lateSpring.range,
      TEMP_CONFIGS.lateSpring.date,
    ),
    summer: applyTemperatureRange(basePattern, TEMP_CONFIGS.summer.range, TEMP_CONFIGS.summer.date),
    earlyFall: applyTemperatureRange(
      basePattern,
      TEMP_CONFIGS.earlyFall.range,
      TEMP_CONFIGS.earlyFall.date,
    ),
    lateFall: applyTemperatureRange(
      basePattern,
      TEMP_CONFIGS.lateFall.range,
      TEMP_CONFIGS.lateFall.date,
    ),
  };
}

// ============================================================================
// Pattern 1: Building Storm Day
// Clear start → clouds building → 2 hours rain → clouds stay → wind clears
// ============================================================================

const buildingStormBase: BaseHourData[] = [
  // Hours 0-6: Clear/partly cloudy night and early morning
  {
    condition: 'clear-night',
    cloud_coverage: 10,
    precipitation: 0,
    precipitation_probability: 5,
    wind_speed: 5,
    humidity: 60,
  },
  {
    condition: 'clear-night',
    cloud_coverage: 15,
    precipitation: 0,
    precipitation_probability: 5,
    wind_speed: 5,
    humidity: 62,
  },
  {
    condition: 'clear-night',
    cloud_coverage: 15,
    precipitation: 0,
    precipitation_probability: 5,
    wind_speed: 5,
    humidity: 65,
  },
  {
    condition: 'clear-night',
    cloud_coverage: 20,
    precipitation: 0,
    precipitation_probability: 10,
    wind_speed: 5,
    humidity: 65,
  },
  {
    condition: 'clear-night',
    cloud_coverage: 25,
    precipitation: 0,
    precipitation_probability: 10,
    wind_speed: 6,
    humidity: 68,
  },
  {
    condition: 'clear-night',
    cloud_coverage: 30,
    precipitation: 0,
    precipitation_probability: 15,
    wind_speed: 6,
    humidity: 70,
  },
  {
    condition: 'partlycloudy',
    cloud_coverage: 35,
    precipitation: 0,
    precipitation_probability: 15,
    wind_speed: 7,
    humidity: 70,
  },
  // Hours 7-11: Clouds building
  {
    condition: 'partlycloudy',
    cloud_coverage: 45,
    precipitation: 0,
    precipitation_probability: 20,
    wind_speed: 8,
    humidity: 72,
  },
  {
    condition: 'partlycloudy',
    cloud_coverage: 55,
    precipitation: 0,
    precipitation_probability: 30,
    wind_speed: 8,
    humidity: 75,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 70,
    precipitation: 0,
    precipitation_probability: 45,
    wind_speed: 10,
    humidity: 78,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 85,
    precipitation: 0,
    precipitation_probability: 60,
    wind_speed: 12,
    humidity: 80,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 95,
    precipitation: 0,
    precipitation_probability: 75,
    wind_speed: 14,
    humidity: 82,
  },
  // Hours 12-13: Rain (2 hours) — wind shifts to SW as front arrives
  {
    condition: 'rainy',
    cloud_coverage: 100,
    precipitation: 0.3,
    precipitation_probability: 90,
    wind_speed: 15,
    wind_bearing: 240,
    humidity: 88,
  },
  {
    condition: 'rainy',
    cloud_coverage: 100,
    precipitation: 0.5,
    precipitation_probability: 95,
    wind_speed: 16,
    wind_bearing: 250,
    humidity: 90,
  },
  // Hours 14-17: Post-rain cloudy, wind picking up
  {
    condition: 'cloudy',
    cloud_coverage: 100,
    precipitation: 0.05,
    precipitation_probability: 40,
    wind_speed: 18,
    humidity: 85,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 95,
    precipitation: 0,
    precipitation_probability: 25,
    wind_speed: 20,
    humidity: 80,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 90,
    precipitation: 0,
    precipitation_probability: 15,
    wind_speed: 22,
    humidity: 75,
  },
  {
    condition: 'windy',
    cloud_coverage: 85,
    precipitation: 0,
    precipitation_probability: 10,
    wind_speed: 25,
    humidity: 70,
  },
  // Hours 18-23: Windy, clouds fading
  {
    condition: 'windy',
    cloud_coverage: 70,
    precipitation: 0,
    precipitation_probability: 5,
    wind_speed: 22,
    humidity: 65,
  },
  {
    condition: 'windy-variant',
    cloud_coverage: 55,
    precipitation: 0,
    precipitation_probability: 5,
    wind_speed: 20,
    humidity: 60,
  },
  {
    condition: 'partlycloudy',
    cloud_coverage: 40,
    precipitation: 0,
    precipitation_probability: 5,
    wind_speed: 15,
    humidity: 58,
  },
  {
    condition: 'partlycloudy',
    cloud_coverage: 30,
    precipitation: 0,
    precipitation_probability: 5,
    wind_speed: 12,
    humidity: 55,
  },
  {
    condition: 'clear-night',
    cloud_coverage: 25,
    precipitation: 0,
    precipitation_probability: 5,
    wind_speed: 10,
    humidity: 55,
  },
  {
    condition: 'clear-night',
    cloud_coverage: 20,
    precipitation: 0,
    precipitation_probability: 5,
    wind_speed: 8,
    humidity: 55,
  },
];

// ============================================================================
// Pattern 2: Fog and Thunderstorm Day
// Clear night → fog at dawn → clears by 11 → afternoon thunderstorm
// ============================================================================

const fogAndThunderstormBase: BaseHourData[] = [
  // Hours 0-4: Clear night
  {
    condition: 'clear-night',
    cloud_coverage: 5,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 3,
    humidity: 70,
  },
  {
    condition: 'clear-night',
    cloud_coverage: 5,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 3,
    humidity: 72,
  },
  {
    condition: 'clear-night',
    cloud_coverage: 5,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 2,
    humidity: 75,
  },
  {
    condition: 'clear-night',
    cloud_coverage: 5,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 2,
    humidity: 80,
  },
  {
    condition: 'clear-night',
    cloud_coverage: 10,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 2,
    humidity: 85,
  },
  // Hours 5-10: Fog rolls in at dawn
  {
    condition: 'fog',
    cloud_coverage: 100,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 2,
    humidity: 95,
  },
  {
    condition: 'fog',
    cloud_coverage: 100,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 2,
    humidity: 98,
  },
  {
    condition: 'fog',
    cloud_coverage: 100,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 2,
    humidity: 95,
  },
  {
    condition: 'fog',
    cloud_coverage: 100,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 3,
    humidity: 92,
  },
  {
    condition: 'fog',
    cloud_coverage: 90,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 4,
    humidity: 88,
  },
  {
    condition: 'partlycloudy',
    cloud_coverage: 60,
    precipitation: 0,
    precipitation_probability: 5,
    wind_speed: 5,
    humidity: 75,
  },
  // Hours 11-14: Clear/sunny
  {
    condition: 'sunny',
    cloud_coverage: 30,
    precipitation: 0,
    precipitation_probability: 10,
    wind_speed: 6,
    humidity: 65,
  },
  {
    condition: 'sunny',
    cloud_coverage: 20,
    precipitation: 0,
    precipitation_probability: 15,
    wind_speed: 7,
    humidity: 60,
  },
  {
    condition: 'sunny',
    cloud_coverage: 25,
    precipitation: 0,
    precipitation_probability: 25,
    wind_speed: 8,
    humidity: 58,
  },
  {
    condition: 'partlycloudy',
    cloud_coverage: 40,
    precipitation: 0,
    precipitation_probability: 40,
    wind_speed: 10,
    humidity: 60,
  },
  // Hours 15-17: Afternoon thunderstorm
  {
    condition: 'cloudy',
    cloud_coverage: 80,
    precipitation: 0,
    precipitation_probability: 70,
    wind_speed: 15,
    humidity: 70,
  },
  {
    condition: 'lightning-rainy',
    cloud_coverage: 100,
    precipitation: 0.8,
    precipitation_probability: 90,
    wind_speed: 22,
    wind_bearing: 270,
    humidity: 85,
  },
  {
    condition: 'lightning-rainy',
    cloud_coverage: 100,
    precipitation: 1.2,
    precipitation_probability: 95,
    wind_speed: 25,
    wind_bearing: 275,
    humidity: 88,
  },
  // Hours 18-23: Clearing, partly cloudy
  {
    condition: 'rainy',
    cloud_coverage: 90,
    precipitation: 0.3,
    precipitation_probability: 60,
    wind_speed: 18,
    wind_bearing: 280,
    humidity: 80,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 70,
    precipitation: 0,
    precipitation_probability: 30,
    wind_speed: 12,
    humidity: 72,
  },
  {
    condition: 'partlycloudy',
    cloud_coverage: 50,
    precipitation: 0,
    precipitation_probability: 15,
    wind_speed: 8,
    humidity: 68,
  },
  {
    condition: 'partlycloudy',
    cloud_coverage: 35,
    precipitation: 0,
    precipitation_probability: 10,
    wind_speed: 6,
    humidity: 65,
  },
  {
    condition: 'clear-night',
    cloud_coverage: 25,
    precipitation: 0,
    precipitation_probability: 5,
    wind_speed: 5,
    humidity: 62,
  },
  {
    condition: 'clear-night',
    cloud_coverage: 20,
    precipitation: 0,
    precipitation_probability: 5,
    wind_speed: 4,
    humidity: 60,
  },
];

// ============================================================================
// Pattern 3: Rainy Morning, Variable Afternoon
// Cloudy night → morning rain → clearing → clouds return
// ============================================================================

const rainyMorningBase: BaseHourData[] = [
  // Hours 0-5: Cloudy night
  {
    condition: 'cloudy',
    cloud_coverage: 85,
    precipitation: 0,
    precipitation_probability: 40,
    wind_speed: 8,
    humidity: 75,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 88,
    precipitation: 0,
    precipitation_probability: 50,
    wind_speed: 8,
    humidity: 78,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 90,
    precipitation: 0,
    precipitation_probability: 55,
    wind_speed: 9,
    humidity: 80,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 92,
    precipitation: 0,
    precipitation_probability: 65,
    wind_speed: 10,
    humidity: 82,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 95,
    precipitation: 0,
    precipitation_probability: 75,
    wind_speed: 10,
    humidity: 85,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 98,
    precipitation: 0.05,
    precipitation_probability: 80,
    wind_speed: 11,
    humidity: 87,
  },
  // Hours 6-9: Morning rain — east wind so streaks lean left
  {
    condition: 'rainy',
    cloud_coverage: 100,
    precipitation: 0.3,
    precipitation_probability: 90,
    wind_speed: 12,
    wind_bearing: 100,
    humidity: 90,
  },
  {
    condition: 'rainy',
    cloud_coverage: 100,
    precipitation: 0.5,
    precipitation_probability: 95,
    wind_speed: 14,
    wind_bearing: 100,
    humidity: 92,
  },
  {
    condition: 'rainy',
    cloud_coverage: 100,
    precipitation: 0.4,
    precipitation_probability: 90,
    wind_speed: 12,
    wind_bearing: 110,
    humidity: 90,
  },
  {
    condition: 'rainy',
    cloud_coverage: 100,
    precipitation: 0.2,
    precipitation_probability: 75,
    wind_speed: 10,
    wind_bearing: 120,
    humidity: 85,
  },
  // Hours 10-13: Clearing up, sunny
  {
    condition: 'cloudy',
    cloud_coverage: 80,
    precipitation: 0,
    precipitation_probability: 40,
    wind_speed: 8,
    humidity: 75,
  },
  {
    condition: 'partlycloudy',
    cloud_coverage: 50,
    precipitation: 0,
    precipitation_probability: 20,
    wind_speed: 7,
    humidity: 65,
  },
  {
    condition: 'sunny',
    cloud_coverage: 25,
    precipitation: 0,
    precipitation_probability: 10,
    wind_speed: 6,
    humidity: 55,
  },
  {
    condition: 'sunny',
    cloud_coverage: 20,
    precipitation: 0,
    precipitation_probability: 10,
    wind_speed: 6,
    humidity: 50,
  },
  // Hours 14-19: Clouds return
  {
    condition: 'partlycloudy',
    cloud_coverage: 35,
    precipitation: 0,
    precipitation_probability: 15,
    wind_speed: 7,
    humidity: 52,
  },
  {
    condition: 'partlycloudy',
    cloud_coverage: 50,
    precipitation: 0,
    precipitation_probability: 20,
    wind_speed: 8,
    humidity: 55,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 60,
    precipitation: 0,
    precipitation_probability: 25,
    wind_speed: 8,
    humidity: 58,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 65,
    precipitation: 0,
    precipitation_probability: 25,
    wind_speed: 7,
    humidity: 60,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 70,
    precipitation: 0,
    precipitation_probability: 20,
    wind_speed: 6,
    humidity: 62,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 70,
    precipitation: 0,
    precipitation_probability: 15,
    wind_speed: 6,
    humidity: 65,
  },
  // Hours 20-23: Cloudy night
  {
    condition: 'cloudy',
    cloud_coverage: 75,
    precipitation: 0,
    precipitation_probability: 15,
    wind_speed: 5,
    humidity: 68,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 78,
    precipitation: 0,
    precipitation_probability: 15,
    wind_speed: 5,
    humidity: 70,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 80,
    precipitation: 0,
    precipitation_probability: 20,
    wind_speed: 5,
    humidity: 72,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 82,
    precipitation: 0,
    precipitation_probability: 25,
    wind_speed: 5,
    humidity: 74,
  },
];

// ============================================================================
// Pattern 4: Drizzle and Thunderstorms
// Light drizzle all morning → afternoon thunderstorms → drizzle continues
// ============================================================================

const drizzleAndThunderstormsBase: BaseHourData[] = [
  // Hours 0-5: Light drizzle
  {
    condition: 'rainy',
    cloud_coverage: 100,
    precipitation: 0.1,
    precipitation_probability: 70,
    wind_speed: 6,
    humidity: 88,
  },
  {
    condition: 'rainy',
    cloud_coverage: 100,
    precipitation: 0.1,
    precipitation_probability: 70,
    wind_speed: 6,
    humidity: 88,
  },
  {
    condition: 'rainy',
    cloud_coverage: 100,
    precipitation: 0.1,
    precipitation_probability: 65,
    wind_speed: 5,
    humidity: 87,
  },
  {
    condition: 'rainy',
    cloud_coverage: 100,
    precipitation: 0.1,
    precipitation_probability: 65,
    wind_speed: 5,
    humidity: 86,
  },
  {
    condition: 'rainy',
    cloud_coverage: 100,
    precipitation: 0.1,
    precipitation_probability: 70,
    wind_speed: 6,
    humidity: 87,
  },
  {
    condition: 'rainy',
    cloud_coverage: 100,
    precipitation: 0.15,
    precipitation_probability: 75,
    wind_speed: 7,
    humidity: 88,
  },
  // Hours 6-11: Continued drizzle
  {
    condition: 'rainy',
    cloud_coverage: 100,
    precipitation: 0.15,
    precipitation_probability: 75,
    wind_speed: 8,
    humidity: 88,
  },
  {
    condition: 'rainy',
    cloud_coverage: 100,
    precipitation: 0.2,
    precipitation_probability: 80,
    wind_speed: 8,
    humidity: 89,
  },
  {
    condition: 'rainy',
    cloud_coverage: 100,
    precipitation: 0.2,
    precipitation_probability: 80,
    wind_speed: 9,
    humidity: 90,
  },
  {
    condition: 'rainy',
    cloud_coverage: 100,
    precipitation: 0.15,
    precipitation_probability: 75,
    wind_speed: 10,
    humidity: 88,
  },
  {
    condition: 'rainy',
    cloud_coverage: 100,
    precipitation: 0.15,
    precipitation_probability: 80,
    wind_speed: 12,
    humidity: 87,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 100,
    precipitation: 0.05,
    precipitation_probability: 70,
    wind_speed: 14,
    humidity: 85,
  },
  // Hours 12-16: Afternoon thunderstorms
  {
    condition: 'lightning',
    cloud_coverage: 100,
    precipitation: 0,
    precipitation_probability: 80,
    wind_speed: 18,
    humidity: 82,
  },
  {
    condition: 'lightning-rainy',
    cloud_coverage: 100,
    precipitation: 0.8,
    precipitation_probability: 95,
    wind_speed: 22,
    humidity: 88,
  },
  {
    condition: 'lightning-rainy',
    cloud_coverage: 100,
    precipitation: 1.5,
    precipitation_probability: 100,
    wind_speed: 28,
    humidity: 92,
  },
  {
    condition: 'lightning-rainy',
    cloud_coverage: 100,
    precipitation: 1.0,
    precipitation_probability: 95,
    wind_speed: 25,
    humidity: 90,
  },
  {
    condition: 'pouring',
    cloud_coverage: 100,
    precipitation: 0.6,
    precipitation_probability: 90,
    wind_speed: 20,
    humidity: 88,
  },
  // Hours 17-23: Back to drizzle
  {
    condition: 'rainy',
    cloud_coverage: 100,
    precipitation: 0.3,
    precipitation_probability: 85,
    wind_speed: 15,
    humidity: 86,
  },
  {
    condition: 'rainy',
    cloud_coverage: 100,
    precipitation: 0.2,
    precipitation_probability: 80,
    wind_speed: 12,
    humidity: 85,
  },
  {
    condition: 'rainy',
    cloud_coverage: 100,
    precipitation: 0.15,
    precipitation_probability: 75,
    wind_speed: 10,
    humidity: 85,
  },
  {
    condition: 'rainy',
    cloud_coverage: 100,
    precipitation: 0.1,
    precipitation_probability: 70,
    wind_speed: 8,
    humidity: 86,
  },
  {
    condition: 'rainy',
    cloud_coverage: 100,
    precipitation: 0.1,
    precipitation_probability: 70,
    wind_speed: 7,
    humidity: 86,
  },
  {
    condition: 'rainy',
    cloud_coverage: 100,
    precipitation: 0.1,
    precipitation_probability: 65,
    wind_speed: 6,
    humidity: 87,
  },
  {
    condition: 'rainy',
    cloud_coverage: 100,
    precipitation: 0.1,
    precipitation_probability: 65,
    wind_speed: 6,
    humidity: 88,
  },
];

// ============================================================================
// Pattern 5: Perfect Clear Day
// Clear all day with minimal clouds
// ============================================================================

const perfectClearBase: BaseHourData[] = [
  // Hours 0-5: Clear night
  {
    condition: 'clear-night',
    cloud_coverage: 0,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 3,
    humidity: 55,
  },
  {
    condition: 'clear-night',
    cloud_coverage: 0,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 3,
    humidity: 58,
  },
  {
    condition: 'clear-night',
    cloud_coverage: 2,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 2,
    humidity: 60,
  },
  {
    condition: 'clear-night',
    cloud_coverage: 3,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 2,
    humidity: 62,
  },
  {
    condition: 'clear-night',
    cloud_coverage: 5,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 2,
    humidity: 60,
  },
  {
    condition: 'clear-night',
    cloud_coverage: 5,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 3,
    humidity: 58,
  },
  // Hours 6-11: Sunny morning
  {
    condition: 'sunny',
    cloud_coverage: 5,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 4,
    humidity: 55,
  },
  {
    condition: 'sunny',
    cloud_coverage: 8,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 5,
    humidity: 50,
  },
  {
    condition: 'sunny',
    cloud_coverage: 8,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 5,
    humidity: 48,
  },
  {
    condition: 'sunny',
    cloud_coverage: 10,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 6,
    humidity: 45,
  },
  {
    condition: 'sunny',
    cloud_coverage: 10,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 6,
    humidity: 42,
  },
  {
    condition: 'sunny',
    cloud_coverage: 12,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 7,
    humidity: 40,
  },
  // Hours 12-17: Sunny afternoon with a few puffy clouds
  {
    condition: 'sunny',
    cloud_coverage: 15,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 7,
    humidity: 38,
  },
  {
    condition: 'sunny',
    cloud_coverage: 15,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 7,
    humidity: 38,
  },
  {
    condition: 'sunny',
    cloud_coverage: 12,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 6,
    humidity: 40,
  },
  {
    condition: 'sunny',
    cloud_coverage: 10,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 6,
    humidity: 42,
  },
  {
    condition: 'sunny',
    cloud_coverage: 8,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 5,
    humidity: 45,
  },
  {
    condition: 'sunny',
    cloud_coverage: 5,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 5,
    humidity: 48,
  },
  // Hours 18-23: Clear evening/night
  {
    condition: 'partlycloudy',
    cloud_coverage: 10,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 4,
    humidity: 50,
  },
  {
    condition: 'clear-night',
    cloud_coverage: 5,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 4,
    humidity: 52,
  },
  {
    condition: 'clear-night',
    cloud_coverage: 3,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 3,
    humidity: 54,
  },
  {
    condition: 'clear-night',
    cloud_coverage: 2,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 3,
    humidity: 55,
  },
  {
    condition: 'clear-night',
    cloud_coverage: 0,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 3,
    humidity: 55,
  },
  {
    condition: 'clear-night',
    cloud_coverage: 0,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 3,
    humidity: 55,
  },
];

// ============================================================================
// Pattern 6: Winter Snow Day
// Snow throughout with varying intensity
// ============================================================================

const winterSnowBase: BaseHourData[] = [
  // Hours 0-5: Light snow overnight
  {
    condition: 'snowy',
    cloud_coverage: 100,
    precipitation: 0.1,
    precipitation_probability: 80,
    wind_speed: 8,
    humidity: 85,
  },
  {
    condition: 'snowy',
    cloud_coverage: 100,
    precipitation: 0.1,
    precipitation_probability: 80,
    wind_speed: 8,
    humidity: 85,
  },
  {
    condition: 'snowy',
    cloud_coverage: 100,
    precipitation: 0.15,
    precipitation_probability: 85,
    wind_speed: 10,
    humidity: 86,
  },
  {
    condition: 'snowy',
    cloud_coverage: 100,
    precipitation: 0.15,
    precipitation_probability: 85,
    wind_speed: 10,
    humidity: 87,
  },
  {
    condition: 'snowy',
    cloud_coverage: 100,
    precipitation: 0.2,
    precipitation_probability: 88,
    wind_speed: 12,
    humidity: 88,
  },
  {
    condition: 'snowy',
    cloud_coverage: 100,
    precipitation: 0.25,
    precipitation_probability: 90,
    wind_speed: 12,
    humidity: 88,
  },
  // Hours 6-11: Heavier morning snow
  {
    condition: 'snowy',
    cloud_coverage: 100,
    precipitation: 0.3,
    precipitation_probability: 95,
    wind_speed: 14,
    humidity: 90,
  },
  {
    condition: 'snowy',
    cloud_coverage: 100,
    precipitation: 0.4,
    precipitation_probability: 95,
    wind_speed: 15,
    humidity: 90,
  },
  {
    condition: 'snowy',
    cloud_coverage: 100,
    precipitation: 0.5,
    precipitation_probability: 98,
    wind_speed: 16,
    humidity: 92,
  },
  {
    condition: 'snowy',
    cloud_coverage: 100,
    precipitation: 0.5,
    precipitation_probability: 98,
    wind_speed: 16,
    humidity: 92,
  },
  {
    condition: 'snowy',
    cloud_coverage: 100,
    precipitation: 0.4,
    precipitation_probability: 95,
    wind_speed: 15,
    humidity: 90,
  },
  {
    condition: 'snowy',
    cloud_coverage: 100,
    precipitation: 0.35,
    precipitation_probability: 92,
    wind_speed: 14,
    humidity: 88,
  },
  // Hours 12-17: Tapering snow
  {
    condition: 'snowy',
    cloud_coverage: 100,
    precipitation: 0.25,
    precipitation_probability: 88,
    wind_speed: 12,
    humidity: 86,
  },
  {
    condition: 'snowy',
    cloud_coverage: 100,
    precipitation: 0.2,
    precipitation_probability: 85,
    wind_speed: 12,
    humidity: 85,
  },
  {
    condition: 'snowy',
    cloud_coverage: 100,
    precipitation: 0.15,
    precipitation_probability: 80,
    wind_speed: 10,
    humidity: 84,
  },
  {
    condition: 'snowy',
    cloud_coverage: 100,
    precipitation: 0.15,
    precipitation_probability: 78,
    wind_speed: 10,
    humidity: 83,
  },
  {
    condition: 'snowy',
    cloud_coverage: 100,
    precipitation: 0.1,
    precipitation_probability: 75,
    wind_speed: 8,
    humidity: 82,
  },
  {
    condition: 'snowy',
    cloud_coverage: 100,
    precipitation: 0.1,
    precipitation_probability: 72,
    wind_speed: 8,
    humidity: 82,
  },
  // Hours 18-23: Flurries/light snow
  {
    condition: 'snowy',
    cloud_coverage: 100,
    precipitation: 0.08,
    precipitation_probability: 65,
    wind_speed: 7,
    humidity: 82,
  },
  {
    condition: 'snowy',
    cloud_coverage: 100,
    precipitation: 0.05,
    precipitation_probability: 60,
    wind_speed: 6,
    humidity: 82,
  },
  {
    condition: 'snowy',
    cloud_coverage: 100,
    precipitation: 0.05,
    precipitation_probability: 55,
    wind_speed: 6,
    humidity: 83,
  },
  {
    condition: 'snowy',
    cloud_coverage: 100,
    precipitation: 0.05,
    precipitation_probability: 50,
    wind_speed: 5,
    humidity: 84,
  },
  {
    condition: 'snowy',
    cloud_coverage: 100,
    precipitation: 0.08,
    precipitation_probability: 55,
    wind_speed: 6,
    humidity: 84,
  },
  {
    condition: 'snowy',
    cloud_coverage: 100,
    precipitation: 0.1,
    precipitation_probability: 60,
    wind_speed: 7,
    humidity: 85,
  },
];

// ============================================================================
// Pattern 7: Cold Front Passage
// Warm humid morning → storms as front passes → rapid clearing and cooling
// ============================================================================

const coldFrontBase: BaseHourData[] = [
  // Hours 0-6: Warm, humid, partly cloudy
  {
    condition: 'partlycloudy',
    cloud_coverage: 30,
    precipitation: 0,
    precipitation_probability: 10,
    wind_speed: 8,
    humidity: 72,
  },
  {
    condition: 'partlycloudy',
    cloud_coverage: 32,
    precipitation: 0,
    precipitation_probability: 10,
    wind_speed: 8,
    humidity: 74,
  },
  {
    condition: 'partlycloudy',
    cloud_coverage: 35,
    precipitation: 0,
    precipitation_probability: 12,
    wind_speed: 9,
    humidity: 75,
  },
  {
    condition: 'partlycloudy',
    cloud_coverage: 38,
    precipitation: 0,
    precipitation_probability: 15,
    wind_speed: 10,
    humidity: 76,
  },
  {
    condition: 'partlycloudy',
    cloud_coverage: 40,
    precipitation: 0,
    precipitation_probability: 18,
    wind_speed: 10,
    humidity: 78,
  },
  {
    condition: 'partlycloudy',
    cloud_coverage: 42,
    precipitation: 0,
    precipitation_probability: 20,
    wind_speed: 11,
    humidity: 78,
  },
  {
    condition: 'partlycloudy',
    cloud_coverage: 45,
    precipitation: 0,
    precipitation_probability: 25,
    wind_speed: 12,
    humidity: 80,
  },
  // Hours 7-11: Clouds building rapidly
  {
    condition: 'cloudy',
    cloud_coverage: 55,
    precipitation: 0,
    precipitation_probability: 35,
    wind_speed: 14,
    humidity: 80,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 70,
    precipitation: 0,
    precipitation_probability: 50,
    wind_speed: 16,
    humidity: 82,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 82,
    precipitation: 0,
    precipitation_probability: 65,
    wind_speed: 18,
    humidity: 84,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 90,
    precipitation: 0,
    precipitation_probability: 75,
    wind_speed: 20,
    humidity: 85,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 95,
    precipitation: 0.05,
    precipitation_probability: 85,
    wind_speed: 22,
    humidity: 86,
  },
  // Hours 12-14: Storms as front passes — strong westerly at max lean
  {
    condition: 'lightning-rainy',
    cloud_coverage: 100,
    precipitation: 0.8,
    precipitation_probability: 95,
    wind_speed: 28,
    wind_bearing: 260,
    humidity: 90,
  },
  {
    condition: 'lightning-rainy',
    cloud_coverage: 100,
    precipitation: 1.2,
    precipitation_probability: 98,
    wind_speed: 32,
    wind_bearing: 270,
    humidity: 92,
  },
  {
    condition: 'pouring',
    cloud_coverage: 100,
    precipitation: 0.6,
    precipitation_probability: 90,
    wind_speed: 28,
    wind_bearing: 275,
    humidity: 88,
  },
  // Hours 15-17: Rapid clearing, windy
  {
    condition: 'windy-variant',
    cloud_coverage: 75,
    precipitation: 0.1,
    precipitation_probability: 50,
    wind_speed: 30,
    wind_bearing: 290,
    humidity: 70,
  },
  {
    condition: 'windy',
    cloud_coverage: 50,
    precipitation: 0,
    precipitation_probability: 20,
    wind_speed: 28,
    humidity: 55,
  },
  {
    condition: 'windy',
    cloud_coverage: 30,
    precipitation: 0,
    precipitation_probability: 10,
    wind_speed: 25,
    humidity: 45,
  },
  // Hours 18-23: Clear and cool, light wind
  {
    condition: 'partlycloudy',
    cloud_coverage: 20,
    precipitation: 0,
    precipitation_probability: 5,
    wind_speed: 18,
    humidity: 42,
  },
  {
    condition: 'clear-night',
    cloud_coverage: 15,
    precipitation: 0,
    precipitation_probability: 5,
    wind_speed: 14,
    humidity: 40,
  },
  {
    condition: 'clear-night',
    cloud_coverage: 12,
    precipitation: 0,
    precipitation_probability: 5,
    wind_speed: 12,
    humidity: 40,
  },
  {
    condition: 'clear-night',
    cloud_coverage: 10,
    precipitation: 0,
    precipitation_probability: 5,
    wind_speed: 10,
    humidity: 42,
  },
  {
    condition: 'clear-night',
    cloud_coverage: 8,
    precipitation: 0,
    precipitation_probability: 5,
    wind_speed: 8,
    humidity: 44,
  },
  {
    condition: 'clear-night',
    cloud_coverage: 8,
    precipitation: 0,
    precipitation_probability: 5,
    wind_speed: 7,
    humidity: 45,
  },
];

// ============================================================================
// Pattern 8: Coastal Marine Layer
// Fog/overcast morning → burns off → sunny afternoon → fog returns at dusk
// ============================================================================

const marineLayerBase: BaseHourData[] = [
  // Hours 0-5: Fog/overcast
  {
    condition: 'fog',
    cloud_coverage: 100,
    precipitation: 0,
    precipitation_probability: 5,
    wind_speed: 3,
    humidity: 95,
  },
  {
    condition: 'fog',
    cloud_coverage: 100,
    precipitation: 0,
    precipitation_probability: 5,
    wind_speed: 3,
    humidity: 96,
  },
  {
    condition: 'fog',
    cloud_coverage: 100,
    precipitation: 0,
    precipitation_probability: 5,
    wind_speed: 2,
    humidity: 97,
  },
  {
    condition: 'fog',
    cloud_coverage: 100,
    precipitation: 0,
    precipitation_probability: 5,
    wind_speed: 2,
    humidity: 98,
  },
  {
    condition: 'fog',
    cloud_coverage: 100,
    precipitation: 0,
    precipitation_probability: 5,
    wind_speed: 2,
    humidity: 97,
  },
  {
    condition: 'fog',
    cloud_coverage: 100,
    precipitation: 0,
    precipitation_probability: 5,
    wind_speed: 3,
    humidity: 96,
  },
  // Hours 6-10: Fog slowly burning off
  {
    condition: 'fog',
    cloud_coverage: 100,
    precipitation: 0,
    precipitation_probability: 5,
    wind_speed: 4,
    humidity: 94,
  },
  {
    condition: 'fog',
    cloud_coverage: 95,
    precipitation: 0,
    precipitation_probability: 5,
    wind_speed: 5,
    humidity: 90,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 85,
    precipitation: 0,
    precipitation_probability: 5,
    wind_speed: 6,
    humidity: 82,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 70,
    precipitation: 0,
    precipitation_probability: 5,
    wind_speed: 7,
    humidity: 72,
  },
  {
    condition: 'partlycloudy',
    cloud_coverage: 55,
    precipitation: 0,
    precipitation_probability: 5,
    wind_speed: 8,
    humidity: 65,
  },
  // Hours 11-16: Sunny, clear
  {
    condition: 'sunny',
    cloud_coverage: 25,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 10,
    humidity: 55,
  },
  {
    condition: 'sunny',
    cloud_coverage: 15,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 12,
    humidity: 50,
  },
  {
    condition: 'sunny',
    cloud_coverage: 12,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 12,
    humidity: 48,
  },
  {
    condition: 'sunny',
    cloud_coverage: 15,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 11,
    humidity: 50,
  },
  {
    condition: 'sunny',
    cloud_coverage: 18,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 10,
    humidity: 52,
  },
  {
    condition: 'sunny',
    cloud_coverage: 20,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 9,
    humidity: 55,
  },
  // Hours 17-20: Clouds returning
  {
    condition: 'partlycloudy',
    cloud_coverage: 35,
    precipitation: 0,
    precipitation_probability: 5,
    wind_speed: 7,
    humidity: 62,
  },
  {
    condition: 'partlycloudy',
    cloud_coverage: 50,
    precipitation: 0,
    precipitation_probability: 5,
    wind_speed: 6,
    humidity: 70,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 65,
    precipitation: 0,
    precipitation_probability: 5,
    wind_speed: 5,
    humidity: 78,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 78,
    precipitation: 0,
    precipitation_probability: 5,
    wind_speed: 4,
    humidity: 85,
  },
  // Hours 21-23: Fog rolling back in
  {
    condition: 'fog',
    cloud_coverage: 90,
    precipitation: 0,
    precipitation_probability: 5,
    wind_speed: 3,
    humidity: 92,
  },
  {
    condition: 'fog',
    cloud_coverage: 98,
    precipitation: 0,
    precipitation_probability: 5,
    wind_speed: 3,
    humidity: 95,
  },
  {
    condition: 'fog',
    cloud_coverage: 100,
    precipitation: 0,
    precipitation_probability: 5,
    wind_speed: 3,
    humidity: 96,
  },
];

// ============================================================================
// Pattern 9: All-Day Overcast
// Persistent gray clouds, no precipitation, just gloomy
// ============================================================================

const allDayOvercastBase: BaseHourData[] = [
  // All 24 hours: Persistent gray clouds
  {
    condition: 'cloudy',
    cloud_coverage: 90,
    precipitation: 0,
    precipitation_probability: 15,
    wind_speed: 6,
    humidity: 70,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 92,
    precipitation: 0,
    precipitation_probability: 15,
    wind_speed: 6,
    humidity: 72,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 95,
    precipitation: 0,
    precipitation_probability: 18,
    wind_speed: 7,
    humidity: 73,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 95,
    precipitation: 0,
    precipitation_probability: 18,
    wind_speed: 7,
    humidity: 74,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 98,
    precipitation: 0,
    precipitation_probability: 20,
    wind_speed: 8,
    humidity: 75,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 100,
    precipitation: 0,
    precipitation_probability: 22,
    wind_speed: 8,
    humidity: 76,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 100,
    precipitation: 0,
    precipitation_probability: 22,
    wind_speed: 8,
    humidity: 75,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 100,
    precipitation: 0,
    precipitation_probability: 20,
    wind_speed: 9,
    humidity: 74,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 98,
    precipitation: 0,
    precipitation_probability: 18,
    wind_speed: 9,
    humidity: 72,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 95,
    precipitation: 0,
    precipitation_probability: 18,
    wind_speed: 10,
    humidity: 70,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 92,
    precipitation: 0,
    precipitation_probability: 15,
    wind_speed: 10,
    humidity: 68,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 90,
    precipitation: 0,
    precipitation_probability: 15,
    wind_speed: 10,
    humidity: 66,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 88,
    precipitation: 0,
    precipitation_probability: 12,
    wind_speed: 9,
    humidity: 65,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 88,
    precipitation: 0,
    precipitation_probability: 12,
    wind_speed: 9,
    humidity: 65,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 90,
    precipitation: 0,
    precipitation_probability: 15,
    wind_speed: 8,
    humidity: 66,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 92,
    precipitation: 0,
    precipitation_probability: 15,
    wind_speed: 8,
    humidity: 68,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 95,
    precipitation: 0,
    precipitation_probability: 18,
    wind_speed: 7,
    humidity: 70,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 95,
    precipitation: 0,
    precipitation_probability: 18,
    wind_speed: 7,
    humidity: 72,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 98,
    precipitation: 0,
    precipitation_probability: 20,
    wind_speed: 6,
    humidity: 74,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 98,
    precipitation: 0,
    precipitation_probability: 20,
    wind_speed: 6,
    humidity: 75,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 100,
    precipitation: 0,
    precipitation_probability: 22,
    wind_speed: 6,
    humidity: 76,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 100,
    precipitation: 0,
    precipitation_probability: 22,
    wind_speed: 5,
    humidity: 76,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 98,
    precipitation: 0,
    precipitation_probability: 20,
    wind_speed: 5,
    humidity: 75,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 95,
    precipitation: 0,
    precipitation_probability: 18,
    wind_speed: 5,
    humidity: 74,
  },
];

// ============================================================================
// Pattern 10: Overnight Snow Clearing
// Snow overnight → stops at dawn → clearing → sunny afternoon
// ============================================================================

const overnightSnowClearingBase: BaseHourData[] = [
  // Hours 0-5: Snow overnight
  {
    condition: 'snowy',
    cloud_coverage: 100,
    precipitation: 0.25,
    precipitation_probability: 90,
    wind_speed: 12,
    humidity: 88,
  },
  {
    condition: 'snowy',
    cloud_coverage: 100,
    precipitation: 0.3,
    precipitation_probability: 92,
    wind_speed: 14,
    humidity: 90,
  },
  {
    condition: 'snowy',
    cloud_coverage: 100,
    precipitation: 0.3,
    precipitation_probability: 92,
    wind_speed: 14,
    humidity: 90,
  },
  {
    condition: 'snowy',
    cloud_coverage: 100,
    precipitation: 0.25,
    precipitation_probability: 88,
    wind_speed: 12,
    humidity: 88,
  },
  {
    condition: 'snowy',
    cloud_coverage: 100,
    precipitation: 0.2,
    precipitation_probability: 85,
    wind_speed: 10,
    humidity: 86,
  },
  {
    condition: 'snowy',
    cloud_coverage: 100,
    precipitation: 0.15,
    precipitation_probability: 80,
    wind_speed: 8,
    humidity: 85,
  },
  // Hours 6-8: Snow stopping
  {
    condition: 'snowy',
    cloud_coverage: 100,
    precipitation: 0.08,
    precipitation_probability: 60,
    wind_speed: 7,
    humidity: 84,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 95,
    precipitation: 0.02,
    precipitation_probability: 35,
    wind_speed: 6,
    humidity: 82,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 88,
    precipitation: 0,
    precipitation_probability: 20,
    wind_speed: 6,
    humidity: 78,
  },
  // Hours 9-12: Clearing skies
  {
    condition: 'cloudy',
    cloud_coverage: 75,
    precipitation: 0,
    precipitation_probability: 10,
    wind_speed: 6,
    humidity: 70,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 55,
    precipitation: 0,
    precipitation_probability: 8,
    wind_speed: 7,
    humidity: 62,
  },
  {
    condition: 'partlycloudy',
    cloud_coverage: 38,
    precipitation: 0,
    precipitation_probability: 5,
    wind_speed: 7,
    humidity: 55,
  },
  {
    condition: 'partlycloudy',
    cloud_coverage: 25,
    precipitation: 0,
    precipitation_probability: 5,
    wind_speed: 8,
    humidity: 50,
  },
  // Hours 13-18: Sunny afternoon
  {
    condition: 'sunny',
    cloud_coverage: 15,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 8,
    humidity: 45,
  },
  {
    condition: 'sunny',
    cloud_coverage: 12,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 7,
    humidity: 42,
  },
  {
    condition: 'sunny',
    cloud_coverage: 10,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 7,
    humidity: 42,
  },
  {
    condition: 'sunny',
    cloud_coverage: 12,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 6,
    humidity: 44,
  },
  {
    condition: 'sunny',
    cloud_coverage: 15,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 5,
    humidity: 46,
  },
  {
    condition: 'partlycloudy',
    cloud_coverage: 18,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 4,
    humidity: 48,
  },
  // Hours 19-23: Clear night
  {
    condition: 'clear-night',
    cloud_coverage: 10,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 4,
    humidity: 52,
  },
  {
    condition: 'clear-night',
    cloud_coverage: 8,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 3,
    humidity: 55,
  },
  {
    condition: 'clear-night',
    cloud_coverage: 5,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 3,
    humidity: 58,
  },
  {
    condition: 'clear-night',
    cloud_coverage: 5,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 3,
    humidity: 60,
  },
  {
    condition: 'clear-night',
    cloud_coverage: 5,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 3,
    humidity: 62,
  },
];

// ============================================================================
// Pattern 11: Wintry Mix
// Rain transitions to mixed sleet/freezing rain as cold air undercuts warm air,
// then to snow. SW winds during rain lean right; NE winds during mix lean left.
// ============================================================================

const wintryMixBase: BaseHourData[] = [
  // Hours 0-5: Cloudy night, pre-storm
  {
    condition: 'cloudy',
    cloud_coverage: 80,
    precipitation: 0,
    precipitation_probability: 30,
    wind_speed: 6,
    wind_bearing: 200,
    humidity: 72,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 85,
    precipitation: 0,
    precipitation_probability: 40,
    wind_speed: 7,
    wind_bearing: 210,
    humidity: 75,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 90,
    precipitation: 0,
    precipitation_probability: 55,
    wind_speed: 9,
    wind_bearing: 215,
    humidity: 78,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 95,
    precipitation: 0,
    precipitation_probability: 65,
    wind_speed: 10,
    wind_bearing: 220,
    humidity: 80,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 98,
    precipitation: 0.05,
    precipitation_probability: 75,
    wind_speed: 11,
    wind_bearing: 220,
    humidity: 83,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 100,
    precipitation: 0.1,
    precipitation_probability: 80,
    wind_speed: 12,
    wind_bearing: 225,
    humidity: 85,
  },
  // Hours 6-9: Rain (warm sector, SW wind — streaks lean right)
  {
    condition: 'rainy',
    cloud_coverage: 100,
    precipitation: 0.3,
    precipitation_probability: 90,
    wind_speed: 14,
    wind_bearing: 230,
    humidity: 88,
  },
  {
    condition: 'rainy',
    cloud_coverage: 100,
    precipitation: 0.5,
    precipitation_probability: 95,
    wind_speed: 16,
    wind_bearing: 235,
    humidity: 90,
  },
  {
    condition: 'rainy',
    cloud_coverage: 100,
    precipitation: 0.4,
    precipitation_probability: 92,
    wind_speed: 18,
    wind_bearing: 240,
    humidity: 90,
  },
  {
    condition: 'rainy',
    cloud_coverage: 100,
    precipitation: 0.3,
    precipitation_probability: 88,
    wind_speed: 17,
    wind_bearing: 240,
    humidity: 89,
  },
  // Hours 10-15: Wintry mix (NE wind as cold air undercuts — streaks lean left)
  {
    condition: 'snowy-rainy',
    cloud_coverage: 100,
    precipitation: 0.3,
    precipitation_probability: 92,
    wind_speed: 20,
    wind_bearing: 60,
    humidity: 92,
  },
  {
    condition: 'snowy-rainy',
    cloud_coverage: 100,
    precipitation: 0.4,
    precipitation_probability: 95,
    wind_speed: 22,
    wind_bearing: 50,
    humidity: 93,
  },
  {
    condition: 'snowy-rainy',
    cloud_coverage: 100,
    precipitation: 0.5,
    precipitation_probability: 98,
    wind_speed: 24,
    wind_bearing: 45,
    humidity: 94,
  },
  {
    condition: 'snowy-rainy',
    cloud_coverage: 100,
    precipitation: 0.4,
    precipitation_probability: 95,
    wind_speed: 22,
    wind_bearing: 45,
    humidity: 94,
  },
  {
    condition: 'snowy-rainy',
    cloud_coverage: 100,
    precipitation: 0.3,
    precipitation_probability: 90,
    wind_speed: 20,
    wind_bearing: 40,
    humidity: 93,
  },
  {
    condition: 'snowy-rainy',
    cloud_coverage: 100,
    precipitation: 0.2,
    precipitation_probability: 85,
    wind_speed: 18,
    wind_bearing: 35,
    humidity: 92,
  },
  // Hours 16-19: Snow (NNE wind)
  {
    condition: 'snowy',
    cloud_coverage: 100,
    precipitation: 0.2,
    precipitation_probability: 85,
    wind_speed: 16,
    wind_bearing: 30,
    humidity: 90,
  },
  {
    condition: 'snowy',
    cloud_coverage: 100,
    precipitation: 0.25,
    precipitation_probability: 88,
    wind_speed: 15,
    wind_bearing: 25,
    humidity: 90,
  },
  {
    condition: 'snowy',
    cloud_coverage: 100,
    precipitation: 0.2,
    precipitation_probability: 82,
    wind_speed: 14,
    wind_bearing: 25,
    humidity: 89,
  },
  {
    condition: 'snowy',
    cloud_coverage: 100,
    precipitation: 0.15,
    precipitation_probability: 78,
    wind_speed: 12,
    wind_bearing: 20,
    humidity: 88,
  },
  // Hours 20-23: Tapering snow
  {
    condition: 'snowy',
    cloud_coverage: 100,
    precipitation: 0.1,
    precipitation_probability: 70,
    wind_speed: 10,
    wind_bearing: 15,
    humidity: 87,
  },
  {
    condition: 'snowy',
    cloud_coverage: 95,
    precipitation: 0.08,
    precipitation_probability: 60,
    wind_speed: 9,
    wind_bearing: 15,
    humidity: 86,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 90,
    precipitation: 0.02,
    precipitation_probability: 40,
    wind_speed: 8,
    wind_bearing: 10,
    humidity: 84,
  },
  {
    condition: 'cloudy',
    cloud_coverage: 85,
    precipitation: 0,
    precipitation_probability: 25,
    wind_speed: 7,
    wind_bearing: 10,
    humidity: 82,
  },
];

// ============================================================================
// Create All Variations
// ============================================================================

export const buildingStorm = createAllVariations(buildingStormBase);
export const fogAndThunderstorm = createAllVariations(fogAndThunderstormBase);
export const rainyMorning = createAllVariations(rainyMorningBase);
export const drizzleAndThunderstorms = createAllVariations(drizzleAndThunderstormsBase);
export const perfectClear = createAllVariations(perfectClearBase);
export const winterSnow = createAllVariations(winterSnowBase);
export const coldFront = createAllVariations(coldFrontBase);
export const marineLayer = createAllVariations(marineLayerBase);
export const allDayOvercast = createAllVariations(allDayOvercastBase);
export const overnightSnowClearing = createAllVariations(overnightSnowClearingBase);
export const wintryMix = createAllVariations(wintryMixBase);

// Combined export for Storybook
export const allScenarios = {
  buildingStorm,
  fogAndThunderstorm,
  rainyMorning,
  drizzleAndThunderstorms,
  perfectClear,
  winterSnow,
  coldFront,
  marineLayer,
  allDayOvercast,
  overnightSnowClearing,
  wintryMix,
};

// ============================================================================
// Helper: Calculate Sun Times for a Given Date
// ============================================================================

/**
 * Calculate approximate sunrise/sunset times for a given date and latitude.
 * Uses a simplified solar calculation for mid-latitudes.
 * @param dateString ISO date string (e.g., '2026-01-15')
 * @param latitude Latitude in degrees (default: 40, approximate for mid-latitudes)
 * @returns SunTimes object with sunrise, sunset, dawn, and dusk
 */
export function calculateSunTimes(dateString: string, latitude = 40): SunTimes {
  const date = new Date(`${dateString}T12:00:00`); // Noon on the target date
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000,
  );

  // Solar declination angle (simplified)
  const declination = 23.45 * Math.sin((((360 * (284 + dayOfYear)) / 365) * Math.PI) / 180);

  // Hour angle calculation
  const latRad = (latitude * Math.PI) / 180;
  const decRad = (declination * Math.PI) / 180;
  const hourAngle = (Math.acos(-Math.tan(latRad) * Math.tan(decRad)) * 180) / Math.PI;

  // Sunrise/sunset times (in hours from noon)
  const sunriseOffset = -hourAngle / 15; // Convert to hours
  const sunsetOffset = hourAngle / 15;

  // Calculate actual times — add offset in ms to avoid negative-modulo hour rollback
  const sunrise = new Date(date.getTime() + sunriseOffset * 3600000);
  const sunset = new Date(date.getTime() + sunsetOffset * 3600000);

  // Dawn is 30 minutes before sunrise, dusk is 30 minutes after sunset
  const dawn = new Date(sunrise);
  dawn.setMinutes(dawn.getMinutes() - 30);

  const dusk = new Date(sunset);
  dusk.setMinutes(dusk.getMinutes() + 30);

  return { sunrise, sunset, dawn, dusk };
}

// ============================================================================
// Default Sun Times (for Storybook use)
// Uses January 15 to match winter weather data
// ============================================================================

export const defaultSunTimes: SunTimes = calculateSunTimes('2026-01-15', 40);

// ============================================================================
// Legacy Exports (for backward compatibility with existing stories)
// ============================================================================

export const sunnySkyHot = perfectClear.summer;
export const sunnySkyMild = perfectClear.lateSpring;
export const sunnySkyCold = perfectClear.winter;
export const cloudySkyHot = allDayOvercast.summer;
export const cloudySkyMild = allDayOvercast.lateSpring;
export const cloudySkyCold = allDayOvercast.winter;
export const rainyDayHot = rainyMorning.summer;
export const rainyDayMild = rainyMorning.lateSpring;
export const rainyDayCold = rainyMorning.winter;
export const snowyDayMild = winterSnow.earlySpring;
export const snowyDayCold = winterSnow.winter;
export const mixedRainHot = drizzleAndThunderstorms.summer;
export const mixedRainMild = drizzleAndThunderstorms.lateSpring;
export const mixedRainCold = drizzleAndThunderstorms.winter;
