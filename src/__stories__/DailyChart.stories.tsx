// ============================================================================
// DailyChart Storybook Stories
// Showcase DailyChart component with various scenarios
// ============================================================================

import type { Meta, StoryObj } from '@storybook/preact-vite';
import { getAllStyles } from 'preact-homeassistant';
import { useState } from 'preact/hooks';
import { DailyChart } from '../WeatherCard/DailyChart';
import { DayDetailModal } from '../WeatherCard/DayDetailModal';
import { createAdaptiveTemperatureColorFn } from '../WeatherCard/HourlyChart/colors';
import type { WeatherForecast } from '../WeatherCard/WeatherContext';
import {
  defaultSunTimes,
  mixedWeek,
  rainyWeek,
  snowyWeek,
  sunnyWeekHot,
  threeDayForecast,
  twoWeekForecast,
  variableWeek,
} from './dailyWeatherSamples';

// Helper to create color function from daily forecast data
function createColorFnForDaily(data: WeatherForecast[]) {
  const temps: number[] = [];
  data.forEach((d) => {
    if (d.temperature !== undefined) temps.push(d.temperature);
    if (d.templow !== undefined) temps.push(d.templow);
  });
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  // Match WeatherContext: asymmetric padding (cool end expands more than warm).
  return createAdaptiveTemperatureColorFn(min, max, { low: 12, high: 4 });
}

// ============================================================================
// Storybook Meta
// ============================================================================

const meta: Meta<typeof DailyChart> = {
  title: 'Weather/DailyChart',
  component: DailyChart,
  decorators: [
    // Cards inject registered css`` styles into their shadow root; stories
    // render bare components, so inject them into the story tree instead.
    (Story) => (
      <>
        <style>{getAllStyles()}</style>
        <Story />
      </>
    ),
  ],
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#1a1a2e' },
        { name: 'light', value: '#f5f5f5' },
      ],
    },
  },
  argTypes: {
    height: {
      control: { type: 'range', min: 80, max: 200, step: 10 },
      defaultValue: 120,
    },
    minColumnWidth: {
      control: { type: 'range', min: 40, max: 100, step: 5 },
      defaultValue: 50,
    },
    precipitationUnit: {
      control: { type: 'select' },
      options: ['in', 'mm'],
      defaultValue: 'in',
    },
  },
};

export default meta;

type Story = StoryObj<typeof DailyChart>;

// ============================================================================
// Individual Stories
// ============================================================================

export const SunnyWeekHot: Story = {
  args: {
    forecast: sunnyWeekHot,
    sunTimes: defaultSunTimes,
    height: 120,
    minColumnWidth: 50,
    precipitationUnit: 'in',
    getTemperatureColor: createColorFnForDaily(sunnyWeekHot),
  },
};

export const MixedWeather: Story = {
  args: {
    forecast: mixedWeek,
    sunTimes: defaultSunTimes,
    height: 120,
    minColumnWidth: 50,
    precipitationUnit: 'in',
    getTemperatureColor: createColorFnForDaily(mixedWeek),
  },
};

export const RainyWeek: Story = {
  args: {
    forecast: rainyWeek,
    sunTimes: defaultSunTimes,
    height: 120,
    minColumnWidth: 50,
    precipitationUnit: 'in',
    getTemperatureColor: createColorFnForDaily(rainyWeek),
  },
};

export const SnowyWeek: Story = {
  args: {
    forecast: snowyWeek,
    sunTimes: defaultSunTimes,
    height: 120,
    minColumnWidth: 50,
    precipitationUnit: 'in',
    getTemperatureColor: createColorFnForDaily(snowyWeek),
  },
};

export const VariableWeek: Story = {
  args: {
    forecast: variableWeek,
    sunTimes: defaultSunTimes,
    height: 120,
    minColumnWidth: 50,
    precipitationUnit: 'in',
    getTemperatureColor: createColorFnForDaily(variableWeek),
  },
};

export const ThreeDays: Story = {
  args: {
    forecast: threeDayForecast,
    sunTimes: defaultSunTimes,
    height: 120,
    minColumnWidth: 50,
    precipitationUnit: 'in',
    getTemperatureColor: createColorFnForDaily(threeDayForecast),
  },
};

export const TwoWeeks: Story = {
  args: {
    forecast: twoWeekForecast,
    sunTimes: defaultSunTimes,
    height: 120,
    minColumnWidth: 50,
    precipitationUnit: 'in',
    getTemperatureColor: createColorFnForDaily(twoWeekForecast),
  },
};

export const TallCanvas: Story = {
  args: {
    forecast: mixedWeek,
    sunTimes: defaultSunTimes,
    height: 180,
    minColumnWidth: 50,
    precipitationUnit: 'in',
    getTemperatureColor: createColorFnForDaily(mixedWeek),
  },
};

export const ShortCanvas: Story = {
  args: {
    forecast: mixedWeek,
    sunTimes: defaultSunTimes,
    height: 80,
    minColumnWidth: 50,
    precipitationUnit: 'in',
    getTemperatureColor: createColorFnForDaily(mixedWeek),
  },
};

export const MetricUnits: Story = {
  args: {
    forecast: rainyWeek,
    sunTimes: defaultSunTimes,
    height: 120,
    minColumnWidth: 50,
    precipitationUnit: 'mm',
    getTemperatureColor: createColorFnForDaily(rainyWeek),
  },
};

// ============================================================================
// All Scenarios Grid
// ============================================================================

const AllScenariosGrid = () => {
  const scenarios = [
    { title: 'Sunny Week (Hot)', data: sunnyWeekHot },
    { title: 'Mixed Weather', data: mixedWeek },
    { title: 'Rainy Week', data: rainyWeek },
    { title: 'Snowy Week', data: snowyWeek },
    { title: 'Variable Week', data: variableWeek },
    { title: 'Three Days', data: threeDayForecast },
    { title: 'Two Weeks', data: twoWeekForecast },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '2rem',
        padding: '2rem',
        background: '#0f0f1e',
      }}
    >
      {scenarios.map((scenario, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <h4
            style={{
              color: '#fff',
              fontSize: '14px',
              fontWeight: '600',
              margin: 0,
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            {scenario.title}
          </h4>
          <DailyChart
            forecast={scenario.data}
            sunTimes={defaultSunTimes}
            height={120}
            minColumnWidth={50}
            precipitationUnit="in"
            getTemperatureColor={createColorFnForDaily(scenario.data)}
          />
        </div>
      ))}
    </div>
  );
};

export const AllScenarios: Story = {
  render: AllScenariosGrid,
};

// ============================================================================
// Clickable Days + Detail Modal
// Mirrors the WeatherDisplay wiring: click a day column to open the modal
// (auto-dismisses after 2 minutes).
// ============================================================================

const ClickableDaysDemo = () => {
  const [selectedDay, setSelectedDay] = useState<WeatherForecast | null>(null);
  const getTemperatureColor = createColorFnForDaily(mixedWeek);

  return (
    <>
      <DailyChart
        forecast={mixedWeek}
        sunTimes={defaultSunTimes}
        height={120}
        minColumnWidth={50}
        precipitationUnit="in"
        getTemperatureColor={getTemperatureColor}
        onDayClick={setSelectedDay}
      />
      {selectedDay && (
        <DayDetailModal
          day={selectedDay}
          windSpeedUnit="mph"
          precipitationUnit="in"
          getTemperatureColor={getTemperatureColor}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </>
  );
};

export const ClickableDays: Story = {
  render: ClickableDaysDemo,
};
