# API Reference

This document provides a detailed reference for the core APIs of Adaptive Tests. For language-specific setup and framework integrations, please see the guides for [JavaScript](../languages/javascript/README.md), [TypeScript](../languages/typescript/README.md), [Python](../languages/python/README.md), and [Java](../languages/java/README.md).

---

## Core Concept: Signatures

The fundamental building block of an adaptive test is the **signature**. A signature is a JavaScript object that describes the structural characteristics of the code you want to test. The discovery engine uses this signature to find the code, no matter where it is in your project.

### Signature Properties

| Property | Type | Description |
|---|---|---|
| `name` | `string` or `RegExp` | The name of the class, function, or variable. This is the most common property. |
| `type` | `string` | The type of the code element. Common values are `'class'`, `'function'`, `'object'`, and `'interface'`. |
| `methods` | `string[]` | An array of method names that should exist on a class. |
| `properties` | `string[]` | An array of property names that should exist on a class or object. |
| `exports` | `string` | The name of a specific named export to select from a module. |
| `extends` | `string` or `Function` | The name of a class that the target should extend. |
| `filePath` | `string` or `RegExp` | A pattern to match against the file path. Use this as a last resort to constrain the search. |

---

## The `discover()` Function

The `discover()` function is the primary way to find code in an adaptive test. It's a high-level asynchronous function that takes a signature and returns the discovered module.

```javascript
async function discover<T>(signature: object): Promise<T>
```

### Basic Usage

```javascript
import { discover } from '@adaptive-tests/javascript';

describe('UserService', () => {
  let UserService;

  beforeAll(async () => {
    UserService = await discover({ name: 'UserService', type: 'class' });
  });

  it('should have a create method', () => {
    const service = new UserService();
    expect(service.create).toBeInstanceOf(Function);
  });
});
```

### Advanced Usage with More Specific Signatures

```javascript
// Find a class that implements a specific interface (in this case, methods)
const PaymentGateway = await discover({
  name: /Gateway$/,
  type: 'class',
  methods: ['connect', 'charge', 'refund']
});

// Find a specific function exported from a module
const calculateTax = await discover({
  name: 'tax.js', // You can use file names too
  exports: 'calculateTax'
});
```

---

## The `DiscoveryEngine`

For more advanced use cases, you can get a direct instance of the `DiscoveryEngine`. This gives you more control over the discovery process, such as caching, custom scoring, and more.

```javascript
import { getDiscoveryEngine } from '@adaptive-tests/javascript';

const engine = getDiscoveryEngine(process.cwd());

// You can now use the engine to discover targets
const MyClass = await engine.discoverTarget({ name: 'MyClass' });

// Or use other advanced methods
const candidates = await engine.discoverCandidates({ name: 'MyClass' });
console.log(candidates);
```

### When to use the `DiscoveryEngine`

- You need to discover multiple modules and want to take advantage of caching.
- You want to inspect the discovery process, for example, to see all the candidates that were considered.
- You need to customize the scoring algorithm or other advanced settings.

---

## "Invisible Mode"

Invisible Mode is a powerful feature that allows you to use adaptive discovery with your existing test suite, **with zero code changes**. It works by patching your test runner (e.g., Jest, Vitest) to use the adaptive discovery engine as a fallback when a normal `import` or `require` statement fails.

### How it Works

1. You run `npx adaptive-tests enable-invisible` in your project.
2. This command modifies your test runner's configuration to use a custom resolver.
3. When you run your tests, if a test file tries to import a module that can't be found, the custom resolver kicks in.
4. The resolver uses the file name from the broken import path to create a simple signature (e.g., `{ name: 'UserService' }`).
5. It then uses the discovery engine to find the best match for that signature in your project.
6. If a match is found, it's returned to the test, and the test runs as if the import had worked correctly.

This is a great way to get started with adaptive tests and to make your existing test suite more resilient to refactoring.

---

## CLI Reference

For a full reference of the command-line interface, please see the [CLI documentation](CLI_REFERENCE.md).
