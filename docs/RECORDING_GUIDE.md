# Recording the 45‑Second Demo GIF

Goal: Show `npm run validate` proving green → refactor → traditional breaks / adaptive passes → real bug → both fail.

## Option A: Asciinema + agg (crisp, small)

1. Install:
   - macOS: `brew install asciinema agg`
2. Record:
   - `asciinema rec validate.cast`
   - Run: `npm run validate`
   - Stop recording: `Ctrl-D`
3. Convert to GIF:
   - `agg --cols 100 --rows 28 --theme dracula validate.cast validate.gif`

## Option B: Terminalizer (animated GIF)

1. Install: `npm i -g terminalizer`
2. Record: `terminalizer record validate-demo`
3. Run: `npm run validate`
4. Stop: `Ctrl-C` then `terminalizer render validate-demo`

## Tips
- Keep the terminal window ~100x28 chars to avoid huge files.
- Trim long Python/Java skips in editing if needed; the JS/TS parts carry the story.
- Drop the GIF in README under the Quick Start once you’re happy with size/clarity.
