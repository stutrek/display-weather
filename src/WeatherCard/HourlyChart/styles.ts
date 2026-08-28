import { css } from 'preact-homeassistant';

export const hourlyChartStyles = css`
/* Hourly Chart Container */
.hourly-chart-container {
  position: relative;
  width: 100%;
  padding: 0 10px;
  box-sizing: border-box;
}

/* Content box inside the container padding; also the width measurement target. */
.hourly-chart-inner {
  width: 100%;
}

/* Weather Icons Row */
.hourly-icons-row {
  position: relative;
  width: 100%;
  height: 0.750em;
  margin-bottom: 0.125em;
}

.hourly-condition-line {
  position: absolute;
  bottom: 0;
  height: 0.0625em;
  background-color: var(--primary-text-color, #fff);
  opacity: 0.3;
}

.hourly-condition-tick {
  position: absolute;
  bottom: 0;
  width: 0.0625em;
  height: 0.375em;
  background-color: var(--primary-text-color, #fff);
  opacity: 0.3;
}

.hourly-condition-icon {
  position: absolute;
  bottom: -0.125em;
  color: var(--primary-text-color, #fff);
  transform: translateX(-50%);
}

/* Canvas Container */
.hourly-canvas-wrapper {
  position: relative;
}

.hourly-canvas {
  width: 100%;
  border-radius: 8px;
  display: block;
}

/* Temperature Labels Overlay */
.hourly-temp-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  pointer-events: none;
}

.hourly-temp-label {
  position: absolute;
  font-size: 0.75em;
  font-weight: 600;
  text-shadow: 0 0 0.2em var(--card-background-color, rgba(255,255,255,0.8)), 0 0 0.4em var(--card-background-color, rgba(255,255,255,0.6));
  white-space: nowrap;
  /* Centred on the temperature line so the number sits on the horizon. */
  transform: translate(-50%, -50%);
}

/* Hour Timeline */
.hourly-timeline {
  position: relative;
  width: 100%;
  height: 1em;
  margin-top: 0.0625em;
}

.hourly-hour-label {
  position: absolute;
  font-size: 0.75em;
  font-weight: 500;
  color: var(--primary-text-color, #fff);
  transform: translateX(-50%);
}

.hourly-hour-tick {
  position: absolute;
  top: 0.3125em;
  width: 0.0625em;
  height: 0.375em;
  background-color: var(--primary-text-color, #fff);
  transform: translateX(-50%);
}

/* No Data State */
.hourly-no-data {
  padding: 1rem;
  text-align: center;
  color: #888;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .hourly-chart-container *,
  .hourly-canvas-wrapper * {
    animation: none !important;
    transition: none !important;
  }
}
`;
