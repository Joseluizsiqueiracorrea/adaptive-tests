# adaptive-tests (Meta Package)

This package bundles the JavaScript CLI (`@adaptive-tests/javascript`) and exposes a convenient `adaptive-tests` binary. It is the entry point recommended in the root README (`npx adaptive-tests ...`).

## Included Commands

- `adaptive-tests init` – interactive setup wizard
- `adaptive-tests migrate` – convert traditional tests to adaptive tests
- `adaptive-tests enable-invisible` – enable import auto-healing
- `adaptive-tests scaffold` – generate adaptive test skeletons
- `adaptive-tests why` – inspect discovery scoring

Each command forwards to the implementation shippped in `@adaptive-tests/javascript`.

## Usage

```bash
npx adaptive-tests init
npx adaptive-tests enable-invisible --dry-run
npx adaptive-tests why '{"name":"UserService"}'
```

For comprehensive documentation see the main project README.
