import { createContext } from 'preact';
import type { ComponentChildren } from 'preact';
import {
  type SunEntity,
  type WeatherEntity,
  type WeatherForecast,
  useEntity,
  useHass,
  useWeatherForecast,
} from 'preact-homeassistant';
import { useContext, useMemo } from 'preact/hooks';
import {
  DEFAULT_TEMPERATURE_PALETTE,
  type TemperaturePalette,
  type TemperatureUnit,
  createAdaptiveTemperatureColorFn,
  getTemperatureColor as getFixedTemperatureColor,
} from './HourlyChart/colors';

// ============================================================================
// Types
// ============================================================================

export type FontSize = 'small' | 'medium' | 'large';

export interface WeatherConfig {
  entity: `weather.${string}`;
  forecast_entity?: `weather.${string}`;
  size?: FontSize;
  showCurrent?: boolean;
  showHourly?: boolean;
  showDaily?: boolean;
  hourlyHours?: 12 | 18 | 24;
  /** Colour scheme for the temperature bar. Defaults to 'ember'. */
  temperaturePalette?: TemperaturePalette;
}

export interface SunTimes {
  sunrise: Date | undefined;
  sunset: Date | undefined;
  dawn: Date | undefined;
  dusk: Date | undefined;
}

export interface WeatherContextValue {
  config: WeatherConfig;
  entity: WeatherEntity | undefined;
  hourlyForecast: WeatherForecast[] | undefined;
  dailyForecast: WeatherForecast[] | undefined;
  loading: boolean;
  windSpeedUnit: string;
  precipitationUnit: string;
  temperatureUnit: TemperatureUnit;
  sunTimes: SunTimes;
  latitude: number | undefined;
  /** Adaptive temperature color function based on forecast range */
  getTemperatureColor: (temp: number) => string;
}

// ============================================================================
// Context
// ============================================================================

const WeatherContext = createContext<WeatherContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

interface WeatherProviderProps {
  config: WeatherConfig;
  // For Storybook/testing: pass data directly
  entity?: WeatherEntity;
  hourlyForecast?: WeatherForecast[];
  dailyForecast?: WeatherForecast[];
  // For Storybook/testing: pass sun times and latitude directly
  sunTimes?: SunTimes;
  latitude?: number;
  // For Storybook/testing: override "now" so fixtures with fixed datetimes
  // aren't filtered out as past. Defaults to the real current time.
  currentTime?: Date;
  children: ComponentChildren;
}

export function WeatherProvider({
  config,
  entity: propEntity,
  hourlyForecast: propHourlyForecast,
  dailyForecast: propDailyForecast,
  sunTimes: propSunTimes,
  latitude: propLatitude,
  currentTime: propCurrentTime,
  children,
}: WeatherProviderProps) {
  // Use HAContext hooks to fetch data (only runs if inside HAProvider)
  let hookEntity: WeatherEntity | undefined;
  let hookHourlyForecast: WeatherForecast[] | undefined;
  let hookDailyForecast: WeatherForecast[] | undefined;
  let hookLoading = false;
  let windSpeedUnit = 'mph';
  let precipitationUnit = 'in';
  let hookSunTimes: SunTimes = {
    sunrise: undefined,
    sunset: undefined,
    dawn: undefined,
    dusk: undefined,
  };
  let hookLatitude: number | undefined;
  let configTemperatureUnit: TemperatureUnit | undefined;

  // Determine which entity to use for forecasts
  const forecastEntity = config.forecast_entity ?? config.entity;

  try {
    const { getHass } = useHass();
    const hass = getHass();
    windSpeedUnit = hass?.config?.unit_system?.wind_speed ?? 'mph';
    precipitationUnit = hass?.config?.unit_system?.accumulated_precipitation ?? 'in';
    configTemperatureUnit = hass?.config?.unit_system?.temperature as TemperatureUnit | undefined;
    hookLatitude = hass?.config?.latitude;

    // Current conditions from primary entity
    hookEntity = useEntity(config.entity);

    // Sun entity for sunrise/sunset times
    const sunEntity = useEntity('sun.sun') as SunEntity | undefined;
    if (sunEntity?.attributes) {
      const attrs = sunEntity.attributes;
      hookSunTimes = {
        sunrise: attrs.next_rising ? new Date(attrs.next_rising) : undefined,
        sunset: attrs.next_setting ? new Date(attrs.next_setting) : undefined,
        dawn: attrs.next_dawn ? new Date(attrs.next_dawn) : undefined,
        dusk: attrs.next_dusk ? new Date(attrs.next_dusk) : undefined,
      };
    }

    // Forecasts from forecast_entity (or primary entity if not specified)
    const hourlyResult = useWeatherForecast(forecastEntity, 'hourly');
    hookHourlyForecast = hourlyResult.forecast;
    hookLoading = hourlyResult.status === 'loading';

    const dailyResult = useWeatherForecast(forecastEntity, 'daily');
    hookDailyForecast = dailyResult.forecast;
    hookLoading = hookLoading || dailyResult.status === 'loading';
  } catch {
    // Not inside HAProvider - hooks will throw
    // This is expected when using prop data in Storybook
  }

  // Use prop data if provided, otherwise use hook data
  const entity = propEntity ?? hookEntity;
  const rawHourlyForecast = propHourlyForecast ?? hookHourlyForecast;
  const rawDailyForecast = propDailyForecast ?? hookDailyForecast;
  const loading = propEntity ? false : hookLoading;
  const sunTimes = propSunTimes ?? hookSunTimes;
  const latitude = propLatitude ?? hookLatitude;
  // `temperature_unit` is sent by HA on weather entities but isn't in the typed
  // attributes shape from preact-homeassistant. Access it through a narrow cast.
  const entityTemperatureUnit = (entity?.attributes as { temperature_unit?: string } | undefined)
    ?.temperature_unit as TemperatureUnit | undefined;
  const temperatureUnit: TemperatureUnit = entityTemperatureUnit ?? configTemperatureUnit ?? '°F';

  // Filter forecasts to show only future time periods
  const hourlyForecast = useMemo(() => {
    if (!rawHourlyForecast) return undefined;

    // Start from the next whole hour (not current hour)
    const now = propCurrentTime ?? new Date();
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1, 0, 0, 0);

    return rawHourlyForecast.filter((item) => {
      return new Date(item.datetime) >= nextHour;
    });
  }, [rawHourlyForecast, propCurrentTime]);

  const dailyForecast = useMemo(() => {
    if (!rawDailyForecast) return undefined;

    // Exclude dates before today (using start of day comparison)
    const now = propCurrentTime ?? new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return rawDailyForecast.filter((item) => {
      const itemDate = new Date(item.datetime);
      const itemStart = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
      return itemStart >= todayStart;
    });
  }, [rawDailyForecast, propCurrentTime]);

  // Create adaptive temperature color function based on all forecast data
  const palette = config.temperaturePalette ?? DEFAULT_TEMPERATURE_PALETTE;
  const getTemperatureColor = useMemo(() => {
    // Collect all temperatures from hourly and daily forecasts
    const allTemps: number[] = [];

    if (hourlyForecast) {
      hourlyForecast.forEach((item) => {
        if (item.temperature !== undefined) allTemps.push(item.temperature);
      });
    }

    if (dailyForecast) {
      dailyForecast.forEach((item) => {
        if (item.temperature !== undefined) allTemps.push(item.temperature);
        if (item.templow !== undefined) allTemps.push(item.templow);
      });
    }

    // If no temperature data, use fixed color function
    if (allTemps.length === 0) {
      return (t: number) => getFixedTemperatureColor(t, temperatureUnit, palette);
    }

    const minTemp = Math.min(...allTemps);
    const maxTemp = Math.max(...allTemps);

    // Create adaptive function with asymmetric padding (palette °F): expand the
    // cool end more than the warm end, so warm forecasts don't overshoot into
    // amber/scorched colours. Inputs are converted to °F inside the color fn.
    return createAdaptiveTemperatureColorFn(
      minTemp,
      maxTemp,
      { low: 12, high: 4 },
      temperatureUnit,
      palette,
    );
  }, [hourlyForecast, dailyForecast, temperatureUnit, palette]);

  const value = useMemo<WeatherContextValue>(() => {
    return {
      config,
      entity,
      hourlyForecast,
      dailyForecast,
      loading,
      windSpeedUnit,
      precipitationUnit,
      temperatureUnit,
      sunTimes,
      latitude,
      getTemperatureColor,
    };
  }, [
    config,
    entity,
    hourlyForecast,
    dailyForecast,
    loading,
    windSpeedUnit,
    precipitationUnit,
    temperatureUnit,
    sunTimes,
    latitude,
    getTemperatureColor,
  ]);

  return <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

export function useWeather(): WeatherContextValue {
  const context = useContext(WeatherContext);
  if (!context) {
    throw new Error('useWeather must be used within a WeatherProvider');
  }
  return context;
}

// Re-export types from HAContext for convenience
export type { WeatherEntity, WeatherForecast, ForecastType, SunEntity } from 'preact-homeassistant';
