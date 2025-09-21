class AdaptiveTestsWebpackPlugin {
  constructor(options = {}) {
    this.options = options;
  }

  apply(compiler) {
    compiler.hooks.beforeRun.tap('AdaptiveTestsWebpackPlugin', () => {
      if (!this.options.quiet) {
        // eslint-disable-next-line no-console
        console.warn('Adaptive Tests Webpack plugin (preview) enabled – run adaptive tests via your test runner.');
      }
    });
  }
}

module.exports = AdaptiveTestsWebpackPlugin;
module.exports.default = AdaptiveTestsWebpackPlugin;
