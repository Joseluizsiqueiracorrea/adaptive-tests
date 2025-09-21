---
layout: default
title: Adaptive Tests - Tests That Never Break
description: Stop fixing import errors. Tests that find your code automatically, no matter where you move it.
---

<style>
.hero {
  text-align: center;
  padding: 60px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  margin: -20px -20px 40px -20px;
  border-radius: 0;
}

.hero h1 {
  font-size: 2.5em;
  margin-bottom: 20px;
  font-weight: 700;
}

.hero h2 {
  font-size: 2em;
  margin-bottom: 30px;
  font-weight: 600;
}

.hero-points {
  font-size: 1.2em;
  margin: 30px 0;
}

.hero-points div {
  margin: 15px 0;
  padding: 0 20px;
}

.code-comparison {
  background: rgba(255,255,255,0.1);
  padding: 20px;
  border-radius: 8px;
  margin: 30px auto;
  max-width: 600px;
  text-align: left;
}

.cta-buttons {
  margin: 30px 0;
}

.cta-buttons a {
  display: inline-block;
  padding: 12px 24px;
  margin: 0 10px;
  background: rgba(255,255,255,0.2);
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  border: 2px solid rgba(255,255,255,0.3);
  transition: all 0.3s ease;
}

.cta-buttons a:hover {
  background: rgba(255,255,255,0.3);
  transform: translateY(-2px);
}

.section {
  margin: 40px 0;
}

.problem-box {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 30px;
  margin: 20px 0;
}

.comparison-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin: 30px 0;
}

.comparison-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e9ecef;
}

.comparison-card h3 {
  color: #dc3545;
  margin-bottom: 15px;
}

.comparison-card.good h3 {
  color: #28a745;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin: 30px 0;
}

.feature-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e9ecef;
}

.framework-table {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
}

.framework-table th,
.framework-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e9ecef;
}

.framework-table th {
  background: #f8f9fa;
  font-weight: 600;
}

@media (max-width: 768px) {
  .hero h1 { font-size: 2em; }
  .hero h2 { font-size: 1.5em; }
  .comparison-grid { grid-template-columns: 1fr; }
  .cta-buttons a { display: block; margin: 10px 0; }
}
</style>

<div class="hero">
  <h1>Your Tests Break When You Move Files</h1>
  <h2><strong>Ours Don't</strong></h2>

  <div class="hero-points">
    <div>🎯 Move <code>UserService.js</code> anywhere. Tests still work</div>
    <div>🚀 Refactor your entire codebase. Tests still work</div>
    <div>✨ Let AI reorganize everything. Tests still work</div>
  </div>

  <div class="code-comparison">
    <div style="margin-bottom: 15px;">
      <code style="color: #ff6b6b;">// This breaks when you move files ❌</code><br>
      <code>import { UserService } from '../../../services/UserService';</code>
    </div>
    <div>
      <code style="color: #51cf66;">// This works no matter where files live ✅</code><br>
      <code>const UserService = await discover('UserService');</code>
    </div>
  </div>

  <div class="cta-buttons">
    <a href="#quick-start">Get Started in 2 Minutes</a>
    <a href="https://github.com/anon57396/adaptive-tests">See Live Demo</a>
    <a href="#how-it-works">Why It Works</a>
  </div>
</div>

<div class="section">

## The Problem We Solve

<div class="problem-box">

Every developer knows this pain:

1. **You refactor** → Move files to better locations
2. **Tests explode** → `Cannot find module '../old/path'`
3. **You waste hours** → Fixing imports instead of shipping features

**We eliminated this problem entirely.**

</div>

</div>

<div class="section" id="quick-start">

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

</div>

<div class="section" id="how-it-works">

## How It Works

<div class="comparison-grid">

<div class="comparison-card">
<h3>Traditional Tests (Fragile)</h3>

```javascript
import { Calculator } from '../utils/Calculator';
// Breaks when moved
```

Uses **file paths** to find code

</div>

<div class="comparison-card good">
<h3>Adaptive Tests (Bulletproof)</h3>

```javascript
const Calculator = await discover({
  name: 'Calculator',
  type: 'class',
  methods: ['add', 'subtract']
});
// Works anywhere
```

Uses **code structure** to find code

</div>

</div>

We analyze your code's AST (Abstract Syntax Tree) to find what you're looking for based on its structure, not its location.

</div>

<div class="section">

## Real Examples

<div class="comparison-grid">

<div class="comparison-card">
<h3>Before (Fragile)</h3>

```javascript
// Break every time you reorganize
import { UserService } from '../../../backend/services/users/UserService';
import { AuthService } from '../../../backend/auth/AuthService';
import { Database } from '../../../infrastructure/db/Database';

describe('User management', () => {
  // If any file moves, tests fail before even running
});
```

</div>

<div class="comparison-card good">
<h3>After (Bulletproof)</h3>

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

</div>

</div>

</div>

<div class="section">

## Who Uses This?

<div class="feature-grid">

<div class="feature-card">
<h3>🤖 AI-Powered Teams</h3>
Let Copilot/Cursor reorganize without breaking tests
</div>

<div class="feature-card">
<h3>🏗️ Frequent Refactors</h3>
Clean up tech debt without test maintenance
</div>

<div class="feature-card">
<h3>📦 Large Codebases</h3>
Find code in massive projects instantly
</div>

<div class="feature-card">
<h3>🚀 Fast Shipping</h3>
Stop wasting time on broken imports
</div>

</div>

</div>

<div class="section">

## Framework Support

Works with your existing test framework:

<table class="framework-table">
<thead>
<tr>
<th>Framework</th>
<th>Support</th>
<th>Package</th>
</tr>
</thead>
<tbody>
<tr><td><strong>Jest</strong></td><td>✅ Full</td><td><code>@adaptive-tests/javascript</code></td></tr>
<tr><td><strong>Mocha</strong></td><td>✅ Full</td><td><code>@adaptive-tests/javascript</code></td></tr>
<tr><td><strong>Vitest</strong></td><td>✅ Full</td><td><code>@adaptive-tests/javascript</code></td></tr>
<tr><td><strong>Pytest</strong></td><td>✅ Full</td><td><code>adaptive-tests-py</code></td></tr>
<tr><td><strong>JUnit</strong></td><td>✅ Full</td><td><code>adaptive-tests-java</code></td></tr>
<tr><td><strong>TypeScript</strong></td><td>✅ Full</td><td><code>@adaptive-tests/typescript</code></td></tr>
</tbody>
</table>

</div>

<div class="section">

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

</div>

<div class="section" style="text-align: center; padding: 40px 20px; background: #f8f9fa; border-radius: 8px; margin: 40px 0;">

## Get Started Now

```bash
# Try it in under 2 minutes
npm install @adaptive-tests/javascript
npx adaptive-tests init
```

**[GitHub Repository](https://github.com/anon57396/adaptive-tests)** | **[NPM Package](https://www.npmjs.com/package/adaptive-tests)** | **[Report Issues](https://github.com/anon57396/adaptive-tests/issues)**

---

## Stop fixing imports. Start shipping features

Built with ❤️ for developers who refactor fearlessly

</div>