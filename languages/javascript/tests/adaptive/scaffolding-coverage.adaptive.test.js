const { AdaptiveTest, adaptiveTest } = require('../../src/index');
const { gatherSourceFiles, runBatch } = require('../../src/scaffolding');
const fs = require('fs');
const path = require('path');
const os = require('os');

class ScaffoldingCoverage extends AdaptiveTest {
  getTargetSignature() {
    return { name: 'gatherSourceFiles', type: 'function', exports: 'gatherSourceFiles' };
  }
  async runTests() {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'scaffold-'));
    const src = path.join(tmp, 'src');
    fs.mkdirSync(src, { recursive: true });
    fs.writeFileSync(path.join(src, 'A.js'), 'module.exports=1;');
    fs.writeFileSync(path.join(src, 'B.test.js'), '');
    fs.mkdirSync(path.join(src, 'deep'), { recursive: true });
    fs.writeFileSync(path.join(src, 'deep', 'C.ts'), 'export const x=1;');
    const files = gatherSourceFiles(tmp, ['.js', '.ts']);
    expect(files.some(f => f.endsWith('A.js'))).toBe(true);
    expect(files.some(f => f.endsWith('C.ts'))).toBe(true);
    expect(files.some(f => f.endsWith('B.test.js'))).toBe(false);

    const engine = require('../../src').getDiscoveryEngine(path.resolve(__dirname, '../../'));
    const results = { created:[], skippedExisting:[], skippedNoExport:[] };
    await runBatch(engine, src, { root: path.resolve(__dirname, '../../'), outputDir: path.join(tmp, 'out'), isTypeScript: false, applyAssertions: false, allExports: false, force: true }, results);
    expect(Array.isArray(results.created)).toBe(true);
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

adaptiveTest(ScaffoldingCoverage);

