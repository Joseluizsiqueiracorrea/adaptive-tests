/**
 * Synchronous Discovery Wrapper
 *
 * Provides sync interface for require() compatibility
 * Uses caching to avoid async/await in require chains
 */

const { getDiscoveryEngine } = require('./index');

// Sync cache for discovered modules
const syncCache = new Map();
let discoveryEngine = null;

/**
 * Initialize discovery engine (call once)
 */
function initSyncDiscovery() {
  if (!discoveryEngine) {
    discoveryEngine = getDiscoveryEngine(process.cwd(), {
      cache: true,
      parallel: false // Sync mode
    });
  }
}

/**
 * Synchronous discovery (uses cache + fallback)
 */
function discoverSync(signature) {
  initSyncDiscovery();

  const cacheKey = JSON.stringify(signature);

  // Check cache first
  if (syncCache.has(cacheKey)) {
    return syncCache.get(cacheKey);
  }

  try {
    // Sync discovery is not supported - the engine only has async methods
    // This is a fundamental limitation of the current architecture
    throw new Error(
      `Synchronous discovery is not supported. ` +
      `The discovery engine requires async operation for file scanning and AST parsing. ` +
      `Use 'await discover()' instead of 'discoverSync()'.`
    );
  } catch (error) {
    // Cache failures too (don't retry repeatedly)
    syncCache.set(cacheKey, null);
    throw error;
  }
}

/**
 * Clear sync cache (for testing)
 */
function clearSyncCache() {
  syncCache.clear();
}

/**
 * Pre-warm common patterns
 */
function prewarmSyncCache(patterns = []) {
  patterns.forEach(pattern => {
    try {
      discoverSync(pattern);
    } catch (error) {
      // Ignore failures during prewarming
    }
  });
}

module.exports = {
  discoverSync,
  clearSyncCache,
  prewarmSyncCache,
  initSyncDiscovery
};