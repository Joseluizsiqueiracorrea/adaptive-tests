# AGENTS.md - Contributing to Adaptive-Tests Repository

**📍 SCOPE: For AI agents working on the adaptive-tests framework itself**

| Document | Purpose |
|----------|---------|
| **AGENTS.md** (this file) | Contributing to adaptive-tests codebase |
| [PROMPT_GUIDE.md](./PROMPT_GUIDE.md) | Using adaptive-tests in external projects |
| [docs/ai-prompts.md](./docs/ai-prompts.md) | Copy-paste prompts for quick reference |

## Mission-Critical Context

This project is the **AI-ready testing foundation** for the autonomous development era. As AI agents increasingly reshape codebases at velocity, adaptive-tests ensures testing infrastructure doesn't break through AST-based analysis instead of brittle file path imports.

**The paradigm shift:** While traditional tests break when AI agents refactor, adaptive tests survive by finding code through structure, not file paths. This eliminates the import maintenance cycles that waste AI capabilities on busywork instead of feature development.

The standards for code quality, documentation, and reliability are exceptionally high. Every contribution must reflect a commitment to perfection and a deep understanding of the project's role in enabling autonomous development workflows. Mediocrity will not be accepted.

## ⚠️ CRITICAL: What This Repository IS and IS NOT

### This Repository IS:
- **A FRAMEWORK** for creating resilient tests in OTHER projects
- **A TOOL** that helps developers instrument THEIR codebases
- **A LIBRARY** published to npm/PyPI for use in external projects

### This Repository IS NOT:
- **NOT** a project that needs its own scripts tested
- **NOT** a place to create test files in root directories
- **NOT** asking for test coverage of utility scripts

### 🚨 COMMON AI AGENT MISTAKES TO AVOID:

1. **DO NOT create test files in root directories** (`__tests__/`, `/jest.config.js`)
2. **DO NOT test the repository's own utility scripts** (`scripts/validate.js`, etc.)
3. **DO NOT add Jest or testing dependencies to the root package.json**
4. **DO NOT create "adaptive tests" for this repository itself**
5. **DO NOT confuse this framework with a project that needs testing**

The ONLY tests that belong here are:
- Framework tests in `languages/*/tests/` that test the discovery engine
- Example tests in `languages/*/examples/*/tests/` that demonstrate usage

If asked to "ensure 100% test coverage", you should:
1. Check coverage of the FRAMEWORK code in `languages/javascript/src/`
2. Run `npm test` to see existing coverage
3. Add tests ONLY in `languages/javascript/tests/adaptive/` if needed
4. NEVER create new test directories at the root level

## Core Principles

1. **Tests first** – run `npm test` and `npm run validate` before publishing or
   recommending changes. These commands exercise both traditional and adaptive
   suites.
2. **Prefer the unified engine** – the source of truth lives in
   `languages/javascript/src/discovery-engine.js`. Avoid introducing or using any legacy
   `discovery.js` entry points. If you see `getLegacyEngine` in the public API,
   it is a thin deprecation shim around the v2 engine—prefer `getDiscoveryEngine`.
3. **Zero-runtime discovery** – the engine parses candidates with
   `@babel/parser`. If you contribute features, keep the static-analysis
   guarantees intact (no `require()` during discovery).
4. **Respect documentation** – README, Quick Start guides, and `docs/` are part
   of the public story. Keep them aligned with the code.

## Multi-Agent Collaboration Contract

We often have several AI agents working **simultaneously on `main`**. To keep the
experience sane for humans and bots alike:

1. **Never delete, revert, or rewrite someone else's work-in-progress.** If a file
   already has uncommitted edits, assume they are intentional. Do not stage reverts
   or remove paths from the working tree unless explicitly instructed.
2. **Do not touch untracked paths without approval.** If `git status` shows
   untracked files or directories (e.g. local prototypes), leave them alone and
   escalate to a human maintainer.
3. **Stay scoped.** Limit edits to the files relevant to your assigned task. Avoid
   opportunistic "drive-by" cleanups that could interfere with parallel efforts.
4. **Surface conflicts, don't resolve silently.** When you detect contradictory
   modifications, stop and ask for guidance instead of force-merging, deleting, or
   undoing other agents' changes.
5. **Document assumptions in the final summary** so other agents (and humans)
   understand what you touched and what you deliberately left alone.
6. **Run the guard.** Execute `npm run agent:preflight` before broad edits to catch
   untracked directories or risky deletes early.

### Safety Alert — 2025-09-20
>
> Codex AI accidentally deleted the untracked directory `src/adaptive/enhanced/`,
> causing a loss of work for another contributor. Do not remove or rename
> untracked files. When in doubt, stop and ask.

## Useful Commands

### Testing

- `npm test` – run every suite (traditional + adaptive)
- `npm run test:traditional` – JavaScript traditional suites
- `npm run test:adaptive` – JavaScript adaptive suites
- `npm run test:typescript` – TypeScript traditional + adaptive suites
- `jest <path>` – target a single test file in watch/edit loops

### Validation & Demos

- `npm run validate` – end-to-end demonstration: healthy → refactor → broken
- `npm run demo` / `npm run demo:full` – same as `validate`
- `npm run compare` – side-by-side traditional vs adaptive output

### Operational Checks

- `npm run agent:preflight` – enforce the multi-agent safety contract before editing

### Simulator Scripts

- `npm run refactor` / `npm run restore` – move the JS calculator around
- `npm run refactor:ts` / `npm run restore:ts` – TypeScript calculator moves
- `npm run demo:broken` / `npm run restore:broken` – introduce/fix JS bugs
- `npm run demo:broken:ts` / `npm run restore:broken:ts` – TypeScript bug flow

## Architecture Snapshot

- `languages/javascript/src/discovery-engine.js` – AST-driven discovery engine (async I/O,
  zero-runtime static analysis)
- `languages/javascript/src/scoring-engine.js` – heuristic scoring applied during discovery
- `languages/javascript/src/test-base.js` – base class plus helper for Jest-style suites
- `languages/typescript/src/discovery.js` – TypeScript façade extending JavaScript engine
- `languages/javascript/src/index.js` – public entry point for JavaScript package

Supporting directories:

- `languages/javascript/examples/` – calculators, services, ESM modules, React/Todo samples
- `languages/javascript/tests/` – traditional and adaptive discovery fixtures
- `languages/python/` – Python companion package
- `languages/java/` – Java companion package and CLI tooling
- `languages/php/`, `languages/go/`, `languages/rust/`, `languages/ruby/`, `languages/wolfram/` – experimental samples
- `fixtures/` – shared cross-language signatures and sample projects
- `tools/shared/` – shared tooling utilities
- `vscode-adaptive-tests-extension_experimental/` – VS Code extension for Discovery Lens and scaffolding
- `languages/javascript/scripts/` & `languages/typescript/scripts/` – demo automation invoked by `npm run demo:*`

## Contribution Checklist

1. Keep signatures and tests passing (`npm test`, `npm run validate`).
2. Use the v2 helpers (`getDiscoveryEngine`, `discover`, `adaptiveTest`).
3. Update documentation and CHANGELOG when behaviour changes user-facing
   features.
4. When editing discovery logic, add or update fixtures in
   `fixtures/` + adaptive suites under `languages/javascript/tests/adaptive/` to prove the new
   behaviour.

## Support Channels

- Bug reports / feature requests: [GitHub Issues](https://github.com/anon57396/adaptive-tests/issues)
- Package consumers: npm [`adaptive-tests`](https://www.npmjs.com/package/adaptive-tests) &
  PyPI [`adaptive-tests-py`](https://pypi.org/project/adaptive-tests-py/)
- VS Code Extension: [Development Alpha](vscode-adaptive-tests-extension_experimental/README.md)

## Integration Notes

This adaptive testing framework is designed to work with various development workflows and testing strategies. It integrates well with existing CI/CD pipelines and development tools while providing resilient test discovery that survives code refactoring.

Remember: this repository is public. Treat every script, code comment, and issue
reply as something future users will read.
