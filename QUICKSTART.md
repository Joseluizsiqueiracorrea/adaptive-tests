# Quick Start Guide

This guide will help you get started with Adaptive Tests in your project. We recommend using our interactive setup wizard for the best experience.

## JavaScript / TypeScript

### 1. Install JavaScript/TypeScript

```bash
npm install @adaptive-tests/javascript --save-dev
```

If you are using TypeScript, you will also need:

```bash
npm install @adaptive-tests/typescript --save-dev
```

### 2. Initialize JavaScript/TypeScript

Run the interactive setup wizard:

```bash
npx adaptive-tests init
```

This will:

- Detect your project's test framework (Jest, Vitest, etc.).
- Configure your project to use Adaptive Tests.
- Create example tests to get you started.

### 3. Write Your First JavaScript/TypeScript Adaptive Test

Here is an example of a simple adaptive test:

```javascript
import { discover } from '@adaptive-tests/javascript';

describe('Calculator', () => {
  let Calculator;

  beforeAll(async () => {
    Calculator = await discover({ name: 'Calculator', type: 'class' });
  });

  it('should add two numbers', () => {
    const calc = new Calculator();
    expect(calc.add(2, 3)).toBe(5);
  });
});
```

## Python

### 1. Install Python

```bash
pip install adaptive-tests-py
```

### 2. Initialize Python

Run the interactive setup wizard:

```bash
adaptive-tests-py init
```

This will:

- Detect your project's test framework (pytest).
- Configure your project to use Adaptive Tests.
- Create example tests to get you started.

### 3. Write Your First Python Adaptive Test

```python
from adaptive_tests import discover
import asyncio

async def test_calculator():
    Calculator = await discover({
        'name': 'Calculator',
        'type': 'class',
        'methods': ['add', 'subtract']
    })
    calc = Calculator()
    assert calc.add(2, 3) == 5

# To run the async test:
# asyncio.run(test_calculator())
```

## Java

### 1. Add Dependency

Add the following dependency to your `pom.xml`:

```xml
<dependency>
    <groupId>io.adaptivetests</groupId>
    <artifactId>adaptive-tests-java</artifactId>
    <version>0.3.0-SNAPSHOT</version>
</dependency>
```

### 2. Write Your First Java Adaptive Test

```java
import io.adaptivetests.Discovery;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

public class CalculatorTest {

    @Test
    public void testAdd() throws Exception {
        Class<?> calculatorClass = Discovery.discover(
            "Calculator",
            Discovery.type("class"),
            Discovery.methods("add")
        );

        Object calculator = calculatorClass.getDeclaredConstructor().newInstance();
        int result = (int) calculatorClass.getMethod("add", int.class, int.class).invoke(calculator, 2, 3);

        assertEquals(5, result);
    }
}
```

## Next Steps

- **[Migration Guide](docs/MIGRATION_GUIDE.md):** Convert your existing tests to adaptive tests.
- **[API Reference](docs/API_REFERENCE.md):** Learn more about the `discover` function and other APIs.
- **[Best Practices](docs/BEST_PRACTICES.md):** Get tips on how to write effective adaptive tests.
