module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'script',
  },
  overrides: [
    {
      files: ['**/*.mjs', '**/examples/**/*.js', '**/src/**/*.js'],
      parserOptions: {
        sourceType: 'module',
      },
    },
    {
      files: ['tests/**/*.{js,ts}', 'examples/**/*.{js,ts}', '**/*.test.{js,ts}'],
      env: {
        jest: true,
      },
    },
  ],
  ignorePatterns: ['coverage/', 'dist/', 'node_modules/'],
  rules: {
    'no-console': 'off',
  },
};
