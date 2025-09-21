/**
 * Logger utility for Adaptive Tests
 *
 * Simple debug-based logger that can be enabled with DEBUG=adaptive-tests.
 * Optionally allow consumers to inject a custom logger or logger factory.
 */

const debug = require('debug');

let customLoggerFactory = null;

function addMissingMethods(loggerLike) {
  if (!loggerLike) return debug('adaptive-tests');
  const noop = () => {};
  const l = typeof loggerLike === 'function' ? loggerLike : loggerLike;
  l.warn = typeof l.warn === 'function' ? l.warn : (typeof l === 'function' ? l : noop);
  l.error = typeof l.error === 'function' ? l.error : (typeof l === 'function' ? l : noop);
  l.info = typeof l.info === 'function' ? l.info : (typeof l === 'function' ? l : noop);
  l.log = typeof l.log === 'function' ? l.log : (typeof l === 'function' ? l : noop);
  l.debug = typeof l.debug === 'function' ? l.debug : (typeof l === 'function' ? l : noop);
  return l;
}

function setLogger(factoryOrLogger) {
  if (typeof factoryOrLogger === 'function') {
    customLoggerFactory = factoryOrLogger;
  } else if (factoryOrLogger && typeof factoryOrLogger === 'object') {
    customLoggerFactory = () => factoryOrLogger;
  } else {
    customLoggerFactory = null;
  }
}

function getLogger(namespace = 'adaptive-tests') {
  if (customLoggerFactory) {
    try {
      const provided = customLoggerFactory(namespace);
      if (provided) {
        return addMissingMethods(provided);
      }
    } catch (_) {
      // fall back to default
    }
  }
  const logger = debug(namespace);
  logger.warn = logger;
  logger.error = logger;
  logger.info = logger;
  logger.log = logger;
  return logger;
}

module.exports = { getLogger, setLogger };
