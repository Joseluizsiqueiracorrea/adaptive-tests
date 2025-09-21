---
layout: default
title: Python Guide
---

# Adaptive Tests for Python

AI‑ready testing for Python. Finds code by structure, not by import paths.

## Quick Start

```bash
pip install adaptive-tests-py
```

Minimal example (pytest):

```python
from adaptive_tests_py.discovery import DiscoveryEngine, Signature

def test_user_service():
    engine = DiscoveryEngine()
    UserService = engine.discover(Signature(name="UserService", type="class"), load=False)
    assert UserService.name == "UserService"
```

Prefer the convenience helper:

```python
from adaptive_tests_py.discovery import DiscoveryEngine

engine = DiscoveryEngine()
Calculator = engine.discover({"name": "Calculator"})
assert Calculator is not None
```

Diagnose discovery:

```bash
python -m adaptive_tests_py.cli why '{"name":"UserService","type":"class"}'
```

## Configuration (optional)

```python
from adaptive_tests_py.discovery import DiscoveryEngine

engine = DiscoveryEngine(root=".", config={
    "discovery": {
        "extensions": [".py"],
        "max_depth": 12,
        "skip_directories": [".git", "__pycache__", ".venv", "build"],
        "cache": {"enabled": True, "file": ".adaptive-tests-cache.json"}
    }
})
```

See more:
- [API Reference](../API_REFERENCE.md)
- [Configuration](../CONFIGURATION.md)
- [CLI Reference](../CLI_REFERENCE.md)
