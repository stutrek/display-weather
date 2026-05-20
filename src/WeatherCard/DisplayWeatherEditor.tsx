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
] as const;

// Rendered outside ha-form so the three switches stack flush together
// instead of inheriting ha-form's per-row margins. Each entry's key matches
// the WeatherConfig field it toggles.
const SECTION_TOGGLES: Array<{ key: 'showCurrent' | 'showHourly' | 'showDaily'; label: string }> = [
  { key: 'showCurrent', label: 'Show current conditions' },
  { key: 'showHourly', label: 'Show hourly forecast' },
  { key: 'showDaily', label: 'Show daily forecast' },
];

const LABELS: Record<string, string> = {
  entity: 'Current Conditions',
  forecast_entity: 'Forecast Source (optional)',
  size: 'Size',
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
    };
    onConfigChanged(merged);
  });

  const handleToggle = useCallbackStable(
    (key: 'showCurrent' | 'showHourly' | 'showDaily', checked: boolean) => {
      onConfigChanged({ ...config, [key]: checked });
    },
  );

  const computeLabel = useCallbackStable(
    (schema: { name: string }) => LABELS[schema.name] ?? schema.name,
  );

  const computeHelper = useCallbackStable(
    (schema: { name: string }) => HELPER_TEXT[schema.name] ?? '',
  );

  return (
    <>
      <ha-form
        hass={hass}
        data={config}
        schema={SCHEMA}
        computeLabel={computeLabel}
        computeHelper={computeHelper}
        onvalue-changed={handleValueChanged}
      />
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: '8px' }}>
        {SECTION_TOGGLES.map(({ key, label }) => (
          <ha-formfield
            key={key}
            label={label}
            alignEnd
            spaceBetween
            style={{ display: 'flex', padding: '4px 0' }}
          >
            <ha-switch
              checked={config[key] !== false}
              onChange={(e: Event) => handleToggle(key, (e.target as HTMLInputElement).checked)}
            />
          </ha-formfield>
        ))}
      </div>
    </>
  );
}

export { WeatherEditorContent };
