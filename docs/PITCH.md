# Adaptive Tests – Positioning Playbook

Use this cheat sheet when talking with AI platform teams, hiring managers, or potential partners.

## Problem (30 sec)

- AI agents and rapid refactors constantly move files and rename symbols.
- Traditional unit tests explode because their `import` paths go stale.
- Human and AI productivity stalls while teams repair brittle test harnesses instead of shipping features.

## Solution (30 sec)

- Adaptive Tests discovers code by **structure**, not file paths.
- AST-driven signatures match the component you care about (methods, properties, extends/implements, language heuristics).
- Same adaptive discovery works across JavaScript, TypeScript, Python, and Java today; other languages are incubating.

## Proof & Demos

1. `npm run validate` – automated walk-through:
   - Healthy → both suites green.
   - Refactor → traditional fails on import error, adaptive stays green.
   - Inject bugs → both suites fail with real assertions (no false greens).
   - Repeats the flow for the TypeScript mirror; then runs pytest + Maven parity checks.
2. `npm run demo:js:refactor` / `npm run demo:js:restore` – quick JS-only illustration.
3. `npx adaptive-tests why '{"name":"Calculator"}'` – explains scoring heuristics for a given signature.

## Differentiators

- **Zero-runtime discovery:** Uses static analysis (no `require()` of untrusted code during discovery).
- **Language-aware scoring:** Heuristics for exports, method names, inheritance, and recent edits.
- **Explainability:** `why` output surfaces candidate rankings, enabling debugging instead of guesswork.
- **Meta-package (`adaptive-tests`):** Ships a unified CLI + JS runtime with optional TypeScript companion.
- **Validation Script:** One command proves survival through refactors and failure on real bugs.

## Talking Points for AI / DevTools Roles

- “I built the test infrastructure that stays green when AI agents refactor your code. Adaptive Tests keeps humans focused on features instead of repairing imports.”
- “Our AST discovery engine has cross-language parity. The same workflow now exists for TypeScript, Python, and Java—CI validation included.”
- “I treated docs, CLI, VS Code, and GitHub Action as first-class surfaces, so teams can adopt it without bespoke setup.”
- “The project demonstrates how to ship autonomous tooling safely: guardrails (`npm run agent:preflight`), explainability (`why` traces), and performance-conscious scanning.”

## Suggested Metrics to Track (Share When Asked)

- Survival rate of adaptive suites vs. traditional under scripted refactors (100% vs. 0% in the calculator demo).
- Time-to-green after file moves (seconds vs. hours of path fixing).
- Cache hit rate when re-running discovery on large trees.
- Cross-language adoption (npm + PyPI downloads, Maven installs once published).

## Next Conversations

1. **Product Discovery:** How does the target org currently manage flaky tests during AI-assisted refactors?
2. **Integration:** Where do they need adaptive discovery first (language + framework)?
3. **Roadmap Alignment:** Share `ROADMAP.md` highlights (insights, performance harness, IDE tooling).
4. **Ask:** “Would you be interested in piloting Adaptive Tests inside your AI development pipeline?”

Use this playbook alongside the README’s quick start and the validation demo video (when recorded) to tell a crisp, defensible story.
