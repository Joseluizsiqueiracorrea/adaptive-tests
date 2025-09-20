/**
 * Adaptive test that verifies TypeScript path alias metadata capture
 * using a DiscoveryEngine rooted at a fixture project.
 */

const { AdaptiveTest, adaptiveTest } = require('../../src/index');
const { DiscoveryEngine } = require('../../src/discovery-engine');
const path = require('path');

class TsconfigResolverAdaptiveTest extends AdaptiveTest {
  getTargetSignature() {
    // Use a stable, discoverable target for the harness
    return {
      name: 'DiscoveryEngine',
      type: 'class',
      exports: 'DiscoveryEngine',
      methods: ['discoverTarget', 'collectCandidates']
    };
  }

  async runTests() {
    const FIXTURE_ROOT = path.resolve(__dirname, '../fixtures/tsconfig-alias');
    const engine = new DiscoveryEngine(FIXTURE_ROOT);

    const signature = engine.normalizeSignature({ name: 'AliasService', type: 'class' });
    const candidates = await engine.collectCandidates(FIXTURE_ROOT, signature);

    const match = candidates.find((c) => c.fileName === 'AliasService');
    expect(match).toBeDefined();
    expect(match.relativePath).toBe('src/services/AliasService.ts');
    expect(match.tsBaseImport).toBe('services/AliasService');
    expect(Array.isArray(match.tsAliases)).toBe(true);
    expect(match.tsAliases).toContain('@services/AliasService');
  }
}

adaptiveTest(TsconfigResolverAdaptiveTest);

