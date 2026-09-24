import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    // Same origin as the Vite dev server, so the API's real CORS rules apply in integration tests.
    environmentOptions: { jsdom: { url: 'http://localhost:5173/' } },
    include: ['tests/**/*.test.{js,jsx}'],
    globalSetup: ['tests/globalSetup.js'],
    setupFiles: ['tests/setup.js'],
    testTimeout: 20_000,
    hookTimeout: 120_000,
    // Integration tests share one API instance and mutate its data.
    fileParallelism: false,
  },
});
