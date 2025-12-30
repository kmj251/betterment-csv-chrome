import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    include: ['test/**/*-test.js', 'test/**/*.{test,spec}.js'],
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./test/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        'dist/',
        '**/*.config.{js,ts}',
        '**/pdf.worker.js'
      ]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'app/src')
    }
  }
});