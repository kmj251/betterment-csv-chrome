import js from '@eslint/js';

export default [
  {
    ignores: ['dist/**', 'app/pdf.min.js', 'app/pdf.worker.js']
  },
  js.configs.recommended,
  {
    files: ['app/content-script.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        Blob: 'readonly',
        MouseEvent: 'readonly',
        URL: 'readonly',
        chrome: 'readonly',
        clearTimeout: 'readonly',
        console: 'readonly',
        document: 'readonly',
        location: 'readonly',
        setInterval: 'readonly',
        setTimeout: 'readonly',
        window: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': 'warn',
      'prefer-const': 'error'
    }
  },
  {
    files: ['test/**/*.js'],
    languageOptions: {
      globals: {
        afterEach: 'readonly',
        beforeEach: 'readonly',
        describe: 'readonly',
        expect: 'readonly',
        it: 'readonly'
      }
    }
  }
];