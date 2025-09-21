# VS Code Extension – MVP Checklist (Do Not Publish Yet)

Status: internal roadmap for CodeCypher.adaptive-tests. Keep this file; do not link from public docs.

## Goals for MVP

- Simple, stable, intuitive. No marketing UI, no experimental features by default.
- Clear onboarding with a single “Get Started” path.

## Blockers to Ship

- Welcome view
  - [ ] Dedicated Welcome/Empty state view (Activity Bar item)
  - [ ] One primary button: “Scaffold Test for Current File” (disabled until a file is open)
  - [ ] Secondary: “Run Discovery on Current File”
  - [ ] Tertiary: “Open Quick Start (docs)”
- Commands
  - [ ] Keep only: Show Discovery Lens, Run Discovery, Scaffold Test, Open Test
  - [ ] Remove or hide: AI/Test Generator, MCP servers, batch scaffolding for now
- Defaults
  - [ ] Disable all experimental features by default
  - [ ] No console noise (SQLite, punycode, MCP) in a clean dev host
- Discovery Lens
  - [ ] Replace “Liquid Glass” styling with native VS Code components
  - [ ] Compact list with: path, score, open file, scaffold test
  - [ ] Clear error states with actions
- Error handling
  - [ ] Friendly messages; link to CLI “why” docs
  - [ ] Always offer a recovery path (open file, open docs)
- Packaging
  - [ ] Extension `publisher`: CodeCypher
  - [ ] Extension `name`: adaptive-tests (ID: CodeCypher.adaptive-tests)
  - [ ] Version aligned with JS package (e.g., 0.3.x)
  - [ ] Minimal dependencies; lockfile committed
- QA
  - [ ] Clean Extension Development Host launch (F5) with `--disable-extensions`
  - [ ] Test on macOS/Windows/Linux latest VS Code
  - [ ] Manual dogfood on 2–3 sample repos

## Nice-to-Haves (Post-MVP)

- [ ] Contextual CodeLens (“Scaffold/Open Test” inline)
- [ ] Folder batch scaffolding with preview
- [ ] “Why” panel that shells to CLI and renders JSON results
- [ ] Basic telemetry (opt‑in) to count command usage only
- [ ] Settings sync for preferred output directory

## Non-Goals for MVP

- No AI generation, no MCP servers, no Live Share, no fancy webview frameworks.

## Work Plan (Phases)

1) Strip features + default off experiments
2) Replace UI with native VS Code views
3) Add Welcome view + empty state
4) Harden error handling + docs links
5) Packaging sanity, smoke tests, sample repos

## Owner Notes

- Keep this internal. Do not reference from README or docs site until we flip the switch.
