import { HACard, registerPreactCard } from 'preact-homeassistant';
import { type WeatherConfig, WeatherProvider } from './WeatherContext';
import { WeatherDisplay } from './WeatherDisplay';
import './WeatherCard.styles'; // registers card styles
import { WeatherEditorContent } from './DisplayWeatherEditor';

// ============================================================================
// Types
// ============================================================================

interface CardConfig extends WeatherConfig {
  // Additional card config beyond WeatherConfig
}

// ============================================================================
// Preact Component
// ============================================================================

function WeatherCardContent({ config }: { config: CardConfig }) {
  const sizeClass = `size-${config.size ?? 'medium'}`;

  return (
    <WeatherProvider config={config}>
      <HACard class={sizeClass} align="top">
        <div class="card-content weather-card">
          <WeatherDisplay />
        </div>
      </HACard>
    </WeatherProvider>
  );
}

// ============================================================================
// Register
// ============================================================================

registerPreactCard<CardConfig>({
  type: 'display-weather',
  name: 'Display Weather',
  description: 'A weather card designed for wall-mounted displays',
  Component: WeatherCardContent,
  ConfigComponent: WeatherEditorContent,
  getStubConfig: () => ({ entity: '' as `weather.${string}`, size: 'medium' as const }),
});
