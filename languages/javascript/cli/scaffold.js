#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const readline = require('readline');
const { DiscoveryEngine } = require('../src/discovery-engine');
const { processSingleFile, runBatch } = require('../src/scaffolding');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

const log = (message, color = COLORS.reset, options = {}) => {
  if (options.json) return;
  console.log(color + message + COLORS.reset);
};

const parseArgs = (argv) => {
  const options = {
    root: process.cwd(),
    isTypeScript: false,
    force: false,
    batch: false,
    exportName: null,
    allExports: false,
    json: false,
    applyAssertions: false,
    outputDir: null,
    targetArg: null,
    interactive: false
  };

  const args = [...argv];
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--root') {
      options.root = path.resolve(args[++i]);
    } else if (arg.startsWith('--root=')) {
      options.root = path.resolve(arg.split('=')[1]);
    } else if (arg === '--typescript' || arg === '--ts') {
      options.isTypeScript = true;
    } else if (arg === '--force' || arg === '--overwrite' || arg === '-f') {
      options.force = true;
    } else if (arg === '--batch' || arg === '-b') {
      options.batch = true;
    } else if (arg === '--all-exports') {
      options.allExports = true;
    } else if (arg === '--apply-assertions') {
      options.applyAssertions = true;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--interactive' || arg === '-i') {
      options.interactive = true;
    } else if (arg.startsWith('--export=')) {
      options.exportName = arg.split('=')[1];
    } else if (arg === '--export') {
      options.exportName = args[++i];
    } else if (arg.startsWith('--output-dir=')) {
      options.outputDir = path.resolve(options.root, arg.split('=')[1]);
    } else if (!options.targetArg) {
      options.targetArg = arg;
    }
  }

  if (!options.targetArg) {
    throw new Error('Please provide a source path or component name.');
  }

  return options;
};

const resolveSourceByName = async (engine, name) => {
  const normalized = engine.normalizeSignature({ name });
  const candidates = await engine.collectCandidates(engine.rootPath, normalized);
  if (!candidates || candidates.length === 0) {
    return null;
  }
  candidates.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));
  return candidates[0];
};

async function interactiveSelectExport(filePath, exports, options) {
  if (!exports || exports.length === 0) {
    return null;
  }

  if (exports.length === 1) {
    return exports[0];
  }

  console.log(`\n${COLORS.cyan}Found ${exports.length} exports in ${path.basename(filePath)}:${COLORS.reset}\n`);

  exports.forEach((exp, index) => {
    const info = exp.info || {};
    const name = exp.exportedName || info.name || 'unnamed';
    const type = info.kind || 'unknown';
    const methods = info.methods?.length || 0;
    const staticMethods = info.staticMethods?.length || 0;

    console.log(`${COLORS.bright}${index + 1}.${COLORS.reset} ${COLORS.green}${name}${COLORS.reset} (${type})`);

    if (methods > 0) {
      console.log(`   Methods: ${info.methods.slice(0, 3).join(', ')}${methods > 3 ? '...' : ''}`);
    }
    if (staticMethods > 0) {
      console.log(`   Static: ${info.staticMethods.slice(0, 3).join(', ')}${staticMethods > 3 ? '...' : ''}`);
    }
    if (info.extends) {
      console.log(`   Extends: ${info.extends}`);
    }
    console.log();
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    const ask = () => {
      rl.question(`${COLORS.cyan}Select an export (1-${exports.length}) or 'a' for all: ${COLORS.reset}`, (answer) => {
        const trimmed = answer.trim().toLowerCase();

        if (trimmed === 'a') {
          rl.close();
          resolve('all');
          return;
        }

        const num = parseInt(trimmed);
        if (num >= 1 && num <= exports.length) {
          rl.close();
          resolve(exports[num - 1]);
        } else {
          console.log(`${COLORS.red}Please enter a number between 1 and ${exports.length}, or 'a' for all${COLORS.reset}`);
          ask();
        }
      });
    };
    ask();
  });
}

async function runScaffold(argv = []) {
  let options;
  try {
    options = parseArgs(argv);
  } catch (error) {
    console.error(`${COLORS.red}Error:${COLORS.reset} ${error.message}`);
    process.exitCode = 1;
    return;
  }

  const root = options.root;
  const targetArg = options.targetArg;
  const discoveryEngine = new DiscoveryEngine(root);
  const results = {
    created: [],
    skippedExisting: [],
    skippedNoExport: [],
    errors: []
  };

  const isPath = targetArg.includes('/') || targetArg.includes('\\') || /\.m?[jt]sx?$/i.test(targetArg);

  try {
    if (options.batch || (isPath && fs.existsSync(path.resolve(root, targetArg)) && fs.statSync(path.resolve(root, targetArg)).isDirectory())) {
      const directory = isPath ? path.resolve(root, targetArg) : path.join(root, 'src');
      if (!fs.existsSync(directory)) {
        throw new Error(`Directory not found: ${targetArg}`);
      }
      log(`🔄 Batch scaffolding ${path.relative(root, directory)}`, COLORS.cyan, options);
      await runBatch(discoveryEngine, directory, { ...options, targetArg: directory }, results);
    } else {
      let filePath = null;
      if (isPath) {
        filePath = path.resolve(root, targetArg);
        if (!fs.existsSync(filePath)) {
          throw new Error(`Source file not found: ${targetArg}`);
        }
      } else {
        const resolved = await resolveSourceByName(discoveryEngine, targetArg);
        if (!resolved) {
          throw new Error(`Unable to find a component named '${targetArg}'.`);
        }
        filePath = resolved.path;
        log(`🔍 Found component at ${path.relative(root, filePath)}`, 'dim', options);
      }
      // Handle interactive mode
      if (options.interactive) {
        const { analyzeSourceFile } = require('../src/scaffolding');
        const exports = analyzeSourceFile(discoveryEngine, filePath);

        if (!exports || exports.length === 0) {
          throw new Error(`No exports found in ${path.basename(filePath)}`);
        }

        if (exports.length > 1) {
          const selected = await interactiveSelectExport(filePath, exports, options);

          if (selected === 'all') {
            options.allExports = true;
          } else {
            options.exportName = selected.exportedName || selected.info?.name;
          }

          // Ask about assertions
          const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
          });

          const applyAssertions = await new Promise((resolve) => {
            rl.question(`${COLORS.cyan}Generate method-level assertions? (y/n): ${COLORS.reset}`, (answer) => {
              rl.close();
              resolve(answer.trim().toLowerCase() === 'y');
            });
          });

          options.applyAssertions = applyAssertions;
        }
      }

      await processSingleFile(discoveryEngine, filePath, options, results);
    }
  } catch (error) {
    console.error(`${COLORS.red}Error:${COLORS.reset} ${error.message}`);
    results.errors.push(error.message);
    process.exitCode = 1;
  }

  if (options.json) {
    const payload = {
      created: results.created.map((file) => path.relative(root, file)),
      skipped: [
        ...results.skippedExisting.map((file) => path.relative(root, file)),
        ...results.skippedNoExport.map((file) => path.relative(root, file))
      ],
      errors: [...results.errors]
    };
    console.log(JSON.stringify(payload));
  } else {
    log('\n📊 Scaffold summary:', COLORS.bright + COLORS.cyan, options);
    log(`  ✅ Created: ${results.created.length}`, COLORS.green, options);
    log(`  ⏭️  Skipped (existing): ${results.skippedExisting.length}`, COLORS.yellow, options);
    log(`  ⚠️  Skipped (no exports): ${results.skippedNoExport.length}`, COLORS.yellow, options);
    if (results.errors.length > 0) {
      log(`  ❌ Failed: ${results.errors.length}`, COLORS.red, options);
    }
  }

  if (results.errors.length > 0) {
    process.exitCode = 1;
  }
}

module.exports = { runScaffold };

if (require.main === module) {
  runScaffold(process.argv.slice(2)).catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}