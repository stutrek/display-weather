import { css } from 'preact-homeassistant';

export const weatherCardStyles = css`
:host {
  display: block;
}

.weather-card {
  container-type: inline-size;
  color: var(--primary-text-color, #fff);
  font-family: system-ui, -apple-system, sans-serif;
  padding: 0.5em 1em 0.5em;
}

ha-card.size-small {
  font-size: 14px;
}

ha-card.size-medium {
  font-size: 17.5px;
}

ha-card.size-large {
  font-size: 21px;
}

.weather-loading,
.weather-error {
  text-align: center;
  padding: 2rem;
  color: var(--secondary-text-color, #888);
}

.weather-display hr {
  border-top: 1px solid var(--divider-color, rgba(255, 255, 255, 0.1));
  margin: 0.5em 0;
}

/* Header: absolute positioning for all elements */
.weather-header {
  position: relative;
  margin-top: 0.25em;
  min-height: 4em; /* Adjust based on your needs */
  display: flex;
  flex-direction: row;
  align-items: space-between;
}

.weather-header-top {
  position: relative;
  width: 100%;
  height: 100%;
}

.weather-temp-section {
  display: flex;
}

.weather-temp-large {
  font-size: 3em;
  font-weight: 300;
  line-height: 1;
}

.weather-feels-like {
  white-space: nowrap;
  font-size: 0.625em;
  color: var(--secondary-text-color, #aaa);
  display: flex;
  align-items: center;
  gap: 0.25em;
}

.weather-icon-section {
}

.weather-icon-large {
  --mdc-icon-size: 3em;
  color: var(--primary-color, #f59e0b);
}

.weather-condition-text {

  font-size: 0.625em;
  color: var(--secondary-text-color, #aaa);
  white-space: nowrap;
}

.weather-time-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.125em;
  line-height: 1.1;
}

.weather-time {
  font-size: 1.25em;
  text-align: right;
}

/* Details: humidity and wind side by side under time */
.weather-details {
  font-size: 0.75em;
}

/* Humidity / Dewpoint group */
.weather-detail-group {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.25em;
  margin-top: 0.25em;
}

.weather-detail-group ha-icon {
  --mdc-icon-size: 1.25em;
  color: var(--secondary-text-color, #aaa);
}

.detail-value {
  font-size: 1em;
  font-weight: 500;
}

.detail-separator {
  color: var(--secondary-text-color, #aaa);
  margin: 0 0.125em;
}

/* Wind section */
.weather-detail-wind {
  display: flex;
  align-items: center;
}

.wind-main {
  display: flex;
  align-items: center;
  gap: 0.25em;
}

.wind-main ha-icon {
  --mdc-icon-size: 1.25em;
  color: var(--secondary-text-color, #aaa);
}

.wind-arrow {
  --mdc-icon-size: 1em;
  transition: transform 0.3s ease;
}

.wind-unit {
  font-size: 0.625em;
  color: var(--secondary-text-color, #aaa);
}

.wind-gust {
  font-size: 0.875em;
  color: var(--secondary-text-color, #aaa);
}

/* Forecast sections - both horizontal, fill width */
.forecast-section {
  display: flex;
  flex-direction: column;
}

.forecast-row {
  display: flex;
  justify-content: space-between;
  gap: 0.25em;
  overflow: hidden;
}

.forecast-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.125em;
  flex: 1 1 0;
  min-width: 0;
  padding: 0.375em 0.25em;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.forecast-item-daily {
  /* Daily items can be slightly taller */
}

.forecast-time {
  font-size: 0.625em;
  color: var(--secondary-text-color, #aaa);
  white-space: nowrap;
}

.forecast-icon {
  --mdc-icon-size: 1.25em;
  color: var(--primary-color, #f59e0b);
}

.forecast-temp {
  font-size: 0.875em;
  font-weight: 500;
}

.forecast-temps {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.2;
}

.forecast-temp-low {
  font-size: 0.75em;
  color: var(--secondary-text-color, #aaa);
}

.forecast-precip {
  font-size: 0.625em;
  color: var(--info-color, #3b82f6);
}

/* Hourly Chart */
.hourly-chart {
  border-radius: 8px;
  overflow: hidden;
  margin: 0.25em 0;
  font-size: inherit;
}

/* Daily Chart */
.daily-chart {
  border-radius: 8px;
  overflow: hidden;
  margin: 0.25em 0;
  font-size: inherit;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .hourly-chart *,
  .daily-chart * {
    animation: none !important;
    transition: none !important;
  }
}

/* Compressed / half-width: stack left and right sections */
@container (max-width: 240px) {
  .weather-header {
    flex-direction: column;
    gap: 0.5em;
    padding-bottom: 0.5em;
  }

  .weather-time-section {
    align-items: flex-start;
  }

  .weather-detail-group {
    justify-content: flex-start;
  }
}
`;
