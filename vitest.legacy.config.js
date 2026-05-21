import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/legacy/**/*-test.js'],
    exclude: ['test/legacy/karma/**'],
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./test/setup.js']
  }
});
