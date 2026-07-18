// ============================================================================
// Daily Weather Chart
// Canvas-based daily forecast with temperature bars and precipitation
// ============================================================================

import type { JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { getWeatherIcon } from '../HourlyChart/canvasHelpers';
import type { SunTimes, WeatherForecast } from '../WeatherContext';
import { createBarPositioner, drawTemperatureBars } from './canvasHelpers';
import { drawPrecipitation } from './precipitation';
import './styles'; // registers styles via css`` tagged template

// ============================================================================
// Types
// ============================================================================

export interface DailyChartProps {
  forecast: WeatherForecast[];
  sunTimes: SunTimes;
  height?: number;
  minColumnWidth?: number;
  precipitationUnit?: string;
  /** Adaptive temperature color function from context */
  getTemperatureColor: (temp: number) => string;
  /** When provided, each day column becomes a click target */
  onDayClick?: (day: WeatherForecast) => void;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Format date to day name (Sun, Mon, etc.)
 */
function formatDay(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

/**
 * Format precipitation amount based on unit
 */
function formatPrecipitation(amount: number | undefined, unit: string): string {
  if (!amount || amount === 0) return '';
  if (unit === 'mm') {
    return `${Math.round(amount)}mm`;
  }
  // Default to inches
  return `${amount.toFixed(1)}"`;
}

// ============================================================================
// Component
// ============================================================================

export function DailyChart({
  forecast,
  sunTimes,
  height = 120,
  minColumnWidth = 50,
  precipitationUnit = 'in',
  getTemperatureColor,
  onDayClick,
}: DailyChartProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [actualColumnCount, setActualColumnCount] = useState<number>(7);

  // Draw canvas when forecast changes
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !forecast || forecast.length === 0) return;

    const updateCanvas = () => {
      const containerWidth = container.offsetWidth;
      const dpr = window.devicePixelRatio || 1;
      const columnCount = Math.max(
        1,
        Math.min(forecast.length, Math.floor(containerWidth / minColumnWidth)),
      );
      const columnWidth = containerWidth / columnCount;

      // Set CSS size (logical pixels)
      canvas.style.width = `${containerWidth}px`;
      canvas.style.height = `${height}px`;

      // Set actual canvas size (physical pixels)
      canvas.width = containerWidth * dpr;
      canvas.height = height * dpr;

      // Scale context to match device pixel ratio
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      // Update state so React overlays match
      setActualColumnCount(columnCount);

      // Draw layers (pass logical dimensions)
      drawTemperatureBars(
        canvas,
        forecast.slice(0, columnCount),
        columnWidth,
        height,
        getTemperatureColor,
      );
      drawPrecipitation(canvas, forecast.slice(0, columnCount), columnWidth, height);
    };

    updateCanvas();

    const resizeObserver = new ResizeObserver(updateCanvas);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [forecast, sunTimes, height, minColumnWidth, getTemperatureColor]);

  if (!forecast || forecast.length === 0) {
    return <div className="daily-no-data">No forecast data available</div>;
  }

  // Use the actual column count from canvas state
  const visibleForecast = forecast.slice(0, actualColumnCount);
  const columnWidth = 100 / actualColumnCount;

  // Create bar positioner for consistent positioning
  const barPositioner = createBarPositioner(visibleForecast, height);

  return (
    <div ref={containerRef} className="daily-chart-container">
      {/* Canvas with overlays */}
      <div>
        {/* Day labels */}
        <div className="daily-labels-row">
          {visibleForecast.map((day, index) => (
            <div
              key={index}
              className="daily-day-label"
              style={{
                flex: `0 0 ${columnWidth}%`,
              }}
            >
              {formatDay(day.datetime)}
            </div>
          ))}
        </div>

        {/* Weather icons */}
        <div className="daily-icons-row">
          {visibleForecast.map((day, index) => {
            const icon = getWeatherIcon(day.condition);
            return (
              <div
                key={index}
                className="daily-icon-cell"
                style={{
                  flex: `0 0 ${columnWidth}%`,
                }}
              >
                <ha-icon icon={icon} className="daily-weather-icon" />
              </div>
            );
          })}
        </div>

        {/* Precipitation amounts */}
        <div className="daily-precip-row">
          {visibleForecast.map((day, index) => {
            const precipText = formatPrecipitation(day.precipitation, precipitationUnit);
            return (
              <div
                key={index}
                className="daily-precip-cell"
                style={{
                  flex: `0 0 ${columnWidth}%`,
                }}
              >
                {precipText}
              </div>
            );
          })}
        </div>

        {/* Canvas with temperature bars and precipitation */}
        <div className="daily-canvas-container">
          <canvas
            ref={canvasRef}
            className="daily-canvas"
            style={{
              height: `${height}px`,
            }}
          />

          {/* Temperature labels overlay */}
          <div className="daily-temp-overlay">
            {visibleForecast.map((day, index) => {
              const highTemp = day.temperature ?? 0;
              const lowTemp = day.templow ?? 0;
              const xPercent = (index + 0.5) * columnWidth;

              // Calculate bar positions using shared positioner
              const barTop = barPositioner.getTempY(highTemp);
              const barBottom = barPositioner.getTempY(lowTemp);

              return (
                <div key={index}>
                  {/* High temp - sits atop the bar */}
                  <div
                    className="daily-temp-high"
                    style={{
                      left: `${xPercent}%`,
                      top: `${barTop}px`,
                    }}
                  >
                    {Math.round(highTemp)}°
                  </div>

                  {/* Low temp - sits below the bar */}
                  <div
                    className="daily-temp-low"
                    style={{
                      left: `${xPercent}%`,
                      top: `${barBottom}px`,
                    }}
                  >
                    {Math.round(lowTemp)}°
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Full-height click targets, one per column, laid over the whole chart */}
      {onDayClick && (
        <div className="daily-click-row">
          {visibleForecast.map((day, index) => (
            <button
              key={index}
              type="button"
              className="daily-click-target"
              style={{ flex: `0 0 ${columnWidth}%` }}
              aria-label={`${formatDay(day.datetime)} forecast details`}
              aria-haspopup="dialog"
              onClick={() => onDayClick(day)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
