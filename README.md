# Display Weather

A Home Assistant custom card designed for wall-mounted displays. Shows current
conditions plus hourly and daily forecast charts.

## Features

- Current temperature, humidity, and conditions
- Hourly forecast chart with temperature gradient and precipitation
- Daily forecast chart
- Sky color rendering tied to sunrise/sunset
- Three sizes (small / medium / large)
- Bundles into a single `display-weather.js` for HACS distribution

## Install

### HACS (custom repository)

1. HACS → three-dot menu → **Custom repositories**.
2. Add `https://github.com/stutrek/display-weather`, category **Dashboard**.
3. Search "Display Weather", install, restart HA.

### Manual

1. Download `display-weather.js` from the [latest release](https://github.com/stutrek/display-weather/releases).
2. Copy to `config/www/`.
3. Add as a Lovelace resource (`/local/display-weather.js`, type JavaScript Module).
4. Restart HA.

## Configuration

```yaml
type: custom:display-weather
entity: weather.forecast_home
size: medium          # 'small' | 'medium' | 'large' (default 'medium')
forecastEntity: weather.forecast_home_hourly  # optional, defaults to entity
```

| Option | Type | Required | Description |
|---|---|---|---|
| `entity` | `weather.*` entity id | Yes | Weather entity for current conditions |
| `forecastEntity` | `weather.*` entity id | No | Separate entity for forecasts; defaults to `entity` |
| `size` | `'small' \| 'medium' \| 'large'` | No | Card size, default `medium` |

## Development

```bash
pnpm install      # uses sibling pnpm workspace if set up (see preact-homeassistant)
pnpm dev
pnpm storybook    # :6007
pnpm test
pnpm build        # produces dist/display-weather.js
pnpm lint
```

## Release

Tag a `v*` release on `main`. The workflow at `.github/workflows/release.yml`
builds and attaches `display-weather.js` to the GitHub Release. HACS reads
from that release asset.

## License

MIT
