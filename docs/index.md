---
layout: default
title: Adaptive Tests - Tests That Never Break
---

<div align="center">

## Your Tests Break When You Move Files

### **Ours Don't**

<br>

### 🎯 Move `UserService.js` anywhere. Tests still work

### 🚀 Refactor your entire codebase. Tests still work

### ✨ Let AI reorganize everything. Tests still work

<br>

```javascript
// This breaks when you move files ❌
import { UserService } from '../../../services/UserService';

// This works no matter where files live ✅
const UserService = await discover('UserService');
```

<br>

**[Get Started in 2 Minutes →](#quick-start)** | **[See Live Demo](https://github.com/anon57396/adaptive-tests)** | **[Why It Works](#how-it-works)**

</div>

---

## The Problem We Solve

Every developer knows this pain:

1. **You refactor** → Move files to better locations
2. **Tests explode** → `Cannot find module '../old/path'`
3. **You waste hours** → Fixing imports instead of shipping features

**We eliminated this problem entirely.**

---

## Quick Start

Pick your language and start in literally 2 minutes:

### JavaScript / TypeScript

```bash
npm install @adaptive-tests/javascript
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
    <version>0.1.0</version>
</dependency>
```

---

## How It Works

Traditional tests use **file paths** to find code:

```javascript
import { Calculator } from '../utils/Calculator'; // Breaks when moved
```

Adaptive tests use **code structure** to find code:

```javascript
const Calculator = await discover({
  name: 'Calculator',
  type: 'class',
  methods: ['add', 'subtract']
}); // Works anywhere
```

We analyze your code's AST (Abstract Syntax Tree) to find what you're looking for based on its structure, not its location.

---

## Real Examples

### Before (Fragile)

```javascript
// Break every time you reorganize
import { UserService } from '../../../backend/services/users/UserService';
import { AuthService } from '../../../backend/auth/AuthService';
import { Database } from '../../../infrastructure/db/Database';

describe('User management', () => {
  // If any file moves, tests fail before even running
});
```

### After (Bulletproof)

```javascript
const { discover } = require('@adaptive-tests/javascript');

// Find by what they ARE, not where they live
const UserService = await discover({ name: 'UserService', type: 'class' });
const AuthService = await discover({ name: 'AuthService', type: 'class' });
const Database = await discover({ name: 'Database', type: 'class' });

describe('User management', () => {
  // Move files anywhere. Tests keep working.
});
```

---

## Who Uses This?

Perfect for teams that:

- 🤖 **Use AI agents** - Let Copilot/Cursor reorganize without breaking tests
- 🏗️ **Refactor frequently** - Clean up tech debt without test maintenance
- 📦 **Have large codebases** - Find code in massive projects instantly
- 🚀 **Ship fast** - Stop wasting time on broken imports

---

## Framework Support

Works with your existing test framework:

| Framework | Support | Package |
|-----------|---------|---------|
| **Jest** | ✅ Full | `@adaptive-tests/javascript` |
| **Mocha** | ✅ Full | `@adaptive-tests/javascript` |
| **Vitest** | ✅ Full | `@adaptive-tests/javascript` |
| **Pytest** | ✅ Full | `adaptive-tests-py` |
| **JUnit** | ✅ Full | `adaptive-tests-java` |
| **TypeScript** | ✅ Full | `@adaptive-tests/typescript` |

---

## Documentation

### Essentials

- [Why Adaptive Tests?](WHY_ADAPTIVE_TESTS.md) - Deep dive into the problem & solution
- [Migration Guide](MIGRATION_GUIDE.md) - Convert existing tests
- [Best Practices](BEST_PRACTICES.md) - Patterns for success

### Language Guides

- [JavaScript Guide](../languages/javascript/README.md)
- [TypeScript Guide](../languages/typescript/README.md)
- [Python Guide](../languages/python/README.md)
- [Java Guide](../languages/java/README.md)

### Framework Quickstarts

- [React](../languages/javascript/docs/REACT_QUICKSTART.md)
- [Vue.js](../languages/javascript/docs/VUE_QUICKSTART.md)
- [Express](../languages/javascript/docs/EXPRESS_QUICKSTART.md)

### Advanced

- [How It Works](HOW_IT_WORKS.md) - Technical architecture
- [API Reference](API_REFERENCE.md) - Complete API docs
- [CI/CD Integration](CI_STRATEGY.md) - GitHub Actions & more

---

## Get Started Now

```bash
# Try it in under 2 minutes
npm install @adaptive-tests/javascript
npx adaptive-tests init
```

**[GitHub Repository](https://github.com/anon57396/adaptive-tests)** | **[NPM Package](https://www.npmjs.com/package/adaptive-tests)** | **[Report Issues](https://github.com/anon57396/adaptive-tests/issues)**

---

<div align="center">

## Stop fixing imports. Start shipping features

Built with ❤️ for developers who refactor fearlessly

</div>
