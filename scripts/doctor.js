#!/usr/bin/env node

/**
 * Adaptive Tests Doctor - Diagnose common issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🏥 Adaptive Tests Doctor');
console.log('========================\n');

const checks = [];

// Check Node version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
if (majorVersion >= 16) {
  checks.push('✅ Node version compatible: ' + nodeVersion);
} else {
  checks.push('❌ Node version too old: ' + nodeVersion + ' (need 16+)');
}

// Check TypeScript availability
try {
  require.resolve('typescript');
  checks.push('✅ TypeScript support available');
} catch {
  checks.push('⚠️  TypeScript not installed (optional)');
}

// Check node_modules size
const nodeModulesPath = path.join(process.cwd(), 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  const stats = fs.statSync(nodeModulesPath);
  const files = fs.readdirSync(nodeModulesPath).length;
  if (files > 500) {
    checks.push(`⚠️  Large node_modules detected (${files} packages) - may slow discovery`);
  } else {
    checks.push(`✅ node_modules size OK (${files} packages)`);
  }
}

// Check cache directory
const cacheFile = '.adaptive-tests-cache.json';
try {
  fs.writeFileSync(cacheFile + '.test', 'test');
  fs.unlinkSync(cacheFile + '.test');
  checks.push('✅ Cache directory writable');
} catch {
  checks.push('❌ Cannot write to cache directory');
}

// Check for common issues
if (fs.existsSync('.gitignore')) {
  const gitignore = fs.readFileSync('.gitignore', 'utf8');
  if (!gitignore.includes('.adaptive-tests-cache')) {
    checks.push('⚠️  Consider adding .adaptive-tests-cache.json to .gitignore');
  }
}

// Display results
checks.forEach(check => console.log(check));

console.log('\n' + '='.repeat(40));

// Provide recommendations
const warnings = checks.filter(c => c.startsWith('⚠️'));
const errors = checks.filter(c => c.startsWith('❌'));

if (errors.length > 0) {
  console.log('\n❌ Found', errors.length, 'error(s) that should be fixed');
  process.exit(1);
} else if (warnings.length > 0) {
  console.log('\n⚠️  Found', warnings.length, 'warning(s) - optional improvements');
} else {
  console.log('\n✅ All checks passed! Your setup is optimal.');
}