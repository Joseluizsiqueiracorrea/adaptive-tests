# Configuration Guide

This page shows how to configure Adaptive Tests for common setups. Keep it simple: start with the defaults, add only what you need.

## JavaScript / TypeScript

Create `adaptive-tests.config.js` in your project root:

```js
/** @type {import('@adaptive-tests/javascript').DiscoveryOptions} */
module.exports = {
  discovery: {
    // File types to scan. Add `.ts` / `.tsx` for TS projects
    extensions: ['.js', '.ts', '.tsx'],

    // Depth of directory traversal (default ~10)
    maxDepth: 10,

    // Folders to skip during scanning
    skipDirectories: [
      'node_modules', '.git', 'dist', 'build', 'coverage',
      '__tests__', '__mocks__'
    ],

    // Cache results to speed up repeated runs
    cache: {
      enabled: true,
      file: '.adaptive-tests-cache.json',
      // ttl: 24 * 60 * 60, // seconds (optional)
      logWarnings: false
    },

    // Tuning signals. Defaults are sane; tweak only if needed.
    scoring: {
      // allowLooseNameMatch: true,
      // looseNamePenalty: -25,
      paths: {
        positive: { '/src/': 12, '/app/': 6, '/lib/': 4 },
        negative: { '/__tests__/': -40, '/fixtures/': -15 }
      }
    }
  }
};
```

Use it in tests (Jest example):

```js
const { getDiscoveryEngine } = require('@adaptive-tests/javascript');

test('Calculator', async () => {
  const engine = getDiscoveryEngine(process.cwd(), require('./adaptive-tests.config.js'));
  const Calculator = await engine.discoverTarget({ name: 'Calculator', type: 'class' });
  expect(new Calculator().add(2, 3)).toBe(5);
});
```

### TypeScript path aliases

If you use path aliases, Adaptive Tests will attempt to resolve them automatically from `tsconfig.json`. Keep your aliases in `compilerOptions.paths` and ensure the config lives at the repo root (or pass a custom rootPath to `getDiscoveryEngine`).

## Python

Most projects don’t need a config file. To customize runtime behavior, pass options to `DiscoveryEngine` or create a small module to centralize defaults.

```python
from adaptive_tests_py.discovery import DiscoveryEngine

def make_engine(root=None):
    return DiscoveryEngine(root, config={
        "discovery": {
            "extensions": [".py"],
            "max_depth": 12,
            "skip_directories": [".git", "__pycache__", ".venv", "build"],
            "cache": {"enabled": True, "file": ".adaptive-tests-cache.json"}
        }
    })
```

## Java

Java uses its own package under `languages/java`. Maven/Gradle layouts are detected automatically. Consult the Java README for details on configuration and scaffolding.

## Tips

- Start with the defaults; add or remove extensions only if discovery is slow or scanning unwanted files.
- When discovery fails, run:
  - `npx adaptive-tests why '{"name":"YourClass"}'` (JS/TS)
  - or tune your signature (name/type/methods) and re-run.
- Keep configuration under version control. The cache file `.adaptive-tests-cache.json` can be committed or ignored depending on your workflow.
