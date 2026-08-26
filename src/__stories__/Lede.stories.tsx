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

// ============================================================================
// Lede
// ----------------------------------------------------------------------------
// The screenshot at the top of the README. Unlike the other stories this one is
// pinned to a fixed date and a fixed "now" so it renders identically every time
// it is shot — the cloud RNG is seeded off each hour's datetime, so a frozen
// clock means a frozen sky.
//
// The day is a fair one, and cumulus carries it: coverage swells to a little
// over half the sky at midday and tapers off at both ends, the wind stays light
// so the layer never shears into rolls, and the air is dry — which is what keeps
// the low band reading as detached puffs rather than a lumpy deck. No front, no
// rain probability, and low UV all day, so the high band stays at its
// unconditional baseline and the sky stays cyan instead of milky.
// ============================================================================

/** Fixed anchor: Friday 12 June 2026, local time. */
const ANCHOR = { year: 2026, month: 5, day: 12 } as const;

const at = (dayOffset: number, hour: number, minute = 0): Date =>
  new Date(ANCHOR.year, ANCHOR.month, ANCHOR.day + dayOffset, hour, minute, 0, 0);

/** "Now" for the card: the hourly strip starts at the next whole hour, 03:00. */
const currentTime = at(0, 2, 20);

const sunTimes: SunTimes = {
  sunrise: at(0, 5, 24),
  sunset: at(0, 20, 31),
  dawn: at(0, 4, 52),
  dusk: at(0, 21, 3),
};

interface HourSpec {
  /** Hours past midnight on the anchor day (may run past 24 into the next). */
  h: number;
  condition: string;
  temperature: number;
  /** Cloud cover, percent. */
  cloud: number;
  humidity: number;
  wind: number;
  uv: number;
  /** Precipitation *probability* only — nothing actually falls in frame. */
  pop?: number;
}

// 24 hours, 03:00 → 02:00 — a whole day with night at both ends, so the star
// field frames the daylight instead of hanging off one edge.
//
// The temperature curve does double duty: it is also the horizon line, so the
// sky is tallest where the day is coolest. The warm-up is deliberately slow
// through the morning, which is where the cumulus lives — the puffs get the full
// height of the strip to tower into — and the afternoon peak is left to the flat
// deck, which doesn't need the room.
//
// Humidity stays low enough that dew points sit near the haze floor, and
// nothing precipitates: no wet hour and no rain probability anywhere in the
// window, so neither the altostratus sheet nor the cirrostratus veil that
// announces a front ever fires (see decidePrimary / decideHigh in
// inferCloudType.ts).
const HOURS: HourSpec[] = [
  { h: 3, condition: 'clear-night', temperature: 57, cloud: 8, humidity: 60, wind: 4, uv: 0 },
  { h: 4, condition: 'clear-night', temperature: 56, cloud: 6, humidity: 58, wind: 4, uv: 0 },
  { h: 5, condition: 'clear-night', temperature: 55, cloud: 8, humidity: 57, wind: 5, uv: 0 },
  { h: 6, condition: 'sunny', temperature: 55, cloud: 15, humidity: 56, wind: 5, uv: 0 },
  { h: 7, condition: 'sunny', temperature: 56, cloud: 22, humidity: 54, wind: 5, uv: 1 },
  { h: 8, condition: 'partlycloudy', temperature: 58, cloud: 28, humidity: 52, wind: 6, uv: 2 },
  { h: 9, condition: 'partlycloudy', temperature: 60, cloud: 38, humidity: 50, wind: 6, uv: 3 },
  { h: 10, condition: 'partlycloudy', temperature: 63, cloud: 48, humidity: 47, wind: 7, uv: 4 },
  { h: 11, condition: 'partlycloudy', temperature: 66, cloud: 55, humidity: 45, wind: 7, uv: 4 },
  { h: 12, condition: 'partlycloudy', temperature: 70, cloud: 58, humidity: 43, wind: 8, uv: 4 },
  { h: 13, condition: 'partlycloudy', temperature: 74, cloud: 58, humidity: 42, wind: 8, uv: 4 },
  { h: 14, condition: 'partlycloudy', temperature: 77, cloud: 55, humidity: 42, wind: 8, uv: 4 },
  { h: 15, condition: 'partlycloudy', temperature: 79, cloud: 52, humidity: 42, wind: 9, uv: 3 },
  { h: 16, condition: 'partlycloudy', temperature: 80, cloud: 48, humidity: 43, wind: 9, uv: 2 },
  { h: 17, condition: 'partlycloudy', temperature: 79, cloud: 42, humidity: 44, wind: 8, uv: 1 },
  { h: 18, condition: 'partlycloudy', temperature: 76, cloud: 34, humidity: 46, wind: 8, uv: 0 },
  { h: 19, condition: 'partlycloudy', temperature: 73, cloud: 24, humidity: 48, wind: 7, uv: 0 },
  { h: 20, condition: 'partlycloudy', temperature: 70, cloud: 16, humidity: 50, wind: 6, uv: 0 },
  { h: 21, condition: 'clear-night', temperature: 68, cloud: 12, humidity: 52, wind: 6, uv: 0 },
  { h: 22, condition: 'clear-night', temperature: 66, cloud: 10, humidity: 54, wind: 5, uv: 0 },
  { h: 23, condition: 'clear-night', temperature: 64, cloud: 8, humidity: 56, wind: 5, uv: 0 },
  { h: 24, condition: 'clear-night', temperature: 62, cloud: 8, humidity: 58, wind: 5, uv: 0 },
  { h: 25, condition: 'clear-night', temperature: 60, cloud: 6, humidity: 59, wind: 4, uv: 0 },
  { h: 26, condition: 'clear-night', temperature: 58, cloud: 6, humidity: 60, wind: 4, uv: 0 },
];

export const ledeHourlyForecast: WeatherForecast[] = HOURS.map((spec) => ({
  datetime: at(0, spec.h).toISOString(),
  condition: spec.condition,
  temperature: spec.temperature,
  cloud_coverage: spec.cloud,
  humidity: spec.humidity,
  uv_index: spec.uv,
  wind_speed: spec.wind,
  wind_bearing: 245,
  precipitation: 0,
  precipitation_probability: spec.pop ?? 5,
}));

interface DaySpec {
  condition: string;
  high: number;
  low: number;
  cloud: number;
  pop: number;
  precipitation: number;
}

// A pleasant week with one wet day in it: showers threaten tonight, midweek
// brings a proper rainy day that knocks ten degrees off the high, and it is
// fair on either side of it.
const DAYS: DaySpec[] = [
  { condition: 'partlycloudy', high: 81, low: 57, cloud: 55, pop: 60, precipitation: 0.08 },
  { condition: 'sunny', high: 77, low: 55, cloud: 15, pop: 5, precipitation: 0 },
  { condition: 'sunny', high: 80, low: 58, cloud: 10, pop: 5, precipitation: 0 },
  { condition: 'partlycloudy', high: 83, low: 61, cloud: 40, pop: 25, precipitation: 0.02 },
  { condition: 'rainy', high: 73, low: 62, cloud: 95, pop: 90, precipitation: 0.62 },
  { condition: 'partlycloudy', high: 76, low: 58, cloud: 40, pop: 20, precipitation: 0.04 },
  { condition: 'sunny', high: 79, low: 57, cloud: 10, pop: 0, precipitation: 0 },
];

export const ledeDailyForecast: WeatherForecast[] = DAYS.map((spec, i) => ({
  datetime: at(i, 0).toISOString(),
  condition: spec.condition,
  temperature: spec.high,
  templow: spec.low,
  cloud_coverage: spec.cloud,
  humidity: 55,
  precipitation: spec.precipitation,
  precipitation_probability: spec.pop,
  wind_speed: 9,
  wind_bearing: 245,
}));

const ledeEntity = {
  entity_id: 'weather.forecast_home',
  state: 'partlycloudy',
  attributes: {
    temperature: 72,
    apparent_temperature: 74,
    temperature_unit: '°F',
    dew_point: 49,
    humidity: 45,
    cloud_coverage: 35,
    uv_index: 8,
    pressure: 30.12,
    pressure_unit: 'inHg',
    wind_bearing: 245,
    wind_speed: 8,
    wind_speed_unit: 'mph',
    visibility_unit: 'mi',
    precipitation_unit: 'in',
    friendly_name: 'Forecast Home',
  },
} as unknown as WeatherEntity;

const config: WeatherConfig = {
  entity: 'weather.forecast_home',
  hourlyHours: 24,
};

// ============================================================================
// Themes
// ============================================================================

const THEMES = {
  light: {
    label: 'Light',
    page: '#f4f5f7',
    vars: {
      '--primary-text-color': '#212121',
      '--secondary-text-color': '#727272',
      '--primary-color': '#03a9f4',
      '--info-color': '#039be5',
      '--divider-color': 'rgba(0, 0, 0, 0.12)',
      '--card-background-color': '#ffffff',
      '--ha-card-background': '#ffffff',
    },
  },
  dark: {
    label: 'Dark',
    page: '#111214',
    vars: {
      '--primary-text-color': '#e1e1e1',
      '--secondary-text-color': '#9b9b9b',
      '--primary-color': '#03a9f4',
      '--info-color': '#039be5',
      '--divider-color': 'rgba(225, 225, 225, 0.12)',
      '--card-background-color': '#1c1c1c',
      '--ha-card-background': '#1c1c1c',
    },
  },
} as const;

type ThemeName = keyof typeof THEMES;

// ============================================================================
// Lede Component
// ============================================================================

interface LedeProps {
  fontSize?: FontSize;
  cardWidth?: number;
  /** Padding around the pair — breathing room for the README crop. */
  gutter?: number;
}

function ThemedCard({
  theme,
  fontSize,
  cardWidth,
  gutter,
}: {
  theme: ThemeName;
  fontSize: FontSize;
  cardWidth: number;
  gutter: number;
}) {
  const { page, vars } = THEMES[theme];
  return (
    <div
      style={{
        ...vars,
        background: page,
        padding: `${gutter}px`,
        display: 'flex',
        justifyContent: 'center',
        colorScheme: theme,
      }}
    >
      <WeatherProvider
        config={{ ...config, size: fontSize }}
        entity={ledeEntity}
        hourlyForecast={ledeHourlyForecast}
        dailyForecast={ledeDailyForecast}
        sunTimes={sunTimes}
        latitude={40}
        currentTime={currentTime}
      >
        <ha-card
          class={`size-${fontSize}`}
          style={{ width: `${cardWidth}px`, boxShadow: '0 2px 10px rgba(0, 0, 0, 0.18)' }}
        >
          <div class="card-content weather-card">
            <WeatherDisplay />
          </div>
        </ha-card>
      </WeatherProvider>
    </div>
  );
}

function Lede({ fontSize = 'medium', cardWidth = 440, gutter = 28 }: LedeProps) {
  return (
    <>
      <style>{getAllStyles()}</style>
      <div
        id="lede"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          width: 'max-content',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        <ThemedCard theme="light" fontSize={fontSize} cardWidth={cardWidth} gutter={gutter} />
        <ThemedCard theme="dark" fontSize={fontSize} cardWidth={cardWidth} gutter={gutter} />
      </div>
    </>
  );
}

const meta: Meta<typeof Lede> = {
  title: 'Weather/Lede',
  component: Lede,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark', values: [{ name: 'dark', value: '#111214' }] },
  },
  argTypes: {
    fontSize: { control: 'select', options: ['small', 'medium', 'large'] },
    cardWidth: { control: 'number' },
    gutter: { control: 'number' },
  },
};

export default meta;
type Story = StoryObj<typeof Lede>;

/** The README screenshot: one fair-weather day, light and dark, side by side. */
export const LightAndDark: Story = {
  name: 'Lede - Light & Dark',
  args: { fontSize: 'large', cardWidth: 440, gutter: 28 },
};
