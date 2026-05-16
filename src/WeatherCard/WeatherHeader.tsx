import type { WeatherEntity } from 'preact-homeassistant';
import { useEffect, useState } from 'preact/hooks';

// ============================================================================
// Weather Icons Mapping
// ============================================================================

const WEATHER_ICONS: Record<string, string> = {
  sunny: 'mdi:weather-sunny',
  'clear-night': 'mdi:weather-night',
  cloudy: 'mdi:weather-cloudy',
  partlycloudy: 'mdi:weather-partly-cloudy',
  'partlycloudy-night': 'mdi:weather-night-partly-cloudy',
  rainy: 'mdi:weather-rainy',
  pouring: 'mdi:weather-pouring',
  snowy: 'mdi:weather-snowy',
  'snowy-rainy': 'mdi:weather-snowy-rainy',
  fog: 'mdi:weather-fog',
  hail: 'mdi:weather-hail',
  lightning: 'mdi:weather-lightning',
  'lightning-rainy': 'mdi:weather-lightning-rainy',
  windy: 'mdi:weather-windy',
  'windy-variant': 'mdi:weather-windy-variant',
  exceptional: 'mdi:alert-circle-outline',
  clear: 'mdi:weather-sunny',
};

function getWeatherIcon(condition: string | undefined): string {
  if (!condition) return 'mdi:weather-cloudy';
  return WEATHER_ICONS[condition] ?? 'mdi:weather-cloudy';
}

// ============================================================================
// Helpers
// ============================================================================

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

/**
 * Format weather condition string to be human-readable, excluding "night" from output
 */
// function formatCondition(condition: string | undefined): string {
// 	if (!condition) return '';

// 	condition = condition.replace('partly', 'partly-');

// 	// Split on hyphens, filter out "night", capitalize each word, and join
// 	const words = condition
// 		.split('-')
// 		.filter(word => word !== 'night')
// 		.map(word => word.charAt(0).toUpperCase() + word.slice(1));

// 	return words.join(' ');
// }

/**
 * Get rotation style for wind arrow (pointing in direction wind is going TO)
 */
function getWindArrowRotation(bearing: number | undefined): string {
  if (bearing === undefined) return 'rotate(0deg)';
  return `rotate(${bearing + 180}deg)`;
}

// ============================================================================
// Components
// ============================================================================

function CurrentTime() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return <span class="weather-time">{formatTime(time)}</span>;
}

interface WeatherHeaderProps {
  entity: WeatherEntity;
  windSpeedUnit: string;
}

export function WeatherHeader({ entity, windSpeedUnit }: WeatherHeaderProps) {
  const attrs = entity.attributes;
  const condition = entity.state;
  const icon = getWeatherIcon(condition);
  const hasFeelsLike = attrs.apparent_temperature !== undefined;

  // const conditionText = formatCondition(condition);

  return (
    <div class="weather-header">
      {/* Top row: temp (with feels like), icon (with condition), time (with humidity/wind) */}
      <div class="weather-temp-section">
        <div>
          <div class="weather-temp-large">
            <div>
              {attrs.temperature !== undefined ? `${Math.round(attrs.temperature)}°` : '--'}
            </div>
          </div>
          {hasFeelsLike && (
            <span class="weather-feels-like">
              Feels like {Math.round(attrs.apparent_temperature!)}°
            </span>
          )}
        </div>
        <div class="weather-icon-section">
          <ha-icon icon={icon} class="weather-icon-large" />
          {/* <div class="weather-condition-text">
						{conditionText}
					</div> */}
        </div>
      </div>
      <div class="weather-time-section">
        <CurrentTime />
        <div class="weather-details">
          {/* Humidity / Dewpoint */}
          <div class="weather-detail-group">
            <ha-icon icon="mdi:water-percent" />
            <span class="detail-value">{attrs.humidity ?? '--'}%</span>
            <span class="detail-separator">/</span>
            <span class="detail-value">
              {attrs.dew_point !== undefined ? `${Math.round(attrs.dew_point)}°` : '--'}
            </span>
            <ha-icon icon="mdi:thermometer-water" />
          </div>

          {/* Wind */}
          <div class="weather-detail-group">
            <div class="wind-main">
              <ha-icon icon="mdi:weather-windy" />
              <span>
                <span class="detail-value">
                  {attrs.wind_speed !== undefined ? Math.round(attrs.wind_speed) : '--'}
                  {attrs.wind_gust_speed !== undefined && (
                    <span class="wind-gust">/{Math.round(attrs.wind_gust_speed)}</span>
                  )}
                </span>
                <span class="wind-unit"> {windSpeedUnit}</span>
              </span>
              <ha-icon
                icon="mdi:arrow-up"
                class="wind-arrow"
                style={{ transform: getWindArrowRotation(attrs.wind_bearing) }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
