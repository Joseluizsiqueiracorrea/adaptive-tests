---
layout: default
title: Java Guide
---

## Adaptive Tests for Java

AI‑ready testing for Java. Finds code by structure, not by import paths.

## Quick Start

Add to Maven:

```xml
<dependency>
  <groupId>io.adaptivetests</groupId>
  <artifactId>adaptive-tests-java</artifactId>
  <version>0.3.0-SNAPSHOT</version>
  <scope>test</scope>
</dependency>
```

JUnit 5 example:

```java
import static org.junit.jupiter.api.Assertions.*;
import io.adaptivetests.java.discovery.Signature;
import io.adaptivetests.java.testing.AdaptiveTestBase;
import java.util.List;
import org.junit.jupiter.api.Test;

class CalculatorAdaptiveTest extends AdaptiveTestBase {
  @Override
  protected Signature signature() {
    return Signature.builder()
      .name("Calculator")
      .methods(List.of("add", "subtract"))
      .build();
  }

  @Test
  void addsNumbers() throws Exception {
    Object calculator = newInstance();
    var add = targetClass().getMethod("add", double.class, double.class);
    assertEquals(5.0, (double) add.invoke(calculator, 2.0, 3.0), 0.001);
  }
}
```

Diagnose discovery (Node CLI):

```bash
npx adaptive-tests why '{"name":"Calculator","type":"class"}'
```

## Configuration (optional)

Create `.adaptive-tests-java.json` in the project root:

```json
{
  "discovery": {
    "extensions": [".java"],
    "skipDirectories": [".git", "target", "build"],
    "cacheFile": ".adaptive-tests-cache.json"
  }
}
```

See more:

- [API Reference](../API_REFERENCE.md)
- [Configuration](../CONFIGURATION.md)
- [CLI Reference](../CLI_REFERENCE.md)
