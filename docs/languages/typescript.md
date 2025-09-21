---
layout: default
title: TypeScript Guide
---

# Adaptive Tests for TypeScript

AI‑ready testing for TypeScript. The TS package wraps the JavaScript discovery engine and adds TS niceties (TSX, path aliases).

## Quick Start

```bash
npm install --save-dev @adaptive-tests/typescript typescript ts-node
```

Add a minimal Jest test (ts‑jest or similar):

```typescript
import { getTypeScriptDiscoveryEngine } from '@adaptive-tests/typescript';

test('discovers UserService class', async () => {
  const engine = getTypeScriptDiscoveryEngine(process.cwd());
  const UserService: any = await engine.discoverTarget({ name: 'UserService', type: 'class' });
  expect(new UserService().findById(1)).toBeDefined();
});
```

Diagnose discovery:

```bash
npx adaptive-tests why '{"name":"UserService","type":"class"}'
```

Stuck? Quick fixes:
- Add `.ts`/`.tsx` to `discovery.extensions` in your config.
- Start simple `{ "name": "YourClass" }` then add `type`/`methods`.
- Run `why` and tune based on candidates shown.

## Configuration (optional)
Use the same config format as JavaScript, TS aware by default:

```js
// adaptive-tests.config.js (or .ts)
module.exports = {
  discovery: {
    extensions: ['.ts', '.tsx', '.js'],
    cache: { enabled: true, file: '.adaptive-tests-cache.json' }
  }
};
```

See more:
- [API Reference](../API_REFERENCE.md)
- [Configuration](../CONFIGURATION.md)
- [CLI Reference](../CLI_REFERENCE.md)
