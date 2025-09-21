# API Reference

Complete API documentation for adaptive-tests language packages.

## Language-Specific APIs

Each language package provides its own implementation and detailed API documentation:

- **[📦 JavaScript API](../languages/javascript/README.md)** - Core `discover()` function, Jest integration, examples
- **[📘 TypeScript API](../languages/typescript/README.md)** - Type-aware discovery with interface matching
- **[🐍 Python API](../languages/python/README.md)** - pytest integration and discovery functions
- **[☕ Java API](../languages/java/README.md)** - JUnit integration and package discovery

## Core Discovery Pattern

All language implementations follow the same discovery pattern:

### `discover(signature, options?)`

**Purpose:** Find code by structure, not file paths

**Parameters:**

- `signature` (Object): What to find
  - `name` (string): Name of the class/function/module
  - `type` (string): Type ('class', 'function', 'module', etc.)
  - `methods` (array): Expected methods (for classes)
- `options` (Object): Search options (language-specific)

**Returns:** The discovered code, ready to use

## Quick Examples

### JavaScript

```javascript
const { discover } = require('@adaptive-tests/javascript');

const MyClass = await discover({
  name: 'UserService',
  type: 'class',
  methods: ['create', 'find', 'update']
});
```

### TypeScript

```typescript
import { discover } from '@adaptive-tests/typescript';

const MyInterface = await discover({
  name: 'ApiResponse',
  type: 'interface'
});
```

### Python

```python
from adaptive_tests import discover
import asyncio

async def test_user_model():
    UserModel = await discover({
        'name': 'UserModel',
        'type': 'class',
        'methods': ['save', 'delete']
    })
    return UserModel

# Run in async context
UserModel = asyncio.run(test_user_model())
```

### Java

```java
import io.adaptivetests.Discovery;

Class<?> userService = Discovery.discover(
    "UserService",
    Discovery.type("class"),
    Discovery.methods("save", "findById")
);
```

---

## Why This Works

**Traditional tests break when code moves:**

```javascript
import UserService from './src/services/UserService'; // ❌ Breaks when file moves
```

**Adaptive tests survive refactoring:**

```javascript
const UserService = await discover({
  name: 'UserService',
  type: 'class'
}); // ✅ Works regardless of file location
```

## Configuration

Each language package supports configuration files:

- **JavaScript/TypeScript:** `adaptive-tests.config.js`
- **Python:** `pyproject.toml` or `adaptive_tests.yml`
- **Java:** `adaptive-tests.xml` or Maven/Gradle configuration

See language-specific documentation for detailed configuration options.

## CLI Tools

Each package may include CLI tools for scaffolding and migration:

```bash
# JavaScript
npx @adaptive-tests/javascript init

# Python
python -m adaptive_tests init

# Java
mvn adaptive-tests:init
```

See individual language packages for complete CLI documentation.
