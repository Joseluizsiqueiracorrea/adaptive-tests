---
layout: default
title: Adaptive Tests Documentation
---

> Stop fixing import errors. Start shipping features. Tests that find your code automatically, no matter where you move it.

## 🚀 See It Work in 30 Seconds

```bash
# 1. Install adaptive-tests
npm install --save-dev adaptive-tests

# 2. Try our interactive demo
npx adaptive-tests demo

# 3. Or jump straight into your code
```

```javascript
// Before: Breaks when you move UserService.js
import { UserService } from '../../../services/UserService';

// After: Works regardless of file location
const { discover } = require('adaptive-tests');
const UserService = await discover({
  name: 'UserService',
  type: 'class'
});

// Your tests stay exactly the same
test('creates users', async () => {
  const service = new UserService();
  const user = await service.create({ name: 'Ada' });
  expect(user.id).toBeDefined();
});
```

## 📖 Documentation

### Getting Started

- **[Why Adaptive Tests?](WHY_ADAPTIVE_TESTS.md)** - The business case with ROI
- **[Framework Comparison](COMPARISON.md)** - vs Jest, Mocha, Pytest, JUnit
- [How It Works](HOW_IT_WORKS.md) - Technical deep dive
- [Migration Guide](MIGRATION_GUIDE.md) - Migrate existing tests
- [Best Practices](BEST_PRACTICES.md) - Patterns and tips

### Framework Guides

- [React Quick Start](../languages/javascript/docs/REACT_QUICKSTART.md)
- [Vue.js Quick Start](../languages/javascript/docs/VUE_QUICKSTART.md)
- [Express Quick Start](../languages/javascript/docs/EXPRESS_QUICKSTART.md)
- [Java Quick Start](../languages/java/README.md)
- [PHP Quick Start](../languages/php/README.md)

### Reference

- [API Reference](API_REFERENCE.md) - Complete API docs
- **[Error Messages Guide](ERROR_MESSAGES.md)** - Detailed error explanations
- [CI/CD Strategy](CI_STRATEGY.md) - Integration strategies
- [Troubleshooting](TROUBLESHOOTING.md) - Problem solving
- [Common Issues](COMMON_ISSUES.md) - Known issues

### GitHub Integration

- [GitHub Action](GITHUB_ACTION.md)
- [Automated Publishing](AUTOMATED_PUBLISHING.md)

## 🎯 Why Adaptive Tests?

**Stop wasting hours fixing broken imports after every refactor.** When you reorganize code, traditional tests fail with import errors - even though your code still works. We eliminate this entirely.

### The Problem: Tests Break When You Move Files

**Before refactoring** - Your tests pass:
```javascript
// File location: src/utils/Calculator.js
export class Calculator {
  add(a, b) { return a + b; }
  subtract(a, b) { return a - b; }
}

// Test file: tests/Calculator.test.js
import { Calculator } from '../src/utils/Calculator';

test('adds numbers correctly', () => {
  const calc = new Calculator();
  expect(calc.add(2, 3)).toBe(5);  // ✅ Passes
});
```

**After moving the file** - Same code, different location, tests fail:
```javascript
// Moved to: src/math/calc/Calculator.js (same code, new location)
export class Calculator {
  add(a, b) { return a + b; }
  subtract(a, b) { return a - b; }
}

// Test still looks for old location:
import { Calculator } from '../src/utils/Calculator';
// ❌ Error: Cannot find module '../src/utils/Calculator'
// ❌ Test suite fails before even running
```

**The Real Cost**: You just spent 30 minutes reorganizing your code structure. Now you'll spend another hour updating import paths in 50+ test files. This is pure waste.

### The Solution: Tests That Find Your Code

Adaptive tests discover your code by what it IS, not WHERE it is:

```javascript
// This ALWAYS works, no matter where Calculator.js moves
const Calculator = await discover({
  name: 'Calculator',
  type: 'class',
  methods: ['add', 'subtract']
});

test('adds numbers correctly', () => {
  const calc = new Calculator();
  expect(calc.add(2, 3)).toBe(5);  // ✅ Still passes after moving file
});
```

Move `Calculator.js` anywhere - `/src/math/`, `/lib/utilities/`, `/shared/helpers/` - your tests keep passing. No manual updates needed.

### Real Example: A Simple Refactor Gone Wrong

Imagine you're cleaning up your project structure. You have 20 test files testing various services. You decide to organize better:

```bash
# Moving files to a cleaner structure
mv src/UserService.js src/services/user/UserService.js
mv src/AuthService.js src/services/auth/AuthService.js
mv src/PaymentService.js src/services/payment/PaymentService.js
# ... and 17 more files
```

**Traditional Tests**: Now you have 60+ import statements to fix across 20 test files. Your IDE might catch some, but not all. You'll spend the next hour:
1. Running tests to see what broke
2. Fixing import paths one by one
3. Re-running to find the ones you missed
4. Dealing with merge conflicts when your team moved files too

**Adaptive Tests**: Everything still works. Zero changes needed. You just saved an hour.

### For Skeptics: Common Questions

**"My IDE updates imports automatically"**
- IDEs often miss test files, especially with complex relative paths
- When CI/CD runs, there's no IDE to help
- AI agents refactoring at scale don't have IDE support

**"This seems like over-engineering"**
- It's actually simplification: your tests become simpler and more maintainable
- The discovery happens once at test startup, then uses cache
- Performance impact: <10ms after initial scan

**"What about multiple files with the same name?"**
- Add specificity: `discover({ name: 'Calculator', methods: ['add'] })`
- Or use path hints: `discover({ name: 'Calculator', pathIncludes: 'billing' })`
- The engine scores and ranks matches - you get the best one

**[→ Read the full engineering case with ROI calculations](WHY_ADAPTIVE_TESTS.md)****

## ✨ Features

- **🔍 Smart Discovery** - Finds classes, functions, and modules by structure
- **🚀 Zero Configuration** - Works out of the box with Jest
- **🌍 Multi-language** - Core JS/TS; others beta/experimental
- **⚡ Fast** - AST-based parsing with intelligent caching
- **🛠️ VS Code Extension** - Visual discovery tools and scaffolding
- **🔄 CI/CD Ready** - GitHub Actions integration

## 💬 Community

- [GitHub Discussions](https://github.com/anon57396/adaptive-tests/discussions) - Ask questions, share ideas
- [Issue Tracker](https://github.com/anon57396/adaptive-tests/issues) - Report bugs, request features
- [Examples](https://github.com/anon57396/adaptive-tests/tree/main/languages/javascript/examples) - See it in action

## 📊 Language Support

| Language | AST Parser | Status |
|----------|------------|--------|
| JavaScript | Babel | ✅ Stable |
| TypeScript | TypeScript Compiler | ✅ Stable |
| Python | Native ast module | 🟡 Beta |
| Java | JavaParser | 🟡 Beta |
| PHP | token_get_all / nikic/php-parser | 🟡 Beta |
| Ruby | Ripper | 🧪 Experimental |
| Go | go/parser (via tree‑sitter bindings) | 🧪 Experimental |
| Rust | Lezer (rust) | 🧪 Experimental |
| Wolfram | CodeParse | 🧪 Experimental |

Status legend: Stable = production‑ready; Beta = broadly usable with caveats; Experimental = early support, subject to change.

## 🤝 Contributing

We welcome contributions! See our [Contributing Guide](https://github.com/anon57396/adaptive-tests/blob/main/CONTRIBUTING.md).

## 📄 License

MIT - See [LICENSE](https://github.com/anon57396/adaptive-tests/blob/main/LICENSE) for details.
