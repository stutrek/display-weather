import { defineConfig } from 'vitest/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const localPreactHA = path.resolve(dirname, '../preact-homeassistant');
const hasLocalPreactHA = fs.existsSync(path.join(localPreactHA, 'package.json'));

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__test-utils__/setup.ts'],
  },
  resolve: {
    alias: hasLocalPreactHA ? { 'preact-homeassistant': localPreactHA } : {},
  },
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'preact',
  },
});
