import { describe, expect, it } from 'vitest';

// Smoke test: the card module side-effects register a custom element.
describe('WeatherCard registration', () => {
  it('registers the display-weather custom element on import', async () => {
    await import('./index');
    expect(customElements.get('display-weather')).toBeDefined();
  });
});
