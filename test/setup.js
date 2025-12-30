// Vitest setup file
import { vi } from 'vitest';

// Mock Chrome APIs
global.chrome = {
  storage: {
    sync: {
      get: vi.fn(),
      set: vi.fn()
    }
  },
  runtime: {
    getURL: vi.fn((path) => `chrome-extension://test/${path}`)
  }
};

// Mock browser globals
global.window = global;
global.document = global.document || {};

// Mock PDF.js
global.globalThis = global;
global.pdfjsLib = {
  GlobalWorkerOptions: {
    workerSrc: ''
  },
  getDocument: vi.fn()
};