const fs = require('fs');
const os = require('os');
const path = require('path');
const { DiscoveryEngine } = require('../../src/discovery-engine');

describe('Static analysis safeguards', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'adaptive-tests-static-'));
    delete global.__exploded;
  });

  afterEach(() => {
    if (sandbox && fs.existsSync(sandbox)) {
      fs.rmSync(sandbox, { recursive: true, force: true });
    }
    delete global.__exploded;
  });

  test('collectCandidates does not execute module code', async () => {
    const explosivePath = path.join(sandbox, 'Explosive.js');
    fs.writeFileSync(
      explosivePath,
      `global.__exploded = (global.__exploded || 0) + 1;\n` +
        `module.exports = class Explosive { ping() { return 'pong'; } };\n`
    );

    const engine = new DiscoveryEngine(sandbox, {
      discovery: {
        cache: { enabled: false },
        security: {
          allowUnsafeRequires: true
        }
      }
    });

    const signature = { name: 'Explosive', type: 'class' };

    const candidates = await engine.collectCandidates(sandbox, signature);
    expect(candidates).toHaveLength(1);
    expect(global.__exploded).toBeUndefined();

    await engine.tryResolveCandidate(candidates[0], signature);
    expect(global.__exploded).toBe(1);
  });
});
