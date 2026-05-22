import { type ComponentChildren, Fragment } from 'preact';
import { DailyChart } from './DailyChart';
import { HourlyChart } from './HourlyChart';
import { useWeather } from './WeatherContext';
import { WeatherHeader } from './WeatherHeader';

// ============================================================================
// Main Component
// ============================================================================

export function WeatherDisplay() {
  const {
    config,
    entity,
    hourlyForecast,
    dailyForecast,
    loading,
    windSpeedUnit,
    precipitationUnit,
    sunTimes,
    getTemperatureColor,
  } = useWeather();

  if (loading && !entity) {
    return <div class="weather-loading">Loading weather...</div>;
  }

  if (!entity) {
    return <div class="weather-error">Weather entity not found</div>;
  }

  const showCurrent = config.showCurrent !== false;
  const showHourly = config.showHourly !== false && !!hourlyForecast;
  const showDaily = config.showDaily !== false && !!dailyForecast;

  // Dividers only sit *between* visible sections, never leading or trailing.
  const sections: Array<{ key: string; node: ComponentChildren }> = [];
  if (showCurrent) {
    sections.push({
      key: 'current',
      node: <WeatherHeader entity={entity} windSpeedUnit={windSpeedUnit} />,
    });
  }
  if (showHourly && hourlyForecast) {
    sections.push({
      key: 'hourly',
      node: (
        <HourlyChart
          forecast={hourlyForecast}
          sunTimes={sunTimes}
          maxItems={config.hourlyHours ?? 12}
          height={80}
          getTemperatureColor={getTemperatureColor}
        />
      ),
    });
  }
  if (showDaily && dailyForecast) {
    sections.push({
      key: 'daily',
      node: (
        <DailyChart
          forecast={dailyForecast}
          sunTimes={sunTimes}
          precipitationUnit={precipitationUnit}
          height={100}
          getTemperatureColor={getTemperatureColor}
        />
      ),
    });
  }

  return (
    <div class="weather-display">
      {sections.map((section, i) => (
        <Fragment key={section.key}>
          {i > 0 && <hr />}
          {section.node}
        </Fragment>
      ))}
    </div>
  );
}
