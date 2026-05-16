import type { Meta, StoryObj } from '@storybook/preact-vite';
import { getAllStyles } from 'preact-homeassistant';
import { HourlyChart, type HourlyChartProps } from '../WeatherCard/HourlyChart';
import { createAdaptiveTemperatureColorFn } from '../WeatherCard/HourlyChart/colors';
import type { WeatherForecast } from '../WeatherCard/WeatherContext';
// Import component styles to register them
import '../WeatherCard/HourlyChart/styles';
import * as samples from './hourlyWeatherSamples';

// Helper to create color function from sample data
function createColorFnForSample(data: WeatherForecast[] | undefined) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return createAdaptiveTemperatureColorFn(50, 70, 10);
  }
  const temps = data.map((d) => d.temperature ?? 70);
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  return createAdaptiveTemperatureColorFn(min, max, 10);
}

// Helper to get sun times for a forecast (extracts date from first entry)
function getSunTimesForForecast(forecast: WeatherForecast[] | undefined) {
  if (!forecast || forecast.length === 0) {
    return samples.defaultSunTimes;
  }
  const firstDate = new Date(forecast[0].datetime);
  const dateString = firstDate.toISOString().split('T')[0]; // Get YYYY-MM-DD
  return samples.calculateSunTimes(dateString, 40);
}

// ============================================================================
// Meta Configuration
// ============================================================================

const meta: Meta<typeof HourlyChart> = {
  title: 'Weather/HourlyCard2',
  component: HourlyChart,
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#0d0d0d' }],
    },
  },
  decorators: [
    (Story) => (
      <>
        <style>{getAllStyles()}</style>
        <style>{`
          :root {
            --primary-text-color: #000;
            --card-background-color: rgba(255, 255, 255, 0.1);
            --ha-card-background: #1c1c1c;
            font-family: system-ui, -apple-system, sans-serif;
          }
        `}</style>
        <Story />
      </>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof HourlyChart>;

// Extract props type from component
type HourlyChartStoryArgs = Parameters<typeof HourlyChart>[0];

// ============================================================================
// Wrapper Component
// ============================================================================

function HourlyChartWrapper(props: HourlyChartProps) {
  return (
    <div style={{ width: '400px', padding: '1rem' }} onClick={() => console.log(props.forecast)}>
      <HourlyChart {...props} />
    </div>
  );
}

// ============================================================================
// Pattern Grid Component - Shows all 6 seasons for a pattern
// ============================================================================

interface PatternGridProps {
  pattern: Record<string, WeatherForecast[]>;
  patternName: string;
}

function PatternGrid({ pattern, patternName }: PatternGridProps) {
  const seasons = ['winter', 'earlySpring', 'lateSpring', 'summer', 'earlyFall', 'lateFall'];
  const seasonLabels: Record<string, string> = {
    winter: 'Winter (25-38°F)',
    earlySpring: 'Early Spring (40-55°F)',
    lateSpring: 'Late Spring (55-70°F)',
    summer: 'Summer (75-90°F)',
    earlyFall: 'Early Fall (60-75°F)',
    lateFall: 'Late Fall (38-50°F)',
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
        gap: '1.5rem',
        padding: '2rem',
        maxWidth: '1800px',
      }}
    >
      {seasons.map((season) => {
        const data = pattern[season];
        return (
          <div key={season} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <h4
              style={{
                margin: 0,
                color: '#fff',
                fontSize: '0.9rem',
                fontWeight: '600',
                textAlign: 'center',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              {patternName} - {seasonLabels[season]}
            </h4>
            <div style={{ width: '400px' }} onClick={() => console.log(data)}>
              <HourlyChart
                forecast={data}
                sunTimes={getSunTimesForForecast(data)}
                getTemperatureColor={createColorFnForSample(data)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// All Patterns Grid - Shows all 10 patterns at once (one season)
// ============================================================================

interface AllPatternsGridProps {
  season: 'winter' | 'earlySpring' | 'lateSpring' | 'summer' | 'earlyFall' | 'lateFall';
}

function AllPatternsGrid({ season }: AllPatternsGridProps) {
  const patterns = [
    { name: 'Building Storm', data: samples.buildingStorm },
    { name: 'Fog & Thunderstorm', data: samples.fogAndThunderstorm },
    { name: 'Rainy Morning', data: samples.rainyMorning },
    { name: 'Drizzle & Thunderstorms', data: samples.drizzleAndThunderstorms },
    { name: 'Perfect Clear', data: samples.perfectClear },
    { name: 'Winter Snow', data: samples.winterSnow },
    { name: 'Cold Front', data: samples.coldFront },
    { name: 'Marine Layer', data: samples.marineLayer },
    { name: 'All-Day Overcast', data: samples.allDayOvercast },
    { name: 'Overnight Snow Clearing', data: samples.overnightSnowClearing },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
        gap: '1.5rem',
        padding: '2rem',
        maxWidth: '1800px',
      }}
    >
      {patterns.map(({ name, data }) => {
        const forecast = data[season];
        return (
          <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <h4
              style={{
                margin: 0,
                color: '#fff',
                fontSize: '0.9rem',
                fontWeight: '600',
                textAlign: 'center',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              {name}
            </h4>
            <div style={{ width: '400px' }} onClick={() => console.log(forecast)}>
              <HourlyChart
                forecast={forecast}
                sunTimes={getSunTimesForForecast(forecast)}
                getTemperatureColor={createColorFnForSample(forecast)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Stories - By Season (All 10 Patterns)
// ============================================================================

export const WinterAllPatterns: Story = {
  name: '❄️ Winter - All Patterns',
  render: () => <AllPatternsGrid season="winter" />,
  parameters: { layout: 'fullscreen' },
};

export const EarlySpringAllPatterns: Story = {
  name: '🌱 Early Spring - All Patterns',
  render: () => <AllPatternsGrid season="earlySpring" />,
  parameters: { layout: 'fullscreen' },
};

export const LateSpringAllPatterns: Story = {
  name: '🌸 Late Spring - All Patterns',
  render: () => <AllPatternsGrid season="lateSpring" />,
  parameters: { layout: 'fullscreen' },
};

export const SummerAllPatterns: Story = {
  name: '☀️ Summer - All Patterns',
  render: () => <AllPatternsGrid season="summer" />,
  parameters: { layout: 'fullscreen' },
};

export const EarlyFallAllPatterns: Story = {
  name: '🍂 Early Fall - All Patterns',
  render: () => <AllPatternsGrid season="earlyFall" />,
  parameters: { layout: 'fullscreen' },
};

export const LateFallAllPatterns: Story = {
  name: '🍁 Late Fall - All Patterns',
  render: () => <AllPatternsGrid season="lateFall" />,
  parameters: { layout: 'fullscreen' },
};

// ============================================================================
// Stories - By Pattern (All 6 Seasons)
// ============================================================================

export const BuildingStormAllSeasons: Story = {
  name: '⛈️ Building Storm - All Seasons',
  render: () => <PatternGrid pattern={samples.buildingStorm} patternName="Building Storm" />,
  parameters: { layout: 'fullscreen' },
};

export const FogAndThunderstormAllSeasons: Story = {
  name: '🌫️ Fog & Thunderstorm - All Seasons',
  render: () => (
    <PatternGrid pattern={samples.fogAndThunderstorm} patternName="Fog & Thunderstorm" />
  ),
  parameters: { layout: 'fullscreen' },
};

export const RainyMorningAllSeasons: Story = {
  name: '🌧️ Rainy Morning - All Seasons',
  render: () => <PatternGrid pattern={samples.rainyMorning} patternName="Rainy Morning" />,
  parameters: { layout: 'fullscreen' },
};

export const DrizzleAndThunderstormsAllSeasons: Story = {
  name: '🌦️ Drizzle & Thunderstorms - All Seasons',
  render: () => (
    <PatternGrid pattern={samples.drizzleAndThunderstorms} patternName="Drizzle & Thunderstorms" />
  ),
  parameters: { layout: 'fullscreen' },
};

export const PerfectClearAllSeasons: Story = {
  name: '☀️ Perfect Clear - All Seasons',
  render: () => <PatternGrid pattern={samples.perfectClear} patternName="Perfect Clear" />,
  parameters: { layout: 'fullscreen' },
};

export const WinterSnowAllSeasons: Story = {
  name: '❄️ Winter Snow - All Seasons',
  render: () => <PatternGrid pattern={samples.winterSnow} patternName="Winter Snow" />,
  parameters: { layout: 'fullscreen' },
};

export const ColdFrontAllSeasons: Story = {
  name: '🌬️ Cold Front - All Seasons',
  render: () => <PatternGrid pattern={samples.coldFront} patternName="Cold Front" />,
  parameters: { layout: 'fullscreen' },
};

export const MarineLayerAllSeasons: Story = {
  name: '🌫️ Marine Layer - All Seasons',
  render: () => <PatternGrid pattern={samples.marineLayer} patternName="Marine Layer" />,
  parameters: { layout: 'fullscreen' },
};

export const AllDayOvercastAllSeasons: Story = {
  name: '☁️ All-Day Overcast - All Seasons',
  render: () => <PatternGrid pattern={samples.allDayOvercast} patternName="All-Day Overcast" />,
  parameters: { layout: 'fullscreen' },
};

export const OvernightSnowClearingAllSeasons: Story = {
  name: '🌨️ Overnight Snow Clearing - All Seasons',
  render: () => (
    <PatternGrid pattern={samples.overnightSnowClearing} patternName="Overnight Snow Clearing" />
  ),
  parameters: { layout: 'fullscreen' },
};

// ============================================================================
// Individual Stories (for detailed viewing)
// ============================================================================

export const BuildingStormSummer: Story = {
  name: '⛈️ Building Storm - Summer',
  render: (args) => <HourlyChartWrapper {...(args as unknown as HourlyChartStoryArgs)} />,
  args: {
    forecast: samples.buildingStorm.summer,
    sunTimes: getSunTimesForForecast(samples.buildingStorm.summer),
    getTemperatureColor: createColorFnForSample(samples.buildingStorm.summer),
  },
};

export const FogAndThunderstormSummer: Story = {
  name: '🌫️ Fog & Thunderstorm - Summer',
  render: (args) => <HourlyChartWrapper {...(args as unknown as HourlyChartStoryArgs)} />,
  args: {
    forecast: samples.fogAndThunderstorm.summer,
    sunTimes: getSunTimesForForecast(samples.fogAndThunderstorm.summer),
    getTemperatureColor: createColorFnForSample(samples.fogAndThunderstorm.summer),
  },
};

export const RainyMorningFall: Story = {
  name: '🌧️ Rainy Morning - Fall',
  render: (args) => <HourlyChartWrapper {...(args as unknown as HourlyChartStoryArgs)} />,
  args: {
    forecast: samples.rainyMorning.earlyFall,
    sunTimes: getSunTimesForForecast(samples.rainyMorning.earlyFall),
    getTemperatureColor: createColorFnForSample(samples.rainyMorning.earlyFall),
  },
};

export const DrizzleAndThunderstormsSummer: Story = {
  name: '🌦️ Drizzle & Thunderstorms - Summer',
  render: (args) => <HourlyChartWrapper {...(args as unknown as HourlyChartStoryArgs)} />,
  args: {
    forecast: samples.drizzleAndThunderstorms.summer,
    sunTimes: getSunTimesForForecast(samples.drizzleAndThunderstorms.summer),
    getTemperatureColor: createColorFnForSample(samples.drizzleAndThunderstorms.summer),
  },
};

export const PerfectClearSummer: Story = {
  name: '☀️ Perfect Clear - Summer',
  render: (args) => <HourlyChartWrapper {...(args as unknown as HourlyChartStoryArgs)} />,
  args: {
    forecast: samples.perfectClear.summer,
    sunTimes: getSunTimesForForecast(samples.perfectClear.summer),
    getTemperatureColor: createColorFnForSample(samples.perfectClear.summer),
  },
};

export const WinterSnowWinter: Story = {
  name: '❄️ Winter Snow - Winter',
  render: (args) => <HourlyChartWrapper {...(args as unknown as HourlyChartStoryArgs)} />,
  args: {
    forecast: samples.winterSnow.winter,
    sunTimes: getSunTimesForForecast(samples.winterSnow.winter),
    getTemperatureColor: createColorFnForSample(samples.winterSnow.winter),
  },
};

export const ColdFrontSpring: Story = {
  name: '🌬️ Cold Front - Spring',
  render: (args) => <HourlyChartWrapper {...(args as unknown as HourlyChartStoryArgs)} />,
  args: {
    forecast: samples.coldFront.lateSpring,
    sunTimes: getSunTimesForForecast(samples.coldFront.lateSpring),
    getTemperatureColor: createColorFnForSample(samples.coldFront.lateSpring),
  },
};

export const MarineLayerSummer: Story = {
  name: '🌫️ Marine Layer - Summer',
  render: (args) => <HourlyChartWrapper {...(args as unknown as HourlyChartStoryArgs)} />,
  args: {
    forecast: samples.marineLayer.summer,
    sunTimes: getSunTimesForForecast(samples.marineLayer.summer),
    getTemperatureColor: createColorFnForSample(samples.marineLayer.summer),
  },
};

export const AllDayOvercastFall: Story = {
  name: '☁️ All-Day Overcast - Fall',
  render: (args) => <HourlyChartWrapper {...(args as unknown as HourlyChartStoryArgs)} />,
  args: {
    forecast: samples.allDayOvercast.lateFall,
    sunTimes: getSunTimesForForecast(samples.allDayOvercast.lateFall),
    getTemperatureColor: createColorFnForSample(samples.allDayOvercast.lateFall),
  },
};

export const OvernightSnowClearingWinter: Story = {
  name: '🌨️ Overnight Snow Clearing - Winter',
  render: (args) => <HourlyChartWrapper {...(args as unknown as HourlyChartStoryArgs)} />,
  args: {
    forecast: samples.overnightSnowClearing.winter,
    sunTimes: getSunTimesForForecast(samples.overnightSnowClearing.winter),
    getTemperatureColor: createColorFnForSample(samples.overnightSnowClearing.winter),
  },
};
