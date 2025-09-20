#!/usr/bin/env node
/**
 * Prepare the repo for npm publish of:
 * - @adaptive-tests/javascript
 * - @adaptive-tests/typescript
 * - adaptive-tests (meta)
 *
 * Usage:
 *   node scripts/prepare-publish.js [version]
 *   VERSION env var is also supported.
 *
 * The script updates package.json fields to use semver deps and removes
 * "private": true where needed so that `npm publish --access public` can run.
 *
 * Run `node scripts/restore-dev.js` to switch back to local file links.
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const version = process.argv[2] || process.env.VERSION || '1.0.0';

function readJSON(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function writeJSON(p, obj) { fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8'); }
function backup(p) {
  const rel = path.relative(root, p).replace(/[\/]/g, '_');
  const out = path.join(root, '.adaptive-tests', `publish-backup_${rel}`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  if (!fs.existsSync(out)) fs.copyFileSync(p, out);
}

function updateJsPackage() {
  const p = path.join(root, 'languages/javascript/package.json');
  const pkg = readJSON(p);
  backup(p);
  pkg.version = version;
  if (pkg.private) delete pkg.private;
  pkg.publishConfig = { access: 'public' };
  writeJSON(p, pkg);
}

function updateTsPackage() {
  const p = path.join(root, 'languages/typescript/package.json');
  const pkg = readJSON(p);
  backup(p);
  pkg.version = version;
  if (pkg.dependencies && pkg.dependencies['@adaptive-tests/javascript']) {
    pkg.dependencies['@adaptive-tests/javascript'] = `^${version}`;
  }
  pkg.publishConfig = { access: 'public' };
  writeJSON(p, pkg);
}

function updateMetaPackage() {
  const p = path.join(root, 'packages/adaptive-tests/package.json');
  const pkg = readJSON(p);
  backup(p);
  pkg.version = version;
  if (!pkg.dependencies) pkg.dependencies = {};
  pkg.dependencies['@adaptive-tests/javascript'] = `^${version}`;
  if (!pkg.optionalDependencies) pkg.optionalDependencies = {};
  pkg.optionalDependencies['@adaptive-tests/typescript'] = `^${version}`;
  pkg.publishConfig = { access: 'public' };
  writeJSON(p, pkg);
}

function main() {
  updateJsPackage();
  updateTsPackage();
  updateMetaPackage();
  console.log('\n✅ Prepared package.json files for publish.');
  console.log('Next:');
  console.log('  1) cd languages/javascript && npm publish --access public');
  console.log('  2) cd ../../languages/typescript && npm publish --access public');
  console.log('  3) cd ../../packages/adaptive-tests && npm publish --access public');
  console.log('\nWhen done, run: node scripts/restore-dev.js');
}

main();
