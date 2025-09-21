const {
  enableInvisibleMode,
  disableInvisibleMode,
  patchRequireWithIsolation,
  restoreOriginalRequire
} = require('../invisible');

function setupForJest(options = {}) {
  enableInvisibleMode(options);
  patchRequireWithIsolation();

  if (typeof afterAll === 'function') {
    afterAll(() => {
      teardownForJest();
    });
  }
}

function teardownForJest() {
  restoreOriginalRequire();
  disableInvisibleMode();
}

module.exports = {
  setupForJest,
  teardownForJest
};
