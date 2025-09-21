---
layout: default
title: JavaScript Guide
---

# Adaptive Tests for JavaScript

AI‑ready testing that survives refactors. Finds code by its structure, not by file paths.

## Quick Start (60 seconds)

```bash
# Install
npm install --save-dev @adaptive-tests/javascript

# Optional: diagnose discovery for a class
npx adaptive-tests why '{"name":"Calculator","type":"class"}'
```

Add a minimal Jest test:

```javascript
const { getDiscoveryEngine } = require('@adaptive-tests/javascript');

test('discovers Calculator class', async () => {
  const engine = getDiscoveryEngine();
  const Calculator = await engine.discoverTarget({ name: 'Calculator', type: 'class' });
  expect(new Calculator().add(2, 3)).toBe(5);
});
```

Stuck? Try these quick fixes:
- Include your file types (e.g., add `.ts`/`.tsx` in `discovery.extensions`).
- Start simple: `{ "name": "YourClass" }`, then add `type`/`methods`.
- Run `npx adaptive-tests why '…'` to see candidates and scores.

## Configuration (optional)
Create `adaptive-tests.config.js` at the repo root when you need to customize scanning:

```javascript
/** @type {import('@adaptive-tests/javascript').DiscoveryOptions} */
module.exports = {
  discovery: {
    extensions: ['.js', '.ts', '.tsx'],
    maxDepth: 10,
    skipDirectories: ['node_modules', '.git', 'dist', 'build', 'coverage'],
    cache: { enabled: true, file: '.adaptive-tests-cache.json' }
  }
};
```

See the full guides:
- [API Reference](../API_REFERENCE.md)
- [Configuration](../CONFIGURATION.md)
- [CLI Reference](../CLI_REFERENCE.md)
