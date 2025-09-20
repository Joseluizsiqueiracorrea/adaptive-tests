module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  collectCoverageFrom: [
    'scripts/**/*.js',
    'fix-javascript-imports.js',
    '!scripts/publish-action.sh',
    '!scripts/release.sh',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/languages/**',
    '!**/vscode-adaptive-tests-extension_experimental/**',
    '!**/.venv/**'
  ],
  coverageDirectory: 'coverage-main',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/languages/',
    '/vscode-adaptive-tests-extension_experimental/',
    '/.venv/',
    '/coverage/',
    '/coverage-main/'
  ],
  moduleFileExtensions: ['js', 'json'],
  transform: {},
  verbose: true
};