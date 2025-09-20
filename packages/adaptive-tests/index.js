'use strict';

const javascript = require('@adaptive-tests/javascript');

let typescript = null;
try {
  typescript = require('@adaptive-tests/typescript');
} catch (error) {
  // Optional dependency - ignore if not installed
}

if (typescript && !javascript.typescript) {
  Object.defineProperty(javascript, 'typescript', {
    value: typescript,
    enumerable: true
  });
}

module.exports = javascript;
