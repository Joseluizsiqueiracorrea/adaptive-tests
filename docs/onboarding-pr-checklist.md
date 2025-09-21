# Onboarding UX – PR Checklist

Purpose: keep the repo welcoming for first‑time visitors and “paste‑and‑run” devs.

## README (Top of Fold)

- [ ] One copy‑paste block per language (JS/TS, Python). No extras.
- [ ] Optional “Diagnose discovery” line with `npx adaptive-tests why`.
- [ ] “Stuck? Quick fixes” 3 bullets.
- [ ] “Works with Cursor / Copilot / VS Code — no extension required.”
- [ ] Link to Quick Start as a single page.

## GIF Demo (10–12s)

- [ ] Add a short `docs/assets/discover-pass.gif` showing: failing import → discover → test passes.
- [ ] Embed near Quick Start.

## Docs

- [ ] Troubleshooting: ensure the “3 quick fixes” match README bullets.
- [ ] Keep long-form “Why/Comparison” out of README; just link.

## Repo Hygiene

- [ ] Ignore IDE/build/test/cache noise (*.coverage*, __pycache__, dist, etc.).
- [ ] Keep root files minimal: README, QUICKSTART, docs/, languages/, scripts/, action.yml.
- [ ] Keep experimental VS Code extension ignored and unlinked.

## CI/Action

- [ ] README includes a link to the GitHub Action Marketplace entry.
- [ ] Optional: add a badge for the Action.

## Sample Repo (Nice‑to‑Have)

- [ ] Create `adaptive-tests-example-js` with a tiny service + adaptive tests.
- [ ] README shows running `why` and a test passing.
