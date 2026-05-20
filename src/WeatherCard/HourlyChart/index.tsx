// ============================================================================
// Weather Card 2 - New Hourly Weather Card
// A simplified hourly weather display component
// ============================================================================

import type { JSX } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import type { SunTimes, WeatherForecast } from '../WeatherContext';
import {
  createTemperaturePositioner,
  drawTemperatureLine,
  getWeatherIconForTime,
} from './canvasHelpers';
import { drawPrecipitation } from './precipitation';
import { applyTemperatureMask, drawClouds, drawSkyBackground, drawStars } from './sky';
import './styles'; // registers styles via css`` tagged template

// ============================================================================
// Types
// ============================================================================

export interface HourlyChartProps {
  forecast: WeatherForecast[];
  sunTimes: SunTimes;
  height?: number;
  pixelsPerDegree?: number;
  maxItems?: number;
  /** Adaptive temperature color function from context */
  getTemperatureColor: (temp: number) => string;
}

// ============================================================================
// Component
// ============================================================================

export function HourlyChart({
  forecast: inputForecast,
  sunTimes,
  height = 120,
  pixelsPerDegree = 3,
  maxItems = 12,
  getTemperatureColor,
}: HourlyChartProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const forecast = inputForecast.slice(0, maxItems);

  // Draw canvas when forecast or sunTimes change
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !forecast || forecast.length === 0) return;

    // Set canvas size to match container with device pixel ratio
    const updateCanvas = () => {
      const containerWidth = container.offsetWidth;
      // Skip draws when the container is laid out at 0px wide (hidden tab,
      // pre-layout) — drawImage on a 0-sized canvas throws InvalidStateError.
      if (containerWidth === 0 || height === 0) return;
      const dpr = window.devicePixelRatio || 1;

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

      // Draw layers in order
      drawSkyBackground(canvas, forecast, sunTimes);
      applyTemperatureMask(canvas, forecast, pixelsPerDegree);
      drawStars(canvas, forecast, sunTimes);
      drawClouds(canvas, forecast, sunTimes);
      drawTemperatureLine(canvas, forecast, pixelsPerDegree, getTemperatureColor);
      drawPrecipitation(canvas, forecast); // Drawn last so particles appear on top
    };

    updateCanvas();

    // Handle resize
    const resizeObserver = new ResizeObserver(updateCanvas);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [forecast, sunTimes, height, pixelsPerDegree, getTemperatureColor]);

  if (!forecast || forecast.length === 0) {
    return <div className="hourly-no-data">No forecast data available</div>;
  }

  return (
    <div ref={containerRef} className="hourly-chart-container">
      {/* Canvas with absolutely positioned labels */}
      <div>
        {/* Weather icons row above canvas */}
        <div className="hourly-icons-row">
          {(() => {
            // Get container width, use a default if not available yet
            const container = containerRef.current;
            const containerWidth = container?.offsetWidth || 400;

            // Group consecutive hours with the same condition
            const groups: Array<{
              startIndex: number;
              endIndex: number;
              condition: string | undefined;
            }> = [];
            let currentGroup: {
              startIndex: number;
              endIndex: number;
              condition: string | undefined;
            } | null = null;

            forecast.forEach((hour, index) => {
              // Skip first and last
              if (index === 0 || index === forecast.length - 1) return;

              if (!currentGroup || currentGroup.condition !== hour.condition) {
                // Start new group
                if (currentGroup) {
                  groups.push(currentGroup);
                }
                currentGroup = {
                  startIndex: index,
                  endIndex: index,
                  condition: hour.condition,
                };
              } else {
                // Extend current group
                currentGroup.endIndex = index;
              }
            });

            // Push the last group
            if (currentGroup) {
              groups.push(currentGroup);
            }

            // Find the smallest group width in pixels
            const smallestGroupWidth = Math.min(
              ...groups.map((group) => {
                const startX = group.startIndex / (forecast.length - 1);
                const endX = group.endIndex / (forecast.length - 1) + 1;
                return (endX - startX) * (containerWidth / forecast.length);
              }),
            );

            // Calculate icon size based on smallest group (max 1.125em)
            // Assume icons need ~24px at 1em font size, scale accordingly
            const maxSize = 1.125;
            const minSize = 0.5;
            const iconSize = Math.max(minSize, Math.min(maxSize, smallestGroupWidth / 24));

            // Render consolidated icons with lines
            return groups.map((group, groupIndex) => {
              // Use the middle hour of the group to determine day/night
              const middleIndex = Math.floor((group.startIndex + group.endIndex) / 2);
              const middleHour = forecast[middleIndex];
              const icon = getWeatherIconForTime(group.condition, middleHour.datetime, sunTimes);

              // Calculate positions
              const startX = (group.startIndex / (forecast.length - 1)) * 100;
              const endX = (group.endIndex / (forecast.length - 1)) * 100;
              const centerX = (startX + endX) / 2;

              // Only show line if group has multiple hours
              const showLine = group.startIndex !== group.endIndex;
              // Only show end tick if not the last group (and has multiple hours)
              const showEndTick = groupIndex < groups.length - 1 && showLine;

              return (
                <div key={groupIndex}>
                  {/* Horizontal line underneath the icons - only for multi-hour conditions */}
                  {showLine && (
                    <div
                      className="hourly-condition-line"
                      style={{
                        left: `${startX}%`,
                        right: `${100 - endX}%`,
                      }}
                    />
                  )}

                  {/* End tick mark - creates the gap between conditions */}
                  {showLine && (
                    <div
                      className="hourly-condition-tick"
                      style={{
                        left: `${startX}%`,
                      }}
                    />
                  )}
                  {showEndTick && (
                    <div
                      className="hourly-condition-tick"
                      style={{
                        left: `${endX}%`,
                      }}
                    />
                  )}
                  {/* Icon in the center */}
                  <ha-icon
                    icon={icon}
                    className="hourly-condition-icon"
                    style={{
                      left: `${centerX}%`,
                      '--mdc-icon-size': `${iconSize}em`,
                    }}
                  />
                </div>
              );
            });
          })()}
        </div>

        {/* Canvas for visualization */}
        <div className="hourly-canvas-wrapper">
          <canvas
            ref={canvasRef}
            className="hourly-canvas"
            style={{
              height: `${height}px`,
            }}
          />

          {/* Temperature labels overlay */}
          <div
            className="hourly-temp-overlay"
            style={{
              height: `${height}px`,
            }}
          >
            {(() => {
              // Use shared temperature positioner
              const { getTempY } = createTemperaturePositioner(forecast, height, pixelsPerDegree);

              return forecast.map((hour, index) => {
                if (index === 0 || index === forecast.length - 1) return null;
                const date = new Date(hour.datetime);
                const hourNum = date.getHours();

                // Skip first hour and only show labels for every 3rd hour
                if (index === 0 || hourNum % 3 !== 0) return null;

                const temp = hour.temperature ?? 0;
                const xPercent = (index / (forecast.length - 1)) * 100;

                // Calculate exact Y position using shared utility
                const lineY = getTempY(temp);

                return (
                  <div
                    key={index}
                    className="hourly-temp-label"
                    style={{
                      left: `${xPercent}%`,
                      top: `${lineY}px`,
                    }}
                  >
                    {Math.round(temp)}°
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Hour timeline below canvas */}
        <div className="hourly-timeline">
          {forecast.map((hour, index) => {
            if (index === 0 || index === forecast.length - 1) return null;
            const date = new Date(hour.datetime);
            const hourNum = date.getHours();
            const hour12 = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
            const xPercent = (index / (forecast.length - 1)) * 100;

            // Every 3rd hour shows number, others show tick mark
            if (hourNum % 3 === 0) {
              return (
                <div
                  key={index}
                  className="hourly-hour-label"
                  style={{
                    left: `${xPercent}%`,
                  }}
                >
                  {hour12}
                </div>
              );
            }
            return (
              <div
                key={index}
                className="hourly-hour-tick"
                style={{
                  left: `${xPercent}%`,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
