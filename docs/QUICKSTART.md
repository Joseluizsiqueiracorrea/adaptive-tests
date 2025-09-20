# Quick Start Guide

**New to Adaptive Tests?** Pick your language and get started in 2 minutes:

## 📦 JavaScript/Node.js

```bash
npm install adaptive-tests
```

→ **[Complete JavaScript Guide](../languages/javascript/README.md)**

## 🐍 Python

```bash
pip install adaptive-tests-py
```

→ **[Complete Python Guide](../languages/python/README.md)**

## ☕ Java

```xml
<dependency>
    <groupId>io.adaptivetests</groupId>
    <artifactId>adaptive-tests-java</artifactId>
    <version>0.1.0</version>
</dependency>
```

→ **[Complete Java Guide](../languages/java/README.md)**

## 📘 TypeScript

```bash
npm install adaptive-tests @adaptive-tests/typescript
```

→ **[Complete TypeScript Guide](../languages/typescript/README.md)**

**Other languages?** Check the [experimental implementations](#experimental) above.

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
const { discover } = require('adaptive-tests');

const UserService = await discover('UserService');
// Just works, no matter where the file is
```

### Option 3: Advanced Features

**For complex projects or tooling:**

- Custom search paths and scoring rules
- Batch test generation
- Integration with build tools

**[📖 Advanced features →](advanced-patterns.md)**

## CLI Helper

> **Note:** The `adaptive-tests` CLI ships with the `adaptive-tests` meta package (and remains available via `@adaptive-tests/javascript`).

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

## Framework Templates

Jumpstart your adaptive testing with pre-configured templates for popular frameworks:

### Available Templates

| Template | Framework | Features |
|----------|-----------|----------|
| `nextjs-adaptive` | Next.js 13+ | App Router, TypeScript, React Server Components ready |
| `vite-adaptive` | Vite + React | Lightning fast HMR, TypeScript, modern tooling |
| `cra-adaptive` | Create React App | Classic React setup, TypeScript support |
| `express-adaptive` | Express.js | REST API, middleware testing, async route handlers |

### Quick Setup

```bash
# Interactive CLI
npx create-adaptive-app my-project

# Manual template usage
git clone https://github.com/anon57396/adaptive-tests.git
cp -r adaptive-tests/templates/nextjs-adaptive my-project
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

## Next Steps

- **[📖 How to fix import errors →](../docs/getting-started-invisible.md)**
- **[📖 Advanced features →](advanced-patterns.md)**
- **[📖 CI/CD integration →](CI_STRATEGY.md)**
- **[📖 Migration guide →](MIGRATION_GUIDE.md)**
- **[📖 Troubleshooting →](TROUBLESHOOTING.md)**
