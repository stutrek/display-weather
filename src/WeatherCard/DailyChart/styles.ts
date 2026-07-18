import { css } from 'preact-homeassistant';

export const dailyChartStyles = css`
/* Daily Chart Container */
.daily-chart-container {
  position: relative;
  width: 100%;
}

/* Day Labels Row */
.daily-labels-row {
  display: flex;
  width: 100%;
}

.daily-day-label {
  text-align: center;
  font-size: 0.75em;
  font-weight: 600;
  line-height: 1.2;
}

/* Weather Icons Row */
.daily-icons-row {
  display: flex;
  width: 100%;
  justify-content: space-around;
}

.daily-icon-cell {
  height: 1.25em;
  display: flex;
  justify-content: center;
  align-items: center;
}

.daily-weather-icon {
  --mdc-icon-size: 1em;
  color: var(--primary-text-color, #fff);
}

/* Precipitation Row */
.daily-precip-row {
  display: flex;
  width: 100%;
}

.daily-precip-cell {
  text-align: center;
  font-size: 0.625em;
  min-height: 0.625em;
}

/* Canvas Container */
.daily-canvas-container {
  position: relative;
  width: 100%;
}

.daily-canvas {
  width: 100%;
  border-radius: 8px;
  display: block;
}

/* Temperature Labels Overlay */
.daily-temp-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.daily-temp-high {
  position: absolute;
  font-size: 0.75em;
  font-weight: 600;
  text-shadow: 0 0 0.2em var(--card-background-color, rgba(255,255,255,0.8)), 0 0 0.4em var(--card-background-color, rgba(255,255,255,0.6));
  padding-bottom: 0.125em;
  transform: translate(-50%, -100%);
}

.daily-temp-low {
  position: absolute;
  font-size: 0.75em;
  font-weight: 600;
  text-shadow: 0 0 0.2em var(--card-background-color, rgba(255,255,255,0.8)), 0 0 0.4em var(--card-background-color, rgba(255,255,255,0.6));
  padding-top: 0.125em;
  transform: translateX(-50%);
}

/* Per-day click targets (only rendered when the chart has an onDayClick) */
.daily-click-row {
  position: absolute;
  inset: 0;
  display: flex;
}

.daily-click-target {
  all: unset;
  cursor: pointer;
  border-radius: 8px;
}

/* No Data State */
.daily-no-data {
  padding: 1rem;
  text-align: center;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .daily-chart-container *,
  .daily-canvas-container * {
    animation: none !important;
    transition: none !important;
  }
}
`;
