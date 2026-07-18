import { useEffect } from 'preact/hooks';
import { getWeatherIcon } from './HourlyChart/canvasHelpers';
import type { WeatherForecast } from './WeatherContext';
import './DayDetailModal.styles'; // registers styles via css`` tagged template

// ============================================================================
// Types
// ============================================================================

interface DayDetailModalProps {
  day: WeatherForecast;
  windSpeedUnit: string;
  precipitationUnit: string;
  /** Adaptive temperature color function from context */
  getTemperatureColor: (temp: number) => string;
  onClose: () => void;
}

/** Auto-dismiss after 2 minutes so the wall display returns to the forecast. */
const AUTO_DISMISS_MS = 2 * 60 * 1000;

// ============================================================================
// Helpers
// ============================================================================

/**
 * Format date for the modal header (e.g. "Thursday, July 17")
 */
function formatDayTitle(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format weather condition string to be human-readable, excluding "night"
 * (e.g. "partlycloudy" -> "Partly Cloudy", "clear-night" -> "Clear")
 */
function formatCondition(condition: string | undefined): string {
  if (!condition) return '';
  return condition
    .replace('partly', 'partly-')
    .split('-')
    .filter((word) => word !== 'night')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Convert wind bearing in degrees to a cardinal direction (e.g. 225 -> "SW")
 */
function bearingToCardinal(bearing: number): string {
  const directions = [
    'N',
    'NNE',
    'NE',
    'ENE',
    'E',
    'ESE',
    'SE',
    'SSE',
    'S',
    'SSW',
    'SW',
    'WSW',
    'W',
    'WNW',
    'NW',
    'NNW',
  ];
  return directions[Math.round(bearing / 22.5) % 16];
}

/**
 * Format precipitation amount based on unit
 */
function formatPrecipitation(amount: number, unit: string): string {
  if (unit === 'mm') {
    return `${Math.round(amount)}mm`;
  }
  return `${amount.toFixed(1)}"`;
}

// ============================================================================
// Component
// ============================================================================

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div class="day-modal-row">
      <ha-icon icon={icon} />
      <span class="day-modal-label">{label}</span>
      <span class="day-modal-value">{value}</span>
    </div>
  );
}

export function DayDetailModal({
  day,
  windSpeedUnit,
  precipitationUnit,
  getTemperatureColor,
  onClose,
}: DayDetailModalProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [onClose]);

  const hasPrecip = (day.precipitation ?? 0) > 0;
  const hasPrecipChance = day.precipitation_probability !== undefined;

  return (
    // Reuse HA's own dialog chrome (scrim, header, close button, Escape
    // handling) instead of hand-rolling one. See display-calendar's
    // EventModal for the same pattern.
    <ha-adaptive-dialog open header-title={formatDayTitle(day.datetime)} onclosed={onClose}>
      <div class="day-modal-body">
        {/* Condition hero: icon, condition text, high/low temps */}
        <div class="day-modal-hero">
          <ha-icon icon={getWeatherIcon(day.condition)} class="day-modal-hero-icon" />
          <div>
            <div class="day-modal-condition">{formatCondition(day.condition)}</div>
            <div class="day-modal-temps">
              {day.temperature !== undefined && (
                <span style={{ color: getTemperatureColor(day.temperature) }}>
                  {Math.round(day.temperature)}°
                </span>
              )}
              {day.temperature !== undefined && day.templow !== undefined && (
                <span class="day-modal-temp-separator">/</span>
              )}
              {day.templow !== undefined && (
                <span style={{ color: getTemperatureColor(day.templow) }}>
                  {Math.round(day.templow)}°
                </span>
              )}
            </div>
          </div>
        </div>

        <div class="day-modal-details">
          {(hasPrecip || hasPrecipChance) && (
            <DetailRow
              icon="mdi:weather-pouring"
              label="Precipitation"
              value={[
                hasPrecip ? formatPrecipitation(day.precipitation!, precipitationUnit) : '',
                hasPrecipChance ? `${Math.round(day.precipitation_probability!)}% chance` : '',
              ]
                .filter(Boolean)
                .join(' · ')}
            />
          )}

          {day.humidity !== undefined && (
            <DetailRow
              icon="mdi:water-percent"
              label="Humidity"
              value={`${Math.round(day.humidity)}%`}
            />
          )}

          {day.wind_speed !== undefined && (
            <DetailRow
              icon="mdi:weather-windy"
              label="Wind"
              value={`${Math.round(day.wind_speed)} ${windSpeedUnit}${
                day.wind_bearing !== undefined ? ` ${bearingToCardinal(day.wind_bearing)}` : ''
              }`}
            />
          )}

          {day.cloud_coverage !== undefined && (
            <DetailRow
              icon="mdi:cloud-percent-outline"
              label="Cloud cover"
              value={`${Math.round(day.cloud_coverage)}%`}
            />
          )}

          {day.uv_index !== undefined && (
            <DetailRow icon="mdi:sun-wireless-outline" label="UV index" value={`${day.uv_index}`} />
          )}
        </div>
      </div>
    </ha-adaptive-dialog>
  );
}
