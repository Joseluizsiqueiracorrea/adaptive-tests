/**
 * Minimal logger abstraction that defaults to console output but allows
 * callers to inject custom loggers (e.g. Winston, Pino) when desired.
 */

const LEVELS = ['error', 'warn', 'info', 'debug', 'trace'];
const ENV_LOG_LEVEL = (process.env.ADAPTIVE_LOG_LEVEL || '').toLowerCase();
const DEFAULT_LEVEL = LEVELS.includes(ENV_LOG_LEVEL) ? ENV_LOG_LEVEL : 'warn';
const THRESHOLD_INDEX = LEVELS.indexOf(DEFAULT_LEVEL);

const bindConsoleMethod = (method) => {
  if (typeof console === 'undefined') {
    return () => {};
  }

  const fallback = typeof console.log === 'function' ? console.log.bind(console) : () => {};
  if (typeof console[method] === 'function') {
    return console[method].bind(console);
  }
  return fallback;
};

const applyLogLevelGate = (logger) => {
  const gated = {};
  LEVELS.forEach((level) => {
    const method = typeof logger[level] === 'function'
      ? logger[level]
      : bindConsoleMethod(level === 'trace' ? 'debug' : level);

    gated[level] = (...args) => {
      if (LEVELS.indexOf(level) <= THRESHOLD_INDEX) {
        method(...args);
      }
    };
  });
  return gated;
};

const createDefaultLogger = () => applyLogLevelGate(
  LEVELS.reduce((logger, level) => {
    logger[level] = bindConsoleMethod(level === 'trace' ? 'debug' : level);
    return logger;
  }, {})
);

let currentLogger = createDefaultLogger();

const normaliseLogger = (candidate) => {
  if (!candidate || typeof candidate !== 'object') {
    return createDefaultLogger();
  }

  const logger = {};
  for (const level of LEVELS) {
    const method = candidate[level];
    if (typeof method === 'function') {
      logger[level] = method.bind(candidate);
    } else {
      logger[level] = bindConsoleMethod(level === 'trace' ? 'debug' : level);
    }
  }
  return applyLogLevelGate(logger);
};

function setLogger(logger) {
  currentLogger = normaliseLogger(logger);
}

function getLogger() {
  return currentLogger;
}

module.exports = {
  getLogger,
  setLogger,
};
