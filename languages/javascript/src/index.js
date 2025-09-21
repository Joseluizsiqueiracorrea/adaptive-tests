/**
 * Adaptive Testing - Main exports
 *
 * MIT License - Use this anywhere
 */

const { DiscoveryEngine, getDiscoveryEngine } = require('./discovery-engine');
// TypeScript discovery should be imported from @adaptive-tests/typescript package, not here
const { AdaptiveTest, adaptiveTest } = require('./test-base');
const { ConfigLoader, DEFAULT_CONFIG } = require('./config-loader');
const { ScoringEngine } = require('./scoring-engine');
const { setLogger, getLogger } = require('./logger');

/**
 * @typedef {import('./discovery-engine').DiscoverySignature} DiscoverySignature
 * @typedef {import('./discovery-engine').TargetType} TargetType
 * @typedef {import('./discovery-engine').DiscoveryOptions} DiscoveryOptions
 */

/**
 * A convenience function to quickly discover a target without creating an engine instance directly.
 * @template T
 * @param {string | DiscoverySignature} signature - The signature (or name) of the target to discover.
 * @param {string | DiscoveryOptions} [rootPathOrOptions=process.cwd()] - The root directory to scan from or options object with searchDirectory.
 * @returns {Promise<T>} A promise that resolves with the discovered target.
 */
async function discover(signature, rootPathOrOptions = process.cwd()) {
  const normalizedSignature = typeof signature === 'string'
    ? { name: signature }
    : signature;

  // Handle both string path and options object
  let rootPath, config;
  if (typeof rootPathOrOptions === 'string') {
    rootPath = rootPathOrOptions;
    config = {};
  } else if (rootPathOrOptions && typeof rootPathOrOptions === 'object') {
    rootPath = rootPathOrOptions.searchDirectory || rootPathOrOptions.rootPath || process.cwd();
    config = rootPathOrOptions;
  } else {
    rootPath = process.cwd();
    config = {};
  }

  const engine = getDiscoveryEngine(rootPath, config);
  return await engine.discoverTarget(normalizedSignature);
}

module.exports = {
  // Core classes
  DiscoveryEngine,
  AdaptiveTest,

  // Scaffolding
  ...require('./scaffolding'),

  // Convenience functions
  getDiscoveryEngine,
  adaptiveTest,
  discover,

  // Configuration utilities
  ConfigLoader,
  ScoringEngine,
  DEFAULT_CONFIG,

  // Logging
  setLogger,
  getLogger,
};
