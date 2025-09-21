# Changelog

All notable changes to this project are documented here. Dates are omitted when historical records are unclear.

## [0.3.0] - 2025-09-21

### Breaking

- Removed the shared language plugin registry and `BaseLanguageIntegration` shim from the JavaScript runtime. The package now ships only the JavaScript/TypeScript discovery engine and no longer bundles the experimental PHP, Ruby, Rust or Wolfram collectors.
- TypeScript installs now wrap the JavaScript engine explicitly. Installing `@adaptive-tests/typescript` will pull in `@adaptive-tests/javascript` automatically.

### Added

- `discover()` accepts an options object so callers can pass `{ rootPath, discovery: {...} }` without first creating an engine instance.
- File system scanning is hardened: `LRUCache` parameters are validated, path resolution is fully async, and traversal outside the project root is blocked.
- GitHub Action: automatically installs `adaptive-tests@0.3.0`, exposes coverage paths, and respects the repo’s preferred package manager via `install-command`.
- Release tooling: added `npm run publish:all` plus a build script for companion plugins to keep Marketplace packages in sync.

### Changed

- Scaffolding CLI (and VS Code command) now loads the adaptive-tests API via dynamic import and surfaces clearer error messages.
- Cleaned up legacy calculator examples, removed deprecated scripts, and refreshed package metadata across the workspaces.
- Consolidated CI workflows: modern Node.js baselines, leaner job matrix, and consistent validation across JavaScript, TypeScript, and Python suites.

### Documentation

- Reworked Quick Start + language guides to clarify that JavaScript is the shared core, TypeScript is a thin wrapper, and Python/Java ship independent engines.
- Updated landing page, comparison guide, and troubleshooting docs for the new install flow and supported languages.

## [0.2.5] - 2025-09-19

- **PyPI Update**: Published adaptive-tests-py 0.2.5 to match npm package version
- **Documentation**: Updated all README files for factual accuracy
- **GitHub Action**: Now available in GitHub Marketplace
- **Repository**: Comprehensive fact-check and correction of all documentation

## [0.2.4] - 2025-09-19

- **NEW: Migration Tool** - Added `npx adaptive-tests migrate` command to automatically convert traditional tests to adaptive tests
  - Analyzes existing test files using AST parsing to extract imports, test structure, and methods
  - Generates adaptive tests that use `discover()` instead of hardcoded imports
  - Supports two migration strategies: create new files or replace existing (with backups)
  - Intelligent method detection filters out test framework methods
  - Works with both CommonJS and ES Module test files

- **NEW: Jest Plugin** - Created `jest-adaptive` package for zero-config Jest integration
  - Automatic global injection of `discover()`, `adaptiveTest()`, and helper functions
  - Jest preset for instant setup with `preset: 'jest-adaptive'`
  - Custom Jest matchers: `toBeDiscovered()` and `toHaveMethods()`
  - Optional transformer for `.adaptive.test.js` files
  - Lazy discovery with `lazyDiscover()` for performance
  - Batch discovery with `discoverAll()` for multiple modules
  - Full TypeScript support with type definitions

- **NEW: Vite Plugin (preview)** - Created `vite-plugin-adaptive` for build-time hooks
  - HMR integration for instant test updates
  - Build-time discovery extraction and caching
  - Bundle size analysis for discovered modules
  - Development server API endpoint for discovery
  - Discovery manifest generation for CI/CD

- **NEW: Webpack Plugin (preview)** - Created `webpack-plugin-adaptive` for Webpack integration
  - Automatic loader configuration for adaptive test files
  - Build-time discovery optimization
  - Smart caching with watch mode support
  - Bundle size impact analysis
  - Chunk optimization for test files
  - Discovery manifest generation
- **Build pipeline** - Added `scripts/build-packages.js` and `npm run build:plugins` for offline-friendly builds of companion packages.
- **Repo hygiene** - Introduced `npm run clean:artifacts` and a release checklist to keep shared snapshots lightweight.

## [0.2.3]

- Shipped adaptive-tests-py 0.2.0 with configurable scoring, persistent cache, Lens-style explanations, and bundled CLI tooling (updated to 0.2.5)
- Updated PyPI packaging metadata and wheels for the new Python release
- Fixed critical Windows path handling issues in Java scaffolding
- Added package manager detection (yarn/pnpm/bun support) for cross-team compatibility
- Implemented LRU caches to prevent memory leaks in large codebases
- Enhanced security: added input validation for Python integration to prevent command injection
- Fixed cache portability: converted absolute to relative paths for CI/CD compatibility
- Improved cross-platform file matching with case-insensitive comparisons

## [0.2.2]

- Refreshed all public documentation (README, PROOF, ROADMAP, AGENTS, CONTRIBUTING) for accuracy
- Introduced markdownlint configuration and CI enforcement
- Bumped npm package metadata in preparation for publish
- Added the Discovery Lens CLI (`npx adaptive-tests why`) for deep-dive scoring diagnostics
- Aligned Python companion package version (adaptive-tests-py 0.2.5) and cleaned packaging metadata (SPDX license expression)
- Enhanced Java/PHP quickstart docs with complete adaptive test examples
- Updated VS Code extension status from "Coming Soon" to "Development Alpha" with setup instructions

## [0.2.1]

- Fixed npm `bin` path warning
- Added `demo.gif` to the published package for visual documentation
- Enhanced README with an animated demonstration
- Hardened function detection regex to avoid ReDoS on untrusted input
- Moved adaptive fixtures to `fixtures/` and taught the discovery engine to skip any `tests/` directory while scanning

## [0.2.0]

- Added Python example (`languages/python/examples/python/`) and companion `adaptive-tests-py` package scaffold for PyPI
- Documented cross-language recipes (React components, Node microservices, Prisma/TypeORM repositories)
- Added troubleshooting tips for signature debugging and cache management
- Added GitHub Actions workflow to publish npm and PyPI packages when a release is published

## [0.1.3]

- Pointed repository/homepage metadata to github.com/anon57396/adaptive-tests
- Updated npm README clone instructions to the same namespace

## [0.1.0]

- Initial public release of the adaptive discovery toolkit
- Shipped JavaScript discovery engine with scoring heuristics and caching
- Added TypeScript discovery support powered by the compiler API and optional `ts-node`
- Included base `AdaptiveTest` class, Jest helper, and validation scripts demonstrating refactor and bug scenarios for JS & TS examples
