/**
 * Logger utility for Adaptive Tests
 *
 * Simple debug-based logger that can be enabled with DEBUG=adaptive-tests
 */

const debug = require('debug');

function getLogger(namespace = 'adaptive-tests') {
  const logger = debug(namespace);

  // Add missing methods that are used throughout the codebase
  logger.warn = logger;
  logger.error = logger;
  logger.info = logger;
  logger.log = logger;

  return logger;
}

module.exports = { getLogger };