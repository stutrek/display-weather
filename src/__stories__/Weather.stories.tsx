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
import dailyForecast from './weatherForecastDaily.json';
import hourlyForecast from './weatherForecastHourly.json';

// Config
const config: WeatherConfig = {
  entity: 'weather.forecast_home',
};

// Default sun times (around 6am sunrise, 6pm sunset in UTC for simplicity)
const defaultSunTimes: SunTimes = {
  sunrise: new Date('2026-01-18T06:00:00Z'), // 6am UTC
  sunset: new Date('2026-01-18T18:00:00Z'), // 6pm UTC
  dawn: new Date('2026-01-18T05:30:00Z'),
  dusk: new Date('2026-01-18T18:30:00Z'),
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
}

function WeatherWidget({
  config,
  entity,
  hourlyForecast,
  dailyForecast,
  sunTimes = defaultSunTimes,
  latitude = 40,
  fontSize = 'medium',
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
      <ha-card class={`size-${fontSize}`} style={{ width: '400px' }}>
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
    hourlyForecast: hourlyForecast as WeatherForecast[],
    dailyForecast: dailyForecast as WeatherForecast[],
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
      startDate: new Date('2026-01-18T08:00:00'),
      hours: 12,
      conditions: ['cloudy'],
      tempRange: [30, 34],
      cloudCoverage: 80,
    }),
    dailyForecast: dailyForecast as WeatherForecast[],
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
      startDate: new Date('2026-01-18T08:00:00'),
      hours: 12,
      conditions: ['snowy'],
      tempRange: [-15, -5],
      cloudCoverage: 100,
      precipitation: 0.5,
    }),
    dailyForecast: dailyForecast as WeatherForecast[],
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
      startDate: new Date('2026-01-18T08:00:00'),
      hours: 12,
      conditions: ['rainy'],
      tempRange: [50, 58],
      cloudCoverage: 90,
      precipitation: 0.5,
    }),
    dailyForecast: dailyForecast as WeatherForecast[],
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
      startDate: new Date('2026-01-18T08:00:00'),
      hours: 12,
      conditions: ['pouring'],
      tempRange: [55, 62],
      cloudCoverage: 100,
      precipitation: 5,
      windSpeed: 15,
    }),
    dailyForecast: dailyForecast as WeatherForecast[],
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
      startDate: new Date('2026-03-15T08:00:00'),
      hours: 12,
      conditions: ['partlycloudy', 'cloudy', 'partlycloudy'],
      tempRange: [50, 60],
      cloudCoverage: 60,
      windSpeed: 25,
      windBearing: 270, // West wind
    }),
    dailyForecast: dailyForecast as WeatherForecast[],
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
      startDate: new Date('2026-04-15T14:00:00Z'),
      hours: 12,
      conditions: ['rainy', 'lightning-rainy', 'pouring', 'rainy'],
      tempRange: [58, 68],
      cloudCoverage: 100,
      precipitation: 3,
      windSpeed: 35,
      windBearing: 180, // South wind
    }),
    dailyForecast: dailyForecast as WeatherForecast[],
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
      startDate: new Date('2026-01-18T22:00:00Z'), // 10pm UTC (night)
      hours: 8,
      conditions: ['clear-night'],
      tempRange: [40, 48],
      cloudCoverage: 5,
    }),
    dailyForecast: dailyForecast as WeatherForecast[],
    sunTimes: {
      sunrise: new Date('2026-01-19T07:00:00Z'), // Next morning
      sunset: new Date('2026-01-18T17:00:00Z'), // Already set
      dawn: new Date('2026-01-19T06:30:00Z'),
      dusk: new Date('2026-01-18T17:30:00Z'),
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
      startDate: new Date('2026-07-18T08:00:00'),
      hours: 12,
      conditions: ['sunny'],
      tempRange: [88, 98],
      cloudCoverage: 5,
    }),
    dailyForecast: dailyForecast as WeatherForecast[],
    sunTimes: {
      sunrise: new Date('2026-07-18T10:00:00Z'),
      sunset: new Date('2026-07-19T01:00:00Z'),
      dawn: new Date('2026-07-18T09:30:00Z'),
      dusk: new Date('2026-07-19T01:30:00Z'),
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
      startDate: new Date('2026-07-18T08:00:00'),
      hours: 12,
      conditions: ['sunny'],
      tempRange: [100, 115],
      cloudCoverage: 0,
    }),
    dailyForecast: dailyForecast as WeatherForecast[],
    sunTimes: {
      sunrise: new Date('2026-07-18T10:00:00Z'),
      sunset: new Date('2026-07-19T01:00:00Z'),
      dawn: new Date('2026-07-18T09:30:00Z'),
      dusk: new Date('2026-07-19T01:30:00Z'),
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
      startDate: new Date('2026-04-15T08:00:00'),
      hours: 12,
      conditions: ['sunny', 'partlycloudy', 'sunny'],
      tempRange: [58, 72],
      cloudCoverage: 20,
    }),
    dailyForecast: dailyForecast as WeatherForecast[],
    latitude: 40, // Northern hemisphere
    sunTimes: {
      sunrise: new Date('2026-04-15T10:30:00Z'),
      sunset: new Date('2026-04-15T23:30:00Z'),
      dawn: new Date('2026-04-15T10:00:00Z'),
      dusk: new Date('2026-04-16T00:00:00Z'),
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
      startDate: new Date('2026-07-15T08:00:00'),
      hours: 12,
      conditions: ['sunny'],
      tempRange: [70, 85],
      cloudCoverage: 10,
    }),
    dailyForecast: dailyForecast as WeatherForecast[],
    latitude: 40,
    sunTimes: {
      sunrise: new Date('2026-07-15T09:30:00Z'),
      sunset: new Date('2026-07-16T00:30:00Z'),
      dawn: new Date('2026-07-15T09:00:00Z'),
      dusk: new Date('2026-07-16T01:00:00Z'),
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
      startDate: new Date('2026-10-15T08:00:00'),
      hours: 12,
      conditions: ['partlycloudy', 'sunny', 'partlycloudy'],
      tempRange: [48, 62],
      cloudCoverage: 40,
    }),
    dailyForecast: dailyForecast as WeatherForecast[],
    latitude: 40,
    sunTimes: {
      sunrise: new Date('2026-10-15T11:00:00Z'),
      sunset: new Date('2026-10-15T22:00:00Z'),
      dawn: new Date('2026-10-15T10:30:00Z'),
      dusk: new Date('2026-10-15T22:30:00Z'),
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
      startDate: new Date('2026-01-15T08:00:00'),
      hours: 12,
      conditions: ['sunny'],
      tempRange: [38, 50],
      cloudCoverage: 10,
    }),
    dailyForecast: dailyForecast as WeatherForecast[],
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
      startDate: new Date('2026-10-15T08:00:00'),
      hours: 12,
      conditions: ['sunny', 'partlycloudy'],
      tempRange: [58, 72],
      cloudCoverage: 20,
    }),
    dailyForecast: dailyForecast as WeatherForecast[],
    latitude: -34, // Southern hemisphere (Sydney-ish)
    sunTimes: {
      sunrise: new Date('2026-10-15T19:00:00Z'), // ~5am local
      sunset: new Date('2026-10-16T08:00:00Z'), // ~6pm local
      dawn: new Date('2026-10-15T18:30:00Z'),
      dusk: new Date('2026-10-16T08:30:00Z'),
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
      startDate: new Date('2026-01-15T08:00:00'),
      hours: 12,
      conditions: ['sunny'],
      tempRange: [70, 85],
      cloudCoverage: 5,
    }),
    dailyForecast: dailyForecast as WeatherForecast[],
    latitude: -34,
    sunTimes: {
      sunrise: new Date('2026-01-15T18:00:00Z'),
      sunset: new Date('2026-01-16T09:00:00Z'),
      dawn: new Date('2026-01-15T17:30:00Z'),
      dusk: new Date('2026-01-16T09:30:00Z'),
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
      startDate: new Date('2026-04-15T08:00:00'),
      hours: 12,
      conditions: ['partlycloudy', 'sunny'],
      tempRange: [50, 62],
      cloudCoverage: 35,
    }),
    dailyForecast: dailyForecast as WeatherForecast[],
    latitude: -34,
    sunTimes: {
      sunrise: new Date('2026-04-15T20:00:00Z'),
      sunset: new Date('2026-04-16T07:00:00Z'),
      dawn: new Date('2026-04-15T19:30:00Z'),
      dusk: new Date('2026-04-16T07:30:00Z'),
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
      startDate: new Date('2026-07-15T08:00:00'),
      hours: 12,
      conditions: ['sunny'],
      tempRange: [45, 60],
      cloudCoverage: 15,
    }),
    dailyForecast: dailyForecast as WeatherForecast[],
    latitude: -34,
    sunTimes: {
      sunrise: new Date('2026-07-15T21:00:00Z'),
      sunset: new Date('2026-07-16T07:00:00Z'),
      dawn: new Date('2026-07-15T20:30:00Z'),
      dusk: new Date('2026-07-16T07:30:00Z'),
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
      const start = new Date('2026-04-15T14:00:00'); // 2pm

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
    dailyForecast: dailyForecast as WeatherForecast[],
    sunTimes: {
      sunrise: new Date('2026-04-15T10:30:00Z'),
      sunset: new Date('2026-04-15T23:00:00Z'), // 7pm local
      dawn: new Date('2026-04-15T10:00:00Z'),
      dusk: new Date('2026-04-15T23:30:00Z'),
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
      const start = new Date('2026-05-15T12:00:00');
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
    dailyForecast: dailyForecast as WeatherForecast[],
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
      const start = new Date('2026-11-15T10:00:00');

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
    dailyForecast: dailyForecast as WeatherForecast[],
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
      startDate: new Date('2026-07-25T08:00:00'),
      hours: 12,
      conditions: ['sunny'],
      tempRange: [95, 110],
      cloudCoverage: 0,
      windSpeed: 3,
    }),
    dailyForecast: dailyForecast as WeatherForecast[],
    sunTimes: {
      sunrise: new Date('2026-07-25T09:30:00Z'),
      sunset: new Date('2026-07-26T00:30:00Z'),
      dawn: new Date('2026-07-25T09:00:00Z'),
      dusk: new Date('2026-07-26T01:00:00Z'),
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
      const start = new Date('2026-02-15T08:00:00');

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
    dailyForecast: dailyForecast as WeatherForecast[],
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
    hourlyForecast: hourlyForecast as WeatherForecast[],
    dailyForecast: dailyForecast as WeatherForecast[],
    fontSize: 'small',
  },
};

export const LargeSize: Story = {
  name: 'Size - Large',
  args: {
    config,
    entity: weatherEntity as unknown as WeatherEntity,
    hourlyForecast: hourlyForecast as WeatherForecast[],
    dailyForecast: dailyForecast as WeatherForecast[],
    fontSize: 'large',
  },
};
