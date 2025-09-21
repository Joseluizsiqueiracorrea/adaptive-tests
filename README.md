# Adaptive Tests: AI-Ready Testing Infrastructure

[![CI Status](https://github.com/anon57396/adaptive-tests/actions/workflows/ci-javascript.yml/badge.svg)](https://github.com/anon57396/adaptive-tests/actions/workflows/ci-javascript.yml)
[![Docs](https://img.shields.io/badge/docs-website-blue)](https://anon57396.github.io/adaptive-tests/)
[![npm](https://img.shields.io/npm/v/adaptive-tests.svg)](https://www.npmjs.com/package/adaptive-tests)
[![PyPI](https://img.shields.io/pypi/v/adaptive-tests-py.svg)](https://pypi.org/project/adaptive-tests-py/)
[![GitHub Action](https://img.shields.io/badge/GitHub%20Action-Available-green?logo=github)](action.yml)

**Tests that don't break when you move files.**

Traditional tests use hardcoded file paths. When you refactor, they break. Adaptive Tests find your code by its structure, not its location, so your tests are resilient to change.

**The Problem:**

```javascript
// You moved Calculator.js from /utils to /math
import { Calculator } from '../utils/Calculator';
// ❌ Error: Cannot find module '../utils/Calculator'
```

**The Solution:**

```javascript
const Calculator = await discover({ name: 'Calculator' });
// ✅ Found it in /math - tests pass
```

## Table of Contents

- [Why Adaptive Tests?](#why-adaptive-tests)
- [Choose Your Language](#choose-your-language)
- [Quick Start](#quick-start)
- [Features](#features)
- [Developer Tools](#developer-tools)
- [Contributing](#contributing)

## Why Adaptive Tests?

- **Stop wasting time fixing broken imports.** Let your tests adapt to your code, not the other way around.
- **Perfect for AI-powered development.** Let AI agents refactor your code without breaking your test suite.
- **Refactor with confidence.** Clean up your codebase without the fear of a thousand failing tests.
- **Works with your existing tools.** Integrates with Jest, Vitest, Pytest, JUnit, and more.

**[→ Read the full story: Why Adaptive Tests?](docs/WHY_ADAPTIVE_TESTS.md)**

## Choose Your Language

| Language | Status | Package | Guide |
|---|---|---|---|
| **JavaScript** | ✅ Stable | [`@adaptive-tests/javascript`](https://www.npmjs.com/package/@adaptive-tests/javascript) | [Guide](docs/languages/javascript.md) |
| **TypeScript** | ✅ Stable | [`@adaptive-tests/typescript`](https://www.npmjs.com/package/@adaptive-tests/typescript) | [Guide](docs/languages/typescript.md) |
| **Python** | ✅ Stable | [`adaptive-tests-py`](https://pypi.org/project/adaptive-tests-py/) | [Guide](docs/languages/python.md) |
| **Java** | ✅ Stable | `io.adaptivetests` | [Guide](docs/languages/java.md) |

> ℹ️  The TypeScript package wraps the JavaScript discovery engine. Installing `@adaptive-tests/typescript` pulls in the JavaScript core automatically.

## Quick Start

Get started in minutes with our interactive setup wizard.

```bash
# For JavaScript/TypeScript
npm install @adaptive-tests/javascript --save-dev
npx adaptive-tests init

# (Optional) Diagnose discovery
npx adaptive-tests why '{"name":"Calculator","type":"class"}'

# For Python
pip install adaptive-tests-py
adaptive-tests init
```

Stuck? Try these quick fixes:
- Ensure your file types are included (e.g., add `.ts`/`.tsx` in discovery.extensions)
- Try a simpler signature: `{ "name": "YourClass" }`
- Run `npx adaptive-tests why '…'` and adjust based on the result

Works with Cursor / Copilot / VS Code — no extension required.

**[→ See the full Quick Start Guide](QUICKSTART.md)**

## Features

- **AST-based discovery:** Finds code by its structure, not its location.
- **"Invisible Mode":** Automatically fixes broken imports in your existing tests with zero code changes.
- **Powerful CLI:** Scaffold tests, debug discovery, and migrate your entire test suite.
- **Framework-agnostic:** Works with your favorite testing framework.

## Developer Tools

- **[GitHub Action](./action.yml):** Run your adaptive tests in CI.

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for more details.

---

**[Documentation](https://anon57396.github.io/adaptive-tests/)** • **[Report an Issue](https://github.com/anon57396/adaptive-tests/issues)**
