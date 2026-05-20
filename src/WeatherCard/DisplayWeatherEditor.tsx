import type { HomeAssistant } from 'preact-homeassistant';
import { useCallbackStable } from 'preact-homeassistant';
import type { WeatherConfig } from './WeatherContext';

interface EditorProps {
  hass: HomeAssistant;
  config: WeatherConfig;
  onConfigChanged: (config: WeatherConfig) => void;
}

// Use HA's modern <ha-form> with selectors. HA renders the right control for
// each field and themes it consistently. Avoid the older
// <ha-select>+<ha-list-item> pattern — current HA replaced ha-select's
// internals (ha-dropdown / wa-popup) and arbitrary list-item children no
// longer participate in selection.
const SCHEMA = [
  {
    name: 'entity',
    required: true,
    selector: { entity: { domain: 'weather' } },
  },
  {
    name: 'forecast_entity',
    selector: { entity: { domain: 'weather' } },
  },
  {
    name: 'size',
    selector: {
      select: {
        mode: 'dropdown',
        options: [
          { value: 'small', label: 'Small' },
          { value: 'medium', label: 'Medium' },
          { value: 'large', label: 'Large' },
        ],
      },
    },
  },
  { name: 'showCurrent', selector: { boolean: {} } },
  { name: 'showHourly', selector: { boolean: {} } },
  { name: 'showDaily', selector: { boolean: {} } },
] as const;

const LABELS: Record<string, string> = {
  entity: 'Current Conditions',
  forecast_entity: 'Forecast Source (optional)',
  size: 'Size',
  showCurrent: 'Show current conditions',
  showHourly: 'Show hourly forecast',
  showDaily: 'Show daily forecast',
};

const HELPER_TEXT: Record<string, string> = {
  forecast_entity: 'Use a different entity for forecasts. Leave empty to use the same entity.',
};

function WeatherEditorContent({ hass, config, onConfigChanged }: EditorProps) {
  const handleValueChanged = useCallbackStable((e: Event) => {
    const next = (e as CustomEvent).detail?.value as Partial<WeatherConfig> | undefined;
    if (!next?.entity?.startsWith('weather.')) return;

    const merged: WeatherConfig = {
      ...config,
      ...next,
      entity: next.entity as `weather.${string}`,
      // Drop forecast_entity when it's empty or equals the main entity.
      forecast_entity:
        next.forecast_entity && next.forecast_entity !== next.entity
          ? (next.forecast_entity as `weather.${string}`)
          : undefined,
      showCurrent: next.showCurrent !== false,
      showHourly: next.showHourly !== false,
      showDaily: next.showDaily !== false,
    };
    onConfigChanged(merged);
  });

  const computeLabel = useCallbackStable(
    (schema: { name: string }) => LABELS[schema.name] ?? schema.name,
  );

  const computeHelper = useCallbackStable(
    (schema: { name: string }) => HELPER_TEXT[schema.name] ?? '',
  );

  // Hydrate the toggle states so undefined-in-config (the default) renders as
  // on in the editor, matching what the card actually shows.
  const data = {
    ...config,
    showCurrent: config.showCurrent !== false,
    showHourly: config.showHourly !== false,
    showDaily: config.showDaily !== false,
  };

  return (
    <ha-form
      hass={hass}
      data={data}
      schema={SCHEMA}
      computeLabel={computeLabel}
      computeHelper={computeHelper}
      onvalue-changed={handleValueChanged}
    />
  );
}

export { WeatherEditorContent };
