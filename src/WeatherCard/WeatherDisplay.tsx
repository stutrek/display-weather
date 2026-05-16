import { DailyChart } from './DailyChart';
import { HourlyChart } from './HourlyChart';
import { useWeather } from './WeatherContext';
import { WeatherHeader } from './WeatherHeader';

// ============================================================================
// Main Component
// ============================================================================

export function WeatherDisplay() {
  console.log('[WeatherDisplay] RENDER');
  const {
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

  return (
    <div class="weather-display">
      <WeatherHeader entity={entity} windSpeedUnit={windSpeedUnit} />

      <hr />

      {/* Visual hourly forecast chart */}
      {hourlyForecast && (
        <HourlyChart
          forecast={hourlyForecast}
          sunTimes={sunTimes}
          maxItems={20}
          height={80}
          getTemperatureColor={getTemperatureColor}
        />
      )}

      <hr />

      {/* Visual daily forecast chart */}
      {dailyForecast && (
        <DailyChart
          forecast={dailyForecast}
          sunTimes={sunTimes}
          precipitationUnit={precipitationUnit}
          height={100}
          getTemperatureColor={getTemperatureColor}
        />
      )}
    </div>
  );
}
