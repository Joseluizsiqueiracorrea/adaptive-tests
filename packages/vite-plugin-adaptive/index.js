function adaptiveTestsPlugin(options = {}) {
  return {
    name: 'vite-plugin-adaptive',
    enforce: 'pre',
    configResolved() {
      const message = options.quiet
        ? null
        : 'Adaptive Tests Vite plugin (preview) enabled – ensure adaptive-tests is configured in your test runner.';
      if (message) {
        // eslint-disable-next-line no-console
        console.warn(message);
      }
    }
  };
}

module.exports = adaptiveTestsPlugin;
module.exports.default = adaptiveTestsPlugin;
