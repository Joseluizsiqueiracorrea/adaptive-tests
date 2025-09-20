const { AdaptiveTest, adaptiveTest } = require('../../src/index');

class RegistryCoverage extends AdaptiveTest {
  getTargetSignature() {
    return { name: 'LanguagePluginRegistry', type: 'class', exports: 'LanguagePluginRegistry', methods: ['getStats','isPluginDisabled','registerPlugin'] };
  }
  async runTests(LanguagePluginRegistry) {
    LanguagePluginRegistry.resetInstance();
    const reg = new LanguagePluginRegistry({ discovery: { plugins: { disabled: ['foo'] } } });
    expect(reg.isPluginDisabled('foo')).toBe(true);
    expect(reg.isPluginDisabled('bar')).toBe(false);

    class BadPlugin {}
    expect(reg.isValidPlugin ? reg.isValidPlugin(BadPlugin) : false).toBe(false);

    // Register with a faux plugin that matches expected interface
    class GoodPlugin {
      constructor(){ this._ext='.xyz'; }
      getFileExtension(){ return '.xyz'; }
      parseFile(){}
      extractCandidates(){}
      generateTestContent(){}
    }
    reg.registerPlugin('custom', GoodPlugin, '/tmp/path');
    const s = reg.getStats();
    expect(s.totalPlugins).toBeGreaterThan(0);
  }
}

adaptiveTest(RegistryCoverage);
