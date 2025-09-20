# Adaptive Tests 1.0 — Launch Posts

## Reddit (r/programming / r/javascript / r/node / r/devops)

Title: Refactor‑proof unit tests via AST discovery — Adaptive Tests 1.0

Body:

Traditional tests hardcode import paths. Move a file, rename a symbol, and CI explodes.

Adaptive Tests discovers code by structure (AST), not file paths. Your tests keep running even as AI agents and refactors churn your repo.

What it does:
- Finds classes/functions by signature (name/type/methods/extends…)
- Runs your existing assertions without brittle imports
- Works in JavaScript/TypeScript today; Python/Java companions included

Proof (one command):
- `npm run validate` → Green → Refactor → Traditional breaks, Adaptive stays green → Introduce real bugs → Both fail with assertions

Try it (2 min):
- `npm i adaptive-tests`
- In a test:
  ```js
  const { discover } = require('adaptive-tests');
  const Calculator = await discover({ name: 'Calculator', type: 'class', methods: ['add','divide'] });
  ```

Debug why a match was chosen:
- `npx adaptive-tests why '{"name":"Calculator","type":"class"}'`

Repo & docs:
- GitHub: https://github.com/anon57396/adaptive-tests
- Docs: https://anon57396.github.io/adaptive-tests/

Would love feedback: frameworks to support next, perf scenarios to benchmark, and where “why” output needs to be clearer.

---

## Hacker News

Title: Adaptive Tests — Refactor‑proof unit tests that discover code by structure

Body:

We built an AST‑driven test discovery engine so tests survive file moves/renames. The idea: match components by signature (name/type/methods/properties/extends), not by path.

- JS/TS ready; Python/Java companions included
- CLI has a `why` mode to explain candidate scoring
- Zero‑runtime discovery (no `require()` during matching)

5‑minute demo: `npm run validate` — shows green → refactor → traditional breaks / adaptive passes → real bug → both fail with assertions.

Install: `npm i adaptive-tests`
Why‑mode: `npx adaptive-tests why '{"name":"Calculator","type":"class"}'`

Code & docs: https://github.com/anon57396/adaptive-tests

Curious whether this approach fits your AI‑assisted workflows and what would block adoption.
