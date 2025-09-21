# Error Messages Guide

## Philosophy: Errors That Help, Not Frustrate

Every error message in Adaptive Tests follows these principles:

1. **Tell what went wrong** - Clear problem statement
2. **Show why it failed** - Context and details
3. **Suggest how to fix it** - Actionable next steps
4. **Provide debugging tools** - Commands to investigate further

## Common Error Messages & Solutions

### Discovery Errors

#### Error: No candidates found for signature

**What you see:**

```text
Error: No candidates found for signature {"name":"UserService","type":"class"}

No files matched your search criteria. This could mean:
1. The file doesn't exist in the search paths
2. The signature is too restrictive
3. The file is in an excluded directory

To debug:
• Run: npx adaptive-tests why '{"name":"UserService"}' to see all candidates
• Try a less restrictive signature: {"name":"UserService"}
• Check if the file is in: node_modules, test, __tests__, .git (excluded by default)
• Verify the file extension is included: .js, .jsx, .ts, .tsx

Current search configuration:
- Search paths: ["./src", "./lib", "./app"]
- Excluded: ["node_modules", "test", "__tests__", ".git", "dist", "build"]
- Extensions: [".js", ".jsx", ".ts", ".tsx"]
```

**Quick fixes:**

```bash
# See what files are being considered
npx adaptive-tests why '{"name":"UserService"}'

# Check if file exists
find . -name "*UserService*" -type f

# Try broader signature
{"name": /User/i, "type": "class"}
```

---

#### Error: Multiple candidates with identical scores

**What you see:**

```text
Error: Multiple candidates have identical score (156 points)

Found 3 files with the same score:
1. src/services/UserService.js (156 points)
   ✓ Exact name match: +45
   ✓ Type match (class): +15
   ✓ Has methods [login, logout]: +6

2. src/legacy/UserService.old.js (156 points)
   ✓ Exact name match: +45
   ✓ Type match (class): +15
   ✓ Has methods [login, logout]: +6

3. backup/UserService.backup.js (156 points)
   ✓ Exact name match: +45
   ✓ Type match (class): +15
   ✓ Has methods [login, logout]: +6

To resolve:
• Add more specific criteria: methods, properties, or exports
• Use path hints: {"name":"UserService","pathIncludes":"services"}
• Exclude backup files in config: excludePatterns: ["*.old.js", "*.backup.js"]
• Manually specify exact file: discover.fromFile("src/services/UserService.js")

Run 'npx adaptive-tests why' with --verbose to see full scoring breakdown
```

---

#### Error: Signature validation failed

**What you see:**

```text
Error: Module found but doesn't match signature requirements

File: src/services/UserAPI.js
Signature: {"name":"UserService","type":"class","methods":["login","logout","register"]}

Validation failures:
✗ Name mismatch: Expected "UserService", found "UserAPI"
✓ Type match: Both are classes
✗ Missing required method: "register" not found
  Found methods: ["login", "logout", "authenticate"]

Did you mean one of these?
• UserAPI with methods ["login", "logout", "authenticate"]
• AuthService with methods ["login", "logout", "register"]
• UserService in src/models/UserService.js

To fix:
• Correct the name: {"name":"UserAPI",...}
• Adjust required methods: {"methods":["login","logout"]}
• Use partial matching: {"methods":{"some":["login"]}}
• Check the implementation has the expected methods

Debug command:
npx adaptive-tests analyze src/services/UserAPI.js
```

---

### Configuration Errors

#### Error: Configuration file invalid

**What you see:**

```text
Error: Invalid configuration in adaptive-tests.config.js

Problems found:
✗ Line 15: discovery.scoring.paths expects object with 'positive' and 'negative' arrays
  You provided: {"paths": "/src/"}

✗ Line 23: discovery.extensions must be an array
  You provided: ".js"

✗ Line 31: Unknown configuration key 'discovery.magic'
  Did you mean: 'discovery.maxDepth'?

Example of valid configuration:
{
  discovery: {
    scoring: {
      paths: {
        positive: ['/src/', '/lib/'],
        negative: ['/test/', '/mock/']
      }
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    maxDepth: 10
  }
}

Using default configuration. Fix the errors and restart.
See full config docs: CONFIGURATION.md
```

---

### Runtime Errors

#### Error: Module cannot be loaded

**What you see:**

```text
Error: Found matching file but cannot load module

File: src/services/DatabaseService.ts
Reason: TypeScript file requires compilation

This is a TypeScript file but ts-node is not configured.

To fix:
1. Install TypeScript dependencies:
   npm install --save-dev ts-node typescript @types/node

2. Ensure tsconfig.json exists with:
   {
     "compilerOptions": {
       "target": "ES2020",
       "module": "commonjs",
       "allowJs": true,
       "esModuleInterop": true
     }
   }

3. If using Jest, add to jest.config.js:
   transform: {
     '^.+\\.tsx?$': 'ts-jest'
   }

Alternative: Pre-compile TypeScript files and discover from .js output
```

---

#### Error: Circular dependency detected

**What you see:**

```text
Error: Circular dependency detected during discovery

Dependency chain:
1. src/services/UserService.js
   ↓ imports
2. src/models/User.js
   ↓ imports
3. src/utils/validators.js
   ↓ imports
4. src/services/UserService.js ← circular!

This creates an infinite loop during module loading.

To fix:
• Refactor to remove circular dependencies
• Use lazy loading: const User = () => require('./User')
• Extract shared code to a separate module
• Use dependency injection instead of direct imports

Debugging tools:
• npx madge --circular src/  # Visualize all circular dependencies
• npx adaptive-tests analyze --check-circular

Temporary workaround (not recommended):
Set allowCircular: true in adaptive-tests.config.js
```

---

### Performance Warnings

#### Warning: Discovery taking too long

**What you see:**

```text
Warning: Discovery took 3,847ms (threshold: 1000ms)

Performance breakdown:
- File scanning: 2,341ms (8,923 files)
- Content reading: 1,203ms (892 candidates)
- AST parsing: 234ms (156 files)
- Validation: 69ms (12 candidates)

This might indicate:
• Too many files being scanned
• Missing cache configuration
• Inefficient search paths

Optimization suggestions:
1. Enable caching:
   {
     discovery: {
       cache: {
         enabled: true,
         ttl: 3600000,  // 1 hour
         path: '.adaptive-cache'
       }
     }
   }

2. Narrow search paths:
   searchPaths: ['./src'] instead of ['.']

3. Add more exclusions:
   excludePatterns: ['**/node_modules/**', '**/dist/**', '**/*.test.js']

4. Use more specific signatures:
   {"name": "UserService", "type": "class"} instead of just {"name": "UserService"}

Run with DEBUG=adaptive:perf for detailed timing information
```

---

### Test-Specific Errors

#### Error: BeforeAll hook timeout

**What you see:**

```text
Error: Timeout in beforeAll hook - discovery took too long

Test: UserService.adaptive.test.js
Timeout: 5000ms
Actual: 7234ms

The discovery process is taking too long. This usually means:

1. First run without cache (normal, will be faster next time)
2. Very large codebase (10,000+ files)
3. Complex signature matching

Solutions:
• Increase timeout for first run:
  beforeAll(async () => {
    UserService = await discover({...})
  }, 10000)  // 10 second timeout

• Pre-warm cache in test setup:
  // jest.setup.js
  const { warmCache } = require('@adaptive-tests/javascript');
  beforeAll(() => warmCache());

• Use lazy discovery:
  let UserService;
  beforeEach(async () => {
    UserService ??= await discover({...});
  });

• Enable persistent cache across test runs:
  npx adaptive-tests cache --persist
```

---

## Error Message Templates

### For Library Developers

When adding new error messages, use these templates:

```javascript
// Template for "not found" errors
throw new DiscoveryError(
  `No ${type} found matching "${name}"`,
  {
    searched: searchPaths,
    candidates: nearMatches,
    suggestion: `Try 'npx adaptive-tests why ${JSON.stringify(signature)}'`,
    docs: 'https://docs.adaptive-tests.dev/errors#not-found'
  }
);

// Template for validation errors
throw new ValidationError(
  `${moduleName} doesn't match required signature`,
  {
    expected: signature,
    actual: extractedSignature,
    differences: diffSignatures(signature, extractedSignature),
    fix: suggestSignatureFix(extractedSignature, signature)
  }
);

// Template for configuration errors
throw new ConfigError(
  `Invalid config: ${field} must be ${expectedType}`,
  {
    location: `${configFile}:${lineNumber}`,
    provided: actualValue,
    example: exampleConfig[field],
    schema: configSchema[field]
  }
);
```

## Debug Commands Cheatsheet

```bash
# See why discovery selected/rejected files
npx adaptive-tests why '{"name":"UserService"}'

# Analyze a specific file's exports and structure
npx adaptive-tests analyze src/services/UserService.js

# Check what files are being searched
npx adaptive-tests discover --dry-run --verbose

# Validate configuration
npx adaptive-tests config --validate

# Clear cache if discovery seems stuck
npx adaptive-tests cache --clear

# See discovery performance breakdown
DEBUG=adaptive:perf npm test

# Check for circular dependencies
npx adaptive-tests check --circular

# Generate signature from existing file
npx adaptive-tests signature src/services/UserService.js
```

## Getting Help

If you encounter an error not listed here:

1. **Check the error code**: Each error has a unique code like `DISC_001`
2. **Search issues**: [GitHub Issues](https://github.com/anon57396/adaptive-tests/issues)
3. **Ask the community**: [GitHub Discussions](https://github.com/anon57396/adaptive-tests/discussions)
4. **Enable debug mode**: `DEBUG=adaptive:* npm test`
5. **Report a bug**: Include the full error and output of `npx adaptive-tests debug --report`

Remember: Every error is an opportunity to improve. If an error message confused you, please tell us so we can make it better!
