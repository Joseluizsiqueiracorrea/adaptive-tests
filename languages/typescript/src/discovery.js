/**
 * TypeScript Discovery Engine - Extends DiscoveryEngine for TS support
 *
 * MIT License - Use this anywhere
 */

const path = require('path');
// Import public API from JavaScript package
const { DiscoveryEngine } = require('@adaptive-tests/javascript');

/**
 * @typedef {import('@adaptive-tests/javascript/src/discovery-engine').DiscoveryOptions} DiscoveryOptions
 */

/**
 * An extension of the DiscoveryEngine that understands TypeScript files.
 */
class TypeScriptDiscoveryEngine extends DiscoveryEngine {
  /**
   * @param {string} [rootPath=process.cwd()] - The root directory to start scanning from.
   * @param {DiscoveryOptions} [options={}] - Configuration options for the engine.
   */
  constructor(rootPath = process.cwd(), options = {}) {
    // Ensure TypeScript extensions are included under discovery.extensions
    const defaultTSExtensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];
    const base = (options && typeof options === 'object') ? options : {};
    const baseDiscovery = base.discovery || {};
    const mergedExtensions = Array.isArray(baseDiscovery.extensions) && baseDiscovery.extensions.length > 0
      ? Array.from(new Set([...baseDiscovery.extensions, ...defaultTSExtensions]))
      : defaultTSExtensions;
    const inlineConfig = {
      ...base,
      discovery: {
        ...baseDiscovery,
        extensions: mergedExtensions
      }
    };
    super(rootPath, inlineConfig);
  }
}

const tsEnginesByRoot = new Map();

/**
 * Gets a singleton instance of the TypeScriptDiscoveryEngine for a given root path.
 * @param {string} [rootPath=process.cwd()] - The root directory for the engine instance.
 * @returns {TypeScriptDiscoveryEngine} The singleton TypeScriptDiscoveryEngine instance.
 */
function getTypeScriptDiscoveryEngine(rootPath = process.cwd()) {
  const normalizedRoot = path.resolve(rootPath || process.cwd());
  if (!tsEnginesByRoot.has(normalizedRoot)) {
    tsEnginesByRoot.set(normalizedRoot, new TypeScriptDiscoveryEngine(normalizedRoot));
  }
  return tsEnginesByRoot.get(normalizedRoot);
}

module.exports = { TypeScriptDiscoveryEngine, getTypeScriptDiscoveryEngine };
