---
name: ha-types
description: Find TypeScript types for Home Assistant entities, services, and websocket payloads. Trigger when adding a new entity domain, looking up service signatures, or debugging an entity attribute shape.
---

# Finding Home Assistant types

Home Assistant doesn't publish a single canonical TypeScript types package. The
types you need live across three places, ordered roughly from "loose" to
"strict":

## 1. `home-assistant-js-websocket` (npm) — loose

```ts
import type {
  HassEntity,
  HassEntityBase,
  HassEntityAttributeBase,
  HassServices,
  HassConfig,
  Connection,
} from 'home-assistant-js-websocket';
```

- `HassEntity` has `entity_id`, `state`, `attributes` (untyped Record), `last_changed`, `last_updated`, `context`.
- `attributes` is essentially `Record<string, any>` — fine for prototyping, not great for strict cards.

Use this as the fallback. Most domains will start here.

## 2. `preact-homeassistant`'s `src/types/` — strict, curated

```ts
import type { CalendarEntity, WeatherEntity, SunEntity } from 'preact-homeassistant';
```

These are hand-curated. `useEntity('calendar.foo')` and `useEntity('weather.foo')`
return strict types automatically via `EntityForId<T>`.

**If your card needs a strict type for a domain that isn't covered**, the source
of truth is the HA frontend repo (see next section). Add a file to
`preact-homeassistant/src/types/<domain>.ts` and PR it.

## 3. `home-assistant/frontend` — source of truth for domain types

Most HA domains have a TypeScript file in the frontend repo with hand-written
types matching the entity shape:

```
github.com/home-assistant/frontend/blob/dev/src/data/<domain>.ts
```

Examples:
- Weather: `src/data/weather.ts`
- Calendar: `src/data/calendar.ts`
- Light: `src/data/light.ts`
- Climate: `src/data/climate.ts`
- Cover: `src/data/cover.ts`
- Media player: `src/data/media-player.ts`

Fetch the raw file:

```bash
gh api repos/home-assistant/frontend/contents/src/data/weather.ts \
  --jq '.content' | base64 -d
```

or just browse to the file on GitHub. Mirror the fields you actually use into
a new `preact-homeassistant/src/types/<domain>.ts`. Don't try to copy the whole
file — these files include UI helpers, constants, supportsFeature bitmasks, etc.
You only need the entity interface and any value types.

## 4. Service signatures — `home-assistant/core`

Service definitions live in the core repo:

```
github.com/home-assistant/core/blob/dev/homeassistant/components/<domain>/services.yaml
```

This is YAML, not TypeScript, but it's the authoritative source for what fields
a service accepts.

## 5. Runtime introspection (when docs lie)

The fastest way to see the actual shape of an entity in a running HA instance:

```bash
curl -H "Authorization: Bearer $HA_TOKEN" \
  https://homeassistant.local/api/states/sensor.your_thing
```

Or in the browser dev console while looking at the dashboard:

```js
window.hass.states['sensor.your_thing']
window.hass.services.weather
```

The dev-tools "Templates" tab in HA also lets you inspect entity state shapes.

## Quick decision tree

1. Loose typing OK for now? → `HassEntity` from `home-assistant-js-websocket`.
2. Already in `preact-homeassistant/src/types/`? → import from there.
3. Listed in `home-assistant/frontend/src/data/<domain>.ts`? → copy the interface, PR a new types file to `preact-homeassistant`.
4. Not in frontend? → introspect a live entity, write the interface yourself, PR to `preact-homeassistant` so the next person doesn't have to.

## Contributing a new domain type

The README of `preact-homeassistant` has the contribution flow. The short
version: add `src/types/<domain>.ts`, extend `HassEntityBase` and
`HassEntityAttributeBase`, add the entity to `DomainEntityMap` in
`src/types/index.ts`, and re-export from there.
