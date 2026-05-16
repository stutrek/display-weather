import type { Preview } from '@storybook/preact-vite';
import '../src/__test-utils__/ha-stubs';

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#111' },
        { name: 'light', value: '#fafafa' },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) => {
      // Apply HA CSS variable defaults so stories look close to a real card.
      const styleId = 'ha-css-vars';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          :root {
            --primary-text-color: #e1e1e1;
            --secondary-text-color: #9b9b9b;
            --primary-color: #03a9f4;
            --card-background-color: #1c1c1c;
            --ha-card-background: #1c1c1c;
            --ha-card-border-radius: 12px;
            --primary-font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            --code-font-family: "SF Mono", Menlo, Consolas, monospace;
          }
          body { padding: 24px; background: #111; }
        `;
        document.head.appendChild(style);
      }
      return Story();
    },
  ],
};

export default preview;
