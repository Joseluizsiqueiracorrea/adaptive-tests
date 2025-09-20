#!/usr/bin/env node

/**
 * Adaptive Tests Doctor - Discovery Debugging Tool
 *
 * Friendly wrapper around 'why' command with actionable fixes
 * Usage: npx adaptive-tests doctor "Calculator"
 *        npx adaptive-tests doctor --signature '{"name":"Calculator"}'
 *        npx adaptive-tests doctor --system  (runs root doctor)
 */

const path = require('path');
const { execSync } = require('child_process');
const { getDiscoveryEngine } = require('../src/discovery-engine');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

function formatNumber(value) {
  if (Number.isInteger(value)) {
    return value.toString();
  }
  return value.toFixed(2);
}

function formatSigned(value) {
  const numeric = value || 0;
  const prefix = numeric >= 0 ? '+' : '';
  return `${prefix}${formatNumber(numeric)}`;
}

function parseArgs(args) {
  const options = {
    target: null,
    signature: null,
    root: process.cwd(),
    system: false,
    help: false
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    if (arg === '--system') {
      options.system = true;
      continue;
    }

    if (arg === '--root') {
      const next = args[i + 1];
      if (!next) {
        throw new Error('Missing value for --root');
      }
      options.root = path.resolve(next);
      i += 1;
      continue;
    }

    if (arg.startsWith('--root=')) {
      options.root = path.resolve(arg.split('=')[1]);
      continue;
    }

    if (arg === '--signature') {
      const next = args[i + 1];
      if (!next) {
        throw new Error('Missing value for --signature');
      }
      try {
        options.signature = JSON.parse(next);
      } catch (error) {
        throw new Error(`Invalid JSON signature: ${error.message}`);
      }
      i += 1;
      continue;
    }

    if (arg.startsWith('--signature=')) {
      const sig = arg.split('=')[1];
      try {
        options.signature = JSON.parse(sig);
      } catch (error) {
        throw new Error(`Invalid JSON signature: ${error.message}`);
      }
      continue;
    }

    // If not a flag, treat as target name
    if (!arg.startsWith('-')) {
      options.target = arg;
    }
  }

  return options;
}

function showHelp() {
  console.log(`
${COLORS.bright}🏥 Adaptive Tests Doctor${COLORS.reset}
Discovery debugging and diagnosis tool

${COLORS.cyan}Usage:${COLORS.reset}
  npx adaptive-tests doctor "Calculator"              Find by name
  npx adaptive-tests doctor --signature '{"name":"Calculator"}'  Find by full signature
  npx adaptive-tests doctor --system                  Run system health checks

${COLORS.cyan}Options:${COLORS.reset}
  --root <path>           Set root directory for discovery
  --signature <json>      Provide full signature for discovery
  --system               Run system health checks instead
  --help                 Show this help message

${COLORS.cyan}Examples:${COLORS.reset}
  npx adaptive-tests doctor UserService
  npx adaptive-tests doctor --signature '{"name":"Calculator","type":"class"}'
  npx adaptive-tests doctor --system

${COLORS.dim}For detailed signature debugging, use: npx adaptive-tests why${COLORS.reset}
`);
}

async function runSystemDoctor() {
  console.log(`${COLORS.cyan}Running system health checks...${COLORS.reset}\n`);

  try {
    // Run the root doctor script
    const rootDoctor = path.join(__dirname, '../../../scripts/doctor.js');
    execSync(`node ${rootDoctor}`, { stdio: 'inherit' });
  } catch (error) {
    console.error(`${COLORS.red}Failed to run system doctor:${COLORS.reset}`, error.message);
    process.exit(1);
  }
}

function buildSignatureSuggestion(candidate) {
  const info = candidate.metadata || {};
  const signature = {};

  if (info.name) signature.name = info.name;
  if (info.kind && info.kind !== 'unknown') signature.type = info.kind;

  if (info.methods && info.methods.length > 0) {
    signature.methods = info.methods.slice(0, 5); // Show first 5 methods
  }

  if (info.properties && info.properties.length > 0) {
    signature.properties = info.properties.slice(0, 3); // Show first 3 properties
  }

  if (info.extends) {
    signature.extends = info.extends;
  }

  return signature;
}

async function diagnoseDiscovery(options) {
  const engine = getDiscoveryEngine(options.root);

  // Build signature from target name or use provided signature
  const signature = options.signature || { name: options.target };

  console.log(`${COLORS.bright}🏥 Discovery Doctor${COLORS.reset}`);
  console.log('=' .repeat(50));
  console.log(`${COLORS.cyan}Looking for:${COLORS.reset} ${JSON.stringify(signature)}`);
  console.log(`${COLORS.cyan}Search root:${COLORS.reset} ${options.root}`);
  console.log();

  try {
    // Try to discover with the signature
    const result = await engine.discoverTarget(signature);

    console.log(`${COLORS.green}✅ Success!${COLORS.reset} Found target at:`);
    console.log(`   ${result.__filePath || 'module loaded successfully'}`);
    console.log();
    console.log(`${COLORS.cyan}To create an adaptive test:${COLORS.reset}`);
    console.log(`   npx adaptive-tests scaffold "${options.target || signature.name}"`);

  } catch (error) {
    // Discovery failed - provide diagnosis
    console.log(`${COLORS.yellow}⚠️  Discovery failed${COLORS.reset}`);
    console.log();

    // Get candidates for better diagnosis
    const normalized = engine.normalizeSignature(signature);
    const candidates = await engine.collectCandidates(engine.rootPath, normalized);

    if (candidates.length === 0) {
      console.log(`${COLORS.red}❌ No candidates found${COLORS.reset}`);
      console.log();
      console.log(`${COLORS.cyan}Troubleshooting tips:${COLORS.reset}`);
      console.log('1. Check that the file exists in your project');
      console.log('2. Ensure the module exports the expected name');
      console.log('3. Try a simpler signature: { "name": "YourModule" }');
      console.log('4. Check file extensions (.js, .ts, .jsx, .tsx)');

    } else {
      // Show top 3 candidates with actionable suggestions
      console.log(`${COLORS.yellow}Found ${candidates.length} candidate(s) but none matched perfectly${COLORS.reset}`);
      console.log();

      const top3 = candidates.sort((a, b) => b.score - a.score).slice(0, 3);

      console.log(`${COLORS.cyan}Top matches:${COLORS.reset}`);
      top3.forEach((candidate, i) => {
        const num = i + 1;
        const scoreColor = candidate.score > 0 ? COLORS.green : COLORS.yellow;
        console.log(`\n${num}. ${COLORS.bright}${candidate.metadata?.name || path.basename(candidate.path)}${COLORS.reset}`);
        console.log(`   Path: ${candidate.path}`);
        console.log(`   Score: ${scoreColor}${formatSigned(candidate.score)}${COLORS.reset}`);
        console.log(`   Type: ${candidate.metadata?.kind || 'unknown'}`);

        if (candidate.metadata?.methods?.length > 0) {
          console.log(`   Methods: ${candidate.metadata.methods.slice(0, 3).join(', ')}${candidate.metadata.methods.length > 3 ? '...' : ''}`);
        }
        if (candidate.metadata?.staticMethods?.length > 0) {
          console.log(`   Static: ${candidate.metadata.staticMethods.slice(0, 3).join(', ')}${candidate.metadata.staticMethods.length > 3 ? '...' : ''}`);
        }
      });

      // Suggest the best match signature
      const best = top3[0];
      if (best && best.metadata) {
        const suggested = buildSignatureSuggestion(best);
        console.log();
        console.log(`${COLORS.green}💡 Suggested fix:${COLORS.reset}`);
        console.log(`   Use this signature instead:`);
        console.log(`   ${JSON.stringify(suggested, null, 2).split('\n').join('\n   ')}`);
        console.log();
        console.log(`${COLORS.cyan}Quick actions:${COLORS.reset}`);
        console.log(`1. ${COLORS.bright}Scaffold a test:${COLORS.reset}`);
        console.log(`   npx adaptive-tests scaffold "${best.metadata.name || options.target}"`);
        console.log();
        console.log(`2. ${COLORS.bright}See detailed analysis:${COLORS.reset}`);
        console.log(`   npx adaptive-tests why '${JSON.stringify(suggested)}'`);
      }
    }

    console.log();
    console.log(`${COLORS.dim}For more details, run: npx adaptive-tests why '${JSON.stringify(signature)}'${COLORS.reset}`);
  }
}

async function main() {
  let options;

  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`${COLORS.red}Error:${COLORS.reset} ${error.message}`);
    process.exit(1);
  }

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  if (options.system) {
    await runSystemDoctor();
    process.exit(0);
  }

  if (!options.target && !options.signature) {
    console.error(`${COLORS.red}Error:${COLORS.reset} Please provide a target name or signature`);
    console.log(`Try: npx adaptive-tests doctor --help`);
    process.exit(1);
  }

  try {
    await diagnoseDiscovery(options);
  } catch (error) {
    console.error(`${COLORS.red}Error:${COLORS.reset} ${error.message}`);
    process.exit(1);
  }
}

main();