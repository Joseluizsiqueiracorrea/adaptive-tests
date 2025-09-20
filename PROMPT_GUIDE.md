# PROMPT_GUIDE.md - Using Adaptive-Tests in External Projects

**📍 SCOPE: For AI agents instrumenting OTHER projects with adaptive-tests**

| Document | Purpose |
|----------|---------|
| [AGENTS.md](./AGENTS.md) | Contributing to adaptive-tests codebase |
| **PROMPT_GUIDE.md** (this file) | Using adaptive-tests in external projects |
| [docs/ai-prompts.md](./docs/ai-prompts.md) | Copy-paste prompts for quick reference |

## Mission

Your primary mission is to instrument an existing JavaScript or TypeScript project with `adaptive-tests`. This will make the project's test suite resilient to refactoring, allowing developers and other AI agents to move and rename files without breaking tests.

Follow this phased approach. Prioritize **Invisible Mode** for the fastest, lowest-effort, highest-impact result.

---

## Phase 1: Zero-Effort Setup ("Invisible Mode")

This is the recommended first step. It patches the project's existing test runner to automatically use adaptive discovery as a fallback for broken imports. No test code needs to be rewritten.

### 1.1. Analyze Project

- **Detect Test Framework:** Check `package.json` and config files (`jest.config.js`, `vite.config.ts`, etc.) to identify the test framework (Jest, Vitest, Mocha).
- **Identify Test Command:** Find the primary test script in `package.json` (e.g., `"test": "jest"`).

### 1.2. Install Dependencies

Execute the following command to install the core library and the Jest preset (if Jest is the detected framework).

```bash
npm install --save-dev @adaptive-tests/javascript jest-adaptive
```

### 1.3. Enable Invisible Mode

This command intelligently patches the project's test configuration to enable the adaptive fallback mechanism.

```bash
npx adaptive-tests enable-invisible
```

- The command will automatically detect the test framework.
- It will modify the configuration (e.g., `jest.config.js`) to include the adaptive setup.
- It creates backups of any modified files.

---

## Phase 2: Verification

Confirm that the instrumentation was successful.

### 2.1. Run Existing Tests

Execute the project's primary test command.

```bash
npm test
```

**Expected Outcome:** All tests should pass exactly as they did before. Invisible mode does not affect tests with valid imports.

### 2.2. Simulate a Refactor

This is the critical step to prove resilience.

1.  **Identify a test file** that imports a specific source file (e.g., `tests/UserService.test.js` imports `src/services/UserService.js`).
2.  **Move the source file** to a new location (e.g., move `src/services/UserService.js` to `src/api/users/UserService.js`).
3.  **Do NOT update the `require` or `import` statement** in the test file. It is now intentionally broken.
4.  **Run the test command again** (`npm test`).

**Expected Outcome:** The test for the moved file **should still pass**. The console output may show a "discovery" message indicating that `adaptive-tests` found the moved file. This proves the setup is working.

### 2.3. Restore the File

Move the source file back to its original location to restore the project to its previous state.

---

## Phase 3: Authoring New Adaptive Tests

For all *new* tests, use the explicit `discover()` API instead of relying on Invisible Mode. This is the best practice for future development.

### 3.1. Scaffold a New Test

Use the `scaffold` command to generate a boilerplate adaptive test for a source file. This is the fastest way to start.

```bash
# Scaffold a test for a specific file
npx adaptive-tests scaffold src/components/Button.jsx --json

# Scaffold tests for an entire directory
npx adaptive-tests scaffold --batch src/services/ --json
```

The `--json` flag provides a machine-readable summary of the created files.

### 3.2. Write an Explicit Adaptive Test

When writing a test manually, use the `discover` function to find your target module.

```javascript
// tests/adaptive/NewService.test.js
const { discover } = require('@adaptive-tests/javascript');

describe('NewService', () => {
  let NewService;

  // Use beforeAll to discover the target once per test suite
  beforeAll(async () => {
    NewService = await discover({
      name: 'NewService',
      type: 'class',
      methods: ['create', 'find']
    });
  });

  it('should create a new item', () => {
    const service = new NewService();
    const item = service.create({ name: 'Test Item' });
    expect(item).toBeDefined();
  });
});
```

---

## Advanced Tooling Reference

Use these commands for deeper analysis and debugging. **Always prefer JSON output for agent-based workflows.**

### `why`: Debug Discovery

Use this to understand why a signature did or did not find a specific file. It provides a ranked list of candidates and a score breakdown.

```bash
# Why did my signature for "UserService" match these files?
npx adaptive-tests why '{"name":"UserService"}' --json

# Be more specific
npx adaptive-tests why '{"name":"Calculator","type":"class","methods":["add","subtract"]}' --json
```

If discovery fails, the `suggestedSignature` in the JSON output can be used to automatically correct the test.

### `discover` Function Signature

The `discover<T>(signature: DiscoverySignature)` function accepts a signature object with the following core fields:

-   `name: string | RegExp`: The name of the target class, function, or object.
-   `type: 'class' | 'function' | 'object'`: The type of the target.
-   `exports?: string`: The specific named export to select.
-   `methods?: string[]`: An array of public method names to validate.
-   `properties?: string[]`: An array of instance property names to validate.
-   `extends?: string | Function`: The name of a class the target should inherit from.