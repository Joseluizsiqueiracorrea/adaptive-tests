module.exports = {
  "testEnvironment": "node",
  "roots": [
    "<rootDir>/tests",
    "<rootDir>/examples"
  ],
  "testMatch": [
    "**/*.test.(js|ts)"
  ],
  "testPathIgnorePatterns": [
    "/node_modules/",
    "/examples/esm-module/"
  ],
  "transform": {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        "tsconfig": "<rootDir>/tsconfig.json",
        "diagnostics": false
      }
    ]
  },
  "moduleFileExtensions": [
    "ts",
    "tsx",
    "js",
    "jsx",
    "json"
  ],
  "moduleNameMapper": {
    "^adaptive-tests$": "<rootDir>/src/index.js",
    "^adaptive-tests/(.*)$": "<rootDir>/src/$1",
    "^@adaptive-tests/javascript$": "<rootDir>/src/index.js"
  },
  "collectCoverageFrom": [
    "src/**/*.{js,ts}",
    "!src/**/index.js",
    // Exclude non-critical or IO-heavy modules from coverage for 1.0
    "!src/experimental/**",
    "!src/scaffolding.js",
    "!src/language-plugin-registry.js",
    "!src/async-utils.js",
    "!src/base-language-integration.js",
    "!src/logger.js",
    "!src/config-loader.js",
    "!src/enhanced-config-schema.js",
    "!src/process-runner.js"
  ],
  "coverageDirectory": "<rootDir>/coverage",
  "clearMocks": true,
  "resetMocks": true,
  "restoreMocks": true
};
