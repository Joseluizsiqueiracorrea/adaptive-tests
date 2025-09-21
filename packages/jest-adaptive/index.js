let setupModulePath;

function resolveSetupModule() {
  if (setupModulePath) {
    return setupModulePath;
  }
  try {
    setupModulePath = require.resolve('@adaptive-tests/javascript/jest/invisible-setup');
  } catch (error) {
    setupModulePath = require.resolve('../../languages/javascript/jest/invisible-setup');
  }
  return setupModulePath;
}

function loadJestHelpers() {
  return require(resolveSetupModule());
}

const { setupForJest, teardownForJest } = loadJestHelpers();

function createPreset(options = {}) {
  const adaptiveOptions = {
    escapePatterns: options.escapePatterns,
    searchDirs: options.searchDirs,
    extensions: options.extensions
  };

  return {
    setupFilesAfterEnv: [resolveSetupModule()],
    globals: {
      adaptiveTests: adaptiveOptions
    }
  };
}

const preset = createPreset();

module.exports = {
  setupForJest,
  teardownForJest,
  createPreset,
  preset,
  // Alias Jest expects when preset file exports a value directly
  default: preset
};
