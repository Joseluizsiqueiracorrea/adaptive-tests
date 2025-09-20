# Adaptive Tests: AI-Ready Testing Infrastructure

[![Docs](https://img.shields.io/badge/docs-website-blue)](https://anon57396.github.io/adaptive-tests/)
[![npm](https://img.shields.io/badge/npm-in%20development-yellow)](packages/)
[![PyPI](https://img.shields.io/badge/PyPI-in%20development-yellow)](languages/python/)
[![VS Code Extension](https://img.shields.io/badge/VS%20Code-Development%20Alpha-yellow)](vscode-adaptive-tests-extension_experimental/README.md)
[![GitHub Action](https://img.shields.io/badge/GitHub%20Action-In%20Development-yellow?logo=github)](#ci-cd-integration)

Documentation: [https://anon57396.github.io/adaptive-tests/](https://anon57396.github.io/adaptive-tests/)

> _Language-specific coverage reports live in each package (JavaScript, TypeScript, Python, Java). A consolidated badge will ship once multi-runtime reporting is wired up._
>
> **Tests that don't break when you move files**

Traditional tests fail when you move or rename files because they use hardcoded file paths. Adaptive Tests finds your code by understanding what it looks like, not where it's located.

**Move files around? Tests still pass.** No more fixing broken imports after refactoring.

If this project helps you, please consider supporting it via the Sponsor button (GitHub Sponsors) or your preferred tip link. Thank you!

---

## 🚀 Choose Your Language

Each language implementation is self-contained with examples, documentation, and framework integrations:

### **Core Languages** _(in development)_

- **[📦 JavaScript/Node.js](./languages/javascript/)** - Core implementation with Jest, Mocha, Vitest support
- **[📘 TypeScript](./languages/typescript/)** - Type-aware discovery with interface matching
- **[🐍 Python](./languages/python/)** - Full pytest integration with Django/Flask examples
- **[☕ Java](./languages/java/)** - Maven/Gradle packages with Spring Boot integration

### **Experimental**

- **[🐘 PHP](./languages/php/)** - PHPUnit integration, Composer packages _(in development)_
- **[🐹 Go](./languages/go/)** - Module-aware discovery _(in development)_
- **[🦀 Rust](./languages/rust/)** - Cargo integration _(in development)_
- **[💎 Ruby](./languages/ruby/)** - RSpec/Rails support _(in development)_
- **[🔬 Wolfram](./languages/wolfram/)** - Symbolic computation patterns _(experimental)_

### **Developer Tools**

- **[🔧 VS Code Extension](./vscode-adaptive-tests-extension_experimental/)** - IDE integration _(development alpha)_

---

## Table of Contents

- [🚀 Choose Your Language](#-choose-your-language)
- [⚡ Quick Start Guide](#-quick-start-guide)
- [🤖 Why AI-Powered Teams Choose Adaptive Tests](#-why-ai-powered-teams-choose-adaptive-tests)
- [🔧 Developer Tools](#-developer-tools)
- [📚 Documentation & Resources](#-documentation--resources)
- [🚀 CI/CD Integration](#-cicd-integration)
- [🤝 Contributing](#-contributing)

---

## ⚡ Quick Start Guide

**New to Adaptive Tests?** Pick your language and get started in 2 minutes:

### 📦 JavaScript/Node.js

```bash
# Note: Main adaptive-tests package is currently in development
# Use the JavaScript implementation:
npm install @adaptive-tests/javascript
```

→ **[Complete JavaScript Guide](./languages/javascript/README.md)**

### 🐍 Python

```bash
pip install adaptive-tests-py
```

→ **[Complete Python Guide](./languages/python/README.md)**

### ☕ Java

```xml
<dependency>
    <groupId>io.adaptivetests</groupId>
    <artifactId>adaptive-tests-java</artifactId>
    <version>0.1.0</version>
</dependency>
```

→ **[Complete Java Guide](./languages/java/README.md)**

### 📘 TypeScript

```bash
# Note: Packages are currently in development and not published to npm
# For local development:
npm install @adaptive-tests/javascript @adaptive-tests/typescript
```

→ **[Complete TypeScript Guide](./languages/typescript/README.md)**

**Other languages?** Check the [experimental implementations](#experimental) above.

---

## <a id="ci-cd-integration"></a>🚀 CI/CD Integration

Run adaptive tests in CI using the official GitHub Action, or use a simple Node.js job if your org restricts Marketplace actions.

### Option A: Official Action

```yaml
# Note: Official GitHub Action is currently in development
# For now, use Option B (Manual Setup) below
# - uses: adaptive-tests-action/adaptive-tests@v1
```

The action typically:

- ✅ Runs adaptive tests
- 🔍 Discovers components
- 📊 Generates coverage (optional)
- 💬 Adds PR comments (optional)
- 🏗️ Can scaffold tests (optional)

### Option B: Manual Setup (recommended fallback)

```yaml
env:
  CI: true

steps:
  - uses: actions/checkout@v4
  - uses: actions/setup-node@v5
    with:
      node-version: '20'
      cache: 'npm'
  - run: npm ci
  - run: npm run test:adaptive
```

[See CI examples and guidance →](docs/GITHUB_ACTION.md)

---

## <a id="vs-code-extension-development-alpha"></a>🎯 VS Code Extension (Development Alpha)

Experience the power of adaptive testing with our VS Code extension currently in development:

### ✨ Key Features

- **🔍 Discovery Lens**: Visualize how adaptive-tests finds your code with an interactive, beautiful webview
- **📁 Batch Scaffolding**: Right-click any folder to generate tests for all files inside
- **🎯 Smart Context Menus**: "Scaffold Test" for new files, "Open Test" for files with existing tests
- **💡 CodeLens Integration**: See test hints directly in your code
- **📊 Discovery Tree View**: Browse discovery results in the activity bar
- **🌐 Language Support**: Core JS/TS today; Beta for Python/Java/PHP; others experimental (see docs for status)

### 🛠️ Development Setup

To test the extension during development:

```bash
cd vscode-adaptive-tests-extension_experimental
npm install
# Open in VS Code and press F5 to launch Extension Development Host
```

### 🚀 Installation

The extension is currently in development and not yet available on the VS Code Marketplace. For now, use the development setup above.

[Learn more about the VS Code extension →](vscode-adaptive-tests-extension_experimental/README.md)

---

## Why Teams Choose Adaptive Tests

- **Tests don't break when you move files** – No more fixing import errors after refactoring
- **Works with any code structure** – Finds classes, functions, and modules by understanding what they look like
- **Fast and reliable** – Analyzes your code structure without running it, so it's quick and safe
- **Easy to adopt** – Start with one test file or convert your whole test suite
- **Works with your tools** – Integrates with Jest, Mocha, Vitest, and more

---

### 🔧 Auto-Fix Import Errors

**Getting import errors after moving files? Fix them automatically:**

```bash
npx adaptive-tests enable-invisible
```

This patches your test runner to automatically find moved files instead of breaking. Works with Jest, Vitest, and Mocha.

**Before:**

```text
Error: Cannot find module './UserService'
```

**After:**

```bash
npx adaptive-tests enable-invisible
npm test  # ✅ Tests pass again
```

[📖 How to fix import errors →](docs/getting-started-invisible.md)

---

### Option 1: Zero-Config with jest-adaptive (New!)

```bash
# Note: This is a local package in development
# For development use:
npm install --save-dev ./packages/jest-adaptive @adaptive-tests/javascript
```

Add to your `jest.config.js`:

```javascript
module.exports = {
  preset: 'jest-adaptive',
};
```

Now `discover()` and `adaptiveTest()` are available as globals in all tests!

Once installed, discover code directly from a test:

```javascript
const { discover } = require('@adaptive-tests/javascript');

it('authenticates a user', async () => {
  const AuthService = await discover({
    name: 'AuthService',
    type: 'class',
    methods: ['login', 'logout'],
    properties: ['sessions']
  });

  const service = new AuthService();
  const result = await service.login({ username: 'ada', password: 'secret' });

  expect(result.success).toBe(true);
});
```

Need a reusable engine? Grab one from the factory:

```javascript
const { getDiscoveryEngine } = require('@adaptive-tests/javascript');
const engine = getDiscoveryEngine(process.cwd());
```

## Three Ways to Use Adaptive Tests

### Option 1: Auto-Fix Existing Tests

**For existing test suites with import errors:**

```bash
npx adaptive-tests enable-invisible
```

This automatically fixes broken imports when you move files. No code changes needed.

### Option 2: Simple Discovery (Most Common)

**For new tests or when you want control:**

```javascript
const { discover } = require('@adaptive-tests/javascript');

const UserService = await discover('UserService');
// Just works, no matter where the file is
```

### Option 3: Advanced Features

**For complex projects or tooling:**

- Custom search paths and scoring rules
- Batch test generation
- Integration with build tools

**[📖 Advanced features →](docs/advanced-patterns.md)**

---

## Framework Templates

Jumpstart your adaptive testing with pre-configured templates for popular frameworks:

### Available Templates _(in development)_

| Template | Framework | Features | Status |
|----------|-----------|----------|---------|
| `nextjs` | Next.js 13+ | App Router, TypeScript, React Server Components ready | Basic structure |
| `vite` | Vite + React | Lightning fast HMR, TypeScript, modern tooling | Basic structure |
| `express` | Express.js | REST API, middleware testing, async route handlers | Planned |

### Quick Setup

```bash
# Templates are currently in development
# Manual template usage (development only):
git clone https://github.com/anon57396/adaptive-tests.git
cp -r adaptive-tests/languages/javascript/templates/nextjs my-project
cd my-project
npm install
```

### What's Included

Each template comes with:

- ✅ **Pre-configured adaptive tests** - Example components with adaptive test suites
- ✅ **Jest setup** - Configured for both traditional and adaptive testing
- ✅ **TypeScript support** - Full type definitions and tsconfig
- ✅ **VS Code integration** - Recommended extensions and settings
- ✅ **Best practices** - Folder structure and naming conventions
- ✅ **CI/CD ready** - GitHub Actions workflows included

### Template Details

#### Available Templates

Templates are currently in early development. Basic structure exists for:

```bash
languages/javascript/templates/
├── nextjs/               # Next.js basic template (in development)
└── vite/                 # Vite basic template (in development)
```

Full template features are planned for future releases.

### Customizing Templates

After copying a template:

1. **Update package.json** with your project details
2. **Modify the example components** to match your needs
3. **Run tests** to ensure everything works: `npm test`
4. **Add your own adaptive tests** using the examples as guides

### Creating Your Own Template

To create a custom template:

```bash
# Start with any existing project
npx adaptive-tests init

# Add example components and tests
npx adaptive-tests scaffold src/components/MyComponent.tsx

# Configure Jest for dual-mode testing
# (See templates/*/jest.config.js for examples)
```

---

## CLI Helper

> **Note:** The `adaptive-tests` CLI is available via the `@adaptive-tests/javascript` package.

```bash
npx adaptive-tests init                                      # Interactive setup wizard
npx adaptive-tests migrate tests                            # Convert traditional tests to adaptive
npx adaptive-tests scaffold src/services/UserService.js     # Generate test from source
npx adaptive-tests scaffold --batch src/                    # Scaffold entire directory
```

### Migration Tool (New!)

Automatically convert your existing traditional tests to adaptive tests:

```bash
npx adaptive-tests migrate [directory]
```

The migration tool:

- Analyzes your existing test files to extract imports and test structure
- Identifies the classes/modules being tested and their methods
- Generates adaptive test files that use `discover()` instead of hardcoded imports
- Preserves your test logic structure while making imports refactor-proof

Migration strategies:

1. **Create new files** (default) - Creates `*.adaptive.test.js` alongside originals
2. **Replace existing** - Backs up originals and replaces them

### Scaffold Command

Use `npx adaptive-tests scaffold --help` for all options. Helpful flags include:

- `--typescript` – emit `.test.ts`
- `--force` – overwrite existing test files
- `--apply-assertions` – generate starter assertions (defaults to TODOs)
- `--all-exports` / `--export <Name>` – control multi-export files
- `--batch <dir>` – scaffold an entire directory
- `--json` – machine-readable output

The CLI scaffolds an `adaptive` test directory, drops in example suites, and
links any missing optional peers (such as `ts-node`). Additional CLI helpers
include the Discovery Lens (`why`) and refactor scripts documented below.

Need visibility into why a signature matched (or didn’t)? Use the Discovery
Lens companion:

```bash
npx adaptive-tests why '{"name":"UserService"}'
npx adaptive-tests why '{"name":"UserService"}' --json
```

The `why` command prints a ranked list of candidates with score breakdowns and
optional JSON output for tooling.

### Coverage Notes

`npm run test:coverage` reports on the adaptive engine and core utilities. Jest
intentionally skips the CLI wrappers and the testing base class (`collectCoverageFrom`
excludes `src/cli/**` and `src/adaptive/test-base.js`) so that coverage reflects
the static analysis engine itself. If you need coverage for the CLI, run Jest
against those folders explicitly.

---

## Validation Flow

The repository ships with a validation script that proves adaptive suites behave
the way we advertise:

```bash
npm run validate
```

The script runs four scenarios:

1. ✅ Both traditional and adaptive suites pass on healthy code.
2. ✅ After a refactor, traditional suites fail with import errors, adaptive suites
   keep passing.
3. ✅ When we introduce real bugs, both suites fail with assertion errors.
4. ✅ TypeScript mirrors the JavaScript story.

> ℹ️ Python (pytest) and Java (Maven) demos only run when those runtimes are
> available. In sandboxed or offline environments the validator reports those
> scenarios as “skipped” so the core JavaScript/TypeScript proof still completes.

---

## <a id="ci-cd-strategy"></a>CI/CD Strategy

### Why Adaptive Tests Excel in CI/CD

Traditional CI requires complex dependency tracking to run only affected tests. **Adaptive tests flip this paradigm** — since they're resilient to refactoring, you can run the entire suite without fear of false failures from moved files!

### Simple CI job

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: actions/setup-node@v5
    with:
      node-version: '20'
      cache: 'npm'
  - run: npm ci
  - run: npm run test:adaptive
```

### Optional two-track approach

If you still run traditional tests, keep them fast by selecting changed tests, and run the full adaptive suite for confidence:

```yaml
jobs:
  traditional-tests:
    run: npx jest --onlyChanged
  adaptive-tests:
    run: npm run test:adaptive
```

### The Key Insight

You don't need complex test selection for adaptive tests because:

- ✅ They survive file moves and renames
- ✅ They're fast enough to run completely
- ✅ They catch real bugs, not import errors

**Example**: Move `Calculator.js` to a new folder?

- Traditional tests: ❌ `Cannot find module '../src/Calculator'`
- Adaptive tests: ✅ Find it automatically and pass!

[Read the full CI/CD strategy →](docs/CI_STRATEGY.md)

---

## Documentation & Examples

### Getting Started

- [Quick Start Guide](QUICKSTART.md)
- [Migration Guide](docs/MIGRATION_GUIDE.md)
- [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
- [Common Issues](docs/COMMON_ISSUES.md)

### Framework Guides

- [React Quick Start](languages/javascript/docs/REACT_QUICKSTART.md)
- [Vue.js Quick Start](languages/javascript/docs/VUE_QUICKSTART.md)
- [Express Quick Start](languages/javascript/docs/EXPRESS_QUICKSTART.md)

### Technical Documentation

- [How It Works](docs/HOW_IT_WORKS.md)
- [API Reference](docs/API_REFERENCE.md)
- [Best Practices](docs/BEST_PRACTICES.md)
- [CI/CD Strategy](docs/CI_STRATEGY.md)
- Prompt Guide (AIs & automation): PROMPT_GUIDE.md
- [Positioning Playbook](docs/PITCH.md)

### Extensions & Tools

- [VS Code Extension](vscode-adaptive-tests-extension_experimental/README.md)
- [Proof & Demo Scripts](PROOF.md)
- **Examples**: JavaScript (`languages/javascript/examples/`), TypeScript (`languages/typescript/examples/`), Python (`languages/python/examples/`), Java (`languages/java/examples/`)

Every example exposes both **traditional** and **adaptive** suites so you can see
the contrast immediately.

---

## Publishing

Adaptive Tests is currently in development:

- npm: Packages not yet published (development versions available locally)
- PyPI: `adaptive-tests-py` package status to be verified

When you are ready to publish a new release:

1. Ensure `npm test` and `npm run validate` are green.
2. Run `npm run build:plugins` so the Vite/Webpack packages ship with fresh `dist/` artifacts.
3. Optionally run `npm run clean:artifacts` before zipping or sharing the repo snapshot.
4. Update [`CHANGELOG.md`](CHANGELOG.md) with release notes.
5. `npm version <patch|minor|major>` followed by `npm publish`.
6. `cd languages/python && python -m build && python -m twine upload dist/*`.

---

## <a id="for-developers"></a>🧑‍💻 For Developers

### Developer Setup

```bash
# Clone and setup
git clone https://github.com/anon57396/adaptive-tests.git
cd adaptive-tests
npm install        # Install dependencies

# Development commands
npm test           # Run tests
npm run validate   # Run validation suite
```

### Resources

- **[Development Guide](.github/DEVELOPMENT.md)** - Complete developer documentation
- **[GitHub Discussions](https://github.com/anon57396/adaptive-tests/discussions)** - Ask questions, share ideas
- **[Issue Tracker](https://github.com/anon57396/adaptive-tests/issues)** - Report bugs, request features
- **[Contributing Guide](CONTRIBUTING.md)** - How to contribute
- **[API Docs](https://anon57396.github.io/adaptive-tests/)** - Full documentation

### Project Health

- ✅ Tests running in CI with coverage
- ✅ Core: JS/TS; Beta: Python/Java/PHP; Experimental: Go/Rust/Ruby/Wolfram
- ✅ Codecov reporting and GitHub Actions CI/CD

## Contributing & Support

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Get Help:**

- 💬 [GitHub Discussions](https://github.com/anon57396/adaptive-tests/discussions) - Community support
- 🐛 [Issues](https://github.com/anon57396/adaptive-tests/issues) - Bug reports
- 📚 [Documentation](https://anon57396.github.io/adaptive-tests/) - Complete docs
- 📖 [Common Issues](docs/COMMON_ISSUES.md) - Troubleshooting

Adaptive Tests is released under the [MIT license](LICENSE).
