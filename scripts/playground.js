#!/usr/bin/env node

/**
 * Adaptive Tests Playground - Interactive Discovery REPL
 *
 * Usage: npm run playground
 *
 * Try commands like:
 *   discover { name: "Calculator" }
 *   find class Calculator
 *   search methods: ["add", "subtract"]
 */

const repl = require('repl');
const path = require('path');
const { getDiscoveryEngine, discover } = require('../languages/javascript/src');

console.log('🔍 Adaptive Tests Discovery Playground');
console.log('=====================================');
console.log('');
console.log('Available commands:');
console.log('  discover(signature) - Find code matching signature');
console.log('  find <type> <name>  - Quick search by type and name');
console.log('  clear()             - Clear discovery cache');
console.log('  help()              - Show examples');
console.log('');

const replServer = repl.start({
  prompt: 'adaptive> ',
  useGlobal: true
});

const engine = getDiscoveryEngine();

// Add discovery functions to REPL context
replServer.context.discover = async (signature) => {
  console.log('Searching...');
  const start = Date.now();

  try {
    const result = await discover(signature);
    const elapsed = Date.now() - start;

    console.log(`✅ Found in ${elapsed}ms`);
    return result;
  } catch (error) {
    console.log(`❌ Not found: ${error.message.split('\n')[0]}`);
    console.log('   Try: help() for examples');
    return null;
  }
};

replServer.context.find = async (type, name) => {
  return replServer.context.discover({ type, name });
};

replServer.context.clear = async () => {
  await engine.clearCache();
  console.log('Cache cleared');
};

replServer.context.help = () => {
  console.log(`
Examples:
---------

// Find a class by name
await discover({ name: "Calculator" })

// Find by type and methods
await discover({
  type: "class",
  methods: ["add", "subtract"]
})

// Find module exports
await discover({
  exports: "parseModule",
  type: "function"
})

// Quick syntax
await find("class", "Calculator")
`);
};

// Custom command handler for shorthand syntax
replServer.defineCommand('find', {
  help: 'Find code by type and name',
  action(input) {
    const [type, ...nameParts] = input.trim().split(' ');
    const name = nameParts.join(' ');

    this.context.discover({ type, name })
      .then(result => {
        if (result) {
          console.log('Found:', result);
        }
      })
      .catch(console.error);

    this.displayPrompt();
  }
});

console.log('Type help() to see examples\n');