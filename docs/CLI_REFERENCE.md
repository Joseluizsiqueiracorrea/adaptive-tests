# CLI Reference

Adaptive Tests ships a single CLI: `adaptive-tests`. Use via `npx` or as a dev dependency.

## Installation

```bash
# Use directly (recommended)
npx adaptive-tests --help

# Or install locally
npm install --save-dev adaptive-tests
```

## Commands

### init

Initialize Adaptive Tests in your project (creates a config file and guided setup).

```bash
npx adaptive-tests init
```

What it does:

- Detects your package manager and test framework
- Offers to create `adaptive-tests.config.js`
- Suggests sensible defaults for discovery options

---

### why

Explain how discovery scores candidates for a given signature. This is your primary debugging tool.

```bash
# Minimal
npx adaptive-tests why '{"name":"UserService"}'

# With type hint
npx adaptive-tests why '{"name":"UserService","type":"class"}'

# Read signature from a file
npx adaptive-tests why --signature signature.json --json
```

Options:

- `--signature <file>`: load JSON from file instead of inline
- `--json`: machine‑readable output
- `--limit <n>`: limit number of candidates shown (default 5)

---

### discover

Run discovery for a signature. (Useful for CI or quick checks.)

```bash
npx adaptive-tests discover --signature signature.json --json
```

Options:

- `--signature <file>`: signature JSON file
- `--json`: machine‑readable output
- `--dry-run`: show search plan without loading modules
- `--verbose`: print extra diagnostics

---

### analyze <path>

Show exports and structural info for a specific file.

```bash
npx adaptive-tests analyze src/services/UserService.js
```

---

### signature <path>

Generate a basic signature from an existing file.

```bash
npx adaptive-tests signature src/services/UserService.js
```

---

### config --validate

Validate your `adaptive-tests.config.js` (or discovered config).

```bash
npx adaptive-tests config --validate
```

---

### cache [--clear|--persist]

Manage discovery caches.

```bash
# Clear local cache
npx adaptive-tests cache --clear

# Persist cache across runs (if supported)
npx adaptive-tests cache --persist
```

---

### check --circular

Check for circular dependencies via discovery helpers.

```bash
npx adaptive-tests check --circular
```

---

### scaffold (preview)

Scaffold adaptive tests for the current project. (For JavaScript/TypeScript only.)

```bash
# Scaffold using defaults into tests/adaptive
npx adaptive-tests scaffold --root .
```

Options vary by project; prefer running `npx adaptive-tests init` first to establish defaults.

## Configuration

Most JavaScript/TypeScript projects place options in `adaptive-tests.config.js`. See the [Configuration Guide](CONFIGURATION.md) for details.

## Tips

- If discovery fails, start with `why` — it shows exactly which files were considered and how they scored.
- Keep signatures simple at first: `{ "name": "YourClass" }`, then add `type`, `methods`, or `exports` hints as needed.
- Add `.ts` / `.tsx` to `discovery.extensions` for TypeScript projects.
