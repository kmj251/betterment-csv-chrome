import { defineConfig } from 'vite';
import { resolve } from 'path';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default defineConfig({
  plugins: [
    nodeResolve({
      browser: true,
      preferBuiltins: false
    }),
    commonjs({
      include: [/app\/src/, /node_modules/],
      transformMixedEsModules: true,
      requireReturnsDefault: 'auto'
    })
  ],
  build: {
    outDir: 'dist/app',
    emptyOutDir: false,  // Don't empty directory so we keep static assets
    lib: {
      entry: resolve(__dirname, 'app/src/pdf-to-csv.js'),
      name: 'BettermentCSV',
      fileName: (format) => `main.${format}.js`,
      formats: ['iife']
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        format: 'iife'
      },
      external: []  // Bundle everything, don't treat anything as external
    },
    commonjsOptions: {
      include: [/app\/src/]  // Include our source files for CommonJS processing
    },
    target: ['chrome76', 'chrome88'],
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,  // Keep console for debugging in extension
        drop_debugger: true
      }
    },
    copyPublicDir: false
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'app/src')
    }
  },
  optimizeDeps: {
    include: []
  },
  define: {
    global: 'globalThis',
    'process.env.NODE_ENV': '"production"',
    'module': '{}'
  }
});