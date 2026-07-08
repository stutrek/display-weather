import { type ComponentChildren, Fragment } from 'preact';
import { useCallbackStable } from 'preact-homeassistant';
import { useState } from 'preact/hooks';
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
    temperatureUnit,
  } = useWeather();

  const [forecastModalOpen, setForecastModalOpen] = useState(false);
  const closeForecastModal = useCallbackStable(() => setForecastModalOpen(false));

  if (loading && !entity) {
    return <div class="weather-loading">Loading weather...</div>;
  }

  if (!entity) {
    return <div class="weather-error">Weather entity not found</div>;
  }

  const showCurrent = config.showCurrent !== false;
  const showHourly = config.showHourly !== false && !!hourlyForecast;
  const showDaily = config.showDaily !== false && !!dailyForecast;

  // Current conditions is the only visible section: make it open a modal with
  // the forecast data that would otherwise have nowhere to show up.
  const forecastInModal = showCurrent && !showHourly && !showDaily;

  const hourlyNode = hourlyForecast && (
    <HourlyChart
      forecast={hourlyForecast}
      sunTimes={sunTimes}
      maxItems={config.hourlyHours ?? 12}
      height={80}
      getTemperatureColor={getTemperatureColor}
      temperatureUnit={temperatureUnit}
    />
  );

  const dailyNode = dailyForecast && (
    <DailyChart
      forecast={dailyForecast}
      sunTimes={sunTimes}
      precipitationUnit={precipitationUnit}
      height={100}
      getTemperatureColor={getTemperatureColor}
    />
  );

  const currentHeader = <WeatherHeader entity={entity} windSpeedUnit={windSpeedUnit} />;

  // Dividers only sit *between* visible sections, never leading or trailing.
  const sections: Array<{ key: string; node: ComponentChildren }> = [];
  if (showCurrent) {
    sections.push({
      key: 'current',
      node:
        forecastInModal && (hourlyNode || dailyNode) ? (
          <button
            type="button"
            class="weather-current-trigger"
            onClick={() => setForecastModalOpen(true)}
            aria-haspopup="dialog"
          >
            {currentHeader}
          </button>
        ) : (
          currentHeader
        ),
    });
  }
  if (showHourly) {
    sections.push({ key: 'hourly', node: hourlyNode });
  }
  if (showDaily) {
    sections.push({ key: 'daily', node: dailyNode });
  }

  return (
    <div class="weather-display">
      {sections.map((section, i) => (
        <Fragment key={section.key}>
          {i > 0 && <hr />}
          {section.node}
        </Fragment>
      ))}
      {forecastInModal && forecastModalOpen && (
        // Reuse HA's own dialog chrome (scrim, header, close button, Escape
        // handling) instead of hand-rolling one. See display-calendar's
        // EventModal for the same pattern.
        <ha-adaptive-dialog open header-title="Forecast" onclosed={closeForecastModal}>
          <div class="weather-forecast-modal-body">
            {hourlyNode}
            {hourlyNode && dailyNode && <hr />}
            {dailyNode}
          </div>
        </ha-adaptive-dialog>
      )}
    </div>
  );
}
