#!/usr/bin/env node

const { spawnSync } = require('child_process');
const path = require('path');

const cli = path.join(
  process.cwd(),
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'markdownlint.cmd' : 'markdownlint'
);

const args = [
  '*.md',
  'docs/**/*.md',
  'languages/**/*.md',
  '--ignore', '**/node_modules/**',
  '--ignore', 'docs/_site/**',
  '--ignore', 'docs/vendor/**',
  '--ignore', 'languages/**/node_modules/**',
  '--disable', 'MD007',
  '--disable', 'MD009',
  '--disable', 'MD012',
  '--disable', 'MD022',
  '--disable', 'MD024',
  '--disable', 'MD025',
  '--disable', 'MD030',
  '--disable', 'MD031',
  '--disable', 'MD032',
  '--disable', 'MD034',
  '--disable', 'MD036',
  '--disable', 'MD037',
  '--disable', 'MD040',
  '--disable', 'MD046',
  '--disable', 'MD047'
];

const result = spawnSync(cli, args, { stdio: 'inherit' });

if (result.error) {
  console.error('Failed to run markdownlint:', result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 0);
