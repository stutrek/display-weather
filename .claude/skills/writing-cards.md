---
name: writing-cards
description: Patterns and conventions for building Home Assistant cards with preact-homeassistant. Trigger when adding a new card, a new widget, an editor, hooks, styles, or registering a custom element for HA.
---

# Writing a card with preact-homeassistant

This template builds Home Assistant Lovelace cards as Preact components. Every
card boils down to one call to `registerPreactCard` plus a `Component` and an
optional `ConfigComponent`.

## Required structure

```
src/MyCard/
├── index.tsx          # imports `registerPreactCard` and calls it (side-effect entry)
├── MyCard.tsx         # the Component that renders inside <ha-card>
├── MyCard.styles.ts   # css`` tagged template, imported as a side effect from MyCard.tsx
└── MyCardEditor.tsx   # optional ConfigComponent for the visual editor
```

The Vite build entry must point at `index.tsx`. Top-level side-effects in
`index.tsx` register the custom element with the browser.

## The Component

- Wrap the card body in `<ha-card>`. HA's CSS expects this wrapper for borders/elevation.
- Put any padding inside `<div class="card-content">` (HA convention).
- Read entities with `useEntity(entityId)`. The return type is narrowed by domain:
  - `useEntity('calendar.x')` → `CalendarEntity`
  - `useEntity('weather.x')` → `WeatherEntity`
  - `useEntity('sun.sun')` → `SunEntity`
  - other domains → `HassEntity` (loose).
- For one-off service calls, use `const { getHass } = useHass()` then `getHass()?.callService(...)`. This does NOT re-render on entity changes.
- For multi-entity data, use `useMultiCalendarEvents` / `useWeatherForecast` / `useCachedFetch`.

## The ConfigComponent (visual editor)

- Receives `{ hass, config, onConfigChanged }`.
- Renders into the **light DOM**, not the shadow root (HA's own custom elements like `<ha-select>` need this).
- Standard inputs from HA: `<ha-select>`, `<ha-list-item>`, `<ha-textfield>`, `<ha-switch>`, `<ha-formfield>`.
- HA emits `closed` events on selects that bubble out of the editor — swallow them with `onclosed={(e) => e.stopPropagation()}` or you'll get scroll glitches.
- Call `onConfigChanged({ ...config, field: value })` to commit changes.

## Styles

- Write CSS in a `MyCard.styles.ts` file using the `css\`\`` tagged template from `preact-homeassistant`.
- Import that file as a side-effect from `MyCard.tsx`: `import './MyCard.styles';`
- Styles register globally; `registerPreactCard` injects all registered styles into each card's shadow root on render.
- Use HA CSS variables for theming: `--primary-text-color`, `--secondary-text-color`, `--card-background-color`, `--primary-color`, `--ha-card-background`, etc.

## Storybook + tests

- For tests/stories, wrap the component in `<HAProvider hass={mockHass} subscribeToEntity={noopSubscribe()}>`.
- Use `createMockHass({ entities })` and `noopSubscribe` from `src/__test-utils__/mockHass.ts`.
- Import `src/__test-utils__/ha-stubs.ts` once (already done in `.storybook/preview.ts` and `vitest` setup) so `<ha-card>` etc. don't throw "unknown element" errors.

## The Shadow DOM gotcha

The Component renders inside the card's shadow root. Anything that escapes the
shadow root won't be styled by your `css\`\`` (modals, portals, etc.). If you
need full-document overlay UI, render it into `document.body` from a `useEffect`
hook rather than inside the card tree.

## Don't

- Don't import React or react-dom. Preact-only.
- Don't bundle `home-assistant-js-websocket` types into your card's `.js`; they're erased at compile time.
- Don't add `console.log` for debugging in the published build — strip them before tagging a release.
- Don't render the editor into the shadow root. Use light DOM.

## Pattern: stub config

```ts
registerPreactCard<MyConfig>({
  type: 'my-card',
  name: 'My Card',
  description: '...',
  Component: MyCard,
  ConfigComponent: MyCardEditor,
  getStubConfig: () => ({ entity: '' }),
});
```

`getStubConfig` is what HA inserts when the user adds the card from the picker
without going through the editor. Keep it minimal but valid.
