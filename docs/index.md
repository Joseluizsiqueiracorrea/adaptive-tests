---
layout: default
title: Adaptive Tests
description: Tests that find your code automatically, no matter where you move it
---

## Tests That Never Break When You Move Files

**Stop fixing import errors.** Traditional tests break every time you reorganize code because they use hardcoded file paths. Adaptive Tests find your code by understanding what it looks like, not where it lives.

## The Problem Every Developer Knows

You refactor your codebase → Tests explode with import errors → You waste hours fixing paths instead of shipping features.

**We eliminated this problem entirely.**

## Before and After

### Traditional Tests (Break When Files Move)

```javascript
// Hardcoded file path - breaks when you move Calculator.js
import { Calculator } from '../utils/Calculator';

test('calculator works', () => {
  const calc = new Calculator();
  expect(calc.add(2, 3)).toBe(5);
});
```

### Adaptive Tests (Work Anywhere)

```javascript
// Finds Calculator by structure, not location
const Calculator = await discover({
  name: 'Calculator',
  type: 'class',
  methods: ['add', 'subtract']
});

test('calculator works', () => {
  const calc = new Calculator();
  expect(calc.add(2, 3)).toBe(5);
});
```

**Move `Calculator.js` anywhere in your project. The adaptive test still works.**

## Quick Start

### JavaScript

```bash
npm install @adaptive-tests/javascript
npx adaptive-tests init
```

### TypeScript

```bash
npm install @adaptive-tests/typescript
npx adaptive-tests init
```

### Python

```bash
pip install adaptive-tests-py
adaptive-tests init
```

### Java

```xml
<dependency>
    <groupId>io.adaptivetests</groupId>
    <artifactId>adaptive-tests-java</artifactId>
    <version>0.3.0-SNAPSHOT</version>
</dependency>
```

## How It Works

Instead of importing by file path, you **discover** code by its structure:

- **Name**: What is it called?
- **Type**: Is it a class, function, or module?
- **Methods**: What methods does it have? (for classes)
- **Exports**: What does it export? (for modules)

Our discovery engine analyzes your code's AST (Abstract Syntax Tree) to find matches based on these structural characteristics.

## Perfect For

- **🤖 AI-powered development** - Let Copilot/Cursor reorganize without breaking tests
- **🏗️ Large refactors** - Clean up tech debt without hours of import fixing
- **📦 Big codebases** - Find code instantly in massive projects
- **🚀 Fast iteration** - Stop wasting time on broken imports

## Framework Support

Works with your existing test framework:

| Framework | Language | Package |
|-----------|----------|---------|
| Jest | JavaScript | `@adaptive-tests/javascript` |
| Mocha | JavaScript | `@adaptive-tests/javascript` |
| Vitest | JavaScript | `@adaptive-tests/javascript` |
| Pytest | Python | `adaptive-tests-py` |
| JUnit | Java | `adaptive-tests-java` |

## Real Example

**Before** - Fragile imports that break when you reorganize:

```javascript
import { UserService } from '../../../backend/services/users/UserService';
import { AuthService } from '../../../backend/auth/AuthService';
import { Database } from '../../../infrastructure/db/Database';
```

**After** - Resilient discovery that works anywhere:

```javascript
const UserService = await discover({ name: 'UserService', type: 'class' });
const AuthService = await discover({ name: 'AuthService', type: 'class' });
const Database = await discover({ name: 'Database', type: 'class' });
```

## Documentation

**Getting Started:**

- [Why Adaptive Tests?](WHY_ADAPTIVE_TESTS.md) - The complete problem and solution
- [Migration Guide](MIGRATION_GUIDE.md) - Convert your existing tests
- [Best Practices](BEST_PRACTICES.md) - Patterns for success

**Language Guides:**

- [JavaScript](../languages/javascript/README.md)
- [TypeScript](../languages/typescript/README.md)
- [Python](../languages/python/README.md)
- [Java](../languages/java/README.md)

**Framework Guides:**

- [React](../languages/javascript/docs/REACT_QUICKSTART.md)
- [Vue.js](../languages/javascript/docs/VUE_QUICKSTART.md)
- [Express](../languages/javascript/docs/EXPRESS_QUICKSTART.md)

**Advanced:**

- [How It Works](HOW_IT_WORKS.md) - Technical deep dive
- [API Reference](API_REFERENCE.md) - Complete API docs
- [CI/CD Integration](CI_STRATEGY.md) - GitHub Actions and more

## Get Started Now

```bash
# JavaScript/TypeScript
npm install @adaptive-tests/javascript

# Python
pip install adaptive-tests-py

# Get started quickly
npx adaptive-tests init
```

**[GitHub Repository](https://github.com/anon57396/adaptive-tests)** • **[NPM Package](https://www.npmjs.com/package/adaptive-tests)** • **[Report Issues](https://github.com/anon57396/adaptive-tests/issues)**

---

**Stop fixing imports. Start shipping features.**
