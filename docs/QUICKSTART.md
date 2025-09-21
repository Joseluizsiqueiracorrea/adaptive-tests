---
layout: default
title: Quick Start Guide
---

# Quick Start

Get up and running in under a minute. Pick your language and paste the snippet.

## JavaScript / TypeScript

```bash
npm install --save-dev @adaptive-tests/javascript
npx adaptive-tests init
```

Minimal Jest test:

```javascript
const { getDiscoveryEngine } = require('@adaptive-tests/javascript');

test('discovers Calculator', async () => {
  const engine = getDiscoveryEngine();
  const Calculator = await engine.discoverTarget({ name: 'Calculator', type: 'class' });
  expect(new Calculator().add(2, 3)).toBe(5);
});
```

Diagnose discovery:

```bash
npx adaptive-tests why '{"name":"Calculator","type":"class"}'
```

## Python

```bash
pip install adaptive-tests-py
```

Minimal pytest test:

```python
from adaptive_tests_py.discovery import DiscoveryEngine, Signature

def test_user_service():
    engine = DiscoveryEngine()
    UserService = engine.discover(Signature(name="UserService", type="class"), load=False)
    assert UserService.name == "UserService"
```

## Next Steps
- Read the [API Reference](API_REFERENCE.md)
- Tune your [Configuration](CONFIGURATION.md)
- Explore the [CLI Reference](CLI_REFERENCE.md)
