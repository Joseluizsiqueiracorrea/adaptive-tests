# Spring Boot Template with Adaptive Tests

Spring Boot application template with pre-configured adaptive testing infrastructure for Java development.

## Features

- ☕ Spring Boot 3.2+ with modern Java patterns
- 🗄️ JPA/Hibernate with H2/PostgreSQL support
- 🔐 Spring Security integration
- 🧪 Comprehensive adaptive test suites
- 🐳 Docker and testcontainers support
- 📊 Maven/Gradle build configurations

## Quick Start

```bash
# Create new Spring Boot project with adaptive tests
git clone https://github.com/anon57396/adaptive-tests.git
cd adaptive-tests/languages/java/templates/spring-boot
./mvnw spring-boot:run

# Or using Gradle
./gradlew bootRun
```

## Project Structure

```
my-spring-boot-app/
├── src/
│   ├── main/java/com/example/app/
│   │   ├── controller/    # REST controllers
│   │   ├── service/       # Business logic
│   │   ├── repository/    # Data access
│   │   └── config/        # Configuration classes
│   └── test/java/
│       ├── traditional/   # Traditional JUnit tests
│       └── adaptive/      # Adaptive test suites
├── adaptive-tests.properties
└── pom.xml
```

## Adaptive Test Examples

The template includes adaptive tests for:
- Controller endpoint discovery
- Service component validation
- Repository interface testing
- Configuration class validation
- Security configuration testing

## Running Tests

```bash
# Traditional tests
./mvnw test

# Adaptive tests only
./mvnw test -Dtest="**/*AdaptiveTest"

# Full validation suite
./mvnw test -Dspring.profiles.active=adaptive-validation
```

## Configuration

Adaptive tests configuration in `adaptive-tests.properties`:

```properties
adaptive.discovery.rootPath=src/main/java
adaptive.discovery.scoring.allowLooseNameMatch=true
adaptive.discovery.scoring.looseNamePenalty=-15
adaptive.languages=java
adaptive.frameworks=spring-boot
```

## Spring Boot Integration

The template includes custom test configurations and annotations:

```java
// src/test/java/adaptive/config/AdaptiveTestConfig.java
@TestConfiguration
@EnableAdaptiveTests
public class AdaptiveTestConfig {
    
    @Bean
    @Primary
    public AdaptiveDiscoveryEngine discoveryEngine() {
        return AdaptiveDiscoveryEngine.builder()
            .rootPath("src/main/java")
            .enableSpringBootSupport(true)
            .build();
    }
}
```

## Custom Annotations

Use Spring Boot specific adaptive test annotations:

```java
@AdaptiveSpringBootTest
@TestPropertySource(locations = "classpath:application-test.properties")
class UserServiceAdaptiveTest {
    
    @AdaptiveAutowired(signature = @ComponentSignature(
        type = ComponentType.SERVICE,
        name = "UserService"
    ))
    private UserService userService;
    
    @Test
    void testUserCreation() {
        // Test logic using discovered service
        assertThat(userService).isNotNull();
    }
}
```

## Migration from Traditional Tests

Convert existing Spring Boot tests to adaptive tests:

```bash
java -jar adaptive-tests-cli.jar migrate \
    --input src/test/java \
    --output src/test/java/adaptive \
    --framework spring-boot
```

This automatically converts Spring Boot test classes to use adaptive discovery for components, controllers, and services.