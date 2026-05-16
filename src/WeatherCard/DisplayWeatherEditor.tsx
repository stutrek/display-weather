import type { HomeAssistant } from 'preact-homeassistant';
import { useCallbackStable } from 'preact-homeassistant';
import { useEffect, useState } from 'preact/hooks';
import type { FontSize, WeatherConfig } from './WeatherContext';

// ============================================================================
// Types
// ============================================================================

interface EditorProps {
  hass: HomeAssistant;
  config: WeatherConfig;
  onConfigChanged: (config: WeatherConfig) => void;
}

// ============================================================================
// Editor Component
// ============================================================================

function WeatherEditorContent({ hass, config, onConfigChanged }: EditorProps) {
  const [entity, setEntity] = useState<string>(config.entity ?? '');
  const [forecastEntity, setForecastEntity] = useState<string>(config.forecast_entity ?? '');
  const [size, setSize] = useState<FontSize>(config.size ?? 'medium');

  // Get available weather entities from hass
  const weatherEntities = Object.keys(hass.states).filter((e) => e.startsWith('weather.'));

  // Sync with external config changes
  useEffect(() => {
    setEntity(config.entity ?? '');
    setForecastEntity(config.forecast_entity ?? '');
    setSize(config.size ?? 'medium');
  }, [config]);

  const fireConfigChanged = useCallbackStable(
    (newEntity: string, newForecastEntity: string, newSize: FontSize) => {
      if (!newEntity || !newEntity.startsWith('weather.')) {
        return; // Don't fire if no valid entity
      }

      const newConfig: WeatherConfig = {
        ...config,
        entity: newEntity as `weather.${string}`,
        size: newSize,
      };

      // Only include forecast_entity if it's different from entity
      if (newForecastEntity?.startsWith('weather.') && newForecastEntity !== newEntity) {
        newConfig.forecast_entity = newForecastEntity as `weather.${string}`;
      } else {
        newConfig.forecast_entity = undefined;
      }

      onConfigChanged(newConfig);
    },
  );

  const handleEntitySelect = useCallbackStable((e: Event) => {
    const target = e.target as HTMLSelectElement;
    setEntity(target.value);
    fireConfigChanged(target.value, forecastEntity, size);
  });

  const handleForecastEntitySelect = useCallbackStable((e: Event) => {
    const target = e.target as HTMLSelectElement;
    setForecastEntity(target.value);
    fireConfigChanged(entity, target.value, size);
  });

  const handleSizeSelect = useCallbackStable((e: Event) => {
    const target = e.target as HTMLSelectElement;
    const newSize = target.value as FontSize;
    setSize(newSize);
    fireConfigChanged(entity, forecastEntity, newSize);
  });

  return (
    <div class="editor">
      <style>{editorStyles}</style>

      <div class="section">
        <div class="section-header">
          <span>Weather Entity</span>
        </div>
        <ha-select
          label="Current Conditions"
          value={entity}
          naturalMenuWidth
          fixedMenuPosition
          onChange={handleEntitySelect}
          onclosed={(e: Event) => e.stopPropagation()}
        >
          <ha-list-item value="">Select weather entity...</ha-list-item>
          {weatherEntities.map((ent) => (
            <ha-list-item key={ent} value={ent}>
              {hass.states[ent]?.attributes?.friendly_name ?? ent}
            </ha-list-item>
          ))}
        </ha-select>
      </div>

      <div class="section">
        <div class="section-header">
          <span>Forecast Entity (optional)</span>
        </div>
        <p class="help-text">
          Use a different entity for forecasts. Leave empty to use the same entity.
        </p>
        <ha-select
          label="Forecast Source"
          value={forecastEntity}
          naturalMenuWidth
          fixedMenuPosition
          onChange={handleForecastEntitySelect}
          onclosed={(e: Event) => e.stopPropagation()}
        >
          <ha-list-item value="">Same as conditions</ha-list-item>
          {weatherEntities.map((ent) => (
            <ha-list-item key={ent} value={ent}>
              {hass.states[ent]?.attributes?.friendly_name ?? ent}
            </ha-list-item>
          ))}
        </ha-select>
      </div>

      <div class="section">
        <div class="section-header">
          <span>Appearance</span>
        </div>
        <ha-select
          label="Size"
          value={size}
          naturalMenuWidth
          fixedMenuPosition
          onChange={handleSizeSelect}
          onclosed={(e: Event) => e.stopPropagation()}
        >
          <ha-list-item value="small">Small</ha-list-item>
          <ha-list-item value="medium">Medium</ha-list-item>
          <ha-list-item value="large">Large</ha-list-item>
        </ha-select>
      </div>
    </div>
  );
}

const editorStyles = `
  .editor {
    padding: 16px;
  }
  
  .section {
    margin-bottom: 24px;
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    font-weight: 500;
    color: var(--primary-text-color);
  }
  
  .help-text {
    font-size: 12px;
    color: var(--secondary-text-color);
    margin: 0 0 8px 0;
  }
  
  ha-select {
    display: block;
  }
`;

export { WeatherEditorContent };
