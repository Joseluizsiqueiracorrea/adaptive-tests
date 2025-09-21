# @adaptive-tests/typescript

**AI-ready testing infrastructure for TypeScript projects**

## Installation

```bash
# Install the meta package + TypeScript companion
npm install adaptive-tests @adaptive-tests/typescript

# Peer dependencies (if not already installed)
npm install --save-dev typescript ts-node
```

## Quick Start

### Basic TypeScript Discovery

```typescript
import { discover } from 'adaptive-tests';
import { getTypeScriptDiscoveryEngine } from '@adaptive-tests/typescript';

describe('UserService', () => {
  let UserService: any;

  beforeAll(async () => {
    const engine = getTypeScriptDiscoveryEngine('./src');
    UserService = await engine.discoverTarget({
      name: 'UserService',
      type: 'class',
      methods: ['findById', 'create']
    });
  });

  test('finds user by ID', async () => {
    const service = new UserService();
    const user = await service.findById(1);
    expect(user).toBeDefined();
  });
});
```

---

## TypeScript-Specific Features

- Understands `.ts` and `.tsx` files without pre-compiling them.
- Respects your `tsconfig.json` path aliases via `tsconfig-paths`.
- Shares all of the JavaScript discovery features (name/type/method matching, path scoring, caching).
- Works side-by-side with `ts-node` when you want to run TypeScript sources directly.

> ℹ️ Interface decorators, generic matching, and deeper type-checking are on the roadmap. Today the engine relies on structural hints (name/methods/properties) just like the JavaScript implementation.

### TypeScript Configuration

Create `adaptive-tests.config.ts`:

```typescript
import { Config } from 'adaptive-tests-typescript';

const config: Config = {
  typescript: {
    // tsconfig.json path
    configFile: './tsconfig.json',

    // Parse decorators
    experimentalDecorators: true,

    // Include .tsx files
    jsx: true,

    // Strict type checking
    strict: true
  },

  discovery: {
    // TypeScript file patterns
    include: ['src/**/*.ts', 'src/**/*.tsx'],

    // Exclude compiled output
    exclude: ['dist/**', 'build/**', '**/*.d.ts']
  }
};

export default config;
```

---

## Examples

### React Component (TypeScript)

```typescript
// src/components/UserCard.tsx
interface Props {
  user: User;
  onClick?: () => void;
}

export const UserCard: React.FC<Props> = ({ user, onClick }) => {
  return <div onClick={onClick}>{user.name}</div>;
};
```

```typescript
// tests/UserCard.adaptive.test.tsx
import { discover } from 'adaptive-tests';
import { render } from '@testing-library/react';

describe('UserCard Component', () => {
  let UserCard: any;

  beforeAll(async () => {
    UserCard = await discover({
      name: 'UserCard',
      type: 'function',
      exports: 'named',
      frameworks: ['react']  // Framework hint
    });
  });

  test('renders user name', () => {
    const user = { name: 'John Doe' };
    const { getByText } = render(<UserCard user={user} />);
    expect(getByText('John Doe')).toBeInTheDocument();
  });
});
```

### Service with Dependency Injection

```typescript
// src/services/UserService.ts
@Injectable()
export class UserService implements IUserService {
  constructor(
    private repository: UserRepository,
    private cache: CacheService
  ) {}

  async findById(id: string): Promise<User> {
    // Implementation
  }
}
```

```typescript
// tests/UserService.adaptive.test.ts
describe('UserService', () => {
  test('discovers service with dependencies', async () => {
    const UserService = await discover({
      name: 'UserService',
      type: 'class',
      decorators: ['Injectable'],
      implements: ['IUserService'],
      dependencies: ['UserRepository', 'CacheService']
    });

    expect(UserService).toBeDefined();
  });
});
```

---

## Framework Integration

### Jest with TypeScript

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['adaptive-tests-typescript/setup'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  }
};
```

### Vitest with TypeScript

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['adaptive-tests-typescript/setup']
  }
});
```

---

## API Reference

### `getTypeScriptDiscoveryEngine(rootPath?)`

Creates a TypeScript-aware discovery engine:

```typescript
import { getTypeScriptDiscoveryEngine } from 'adaptive-tests-typescript';

const engine = getTypeScriptDiscoveryEngine('./src');
const UserService = await engine.discoverTarget('UserService');
```

### `discoverInterface(signature, rootPath?)`

Discovers TypeScript interfaces:

```typescript
import { discoverInterface } from 'adaptive-tests-typescript';

const IUserService = await discoverInterface({
  name: 'IUserService',
  methods: ['findById', 'create']
});
```

### `discoverType(signature, rootPath?)`

Discovers type aliases and complex types:

```typescript
import { discoverType } from 'adaptive-tests-typescript';

const UserId = await discoverType({
  name: 'UserId',
  type: 'alias'
});
```

---

## Migration from JavaScript

### Existing JavaScript Tests

If you have existing adaptive tests in JavaScript, they'll continue working. To add TypeScript support:

1. Install the TypeScript extension
2. Update imports to use TypeScript-aware discovery
3. Add TypeScript-specific signatures as needed

### Example Migration

**Before (JavaScript):**

```javascript
const UserService = await discover('UserService');
```

**After (TypeScript):**

```typescript
const UserService = await discover({
  name: 'UserService',
  type: 'class',
  implements: ['IUserService'],  // Now type-aware!
  decorators: ['Injectable']
});
```

---

## Troubleshooting

### Common Issues

**TypeScript compilation errors**

```bash
# Ensure ts-node is installed and configured
npm install --save-dev ts-node
```

**Interface discovery fails**

```typescript
// Use more specific signatures
const IUserService = await discoverInterface({
  name: 'IUserService',
  methods: ['findById'],
  location: './src/interfaces'  // Narrow the search
});
```

**Generic type issues**

```typescript
// Be explicit about generic constraints
const Repository = await discover({
  name: 'Repository',
  generics: ['T extends BaseEntity'],
  methods: ['save', 'find']
});
```

---

## Development

### Building from Source

```bash
git clone https://github.com/anon57396/adaptive-tests.git
cd adaptive-tests/languages/typescript
npm install
npm run build
npm test
```

### Contributing

We welcome TypeScript-specific contributions! See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

---

## License

MIT - See [LICENSE](../../LICENSE) for details.

---

**Ready to make your TypeScript tests refactoring-proof?**

```bash
npm install adaptive-tests adaptive-tests-typescript
```

Start with the [Quick Start](#quick-start) guide above!
