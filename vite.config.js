import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import apiPlugin from './scripts/vite-api-plugin.js';

export default defineConfig(({ mode }) => {
  // Loads every variable (prefix '') for the *server-side* API handlers only.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), tailwindcss(), apiPlugin({ env })],
    resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },

    // Only variables starting with VITE_PUBLIC_ can ever reach browser code.
    // This also protects against secrets accidentally named VITE_*.
    envPrefix: 'VITE_PUBLIC_',

    build: {
      chunkSizeWarningLimit: 450,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (/recharts|d3-|victory-vendor/.test(id)) return 'charts';
            if (/leaflet/.test(id)) return 'maps';
            if (/framer-motion|motion-dom|motion-utils/.test(id)) return 'motion';
            return 'vendor';
          },
        },
      },
    },

    test: {
      environment: 'node',
      include: ['tests/**/*.test.{js,jsx}'],
      setupFiles: ['tests/setup.js'],
      restoreMocks: true,
    },
  };
});
