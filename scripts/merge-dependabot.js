#!/usr/bin/env node

/**
 * Safely merge Dependabot PRs after testing
 *
 * Strategy:
 * 1. Group PRs by type (GitHub Actions, npm/yarn, pip)
 * 2. Test each group
 * 3. Merge if tests pass
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = '') {
  console.log(color + message + COLORS.reset);
}

function exec(command, silent = false) {
  try {
    const output = execSync(command, {
      encoding: 'utf8',
      stdio: silent ? 'pipe' : 'inherit'
    });
    return output;
  } catch (error) {
    if (!silent) {
      log(`Command failed: ${command}`, COLORS.red);
      log(error.message, COLORS.red);
    }
    throw error;
  }
}

function getDependabotBranches() {
  const branches = exec('git branch -r | grep dependabot', true)
    .split('\n')
    .filter(b => b.trim())
    .map(b => b.trim().replace('origin/', ''));

  return branches;
}

function categorizeBranches(branches) {
  const categories = {
    githubActions: [],
    npm: [],
    pip: [],
    other: []
  };

  branches.forEach(branch => {
    if (branch.includes('github_actions')) {
      categories.githubActions.push(branch);
    } else if (branch.includes('npm_and_yarn')) {
      categories.npm.push(branch);
    } else if (branch.includes('pip/')) {
      categories.pip.push(branch);
    } else {
      categories.other.push(branch);
    }
  });

  return categories;
}

async function testBranch(branch) {
  log(`\nTesting branch: ${branch}`, COLORS.cyan);

  try {
    // Fetch the branch
    exec(`git fetch origin ${branch}:${branch}`, true);

    // Create a test branch
    const testBranch = `test-${branch.replace(/\//g, '-')}`;
    exec(`git checkout -b ${testBranch} origin/${branch}`, true);

    // Run tests based on what changed
    let testsPassed = true;

    if (branch.includes('npm_and_yarn') || branch.includes('javascript')) {
      log('Running JavaScript tests...', COLORS.yellow);
      try {
        // Install dependencies
        exec('npm ci --prefix languages/javascript', true);
        // Run tests
        exec('npm test --prefix languages/javascript', true);
        log('✅ JavaScript tests passed', COLORS.green);
      } catch (error) {
        log('❌ JavaScript tests failed', COLORS.red);
        testsPassed = false;
      }
    }

    if (branch.includes('pip/') || branch.includes('python')) {
      log('Running Python tests...', COLORS.yellow);
      try {
        exec('cd languages/python && python -m pytest', true);
        log('✅ Python tests passed', COLORS.green);
      } catch (error) {
        log('❌ Python tests failed', COLORS.red);
        testsPassed = false;
      }
    }

    if (branch.includes('github_actions')) {
      log('✅ GitHub Actions changes (no local tests needed)', COLORS.green);
      testsPassed = true;
    }

    // Clean up test branch
    exec('git checkout main', true);
    exec(`git branch -D ${testBranch}`, true);

    return testsPassed;
  } catch (error) {
    log(`Error testing ${branch}: ${error.message}`, COLORS.red);
    // Clean up
    try {
      exec('git checkout main', true);
    } catch {}
    return false;
  }
}

async function mergeBranch(branch) {
  try {
    log(`\nMerging ${branch}...`, COLORS.cyan);

    // Checkout the branch
    exec(`git checkout ${branch}`);

    // Merge into main
    exec('git checkout main');
    exec(`git merge --no-ff ${branch} -m "chore(deps): merge ${branch}"`);

    // Delete the local branch
    exec(`git branch -d ${branch}`, true);

    log(`✅ Merged ${branch}`, COLORS.green);
    return true;
  } catch (error) {
    log(`❌ Failed to merge ${branch}: ${error.message}`, COLORS.red);
    exec('git checkout main', true);
    return false;
  }
}

async function main() {
  log('\n🤖 Dependabot PR Merger', COLORS.bright);
  log('=' .repeat(50));

  // Ensure we're on main and up to date
  exec('git checkout main');
  exec('git pull origin main');

  // Get all Dependabot branches
  const branches = getDependabotBranches();
  log(`\nFound ${branches.length} Dependabot branches`, COLORS.cyan);

  // Categorize branches
  const categories = categorizeBranches(branches);

  log('\nBranches by category:', COLORS.yellow);
  log(`  GitHub Actions: ${categories.githubActions.length}`);
  log(`  NPM/Yarn: ${categories.npm.length}`);
  log(`  Python/pip: ${categories.pip.length}`);
  log(`  Other: ${categories.other.length}`);

  const results = {
    tested: [],
    merged: [],
    failed: []
  };

  // Test GitHub Actions first (safest)
  log('\n📋 Testing GitHub Actions updates...', COLORS.bright);
  for (const branch of categories.githubActions) {
    const passed = await testBranch(branch);
    if (passed) {
      results.tested.push(branch);
      if (await mergeBranch(branch)) {
        results.merged.push(branch);
      }
    } else {
      results.failed.push(branch);
    }
  }

  // Test npm/yarn updates
  log('\n📦 Testing npm/yarn updates...', COLORS.bright);
  for (const branch of categories.npm.slice(0, 3)) { // Test first 3 to be safe
    const passed = await testBranch(branch);
    if (passed) {
      results.tested.push(branch);
      if (await mergeBranch(branch)) {
        results.merged.push(branch);
      }
    } else {
      results.failed.push(branch);
    }
  }

  // Summary
  log('\n' + '=' .repeat(50), COLORS.bright);
  log('📊 Summary:', COLORS.bright);
  log(`  ✅ Merged: ${results.merged.length}`, COLORS.green);
  log(`  ❌ Failed: ${results.failed.length}`, COLORS.red);
  log(`  ⏭️  Remaining: ${branches.length - results.merged.length - results.failed.length}`, COLORS.yellow);

  if (results.merged.length > 0) {
    log('\n🎉 Successfully merged:', COLORS.green);
    results.merged.forEach(b => log(`  - ${b}`));

    log('\n📤 Push changes to GitHub:', COLORS.cyan);
    log('  git push origin main');
  }

  if (results.failed.length > 0) {
    log('\n⚠️  Failed branches (manual review needed):', COLORS.red);
    results.failed.forEach(b => log(`  - ${b}`));
  }

  // Create auto-merge config
  const configPath = path.join(process.cwd(), '.github', 'dependabot.yml');
  if (!fs.existsSync(path.dirname(configPath))) {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
  }

  const dependabotConfig = `version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/languages/javascript"
    schedule:
      interval: "weekly"
    groups:
      dev-dependencies:
        patterns:
          - "*"
        dependency-type: "development"
    open-pull-requests-limit: 5

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    groups:
      actions:
        patterns:
          - "actions/*"
          - "github/*"

  - package-ecosystem: "pip"
    directory: "/languages/python"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 3
`;

  fs.writeFileSync(configPath, dependabotConfig);
  log('\n✅ Created .github/dependabot.yml for better PR management', COLORS.green);
}

main().catch(error => {
  log(`\nFatal error: ${error.message}`, COLORS.red);
  process.exit(1);
});