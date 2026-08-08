import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'url';

export default defineConfig({
  base: '/Re-Dungeon_Re-Master/',
  plugins: [react()],
  resolve: {
    alias: {
      common: fileURLToPath(new URL('./src/common', import.meta.url)),
      components: fileURLToPath(new URL('./src/components', import.meta.url)),
      context: fileURLToPath(new URL('./src/context', import.meta.url)),
      hooks: fileURLToPath(new URL('./src/hooks', import.meta.url)),
      pages: fileURLToPath(new URL('./src/pages', import.meta.url)),
      service: fileURLToPath(new URL('./src/service', import.meta.url)),
    },
  },
  server: {
    port: 8000,
    open: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
    testTimeout: 30000,
  },
});
