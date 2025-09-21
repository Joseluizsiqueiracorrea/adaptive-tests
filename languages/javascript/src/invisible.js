/**
 * Invisible Adaptive Imports (JS/TS Only - Experimental)
 *
 * FEATURE-FLAGGED: Only activates when explicitly enabled
 * ISOLATED: Does not interfere with existing discovery APIs
 * ESCAPE HATCH: Can be disabled per-test or globally
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const debug = require('debug')('adaptive-tests:invisible');

const PROJECT_ROOT = process.cwd();
const ADAPTIVE_DIR = path.join(PROJECT_ROOT, '.adaptive-tests');
const HISTORY_FILE = path.join(ADAPTIVE_DIR, 'invisible-history.json');
const TELEMETRY_FILE = path.join(ADAPTIVE_DIR, 'invisible-telemetry.log');
const TELEMETRY_ENABLED = Boolean(process.env.ADAPTIVE_TESTS_TELEMETRY);
const RECOVERED_SIGNATURES = new Set();

const DEFAULT_SEARCH_DIRS = ['src', 'lib', 'app'];
const DEFAULT_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.cjs', '.mjs'];
const IGNORE_GLOBS = ['**/node_modules/**', '**/dist/**', '**/build/**', '**/coverage/**', '**/tests/**', '**/__tests__/**'];

// Feature flag - must be explicitly enabled
let INVISIBLE_MODE_ENABLED = false;
let ESCAPE_HATCH_PATTERNS = [];
let INVISIBLE_OPTIONS = {
  searchDirs: DEFAULT_SEARCH_DIRS,
  extensions: DEFAULT_EXTENSIONS
};
const RESOLVED_CACHE = new Map();
const FAILED_CACHE = new Set();
let TS_NODE_REGISTERED = false;

function ensureAdaptiveDir() {
  try {
    if (!fs.existsSync(ADAPTIVE_DIR)) {
      fs.mkdirSync(ADAPTIVE_DIR, { recursive: true });
    }
  } catch (error) {
    debug('⚠️ Unable to ensure adaptive dir: %s', error.message);
  }
}

function recordTelemetry(event, payload = {}) {
  if (!TELEMETRY_ENABLED) {
    return;
  }

  try {
    ensureAdaptiveDir();
    const entry = {
      event,
      timestamp: new Date().toISOString(),
      ...payload
    };
    fs.appendFileSync(TELEMETRY_FILE, `${JSON.stringify(entry)}\n`, 'utf8');
  } catch (error) {
    debug('⚠️ Failed to write telemetry: %s', error.message);
  }
}

function updateHistory(entry) {
  try {
    ensureAdaptiveDir();
    const history = fs.existsSync(HISTORY_FILE)
      ? JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'))
      : [];

    if (Array.isArray(history)) {
      history.unshift(entry);
      if (history.length > 50) {
        history.length = 50;
      }
      fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
    }
  } catch (error) {
    debug('⚠️ Failed to update invisible history: %s', error.message);
  }
}

function logInvisibleSuccess(originalPath, suggestion) {
  const key = suggestion;
  if (!RECOVERED_SIGNATURES.has(key)) {
    RECOVERED_SIGNATURES.add(key);
    console.info(
      `⚡ Adaptive Tests invisible mode recovered "${suggestion}" from ${originalPath}. Try "npx adaptive-tests why '{"name":"${suggestion}"}'" to inspect.`
    );
  }

  updateHistory({
    modulePath: originalPath,
    suggestion,
    mode: 'fallback',
    timestamp: new Date().toISOString()
  });
  recordTelemetry('fallback_success', { modulePath: originalPath, suggestion, mode: 'fallback' });
}

function handleDiscoveryFailure(originalPath, suggestion, error) {
  recordTelemetry('fallback_failure', {
    modulePath: originalPath,
    suggestion,
    message: error.message
  });

  if (FAILED_CACHE.has(`${originalPath}:${suggestion}`)) {
    return;
  }
  FAILED_CACHE.add(`${originalPath}:${suggestion}`);

  console.warn(
    `⚠️ Adaptive Tests invisible mode could not resolve "${originalPath}" (searched for "${suggestion}"). ` +
      'Run "npx adaptive-tests migrate" or update the import manually.'
  );
}

function normaliseSearchDir(dir) {
  if (!dir) {
    return '';
  }
  return dir.replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/$/, '');
}

function getSearchDirs(overrides = []) {
  const dirs = overrides.length > 0 ? overrides : INVISIBLE_OPTIONS.searchDirs;
  const resolved = dirs
    .map(normaliseSearchDir)
    .map((dir) => (dir ? path.join(PROJECT_ROOT, dir) : PROJECT_ROOT))
    .filter((dirPath, index, arr) => arr.indexOf(dirPath) === index && fs.existsSync(dirPath));

  if (resolved.length === 0) {
    return [PROJECT_ROOT];
  }
  return resolved;
}

function ensureTypeScriptSupportForPath(filePath) {
  if (TS_NODE_REGISTERED) {
    return;
  }
  const ext = path.extname(filePath);
  if (ext !== '.ts' && ext !== '.tsx') {
    return;
  }
  try {
    require('ts-node').register({
      transpileOnly: true,
      compilerOptions: {
        module: 'commonjs',
        target: 'es2020'
      }
    });
    TS_NODE_REGISTERED = true;
  } catch (error) {
    throw new Error(
      'TypeScript support requires ts-node.\n' +
        'Install it with: npm install --save-dev ts-node'
    );
  }
}

function resolveFallbackModule(suggestion, modulePath, options = {}) {
  const cacheKey = `${modulePath}:${suggestion}`;
  if (RESOLVED_CACHE.has(cacheKey)) {
    return RESOLVED_CACHE.get(cacheKey);
  }
  if (FAILED_CACHE.has(cacheKey)) {
    return null;
  }

  const extensions = options.extensions || INVISIBLE_OPTIONS.extensions;
  const searchDirs = getSearchDirs(options.searchDirs || []);
  const matches = new Set();

  const patterns = extensions.map((ext) => `${suggestion}${ext}`);
  searchDirs.forEach((dir) => {
    const relativeDir = normaliseSearchDir(path.relative(PROJECT_ROOT, dir));
    patterns.forEach((pattern) => {
      const globPattern = relativeDir ? `${relativeDir}/**/${pattern}` : `**/${pattern}`;
      glob.sync(globPattern, {
        cwd: PROJECT_ROOT,
        ignore: IGNORE_GLOBS,
        absolute: true,
        nocase: true,
        nodir: true
      }).forEach((absPath) => matches.add(path.resolve(absPath)));
    });
  });

  if (matches.size === 0) {
    // Fallback to project-wide search if scoped search failed.
    extensions.forEach((ext) => {
      glob.sync(`**/${suggestion}${ext}`, {
        cwd: PROJECT_ROOT,
        ignore: IGNORE_GLOBS,
        absolute: true,
        nocase: true,
        nodir: true
      }).forEach((absPath) => matches.add(path.resolve(absPath)));
    });
  }

  const [resolved] = Array.from(matches);
  if (!resolved) {
    return null;
  }

  ensureTypeScriptSupportForPath(resolved);
  RESOLVED_CACHE.set(cacheKey, resolved);
  return resolved;
}

/**
 * Smart require with transparent adaptive fallback
 * Only works for relative imports to avoid npm module conflicts
 */
async function adaptiveRequire(modulePath, options = {}) {
  if (!INVISIBLE_MODE_ENABLED) {
    return require(modulePath);
  }

  if (ESCAPE_HATCH_PATTERNS.some(pattern => modulePath.includes(pattern))) {
    debug(`🚪 Escape hatch: ${modulePath}`);
    return require(modulePath);
  }

  try {
    return require(modulePath);
  } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND' || !isRelativeImport(modulePath)) {
      throw error;
    }

    const suggestion = extractModuleName(modulePath);
    debug(`📍 Module moved: ${modulePath} → searching for ${suggestion}`);
    console.warn(`⚡ Adaptive Tests invisible mode: ${modulePath} not found, searching project for "${suggestion}"`);

    try {
      const resolvedPath = resolveFallbackModule(suggestion, modulePath, options);
      if (!resolvedPath) {
        throw Object.assign(new Error(`Unable to locate ${suggestion}`), { code: 'MODULE_NOT_FOUND' });
      }
      const exportValue = require(resolvedPath);
      logInvisibleSuccess(modulePath, suggestion);
      return exportValue;
    } catch (fallbackError) {
      handleDiscoveryFailure(modulePath, suggestion, fallbackError);
      throw error;
    }
  }
}

/**
 * Only adapt relative imports to avoid npm conflicts
 */
function isRelativeImport(modulePath) {
  return modulePath.startsWith('./') || modulePath.startsWith('../');
}

/**
 * Extract likely class/module name from require path
 */
function extractModuleName(modulePath) {
  // './src/services/UserService' -> 'UserService'
  // '../UserService.js' -> 'UserService'
  // './UserService' -> 'UserService'

  const filename = path.basename(modulePath, path.extname(modulePath));

  // Handle index files
  if (filename === 'index') {
    return path.basename(path.dirname(modulePath));
  }

  return filename;
}

/**
 * Type inference from file path
 */
/**
 * Feature flags and configuration
 */
function enableInvisibleMode(options = {}) {
  INVISIBLE_MODE_ENABLED = true;
  ESCAPE_HATCH_PATTERNS = options.escapePatterns || ['node_modules', '.mock', 'test-utils'];
  if (Array.isArray(options.searchDirs) && options.searchDirs.length > 0) {
    INVISIBLE_OPTIONS.searchDirs = options.searchDirs;
  }
  if (Array.isArray(options.extensions) && options.extensions.length > 0) {
    INVISIBLE_OPTIONS.extensions = options.extensions.map((ext) => (ext.startsWith('.') ? ext : `.${ext}`));
  }

  RESOLVED_CACHE.clear();
  FAILED_CACHE.clear();

  debug('🎭 Invisible mode enabled', {
    escapePatterns: ESCAPE_HATCH_PATTERNS,
    searchDirs: INVISIBLE_OPTIONS.searchDirs,
    extensions: INVISIBLE_OPTIONS.extensions
  });
}

function disableInvisibleMode() {
  INVISIBLE_MODE_ENABLED = false;
  debug('🎭 Invisible mode disabled');
}

function addEscapePattern(pattern) {
  ESCAPE_HATCH_PATTERNS.push(pattern);
  debug(`🚪 Added escape pattern: ${pattern}`);
}

/**
 * Opt-in Jest setup (does not auto-enable)
 */
function setupForJest(config = {}) {
  // Only enable if explicitly requested
  if (config.invisible === true) {
    enableInvisibleMode(config);
    console.log('⚡ Adaptive Tests: Invisible mode enabled for Jest');
  }
}

/**
 * Safe Module.require patching with isolation
 */
function patchRequireWithIsolation() {
  if (!INVISIBLE_MODE_ENABLED) {
    debug('🛡️ Require patching skipped - invisible mode disabled');
    return;
  }

  const Module = require('module');
  const originalRequire = Module.prototype.require;

  // Store original for cleanup
  Module.prototype._originalRequire = originalRequire;

  Module.prototype.require = function(id) {
    try {
      return originalRequire.call(this, id);
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND' && isRelativeImport(id)) {
        const suggestion = extractModuleName(id);

        debug(`🔄 Intercepted broken import: ${id} → ${suggestion}`);

        try {
          const resolvedPath = resolveFallbackModule(suggestion, id);
          if (!resolvedPath) {
            throw Object.assign(new Error(`Unable to locate ${suggestion}`), { code: 'MODULE_NOT_FOUND' });
          }
          const exportValue = originalRequire.call(this, resolvedPath);
          logInvisibleSuccess(id, suggestion);
          return exportValue;
        } catch (fallbackError) {
          debug(`❌ Fallback failed for ${suggestion}:`, fallbackError.message);
          handleDiscoveryFailure(id, suggestion, fallbackError);
          throw error; // Re-throw original error
        }
      }

      throw error;
    }
  };

  debug('🔧 Module.require patched with isolation');
}

/**
 * Cleanup function to restore original require
 */
function restoreOriginalRequire() {
  const Module = require('module');
  if (Module.prototype._originalRequire) {
    Module.prototype.require = Module.prototype._originalRequire;
    delete Module.prototype._originalRequire;
    debug('🧹 Original require restored');
  }
}

module.exports = {
  // Core functionality
  adaptiveRequire,
  extractModuleName,

  // Feature flags
  enableInvisibleMode,
  disableInvisibleMode,
  addEscapePattern,

  // Framework integration
  setupForJest,
  patchRequireWithIsolation,
  restoreOriginalRequire,

  // Inspection
  isInvisibleModeEnabled: () => INVISIBLE_MODE_ENABLED,
  getEscapePatterns: () => [...ESCAPE_HATCH_PATTERNS]
};
