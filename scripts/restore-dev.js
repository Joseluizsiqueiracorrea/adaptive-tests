#!/usr/bin/env node
/**
 * Restore development package.json links and flags after publishing.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function readJSON(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function writeJSON(p, obj) { fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8'); }

function restoreFromBackup(p) {
  const rel = path.relative(root, p).replace(/[\/]/g, '_');
  const backupPath = path.join(root, '.adaptive-tests', `publish-backup_${rel}`);
  if (fs.existsSync(backupPath)) {
    const content = fs.readFileSync(backupPath, 'utf8');
    fs.writeFileSync(p, content, 'utf8');
    return true;
  }
  return false;
}

function restoreAll() {
  const targets = [
    'languages/javascript/package.json',
    'languages/typescript/package.json',
    'packages/adaptive-tests/package.json'
  ];
  for (const t of targets) {
    const full = path.join(root, t);
    if (!fs.existsSync(full)) continue;
    if (!restoreFromBackup(full)) {
      // Fallback: try to patch dev links
      const pkg = readJSON(full);
      if (t.startsWith('languages/javascript/')) {
        pkg.private = true;
      }
      if (t.startsWith('languages/typescript/')) {
        if (pkg.dependencies && pkg.dependencies['@adaptive-tests/javascript']) {
          pkg.dependencies['@adaptive-tests/javascript'] = 'file:../javascript';
        }
      }
      if (t.startsWith('packages/adaptive-tests/')) {
        if (!pkg.dependencies) pkg.dependencies = {};
        pkg.dependencies['@adaptive-tests/javascript'] = 'file:../../languages/javascript';
        if (!pkg.optionalDependencies) pkg.optionalDependencies = {};
        pkg.optionalDependencies['@adaptive-tests/typescript'] = 'file:../../languages/typescript';
      }
      writeJSON(full, pkg);
    }
  }
  console.log('✅ Restored dev package.json configuration');
}

restoreAll();
