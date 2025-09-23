# AGENTS.md - Contributing to Adaptive-Tests Repository

## 📍 SCOPE: For AI agents working on the adaptive-tests framework itself

| Document | Purpose |
|----------|---------|
| **AGENTS.md** (this file) | Contributing to adaptive-tests codebase |
| [AI_USAGE_GUIDE.md](./docs/AI_USAGE_GUIDE.md) | Using adaptive-tests in external projects |
| [AI_PROMPT_REFERENCE.md](./docs/AI_PROMPT_REFERENCE.md) | Copy-paste prompts for quick reference |

## Mission-Critical Context

This project is the **AI-ready testing foundation** for the autonomous development era. As AI agents increasingly reshape codebases at velocity, adaptive-tests ensures testing infrastructure doesn't break through AST-based analysis instead of brittle file path imports.

**The paradigm shift:** While traditional tests break when AI agents refactor, adaptive tests survive by finding code through structure, not file paths. This eliminates the import maintenance cycles that waste AI capabilities on busywork instead of feature development.

The standards for code quality, documentation, and reliability are exceptionally high. Every contribution must reflect a commitment to perfection and a deep understanding of the project's role in enabling autonomous development workflows. Mediocrity will not be accepted.

## ⚠️ CRITICAL: What This Repository IS and IS NOT

### This Repository IS

- **A FRAMEWORK** for creating resilient tests in OTHER projects
- **A TOOL** that helps developers instrument THEIR codebases
- **A LIBRARY** published to npm/PyPI for use in external projects

### This Repository IS NOT

- **NOT** a project that needs its own scripts tested
- **NOT** a place to create test files in root directories
- **NOT** asking for test coverage of utility scripts

### 🚨 COMMON AI AGENT MISTAKES TO AVOID

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

## 0.3.0 Quick Facts for Agents

- **JavaScript is the core**: the plugin registry and shared `BaseLanguageIntegration` were removed. Only the JS/TS engine ships from this package.
- **TypeScript piggybacks on JS**: installing `@adaptive-tests/typescript` pulls in the JS engine; do not attempt to fork discovery logic into a TS-only engine.
- **Python/Java are standalone**: each lives under `languages/python` and `languages/java` with its own discovery implementation.
- **Docs must reflect the above**: when updating language guides, double-check links on `anon57396.github.io` and run `npm run lint:links`.

## 🤖 AI Agent Collaboration Contract & Guide

This section is a binding contract for all AI agents working on this repository. Violations can cause real loss of work. Read this entire section before touching any file.

### 🚨 Emergency Rules (Read First)

1. NEVER delete uncommitted work – if you didn’t create it in this session, don’t delete it.
2. ALWAYS announce your work – record your intent in `.agent_work_log` before editing.
3. CHECK before you wreck – run `git status -sb` before any file operation.
4. ONE agent, ONE module – don’t work on files another agent is actively editing.
5. FAIL loud, fix together – if you break something, document it immediately and stop.

Signs another agent is working:

```bash
# Always check these first:
git status -sb                 # Uncommitted changes? Someone is working.
git diff                       # See the nature of their changes.
ls -la /tmp/adaptive-tests_*   # Work markers (if present).
tail -50 .agent_work_log       # Recent activity log.
```

If you see uncommitted changes:

- Do NOT delete or revert them
- Assume they are intentional
- Add to them carefully only if necessary
- Document exactly what you added and why

### 📋 Agent Work Log Protocol

Use a lightweight coordination log at the root of the repo. Treat it as append-only. Do not rewrite history.

Starting work (announce):

```bash
echo "[$(date)] Agent $(whoami) starting: $TASK" >> .agent_work_log
echo "Files I plan to modify: $FILES" >> .agent_work_log
touch /tmp/adaptive-tests_$(date +%s)_$MODULE
```

Finishing work (handoff):

```bash
echo "[$(date)] Agent $(whoami) completed: $TASK" >> .agent_work_log
echo "Files modified: $FILES" >> .agent_work_log
echo "Next agent should: $NEXT_STEPS" >> .agent_work_log
rm -f /tmp/adaptive-tests_*_$MODULE
```

Notes:

- Do not commit `.agent_work_log` if it contains sensitive info. It is primarily for live sessions. If committed, ensure entries are appropriate for a public repo.
- Prefer log + /tmp marker files over adding temporary “AGENT_WORKING” comments in code. Never commit ephemeral agent markers into published source files.

### 🧭 Coordination & Conflict Resolution

- Stay scoped: limit edits to the files relevant to your assigned task.
- Surface conflicts, don’t resolve silently: when you detect contradictory modifications, stop and ask for guidance.
- If two agents touched the same file at once:
  1. STOP immediately.
  2. Check `.agent_work_log` to identify who started first.
  3. The second agent should save their changes to a separate file (e.g. `file.js.agent2_conflict`) or a new branch, record the conflict in the log, and wait for resolution.

Example conflict protocol:

```bash
cp path/to/file.js path/to/file.js.$(whoami)_conflict
echo "CONFLICT: Multiple agents edited path/to/file.js" >> .agent_work_log
```

### 🛡️ Safety Guard

Before broad edits, run:

```bash
git status -sb
```

Scan for untracked paths or suspicious deletes. If anything looks risky, stop and ask.

### Safety Alert — 2025-09-20
>
> Codex AI accidentally deleted the untracked directory `src/adaptive/enhanced/`, causing a loss of work for another contributor. Do not remove or rename untracked files. When in doubt, stop and ask.

---

## 🔒 File Modification Rules

These rules protect core functionality and developer ergonomics. When in doubt, ask before changing filesystem shape.

### Never Touch (generated or external)

```text
.git/**
**/node_modules/**
**/dist/**
**/build/**
**/coverage/**
**/.cache/**
**/__pycache__/**
**/*.pyc
.agent_work_log (except appending via the protocol above)
/tmp/adaptive-tests_* (other agents’ markers; don’t remove)
```

### Critical Paths (no delete/rename; modify with care and tests)

- `languages/javascript/src/discovery-engine.js`
- `languages/javascript/src/scoring-engine.js`
- `languages/javascript/src/test-base.js`
- `languages/javascript/src/index.js`
- `languages/typescript/src/discovery.js`

Edits to the discovery logic must include fixtures and adaptive tests proving the intended behavior.

### Safe to Modify (with care)

- `docs/**` and top-level Markdown (keep public docs tight and accurate)
- Example projects and fixtures under `languages/*/examples/**` and `languages/*/tests/**`
- Scripts under `languages/javascript/scripts/**` and `languages/typescript/scripts/**`

Never create test directories at the repository root. All tests belong under the language-specific trees per the “CRITICAL” section above.

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

- Run `git status -sb` before editing to confirm your workspace is clean and spot untracked paths.
- After editing docs, run `npm run lint:links` to catch broken URLs before you push.

## 🧪 Testing Requirements

Fundamental rule: never write tests for code that doesn’t exist or cannot be imported. Tests must target real modules and real behavior.

Before any commit or PR:

- `npm test` – all suites pass
- `npm run validate` – demo flows remain healthy
- `npm run lint:links` – public docs contain no broken links

When working in language-specific packages, also run their native test runners (e.g., `jest <path>` for JS/TS; Python/Java packages use their own runners within `languages/python` or `languages/java` when you are explicitly working there).

Prohibited testing practices:

- Creating tests at the repository root
- Testing utility scripts for this repo (e.g., `scripts/validate.js`)
- Mocking entire feature areas that don’t exist to inflate coverage

### Simulator Scripts

- `npm run refactor` / `npm run restore` – move the JS calculator around
- `npm run refactor:ts` / `npm run restore:ts` – TypeScript calculator moves
- `npm run demo:broken` / `npm run restore:broken` – introduce/fix JS bugs
- `npm run demo:broken:ts` / `npm run restore:broken:ts` – TypeScript bug flow

## 💀 Destructive Operations — Forbidden

Never perform destructive or sweeping operations that can wipe or hide others’ work.

Forbidden:

- `git reset --hard`, `git clean -fd` (without explicit human approval)
- Bulk deletes like `rm -rf *`, or programmatic mass edits/deletes
- Overwriting files without reading and preserving context

Safe alternatives:

- Backup → Verify → Remove (create `*.backup` or use `git stash`)
- Read → Modify → Save (apply minimal, surgical edits)
- Work incrementally and test between steps

## 🚀 Startup Checklist for New Agents

```bash
# 1) Announce yourself
echo "[$(date)] NEW AGENT: $(whoami) starting session" >> .agent_work_log

# 2) Check current state
git status -sb
git diff --stat
tail -50 .agent_work_log || true
ls -la /tmp/adaptive-tests_* || true

# 3) Validate health
npm test -s || true        # skim for obvious failures
npm run validate -s || true

# 4) Claim your module (optional marker)
touch /tmp/adaptive-tests_$(date +%s)_$MODULE
```

## 💬 Inter-Agent Communication

- Use clear commit messages and include context when helpful.
- In code, prefer TODO/FIXME/HACK comments sparingly and remove them before release when possible.
- Leave actionable next steps in `.agent_work_log` during handoff.

Examples:

```text
TODO(AgentA→Engine): Consider factoring visitor into utility
FIXME(AgentB): Scoring breaks when identifiers shadow imports
HACK(AgentC): Temporary heuristic until parser upgrade lands
```

## 📊 Status Tracking (Optional Template)

Keep this updated only if you intend to maintain it. Otherwise omit.

```yaml
Engine:
  discovery-engine: WORKING | DEGRADED | BROKEN
  scoring-engine: WORKING | DEGRADED | BROKEN
  zero-runtime: PRESERVED | VIOLATED

Suites:
  js_tests: PASS | FAIL
  ts_tests: PASS | FAIL
  validate_demo: PASS | FAIL

Docs:
  links: PASS | FAIL
```

## 📈 Success Criteria for This Repo

- All `npm test` suites pass.
- `npm run validate` completes and demonstrates resilience.
- Discovery remains zero-runtime (no `require()` during discovery).
- No new tests at the repository root; adaptive tests live under language trees only.
- Public docs are accurate and link-checked.

## 🆘 Emergency Recovery

If something breaks during your session:

1. Stop immediately.
2. Document in `.agent_work_log` what broke and where.
3. Create a safe point: `git stash -u -m "emergency-snapshot"`.
4. Restore to last good state: `git reset --hard HEAD` (only if approved and safe), or ask for guidance.
5. Leave clear next steps in the work log.

## 📝 Final Agent Covenant

I will:

- Check before I wreck
- Announce my work and hand off cleanly
- Respect other agents’ changes
- Test what I change
- Document assumptions and outcomes
- Prefer surgical edits over sweeping changes
- Keep users’ trust and this project’s quality bar

I will not:

- Delete uncommitted work
- Assume intent without checking the log
- Work silently on shared files

## Architecture Snapshot

- `languages/javascript/src/discovery-engine.js` – AST-driven discovery engine (async I/O,
  zero-runtime static analysis)
- `languages/javascript/src/scoring-engine.js` – heuristic scoring applied during discovery
- `languages/javascript/src/test-base.js` – base class plus helper for Jest-style suites
- `languages/typescript/src/discovery.js` – thin façade that re-exports the JavaScript engine for TS consumers
- `languages/javascript/src/index.js` – public entry point for the JavaScript package (and transitive entry for TypeScript)

Supporting directories:

- `languages/javascript/examples/` – calculators, services, ESM modules, React/Todo samples
- `languages/javascript/tests/` – traditional suites plus adaptive fixtures under `tests/fixtures/`
- `languages/typescript/examples/` – TypeScript calculator sample and adaptive tests
- `languages/python/` – Python companion package (standalone discovery engine, fixtures, and pytest suites)
- `languages/java/` – Java companion package and CLI tooling (standalone discovery engine)
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

## Integration Notes

This adaptive testing framework is designed to work with various development workflows and testing strategies. It integrates well with existing CI/CD pipelines and development tools while providing resilient test discovery that survives code refactoring.

Remember: this repository is public. Treat every script, code comment, and issue
reply as something future users will read.
