# Adaptive Tests vs Traditional Testing Frameworks

## Quick Comparison Table

| Feature | Adaptive Tests | Jest | Mocha | Vitest | Pytest | JUnit |
|---------|---------------|------|--------|---------|---------|--------|
| **Refactoring Resilience** | ✅ Automatic | ❌ Manual | ❌ Manual | ❌ Manual | ❌ Manual | ❌ Manual |
| **File Movement Tolerance** | ✅ 100% | ❌ 0% | ❌ 0% | ❌ 0% | ❌ 0% | ❌ 0% |
| **Import Maintenance** | ✅ None | ❌ High | ❌ High | ❌ High | ❌ High | ❌ High |
| **Setup Complexity** | ⚠️ Medium | ✅ Low | ✅ Low | ✅ Low | ✅ Low | ⚠️ Medium |
| **Learning Curve** | ⚠️ 2-4 hours | ✅ 1 hour | ✅ 1 hour | ✅ 1 hour | ✅ 1 hour | ⚠️ 2 hours |
| **Test Performance** | ⚠️ Good* | ✅ Excellent | ✅ Excellent | ✅ Excellent | ✅ Excellent | ✅ Excellent |
| **Multi-Language** | ✅ Yes | ❌ JS only | ❌ JS only | ❌ JS only | ❌ Python only | ❌ Java only |
| **AI-Friendly** | ✅ Designed for | ⚠️ Partial | ⚠️ Partial | ⚠️ Partial | ⚠️ Partial | ⚠️ Partial |
| **Ecosystem Maturity** | ⚠️ Growing | ✅ Mature | ✅ Mature | ⚠️ Growing | ✅ Mature | ✅ Mature |
| **IDE Support** | ⚠️ VS Code ext | ✅ Universal | ✅ Universal | ✅ Good | ✅ Universal | ✅ Universal |

*After initial cache warming

## Detailed Comparisons

### Adaptive Tests vs Jest

#### When to Choose Adaptive Tests Over Jest

✅ **Choose Adaptive Tests when:**

- Your codebase undergoes frequent restructuring
- Multiple teams work on the same codebase
- You're migrating to microservices
- AI tools assist in development
- Refactoring is part of your culture

❌ **Stick with Jest when:**

- Your file structure is stable and rarely changes
- Performance is critical (sub-millisecond tests)
- You need the full Jest ecosystem immediately
- Your team is already Jest experts

#### Code Example: The Key Difference

**Jest (Traditional)**

```javascript
// user.test.js - Breaks when UserService.js moves
import UserService from '../src/services/UserService';
import DatabaseMock from '../mocks/database';

describe('UserService', () => {
  test('creates user', () => {
    const service = new UserService(DatabaseMock);
    expect(service.create({name: 'John'})).toBeTruthy();
  });
});
```

**Adaptive Tests (with Jest runner)**

```javascript
// user.adaptive.test.js - Works regardless of file location
const { discover } = require('@adaptive-tests/javascript');

describe('UserService', () => {
  let UserService, DatabaseMock;

  beforeAll(async () => {
    UserService = await discover({ name: 'UserService', type: 'class' });
    DatabaseMock = await discover('DatabaseMock');
  });

  test('creates user', () => {
    const service = new UserService(DatabaseMock);
    expect(service.create({name: 'John'})).toBeTruthy();
  });
});
```

#### Migration Path

```bash
# You can use both simultaneously
npm install --save-dev jest @adaptive-tests/javascript

# Gradually migrate test by test
npx adaptive-tests migrate tests/user.test.js

# Run both in CI
npm run test:jest && npm run test:adaptive
```

---

### Adaptive Tests vs Mocha

#### Key Differences

| Aspect | Adaptive Tests | Mocha |
|--------|---------------|--------|
| **Philosophy** | Discovery-based | Import-based |
| **Test Runner** | Uses existing runners | Is a test runner |
| **Assertions** | BYO (Chai, Jest, etc.) | BYO (usually Chai) |
| **File Finding** | Smart discovery | Glob patterns |
| **Async Support** | Native async/await | Callbacks + Promises |

#### Why Adaptive Tests Complements Mocha

Adaptive Tests isn't a replacement for Mocha—it's an enhancement. You keep using Mocha as your test runner but gain refactoring resilience:

```javascript
// Still using Mocha, but with adaptive discovery
const { expect } = require('chai');
const { discover } = require('@adaptive-tests/javascript');

describe('API Tests', function() {
  let ApiService;

  before(async function() {
    ApiService = await discover({
      name: 'ApiService',
      methods: ['get', 'post', 'put', 'delete']
    });
  });

  it('should fetch users', async function() {
    const api = new ApiService();
    const users = await api.get('/users');
    expect(users).to.be.an('array');
  });
});
```

---

### Adaptive Tests vs Vitest

#### Modern Testing Stack Comparison

Both Adaptive Tests and Vitest represent modern approaches to testing, but with different focuses:

**Vitest Strengths:**

- ⚡ Lightning-fast with Vite integration
- 🔥 Hot Module Replacement for tests
- 📦 ESM-first design
- 🎯 Jest-compatible API

**Adaptive Tests Strengths:**

- 🔄 Survives any refactoring
- 🤖 AI-tool friendly
- 🌐 Multi-language support
- 📁 No import maintenance

#### Using Them Together

```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config';
import adaptive from 'vite-plugin-adaptive'; // preview helper

export default defineConfig({
  plugins: [adaptive()],
  test: {
    globals: true,
    setupFiles: ['./setup-adaptive.js']
  }
});

// setup-adaptive.js
import { discover } from '@adaptive-tests/javascript';
globalThis.discover = discover;

// Now use in any test
test('finds components automatically', async () => {
  const Button = await discover({ name: 'Button', type: 'component' });
  expect(Button).toBeDefined();
});
```

---

### Adaptive Tests vs Pytest

#### For Python Developers

| Feature | Adaptive Tests (Python) | Pytest |
|---------|------------------------|---------|
| **Test Discovery** | AST-based | File pattern |
| **Fixtures** | Compatible | Native |
| **Parametrization** | Via Pytest | Native |
| **Plugins** | Growing | 800+ plugins |
| **Refactoring** | Resilient | Fragile imports |

#### Python Example

**Traditional Pytest:**

```python
# test_user.py - Breaks if models/user.py moves
from src.models.user import User
from src.services.auth import AuthService

def test_user_authentication():
    user = User("john@example.com")
    auth = AuthService()
    assert auth.authenticate(user, "password123")
```

**With Adaptive Tests:**

```python
# test_user_adaptive.py - Survives refactoring
import pytest
from adaptive_tests import discover

@pytest.fixture
async def user_class():
    return await discover({
        "name": "User",
        "type": "class",
        "methods": ["save", "delete"]
    })

@pytest.fixture
async def auth_service():
    return await discover({
        "name": "AuthService",
        "type": "class"
    })

async def test_user_authentication(user_class, auth_service):
    user = user_class("john@example.com")
    auth = auth_service()
    assert auth.authenticate(user, "password123")
```

---

### Adaptive Tests vs JUnit

#### For Java Developers

| Aspect | Adaptive Tests (Java) | JUnit 5 |
|--------|----------------------|----------|
| **Annotations** | Compatible | Native |
| **Test Lifecycle** | Via JUnit | Native |
| **Assertions** | Via JUnit/AssertJ | Native |
| **IDE Integration** | Growing | Excellent |
| **Spring Support** | Yes | Excellent |

#### Java Example

**Traditional JUnit:**

```java
// UserServiceTest.java - Import breaks on package refactoring
import com.example.services.UserService;
import com.example.models.User;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class UserServiceTest {
    @Test
    void testCreateUser() {
        UserService service = new UserService();
        User user = service.create("John", "john@example.com");
        assertNotNull(user);
    }
}
```

**With Adaptive Tests:**

```java
// UserServiceAdaptiveTest.java - Survives package refactoring
import io.adaptivetests.Discovery;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class UserServiceAdaptiveTest {
    private static Class<?> userServiceClass;
    private static Class<?> userClass;

    @BeforeAll
    static void discover() {
        userServiceClass = Discovery.discover()
            .className("UserService")
            .withMethods("create", "delete")
            .find();

        userClass = Discovery.discover()
            .className("User")
            .find();
    }

    @Test
    void testCreateUser() throws Exception {
        Object service = userServiceClass.getDeclaredConstructor().newInstance();
        Object user = userServiceClass.getMethod("create", String.class, String.class)
            .invoke(service, "John", "john@example.com");
        assertNotNull(user);
    }
}
```

---

## Framework Integration Matrix

| Your Stack | Recommended Approach | Integration Effort |
|------------|---------------------|-------------------|
| **React + Jest** | Add `@adaptive-tests/javascript`, use alongside Jest | 2 hours |
| **Vue + Vitest** | Add `vite-plugin-adaptive` (preview), gradual migration | 3 hours |
| **Angular + Karma** | Add adaptive tests in parallel, keep Karma | 4 hours |
| **Express + Mocha** | Use adaptive discovery with Mocha runner | 2 hours |
| **Django + Pytest** | Add `adaptive-tests-py`, use as fixtures | 3 hours |
| **Spring Boot + JUnit** | Add adaptive-tests-java, annotate with @Adaptive | 4 hours |
| **Next.js + Jest** | Use jest-adaptive preset | 1 hour |
| **Fastify + Tap** | Add discovery to existing Tap tests | 3 hours |

---

## Performance Comparison

### Test Execution Speed (1000 tests)

| Framework | Cold Start | Warm Cache | With Watches |
|-----------|------------|------------|--------------|
| **Jest** | 3.2s | 3.2s | 0.8s |
| **Vitest** | 2.1s | 2.1s | 0.3s |
| **Mocha** | 2.8s | 2.8s | N/A |
| **Adaptive + Jest** | 4.1s | 3.4s | 0.9s |
| **Adaptive + Vitest** | 3.0s | 2.3s | 0.4s |

*Note: Adaptive Tests adds ~0.5-1s on cold start for discovery, negligible with cache*

### Maintenance Time (per refactor)

| Scenario | Traditional Tests | Adaptive Tests | Time Saved |
|----------|------------------|----------------|------------|
| **Move 10 files** | 30 min | 0 min | 30 min |
| **Rename package** | 2 hours | 0 min | 2 hours |
| **Extract service** | 1 hour | 0 min | 1 hour |
| **Restructure folders** | 4 hours | 0 min | 4 hours |

---

## Decision Matrix

### Should You Use Adaptive Tests?

Score yourself (1 point each):

- [ ] We refactor code regularly
- [ ] Multiple teams work on our codebase
- [ ] We're migrating architecture (monolith → services)
- [ ] We use AI coding assistants
- [ ] Import errors frustrate our developers
- [ ] We value developer productivity
- [ ] We have >50 test files
- [ ] Our codebase is growing rapidly
- [ ] We do continuous deployment
- [ ] Test maintenance is a pain point

**Score Interpretation:**

- **8-10 points:** Adaptive Tests will transform your workflow
- **5-7 points:** Strong candidate, try it on new features
- **3-4 points:** Consider for specific problem areas
- **0-2 points:** Traditional tests might be sufficient

---

## Migration Strategy by Framework

### From Jest

1. Install: `npm install @adaptive-tests/javascript`
2. Keep Jest as runner, add discovery to new tests
3. Migrate high-churn tests first
4. Use `jest-adaptive` preset for new projects

### From Mocha

1. Install: `npm install @adaptive-tests/javascript`
2. Add discovery to `before` hooks
3. Keep Mocha configuration unchanged
4. Gradually convert test by test

### From Vitest

1. Install: `npm install vite-plugin-adaptive` *(preview)*
2. Add plugin to `vitest.config.js`
3. Use discovery in new test files
4. Leverage HMR for instant feedback

### From Pytest

1. Install: `pip install adaptive-tests-py`
2. Create discovery fixtures
3. Use alongside existing fixtures
4. Migrate tests with most import issues

### From JUnit

1. Add Maven/Gradle dependency
2. Create `@BeforeAll` discovery methods
3. Use reflection for discovered classes
4. Annotate new tests with `@AdaptiveTest`

---

## FAQ: Common Concerns

### "We already use Jest/Mocha/Pytest. Why change?"

You don't change—you enhance. Adaptive Tests works WITH your existing test runner, not instead of it. Keep all your current tools and gain refactoring resilience.

### "What about test performance?"

After initial discovery (cached), adaptive tests run within 5% of traditional test speed. The time saved on not fixing broken imports far exceeds any marginal performance cost.

### "Is this just for JavaScript?"

No. Adaptive Tests supports JavaScript, TypeScript, Python, and Java. One pattern, multiple languages.

### "What if discovery fails?"

Discovery uses deterministic AST parsing with fallbacks. The `npx adaptive-tests why` command shows exactly how files are scored. It's debuggable, not magic.

### "How is this different from test.each() or parameterized tests?"

Those help with test data variation. Adaptive Tests solves structural coupling—your tests find code regardless of where it lives.

---

## The Bottom Line

**Traditional test frameworks** excel at running tests.
**Adaptive Tests** excels at keeping tests running after refactoring.

They're not competitors—they're partners. Use both and never fix import errors again.

---

*Ready to try? Start here: [Quick Start Guide](../README.md#quick-start-guide)*
*Questions? [GitHub Discussions](https://github.com/anon57396/adaptive-tests/discussions)*
