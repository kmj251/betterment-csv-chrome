import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ["app/src/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        chrome: "readonly",
        PDFJS: "writable",
        console: "readonly",
        document: "readonly",
        window: "readonly",
        URL: "readonly",
        Blob: "readonly",
        FileReader: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly"
      }
    },
    rules: {
      "no-var": "error",
      "prefer-const": "error",
      "prefer-arrow-callback": "error",
      "arrow-spacing": "error",
      "no-unused-vars": "warn",
      "semi": ["error", "always"],
      "quotes": ["error", "single"],
      "indent": ["error", 2]
    }
  },
  {
    files: ["test/**/*.js"],
    languageOptions: {
      globals: {
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly"
      }
    }
  }
];