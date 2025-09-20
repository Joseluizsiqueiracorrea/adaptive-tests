#!/usr/bin/env node
/*
 * Multi-agent preflight guard
 *
 * Ensures the working tree is safe to mutate before an autonomous agent begins
 * editing. This mirrors the guidance in AGENTS.md: run this script before any
 * large change to detect untracked prototypes, risky deletions, or merge
 * conflicts that could compromise another contributor's work.
 */

const { execSync } = require('child_process');

function color(code, message) {
  return process.stdout.isTTY ? `\u001b[${code}m${message}\u001b[0m` : message;
}

function fail(message) {
  console.error(color('31;1', '✖ Agent preflight failed')); // red bold
  console.error(message);
  console.error('\nSee AGENTS.md for collaboration guidelines.');
  process.exitCode = 1;
}

function runGitStatus() {
  try {
    return execSync('git status --porcelain=v1', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    });
  } catch (error) {
    fail('Unable to read git status. Ensure you are inside a Git repository.');
    process.exit(1);
  }
}

function main() {
  const allowUntracked = /^(1|true|yes)$/i.test(process.env.AGENT_PREFLIGHT_ALLOW_UNTRACKED || '');
  const allowDeletes = /^(1|true|yes)$/i.test(process.env.AGENT_PREFLIGHT_ALLOW_DELETES || '');

  const statusOutput = runGitStatus();
  const lines = statusOutput
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  const problems = [];

  for (const line of lines) {
    const status = line.slice(0, 2);
    const file = line.slice(3).trim();

    const isConflict = status.includes('U');
    if (isConflict) {
      problems.push({
        type: 'conflict',
        message: `Merge conflict detected: ${file}`
      });
      continue;
    }

    const isUntracked = status === '??';
    if (isUntracked && !allowUntracked) {
      const isDirectory = file.endsWith('/');
      const context = isDirectory
        ? 'untracked directory (see 2025-09-20 safety alert)'
        : 'untracked file';
      problems.push({
        type: 'untracked',
        message: `Untracked path detected (${context}): ${file}`
      });
      continue;
    }

    const isDelete = status.includes('D');
    if (isDelete && !allowDeletes) {
      problems.push({
        type: 'delete',
        message: `Tracked file scheduled for deletion: ${file}`
      });
      continue;
    }
  }

  if (problems.length > 0) {
    const bullets = problems
      .map(problem => `  • ${problem.message}`)
      .join('\n');

    const guidance = [
      'Resolve the issues above or rerun with explicit overrides:',
      '  AGENT_PREFLIGHT_ALLOW_UNTRACKED=1 npm run agent:preflight   # allow working with untracked paths',
      '  AGENT_PREFLIGHT_ALLOW_DELETES=1 npm run agent:preflight     # acknowledge deliberate deletions'
    ].join('\n');

    fail(`${bullets}\n\n${guidance}`);
    return;
  }

  console.log(color('32;1', '✔ Agent preflight passed'));
  if (lines.length === 0) {
    console.log('Working tree is clean.');
  } else {
    console.log('Working tree changes are limited to safe modifications.');
  }
  console.log('Happy hacking!');
}

main();
