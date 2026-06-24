import type { Meta, StoryObj } from '@storybook/preact-vite';
import { getAllStyles } from 'preact-homeassistant';
import {
  type FontSize,
  type SunTimes,
  type WeatherConfig,
  type WeatherEntity,
  type WeatherForecast,
  WeatherProvider,
} from '../WeatherCard/WeatherContext';
import { WeatherDisplay } from '../WeatherCard/WeatherDisplay';
// Import component styles to register them
import '../WeatherCard/WeatherCard.styles';

// Import sample data
import weatherEntity from './weatherEntity.json';
import weatherForecastDaily from './weatherForecastDaily.json';
import weatherForecastHourly from './weatherForecastHourly.json';

// Config
const config: WeatherConfig = {
  entity: 'weather.forecast_home',
};

// ============================================================================
// Relative-Date Helpers
// ============================================================================
// All story dates are anchored to "today" so the WeatherContext's future-only
// filter (WeatherContext.tsx:144) doesn't drop everything as past.

/** Today at the given local hour:minute. */
function todayAt(hour: number, minute = 0): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

/** Today + dayOffset days at the given local hour:minute. */
function dayAt(dayOffset: number, hour: number, minute = 0): Date {
  const d = todayAt(hour, minute);
  d.setDate(d.getDate() + dayOffset);
  return d;
}

/** 7-day daily forecast starting today, with varied conditions and temps. */
function generateDailyForecast(): WeatherForecast[] {
  const pattern: Array<{ condition: string; high: number; low: number; precip: number }> = [
    { condition: 'sunny', high: 72, low: 55, precip: 0 },
    { condition: 'partlycloudy', high: 75, low: 58, precip: 0 },
    { condition: 'cloudy', high: 68, low: 56, precip: 0.1 },
    { condition: 'rainy', high: 64, low: 54, precip: 0.6 },
    { condition: 'partlycloudy', high: 70, low: 55, precip: 0.1 },
    { condition: 'sunny', high: 76, low: 58, precip: 0 },
    { condition: 'sunny', high: 78, low: 60, precip: 0 },
  ];
  return pattern.map((p, i) => ({
    datetime: dayAt(i, 0, 0).toISOString(),
    condition: p.condition,
    temperature: p.high,
    templow: p.low,
    precipitation_probability: p.precip > 0 ? 80 : 10,
    precipitation: p.precip,
    cloud_coverage: p.condition === 'cloudy' || p.condition === 'rainy' ? 90 : 30,
    humidity: 50,
    wind_speed: 8,
    wind_bearing: 180,
  }));
}

/** 12-hour forecast starting at the next whole hour. Used by the Default story. */
function generateDefaultHourlyForecast(): WeatherForecast[] {
  const start = new Date();
  start.setHours(start.getHours() + 1, 0, 0, 0);
  return Array.from({ length: 12 }, (_, i) => {
    const date = new Date(start);
    date.setHours(start.getHours() + i);
    const hourOfDay = date.getHours();
    const tempFactor = Math.sin(((hourOfDay - 6) / 24) * Math.PI);
    return {
      datetime: date.toISOString(),
      condition: i < 4 ? 'sunny' : i < 8 ? 'partlycloudy' : 'cloudy',
      temperature: Math.round(60 + 20 * Math.max(0, tempFactor)),
      cloud_coverage: 30 + i * 5,
      precipitation: 0,
      precipitation_probability: 10,
      wind_speed: 5,
      wind_bearing: 180,
      humidity: 55,
    };
  });
}

// Default sun times (around 6am sunrise, 6pm sunset in UTC for simplicity)
const defaultSunTimes: SunTimes = {
  sunrise: todayAt(6), // 6am UTC
  sunset: todayAt(18), // 6pm UTC
  dawn: todayAt(5, 30),
  dusk: todayAt(18, 30),
};

// ============================================================================
// Helper Functions to Generate Mock Data
// ============================================================================

function generateHourlyForecast(options: {
  startDate: Date;
  hours: number;
  conditions: string[];
  tempRange: [number, number];
  cloudCoverage?: number;
  precipitation?: number;
  windSpeed?: number;
  windBearing?: number;
}): WeatherForecast[] {
  const {
    startDate,
    hours,
    conditions,
    tempRange,
    cloudCoverage = 50,
    precipitation = 0,
    windSpeed = 5,
    windBearing = 180,
  } = options;

  const forecast: WeatherForecast[] = [];
  const [minTemp, maxTemp] = tempRange;

  for (let i = 0; i < hours; i++) {
    const date = new Date(startDate);
    date.setHours(date.getHours() + i);

    // Vary temperature through the day
    const hourOfDay = date.getHours();
    const tempFactor = Math.sin(((hourOfDay - 6) / 24) * Math.PI);
    const temp = minTemp + (maxTemp - minTemp) * Math.max(0, tempFactor);

    forecast.push({
      datetime: date.toISOString(),
      condition: conditions[i % conditions.length],
      temperature: Math.round(temp),
      cloud_coverage: cloudCoverage,
      precipitation: precipitation,
      precipitation_probability: precipitation > 0 ? 80 : 10,
      wind_speed: windSpeed,
      wind_bearing: windBearing,
      humidity: 50 + (precipitation > 0 ? 30 : 0),
    });
  }

  return forecast;
}

// ============================================================================
// Wrapper Component
// ============================================================================

interface WeatherWidgetProps {
  config: WeatherConfig;
  entity: WeatherEntity;
  hourlyForecast: WeatherForecast[];
  dailyForecast: WeatherForecast[];
  sunTimes?: SunTimes;
  latitude?: number;
  fontSize?: FontSize;
  cardWidth?: number;
}

function WeatherWidget({
  config,
  entity,
  hourlyForecast,
  dailyForecast,
  sunTimes = defaultSunTimes,
  latitude = 40,
  fontSize = 'medium',
  cardWidth = 400,
}: WeatherWidgetProps) {
  const mergedConfig = { ...config, size: fontSize };

  return (
    <WeatherProvider
      config={mergedConfig}
      entity={entity}
      hourlyForecast={hourlyForecast}
      dailyForecast={dailyForecast}
      sunTimes={sunTimes}
      latitude={latitude}
    >
      <style>{getAllStyles()}</style>
      <ha-card class={`size-${fontSize}`} style={{ width: `${cardWidth}px` }}>
        <div class="card-content weather-card">
          <WeatherDisplay />
        </div>
      </ha-card>
    </WeatherProvider>
  );
}

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof WeatherWidget> = {
  title: 'Weather/HourlyChart',
  component: WeatherWidget,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#0d0d0d' }],
    },
  },
  argTypes: {
    fontSize: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Widget size',
    },
    latitude: {
      control: 'number',
      description: 'Latitude (positive=north, negative=south)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof WeatherWidget>;

// ============================================================================
// Default Story (from real data)
// ============================================================================

export const Default: Story = {
  args: {
    config,
    entity: weatherEntity as unknown as WeatherEntity,
    hourlyForecast: generateDefaultHourlyForecast(),
    dailyForecast: generateDailyForecast(),
    fontSize: 'medium',
  },
};

// ============================================================================
// Ice Stories
// ============================================================================

export const IceLightFreeze: Story = {
  name: 'Ice - Light Freeze (32°F)',
  args: {
    config,
    entity: {
      ...weatherEntity,
      state: 'cloudy',
      attributes: { ...weatherEntity.attributes, temperature: 32 },
    } as unknown as WeatherEntity,
    hourlyForecast: generateHourlyForecast({
      startDate: todayAt(8),
      hours: 12,
      conditions: ['cloudy'],
      tempRange: [30, 34],
      cloudCoverage: 80,
    }),
    dailyForecast: generateDailyForecast(),
    fontSize: 'medium',
  },
};

export const IceDeepFreeze: Story = {
  name: 'Ice - Deep Freeze (-10°F)',
  args: {
    config,
    entity: {
      ...weatherEntity,
      state: 'snowy',
      attributes: { ...weatherEntity.attributes, temperature: -10 },
    } as unknown as WeatherEntity,
    hourlyForecast: generateHourlyForecast({
      startDate: todayAt(8),
      hours: 12,
      conditions: ['snowy'],
      tempRange: [-15, -5],
      cloudCoverage: 100,
      precipitation: 0.5,
    }),
    dailyForecast: generateDailyForecast(),
    fontSize: 'medium',
  },
};

// ============================================================================
// Puddles Stories
// ============================================================================

export const PuddlesLightRain: Story = {
  name: 'Puddles - Light Rain',
  args: {
    config,
    entity: {
      ...weatherEntity,
      state: 'rainy',
      attributes: { ...weatherEntity.attributes, temperature: 55 },
    } as unknown as WeatherEntity,
    hourlyForecast: generateHourlyForecast({
      startDate: todayAt(8),
      hours: 12,
      conditions: ['rainy'],
      tempRange: [50, 58],
      cloudCoverage: 90,
      precipitation: 0.5,
    }),
    dailyForecast: generateDailyForecast(),
    fontSize: 'medium',
  },
};

export const PuddlesHeavyRain: Story = {
  name: 'Puddles - Heavy Rain',
  args: {
    config,
    entity: {
      ...weatherEntity,
      state: 'pouring',
      attributes: { ...weatherEntity.attributes, temperature: 60 },
    } as unknown as WeatherEntity,
    hourlyForecast: generateHourlyForecast({
      startDate: todayAt(8),
      hours: 12,
      conditions: ['pouring'],
      tempRange: [55, 62],
      cloudCoverage: 100,
      precipitation: 5,
      windSpeed: 15,
    }),
    dailyForecast: generateDailyForecast(),
    fontSize: 'medium',
  },
};

// ============================================================================
// Wind Stories
// ============================================================================

export const WindyDay: Story = {
  name: 'Windy Day',
  args: {
    config,
    entity: {
      ...weatherEntity,
      state: 'windy',
      attributes: { ...weatherEntity.attributes, temperature: 55, wind_speed: 25 },
    } as unknown as WeatherEntity,
    hourlyForecast: generateHourlyForecast({
      startDate: todayAt(8),
      hours: 12,
      conditions: ['partlycloudy', 'cloudy', 'partlycloudy'],
      tempRange: [50, 60],
      cloudCoverage: 60,
      windSpeed: 25,
      windBearing: 270, // West wind
    }),
    dailyForecast: generateDailyForecast(),
    fontSize: 'medium',
  },
};

export const StormyWind: Story = {
  name: 'Stormy - Strong Wind',
  args: {
    config,
    entity: {
      ...weatherEntity,
      state: 'lightning-rainy',
      attributes: { ...weatherEntity.attributes, temperature: 65, wind_speed: 35 },
    } as unknown as WeatherEntity,
    hourlyForecast: generateHourlyForecast({
      startDate: todayAt(14),
      hours: 12,
      conditions: ['rainy', 'lightning-rainy', 'pouring', 'rainy'],
      tempRange: [58, 68],
      cloudCoverage: 100,
      precipitation: 3,
      windSpeed: 35,
      windBearing: 180, // South wind
    }),
    dailyForecast: generateDailyForecast(),
    fontSize: 'medium',
  },
};

export const NightTime: Story = {
  name: 'Night Time - Clear',
  args: {
    config,
    entity: {
      ...weatherEntity,
      state: 'clear-night',
      attributes: { ...weatherEntity.attributes, temperature: 45 },
    } as unknown as WeatherEntity,
    hourlyForecast: generateHourlyForecast({
      startDate: todayAt(22), // 10pm UTC (night)
      hours: 8,
      conditions: ['clear-night'],
      tempRange: [40, 48],
      cloudCoverage: 5,
    }),
    dailyForecast: generateDailyForecast(),
    sunTimes: {
      sunrise: dayAt(1, 7), // Next morning
      sunset: todayAt(17), // Already set
      dawn: dayAt(1, 6, 30),
      dusk: todayAt(17, 30),
    },
    fontSize: 'medium',
  },
};

// ============================================================================
// Sand Stories
// ============================================================================

export const SandHotDay: Story = {
  name: 'Sand - Hot Day (95°F)',
  args: {
    config,
    entity: {
      ...weatherEntity,
      state: 'sunny',
      attributes: { ...weatherEntity.attributes, temperature: 95 },
    } as unknown as WeatherEntity,
    hourlyForecast: generateHourlyForecast({
      startDate: todayAt(8),
      hours: 12,
      conditions: ['sunny'],
      tempRange: [88, 98],
      cloudCoverage: 5,
    }),
    dailyForecast: generateDailyForecast(),
    sunTimes: {
      sunrise: todayAt(10),
      sunset: dayAt(1, 1),
      dawn: todayAt(9, 30),
      dusk: dayAt(1, 1, 30),
    },
    fontSize: 'medium',
  },
};

export const SandExtremeHeat: Story = {
  name: 'Sand - Extreme Heat (110°F)',
  args: {
    config,
    entity: {
      ...weatherEntity,
      state: 'sunny',
      attributes: { ...weatherEntity.attributes, temperature: 110 },
    } as unknown as WeatherEntity,
    hourlyForecast: generateHourlyForecast({
      startDate: todayAt(8),
      hours: 12,
      conditions: ['sunny'],
      tempRange: [100, 115],
      cloudCoverage: 0,
    }),
    dailyForecast: generateDailyForecast(),
    sunTimes: {
      sunrise: todayAt(10),
      sunset: dayAt(1, 1),
      dawn: todayAt(9, 30),
      dusk: dayAt(1, 1, 30),
    },
    fontSize: 'medium',
  },
};

// ============================================================================
// Seasonal Stories - Northern Hemisphere
// ============================================================================

export const SpringNorthern: Story = {
  name: 'Spring - Northern Hemisphere (April)',
  args: {
    config,
    entity: {
      ...weatherEntity,
      state: 'sunny',
      attributes: { ...weatherEntity.attributes, temperature: 68 },
    } as unknown as WeatherEntity,
    hourlyForecast: generateHourlyForecast({
      startDate: todayAt(8),
      hours: 12,
      conditions: ['sunny', 'partlycloudy', 'sunny'],
      tempRange: [58, 72],
      cloudCoverage: 20,
    }),
    dailyForecast: generateDailyForecast(),
    latitude: 40, // Northern hemisphere
    sunTimes: {
      sunrise: todayAt(10, 30),
      sunset: todayAt(23, 30),
      dawn: todayAt(10),
      dusk: dayAt(1, 0),
    },
    fontSize: 'medium',
  },
};

export const SummerNorthern: Story = {
  name: 'Summer - Northern Hemisphere (July)',
  args: {
    config,
    entity: {
      ...weatherEntity,
      state: 'sunny',
      attributes: { ...weatherEntity.attributes, temperature: 78 },
    } as unknown as WeatherEntity,
    hourlyForecast: generateHourlyForecast({
      startDate: todayAt(8),
      hours: 12,
      conditions: ['sunny'],
      tempRange: [70, 85],
      cloudCoverage: 10,
    }),
    dailyForecast: generateDailyForecast(),
    latitude: 40,
    sunTimes: {
      sunrise: todayAt(9, 30),
      sunset: dayAt(1, 0, 30),
      dawn: todayAt(9),
      dusk: dayAt(1, 1),
    },
    fontSize: 'medium',
  },
};

export const FallNorthern: Story = {
  name: 'Fall - Northern Hemisphere (October)',
  args: {
    config,
    entity: {
      ...weatherEntity,
      state: 'partlycloudy',
      attributes: { ...weatherEntity.attributes, temperature: 58 },
    } as unknown as WeatherEntity,
    hourlyForecast: generateHourlyForecast({
      startDate: todayAt(8),
      hours: 12,
      conditions: ['partlycloudy', 'sunny', 'partlycloudy'],
      tempRange: [48, 62],
      cloudCoverage: 40,
    }),
    dailyForecast: generateDailyForecast(),
    latitude: 40,
    sunTimes: {
      sunrise: todayAt(11),
      sunset: todayAt(22),
      dawn: todayAt(10, 30),
      dusk: todayAt(22, 30),
    },
    fontSize: 'medium',
  },
};

export const WinterNorthernNice: Story = {
  name: 'Winter - Northern Hemisphere (January, Nice Day)',
  args: {
    config,
    entity: {
      ...weatherEntity,
      state: 'sunny',
      attributes: { ...weatherEntity.attributes, temperature: 45 },
    } as unknown as WeatherEntity,
    hourlyForecast: generateHourlyForecast({
      startDate: todayAt(8),
      hours: 12,
      conditions: ['sunny'],
      tempRange: [38, 50],
      cloudCoverage: 10,
    }),
    dailyForecast: generateDailyForecast(),
    latitude: 40,
    fontSize: 'medium',
  },
};

// ============================================================================
// Seasonal Stories - Southern Hemisphere
// ============================================================================

export const SpringSouthern: Story = {
  name: 'Spring - Southern Hemisphere (October)',
  args: {
    config,
    entity: {
      ...weatherEntity,
      state: 'sunny',
      attributes: { ...weatherEntity.attributes, temperature: 68 },
    } as unknown as WeatherEntity,
    hourlyForecast: generateHourlyForecast({
      startDate: todayAt(8),
      hours: 12,
      conditions: ['sunny', 'partlycloudy'],
      tempRange: [58, 72],
      cloudCoverage: 20,
    }),
    dailyForecast: generateDailyForecast(),
    latitude: -34, // Southern hemisphere (Sydney-ish)
    sunTimes: {
      sunrise: todayAt(19), // ~5am local
      sunset: dayAt(1, 8), // ~6pm local
      dawn: todayAt(18, 30),
      dusk: dayAt(1, 8, 30),
    },
    fontSize: 'medium',
  },
};

export const SummerSouthern: Story = {
  name: 'Summer - Southern Hemisphere (January)',
  args: {
    config,
    entity: {
      ...weatherEntity,
      state: 'sunny',
      attributes: { ...weatherEntity.attributes, temperature: 78 },
    } as unknown as WeatherEntity,
    hourlyForecast: generateHourlyForecast({
      startDate: todayAt(8),
      hours: 12,
      conditions: ['sunny'],
      tempRange: [70, 85],
      cloudCoverage: 5,
    }),
    dailyForecast: generateDailyForecast(),
    latitude: -34,
    sunTimes: {
      sunrise: todayAt(18),
      sunset: dayAt(1, 9),
      dawn: todayAt(17, 30),
      dusk: dayAt(1, 9, 30),
    },
    fontSize: 'medium',
  },
};

export const FallSouthern: Story = {
  name: 'Fall - Southern Hemisphere (April)',
  args: {
    config,
    entity: {
      ...weatherEntity,
      state: 'partlycloudy',
      attributes: { ...weatherEntity.attributes, temperature: 58 },
    } as unknown as WeatherEntity,
    hourlyForecast: generateHourlyForecast({
      startDate: todayAt(8),
      hours: 12,
      conditions: ['partlycloudy', 'sunny'],
      tempRange: [50, 62],
      cloudCoverage: 35,
    }),
    dailyForecast: generateDailyForecast(),
    latitude: -34,
    sunTimes: {
      sunrise: todayAt(20),
      sunset: dayAt(1, 7),
      dawn: todayAt(19, 30),
      dusk: dayAt(1, 7, 30),
    },
    fontSize: 'medium',
  },
};

export const WinterSouthernNice: Story = {
  name: 'Winter - Southern Hemisphere (July, Nice Day)',
  args: {
    config,
    entity: {
      ...weatherEntity,
      state: 'sunny',
      attributes: { ...weatherEntity.attributes, temperature: 55 },
    } as unknown as WeatherEntity,
    hourlyForecast: generateHourlyForecast({
      startDate: todayAt(8),
      hours: 12,
      conditions: ['sunny'],
      tempRange: [45, 60],
      cloudCoverage: 15,
    }),
    dailyForecast: generateDailyForecast(),
    latitude: -34,
    sunTimes: {
      sunrise: todayAt(21),
      sunset: dayAt(1, 7),
      dawn: todayAt(20, 30),
      dusk: dayAt(1, 7, 30),
    },
    fontSize: 'medium',
  },
};

// ============================================================================
// Combined Scenario Stories
// ============================================================================

export const DayToNightTransition: Story = {
  name: 'Sunny Day to Night Transition',
  args: {
    config,
    entity: {
      ...weatherEntity,
      state: 'sunny',
      attributes: { ...weatherEntity.attributes, temperature: 65 },
    } as unknown as WeatherEntity,
    hourlyForecast: (() => {
      const forecast: WeatherForecast[] = [];
      const start = todayAt(14); // 2pm

      for (let i = 0; i < 12; i++) {
        const date = new Date(start);
        date.setHours(date.getHours() + i);
        const hour = date.getHours();

        // Transition from day to night
        let condition = 'sunny';
        if (hour >= 19 && hour < 21) condition = 'partlycloudy';
        if (hour >= 21 || hour < 6) condition = 'clear-night';

        const temp = hour >= 18 ? 65 - (hour - 18) * 3 : 70;

        forecast.push({
          datetime: date.toISOString(),
          condition,
          temperature: Math.round(temp),
          cloud_coverage: hour >= 19 ? 20 : 5,
          precipitation: 0,
          wind_speed: 8,
        });
      }
      return forecast;
    })(),
    dailyForecast: generateDailyForecast(),
    sunTimes: {
      sunrise: todayAt(10, 30),
      sunset: todayAt(23), // 7pm local
      dawn: todayAt(10),
      dusk: todayAt(23, 30),
    },
    fontSize: 'medium',
  },
};

export const ApproachingStorm: Story = {
  name: 'Approaching Storm',
  args: {
    config,
    entity: {
      ...weatherEntity,
      state: 'partlycloudy',
      attributes: { ...weatherEntity.attributes, temperature: 72, wind_speed: 15 },
    } as unknown as WeatherEntity,
    hourlyForecast: (() => {
      const forecast: WeatherForecast[] = [];
      const start = todayAt(12);
      const conditions = [
        'sunny',
        'sunny',
        'partlycloudy',
        'partlycloudy',
        'cloudy',
        'cloudy',
        'rainy',
        'pouring',
        'lightning-rainy',
        'rainy',
        'cloudy',
        'partlycloudy',
      ];
      const clouds = [10, 20, 40, 60, 80, 95, 100, 100, 100, 90, 70, 50];
      const precip = [0, 0, 0, 0, 0, 0.1, 1, 5, 3, 1, 0.2, 0];
      const wind = [5, 8, 10, 12, 15, 18, 22, 28, 25, 18, 12, 8];

      for (let i = 0; i < 12; i++) {
        const date = new Date(start);
        date.setHours(date.getHours() + i);

        forecast.push({
          datetime: date.toISOString(),
          condition: conditions[i],
          temperature: 75 - i * 2,
          cloud_coverage: clouds[i],
          precipitation: precip[i],
          precipitation_probability: precip[i] > 0 ? 80 : 20,
          wind_speed: wind[i],
          wind_bearing: 220,
        });
      }
      return forecast;
    })(),
    dailyForecast: generateDailyForecast(),
    fontSize: 'medium',
  },
};

export const ColdFront: Story = {
  name: 'Cold Front Arrival',
  args: {
    config,
    entity: {
      ...weatherEntity,
      state: 'cloudy',
      attributes: { ...weatherEntity.attributes, temperature: 45, wind_speed: 20 },
    } as unknown as WeatherEntity,
    hourlyForecast: (() => {
      const forecast: WeatherForecast[] = [];
      const start = todayAt(10);

      for (let i = 0; i < 12; i++) {
        const date = new Date(start);
        date.setHours(date.getHours() + i);

        // Temperature drops dramatically
        const temp = 55 - i * 4; // From 55 to 11
        const condition = temp > 40 ? 'cloudy' : temp > 32 ? 'snowy-rainy' : 'snowy';

        forecast.push({
          datetime: date.toISOString(),
          condition,
          temperature: temp,
          cloud_coverage: 90,
          precipitation: temp <= 40 ? 0.5 : 0,
          precipitation_probability: temp <= 40 ? 70 : 30,
          wind_speed: 15 + i,
          wind_bearing: 320,
        });
      }
      return forecast;
    })(),
    dailyForecast: generateDailyForecast(),
    fontSize: 'medium',
  },
};

export const HeatWave: Story = {
  name: 'Heat Wave',
  args: {
    config,
    entity: {
      ...weatherEntity,
      state: 'sunny',
      attributes: { ...weatherEntity.attributes, temperature: 105 },
    } as unknown as WeatherEntity,
    hourlyForecast: generateHourlyForecast({
      startDate: todayAt(8),
      hours: 12,
      conditions: ['sunny'],
      tempRange: [95, 110],
      cloudCoverage: 0,
      windSpeed: 3,
    }),
    dailyForecast: generateDailyForecast(),
    sunTimes: {
      sunrise: todayAt(9, 30),
      sunset: dayAt(1, 0, 30),
      dawn: todayAt(9),
      dusk: dayAt(1, 1),
    },
    fontSize: 'medium',
  },
};

export const MixedPrecipitation: Story = {
  name: 'Mixed Precipitation (Wintry Mix)',
  args: {
    config,
    entity: {
      ...weatherEntity,
      state: 'snowy-rainy',
      attributes: { ...weatherEntity.attributes, temperature: 33 },
    } as unknown as WeatherEntity,
    hourlyForecast: (() => {
      const forecast: WeatherForecast[] = [];
      const start = todayAt(8);

      for (let i = 0; i < 12; i++) {
        const date = new Date(start);
        date.setHours(date.getHours() + i);

        // Temperature hovers around freezing
        const temp = 31 + Math.sin(i / 2) * 4;
        const condition = temp > 33 ? 'rainy' : temp < 31 ? 'snowy' : 'snowy-rainy';

        forecast.push({
          datetime: date.toISOString(),
          condition,
          temperature: Math.round(temp),
          cloud_coverage: 100,
          precipitation: 1.5,
          precipitation_probability: 90,
          wind_speed: 10,
          wind_bearing: 45,
        });
      }
      return forecast;
    })(),
    dailyForecast: generateDailyForecast(),
    fontSize: 'medium',
  },
};

// ============================================================================
// Size Variants
// ============================================================================

export const SmallSize: Story = {
  name: 'Size - Small',
  args: {
    config,
    entity: weatherEntity as unknown as WeatherEntity,
    hourlyForecast: generateDefaultHourlyForecast(),
    dailyForecast: generateDailyForecast(),
    fontSize: 'small',
  },
};

export const LargeSize: Story = {
  name: 'Size - Large',
  args: {
    config,
    entity: weatherEntity as unknown as WeatherEntity,
    hourlyForecast: generateDefaultHourlyForecast(),
    dailyForecast: generateDailyForecast(),
    fontSize: 'large',
  },
};

// ============================================================================
// Real Data Story
// ============================================================================

// Restamp fixture JSONs to start from now so the future-only filter passes.
function restampedRealData(): { hourly: WeatherForecast[]; daily: WeatherForecast[] } {
  const now = new Date();
  const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1);
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const hourly = weatherForecastHourly.slice(0, 12).map((entry, i) => ({
    ...entry,
    datetime: new Date(nextHour.getTime() + i * 3600_000).toISOString(),
  })) as WeatherForecast[];

  const daily = weatherForecastDaily.map((entry, i) => ({
    ...entry,
    datetime: new Date(todayMidnight.getTime() + i * 86_400_000).toISOString(),
  })) as WeatherForecast[];

  return { hourly, daily };
}

const { hourly: realHourly, daily: realDaily } = restampedRealData();

export const RealData: Story = {
  name: 'Real Data (fixture)',
  args: {
    config,
    entity: weatherEntity as unknown as WeatherEntity,
    hourlyForecast: realHourly,
    dailyForecast: realDaily,
    fontSize: 'medium',
  },
};

// ============================================================================
// Compressed / Half-Width
// ============================================================================

export const HalfWidth: Story = {
  name: 'Compressed - Half Width',
  args: {
    config: { ...config, showHourly: false, showDaily: false },
    entity: weatherEntity as unknown as WeatherEntity,
    hourlyForecast: generateDefaultHourlyForecast(),
    dailyForecast: generateDailyForecast(),
    fontSize: 'medium',
    cardWidth: 200,
  },
};
