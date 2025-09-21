# Development Guide

This guide provides instructions for setting up your development environment and contributing to the Adaptive Tests project.

## 🚀 Quick Development Setup

1. **Clone the repository:**

    ```bash
    git clone https://github.com/anon57396/adaptive-tests.git
    cd adaptive-tests
    ```

2. **Install root dependencies:**

    ```bash
    npm install
    ```

3. **Install dependencies for the language you want to work on:**

    - **JavaScript/TypeScript:**

        ```bash
        cd languages/javascript
        npm install
        ```

    - **Python:**

        ```bash
        cd languages/python
        pip install -e .[test]
        ```

    - **Java:**

        ```bash
        cd languages/java
        mvn install
        ```

## 🧪 Running Tests

- **Run all tests:**

    ```bash
    npm test
    ```

- **Run tests for a specific language:**

  - **JavaScript/TypeScript:**

        ```bash
        cd languages/javascript
        npm test
        ```

  - **Python:**

        ```bash
        cd languages/python
        pytest
        ```

  - **Java:**

        ```bash
        cd languages/java
        mvn test
        ```

- **Run the validation suite:**

    The validation suite is a set of end-to-end tests that prove the core functionality of Adaptive Tests. It runs a series of scenarios, including refactoring code and introducing bugs, to ensure that the tests behave as expected.

    ```bash
    npm run validate
    ```

## 📁 Project Structure

```text
adaptive-tests/
├── languages/              # Language-specific packages
│   ├── javascript/         # @adaptive-tests/javascript workspace
│   ├── typescript/         # @adaptive-tests/typescript workspace
│   ├── python/             # adaptive-tests-py package
│   ├── java/               # adaptive-tests-java package
│   └── ...                 # Other language placeholders
├── vscode-adaptive-tests-extension_experimental/ # VS Code extension source
├── scripts/                # Build and validation scripts
└── docs/                   # Documentation
```

### The `scripts` Directory

The `scripts` directory contains various build and validation scripts, including:

- `validate.js`: The main validation script that runs the end-to-end tests.
- `refactor.js`: A script that simulates refactoring by moving files around.
- `restore.js`: A script that restores the files to their original locations.

## 🔧 VS Code Extension Development

1. **Navigate to the extension directory:**

    ```bash
    cd vscode-adaptive-tests-extension_experimental
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

3. **Open the project in VS Code:**

    ```bash
    code .
    ```

4. **Start debugging:**

    Press `F5` to open a new VS Code window with the extension loaded.

5. **Run tests:**

    ```bash
    npm test
    ```

## 🔑 Key Technologies

- **[Babel](https://babeljs.io/):** Used for parsing JavaScript and TypeScript code into an Abstract Syntax Tree (AST).
- **[Jest](https://jestjs.io/):** The primary testing framework for the JavaScript/TypeScript packages.
- **[TypeScript](https://www.typescriptlang.org/):** Used for the TypeScript language integration and for the VS Code extension.
- **[Python](https://www.python.org/):** Used for the Python language integration.
- **[Java](https://www.java.com/):** Used for the Java language integration.

## ✨ Design Philosophy

- **AST-based discovery:** We believe that the most reliable way to find code is by its structure, not its location. That's why we use ASTs to analyze your code and find the exact module you want to test.
- **"Invisible Mode":** We want to make it as easy as possible to get started with Adaptive Tests. That's why we created "Invisible Mode," which allows you to use adaptive discovery with your existing test suite with zero code changes.
- **Developer experience:** We are committed to providing a great developer experience. That's why we have a powerful CLI, a VS Code extension, and detailed documentation.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for more details.
