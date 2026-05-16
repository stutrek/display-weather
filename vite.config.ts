import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { visualizer } from 'rollup-plugin-visualizer';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    preact(),
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    lib: {
      entry: path.resolve(dirname, 'src/WeatherCard/index.tsx'),
      name: 'DisplayWeather',
      formats: ['es'],
      fileName: () => 'display-weather.js',
    },
    rollupOptions: {
      external: [],
    },
    outDir: 'dist',
    minify: false,
  },
  resolve: {
    dedupe: ['preact', 'preact/hooks', 'preact/compat'],
  },
});
