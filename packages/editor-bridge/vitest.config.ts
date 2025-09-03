import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['../shared/src/test-setup.ts', './test-setup.ts'],
    globals: true
  }
});
