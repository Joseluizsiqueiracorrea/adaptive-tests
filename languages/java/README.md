# Adaptive Tests for Java

[![Maven Central](https://img.shields.io/maven-central/v/io.adaptivetests/adaptive-tests-java.svg)](https://search.maven.org/artifact/io.adaptivetests/adaptive-tests-java)

> **AI-ready testing infrastructure for Java** - Tests that survive refactoring without breaking

When AI agents reshape your Java codebase, traditional imports break. Adaptive Tests uses **zero-runtime discovery** powered by AST analysis to find code by structure, not import paths. Your tests adapt as code evolves.

**Stop fixing broken imports.** Move files, rename packages, refactor modules—adaptive tests still find the code they care about.

---

## Quick Start

### Requirements

- Java 17+
- Maven 3.9+ or Gradle 8+

### Installation

Add the following dependency to your `pom.xml`:

```xml
<dependency>
    <groupId>io.adaptivetests</groupId>
    <artifactId>adaptive-tests-java</artifactId>
    <version>0.3.0-SNAPSHOT</version>
    <scope>test</scope>
</dependency>
```

Or in your `build.gradle`:

```groovy
testImplementation 'io.adaptivetests:adaptive-tests-java:0.3.0-SNAPSHOT'
```

### Writing Adaptive Tests with JUnit 5

Subclass `AdaptiveTestBase` from the core package to keep your tests resilient to refactors. The base discovers the target before any assertions run and exposes helpers to load the class, create instances, and hook into discovery events.

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
            .methods(List.of("add", "subtract", "multiply", "divide"))
            .build();
    }

    @Test
    void addsNumbers() throws ReflectiveOperationException, NoSuchMethodException {
        Object calculator = newInstance();
        var add = targetClass().getMethod("add", double.class, double.class);
        assertEquals(8.0, (double) add.invoke(calculator, 5.0, 3.0), 0.001);
    }

    @Test
    void dividesSafely() throws ReflectiveOperationException, NoSuchMethodException {
        Object calculator = newInstance();
        var divide = targetClass().getMethod("divide", double.class, double.class);
        assertThrows(ArithmeticException.class, () -> divide.invoke(calculator, 10.0, 0.0));
    }
}
```

`AdaptiveTestBase` provides:

- `signature()` – required override that defines the discovery signature.
- `targetClass()` – the discovered `Class<?>` for reflection-based assertions.
- `newInstance()` – convenience helper that calls the default constructor.
- `onTargetDiscovered(...)` – optional hook for class-level setup or dependency injection.

Override `projectRoot()` or `createEngine()` if your modules live outside the default working directory or require custom configuration overrides.

---

## Modules

| Module | Description |
| ------ | ----------- |
| `core` | Discovery engine, scoring rules, configuration loader, cache manager. |
| `cli`  | Command line utilities (`discover`, `why`, `scaffold`) packaged as a fat JAR. |
| `examples/spring-boot` | Placeholder for Spring Boot demos (coming soon). |

---

## Scaffolding JUnit Tests from Node.js

The Java bridge is integrated into the primary CLI. Given a `.java` source file, the scaffolder analyses the AST and emits a JUnit 5 shell in the appropriate test directory.

```bash
# From the repository root
npx adaptive-tests scaffold languages/java/examples/spring-boot/src/main/java/com/example/calculator/Calculator.java
```

By default the generated test lands in `src/test/java` and mirrors the package of the production class. Methods discovered in the source file produce individual `@Test` blocks, seeded with sensible assertion placeholders.

You can scaffold multiple Java targets at once:

```bash
npx adaptive-tests scaffold "src/main/java/**/*.java" --all-exports
```

CLI flags such as `--output-dir`, `--all-exports`, and `--force` behave the same way they do for JavaScript/TypeScript targets.

---

## Discovery Signatures for Java

Java discovery signatures support rich metadata:

```java
// Discover by class name and method signatures
DiscoverySignature.builder()
    .name("UserService")
    .type("class")
    .methods("createUser", "findUser", "deleteUser")
    .build();

// Discover by package and inheritance
DiscoverySignature.builder()
    .name("BaseRepository")
    .type("class")
    .packageName("com.example.repository")
    .isAbstract(true)
    .build();

// Discover by annotations
DiscoverySignature.builder()
    .name("ProductController")
    .type("class")
    .annotations("@RestController", "@RequestMapping")
    .build();
```

---

## Native Java CLI

A Maven multi-module project lives under `languages/java/` and provides a pure-Java command line for teams that prefer JVM tooling.

```bash
cd languages/java
./mvnw -pl core test
./mvnw -pl cli -am package

# Discover a class by signature
java -jar cli/target/adaptive-tests-java-cli-0.3.0-SNAPSHOT-shaded.jar   discover --root /path/to/project --name CustomerService --method findActiveUsers
```

Both the Node CLI and the Java CLI share the same discovery heuristics and caching logic.

---

## Configuration

Discovery can be tuned via `adaptive-tests.config.json` or `.adaptive-tests-java.json` at the project root:

```json
{
  "discovery": {
    "extensions": [".java"],
    "skipDirectories": [".git", "target", "build"],
    "skipFiles": ["Test.java", "IT.java"],
    "cacheFile": ".adaptive-tests-cache.json"
  }
}
```

The configuration mirrors the JavaScript engine — overrides cascade across Node and Java workflows.

---

## Current Coverage

- Classes, interfaces, enums, and records
- Method signatures with parameter/annotation metadata
- Package-aware scoring (prefers `src/main/java`, records annotations, honours inheritance)
- JUnit 5 scaffolding with automatic placement under `src/test/java`

---

## Known Limitations

- Nested classes are discoverable, but the scaffolder defaults to top-level types when multiple are present in the same file.
- Dependency wiring inside generated tests is intentionally minimal; TODO comments highlight where to provide fakes or fixtures.
- Gradle project autodetection falls back to `src/test/java` if the source lives outside `src/main/java`.

We ship the Java bridge as an early preview — feedback and issues are welcome while we drive parity with the mature JavaScript and TypeScript integrations.

---

## Development

### Building from Source

```bash
git clone https://github.com/anon57396/adaptive-tests.git
cd adaptive-tests/languages/java
./mvnw clean install
```

### Contributing

We welcome Java-specific contributions! See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

---

## License

MIT - See [LICENSE](../../LICENSE) for details.