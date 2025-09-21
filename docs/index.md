---
layout: default
title: Adaptive Tests
description: Tests that find your code automatically, no matter where you move it. Stop fixing broken imports and start shipping faster.
---

<div class="hero">
  <h1>Stop Fixing Broken Tests. Start Shipping Faster.</h1>
  <p class="lead">Tired of import errors every time you refactor? Adaptive Tests automatically find your code, no matter where you move it. It’s the AI-ready testing framework for modern development.</p>
  <a href="#quick-start" class="btn btn-primary">Get Started in 2 Minutes</a>
  <a href="https://github.com/anon57396/adaptive-tests" class="btn btn-secondary">View on GitHub</a>
</div>

## The Vicious Cycle of Traditional Testing

You’ve been there. You move a file, rename a folder, or let an AI agent refactor your code. Suddenly, your entire test suite explodes.

```diff
- import { Calculator } from '../utils/Calculator';
+ import { Calculator } from '../math/calculator/Calculator'; // You have to fix this manually

// ...and this...
- import { UserService } from '../../services/users';
+ import { UserService } from '../../api/v1/users';

// ...and dozens more.
```

You spend the next hour hunting down broken `import` statements instead of building what matters. **This is a waste of your time.**

## The Adaptive Solution: Test Smarter, Not Harder

Adaptive Tests don’t rely on brittle file paths. They find your code by its **structural signature**—what it *is*, not where it *is*.

```javascript
// This test works even if you move the file.
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

**Move `Calculator.js` anywhere. The test still passes. No changes needed.**

---

## How It Works: A New Paradigm

Instead of hardcoding a file path, you provide a "signature" that describes the code you want to test. Our discovery engine does the rest.

1. **You Define a Signature:** Describe the code's name, type, methods, or other structural features.
2. **Engine Scans Your Code:** It parses your codebase's Abstract Syntax Tree (AST) to find files that match the signature.
3. **It Finds the Best Match:** A powerful scoring algorithm ranks candidates to find the perfect match.
4. **Your Test Runs:** The engine provides the correct module to your test, which runs as usual.

This all happens in milliseconds, and it’s completely transparent.

---

<div id="quick-start"></div>

## 🚀 Quick Start

Get up and running with your preferred language.

### JavaScript / TypeScript

> Heads up: the TypeScript package re-uses the JavaScript discovery engine. Installing `@adaptive-tests/typescript` will pull in `@adaptive-tests/javascript` automatically.

```bash
# 1. Install the package
npm install @adaptive-tests/javascript --save-dev

# 2. Run the interactive setup
npx adaptive-tests init
```

**[→ Full JavaScript Guide](https://raw.githubusercontent.com/anon57396/adaptive-tests/main/languages/javascript/README.md)**

### Python

```bash
# 1. Install the package
pip install adaptive-tests-py

# 2. Run the interactive setup
adaptive-tests init
```

**[→ Full Python Guide](https://raw.githubusercontent.com/anon57396/adaptive-tests/main/languages/python/README.md)**

### Java

Add the dependency to your `pom.xml`:

```xml
<dependency>
    <groupId>io.adaptivetests</groupId>
    <artifactId>adaptive-tests-java</artifactId>
    <version>0.3.0-SNAPSHOT</version>
</dependency>
```

**[→ Full Java Guide](https://raw.githubusercontent.com/anon57396/adaptive-tests/main/languages/java/README.md)**

---

## ✨ Features

- **Resilient to Refactoring:** Move and rename files without breaking tests.
- **AI-Ready:** Perfect for teams using AI agents that frequently modify code structure.
- **Framework Agnostic:** Integrates seamlessly with Jest, Vitest, Pytest, JUnit, and more.
- **Invisible Mode:** Automatically fix broken imports in your existing test suite with zero code changes.
- **Powerful CLI:** Scaffold tests, debug discovery, and migrate your entire test suite automatically.
- **VS Code Extension:** Visualize discovery and manage tests directly in your editor.

---

## Who Is This For?

- **Forward-Thinking Devs:** You want to spend less time on maintenance and more on innovation.
- **AI-Powered Teams:** You use tools like Copilot or Cursor and need a test suite that can keep up.
- **Large-Scale Projects:** You need to navigate and test a complex, evolving codebase.
- **Framework Authors:** You want to provide a more robust testing experience for your users.

---

## Learn More

- **[Why Adaptive Tests?](WHY_ADAPTIVE_TESTS.md)**: The deep dive into the problem and our solution.
- **[How It Works](HOW_IT_WORKS.md)**: The technical details of the discovery engine.
- **[Migration Guide](MIGRATION_GUIDE.md)**: Convert your existing test suite in minutes.
- **[API Reference](API_REFERENCE.md)**: Full documentation for all functions and signatures.

**[GitHub Repository](https://github.com/anon57396/adaptive-tests)** • **[NPM Package](https://www.npmjs.com/package/adaptive-tests)** • **[Report an Issue](https://github.com/anon57396/adaptive-tests/issues)**
