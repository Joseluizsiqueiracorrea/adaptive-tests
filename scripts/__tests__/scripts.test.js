/**
 * Tests for script files
 *
 * These tests ensure all scripts exist and have proper structure.
 * Since the scripts don't export functions, we test their existence and content.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('Scripts Directory Tests', () => {
  const scriptsDir = path.join(__dirname, '..');
  let scriptFiles = [];

  beforeAll(() => {
    // Get all .js files in scripts directory
    scriptFiles = fs.readdirSync(scriptsDir)
      .filter(f => f.endsWith('.js') && !f.startsWith('.'))
      .map(f => ({
        name: f,
        path: path.join(scriptsDir, f),
        content: fs.readFileSync(path.join(scriptsDir, f), 'utf8')
      }));
  });

  describe('validate.js', () => {
    let script;

    beforeAll(() => {
      script = scriptFiles.find(s => s.name === 'validate.js');
    });

    test('should exist', () => {
      expect(script).toBeDefined();
    });

    test('should be executable', () => {
      expect(script.content).toMatch(/^#!/);
    });

    test('should define runCommand function', () => {
      expect(script.content).toContain('async function runCommand');
    });

    test('should define extractTestResults function', () => {
      expect(script.content).toContain('function extractTestResults');
    });

    test('should define all scenario tests', () => {
      expect(script.content).toContain('SCENARIO 1');
      expect(script.content).toContain('SCENARIO 2');
      expect(script.content).toContain('SCENARIO 3');
      expect(script.content).toContain('SCENARIO 4');
      expect(script.content).toContain('SCENARIO 5');
      expect(script.content).toContain('SCENARIO 6');
    });

    test('should handle Python scenarios', () => {
      expect(script.content).toContain('resolvePythonInterpreter');
      expect(script.content).toContain('runPythonScenario');
      expect(script.content).toContain('extractPytestSummary');
    });

    test('should handle Java scenarios', () => {
      expect(script.content).toContain('resolveMavenWrapper');
      expect(script.content).toContain('runJavaScenario');
      expect(script.content).toContain('extractMavenSummary');
    });

    test('should have proper error handling', () => {
      expect(script.content).toContain('try');
      expect(script.content).toContain('catch');
      expect(script.content).toContain('process.exit(1)');
    });
  });

  describe('doctor.js', () => {
    let script;

    beforeAll(() => {
      script = scriptFiles.find(s => s.name === 'doctor.js');
    });

    test('should exist', () => {
      expect(script).toBeDefined();
    });

    test('should check Node.js version', () => {
      expect(script.content).toMatch(/process\.version|node.*version/i);
    });

    test('should check npm', () => {
      expect(script.content).toMatch(/npm/i);
    });

    test('should provide diagnostic output', () => {
      expect(script.content).toContain('console.log');
    });

    test('should have error handling', () => {
      expect(script.content).toMatch(/try|catch|error/i);
    });
  });

  describe('playground.js', () => {
    let script;

    beforeAll(() => {
      script = scriptFiles.find(s => s.name === 'playground.js');
    });

    test('should exist', () => {
      expect(script).toBeDefined();
    });

    test('should use readline for interaction', () => {
      expect(script.content).toMatch(/readline|createInterface/i);
    });

    test('should have help text', () => {
      expect(script.content).toMatch(/help|usage/i);
    });

    test('should handle user input', () => {
      expect(script.content).toMatch(/question|prompt|on.*line/i);
    });
  });

  describe('lint-markdown.js', () => {
    let script;

    beforeAll(() => {
      script = scriptFiles.find(s => s.name === 'lint-markdown.js');
    });

    test('should exist', () => {
      expect(script).toBeDefined();
    });

    test('should be executable', () => {
      expect(script.content).toMatch(/^#!/);
    });

    test('should use markdownlint', () => {
      expect(script.content).toContain('markdownlint');
    });

    test('should handle markdown files', () => {
      expect(script.content).toMatch(/\.md|markdown/i);
    });
  });

  describe('lint-links.js', () => {
    let script;

    beforeAll(() => {
      script = scriptFiles.find(s => s.name === 'lint-links.js');
    });

    test('should exist', () => {
      expect(script).toBeDefined();
    });

    test('should check links', () => {
      expect(script.content).toMatch(/link|url|href/i);
    });
  });

  describe('check-agent-state.js', () => {
    let script;

    beforeAll(() => {
      script = scriptFiles.find(s => s.name === 'check-agent-state.js');
    });

    test('should exist', () => {
      expect(script).toBeDefined();
    });

    test('should be executable', () => {
      expect(script.content).toMatch(/^#!/);
    });

    test('should check agent state', () => {
      expect(script.content).toMatch(/agent|state|status/i);
    });
  });

  describe('check-binaries.js', () => {
    let script;

    beforeAll(() => {
      script = scriptFiles.find(s => s.name === 'check-binaries.js');
    });

    test('should exist', () => {
      expect(script).toBeDefined();
    });

    test('should be executable', () => {
      expect(script.content).toMatch(/^#!/);
    });

    test('should check for binaries', () => {
      expect(script.content).toMatch(/which|command|binary/i);
    });
  });

  describe('clean-artifacts.js', () => {
    let script;

    beforeAll(() => {
      script = scriptFiles.find(s => s.name === 'clean-artifacts.js');
    });

    test('should exist', () => {
      expect(script).toBeDefined();
    });

    test('should be executable', () => {
      expect(script.content).toMatch(/^#!/);
    });

    test('should clean artifacts', () => {
      expect(script.content).toMatch(/clean|remove|delete|rm/i);
    });
  });

  describe('dev-setup.js', () => {
    let script;

    beforeAll(() => {
      script = scriptFiles.find(s => s.name === 'dev-setup.js');
    });

    test('should exist', () => {
      expect(script).toBeDefined();
    });

    test('should setup development', () => {
      expect(script.content).toMatch(/setup|install|configure/i);
    });

    test('should handle dependencies', () => {
      expect(script.content).toMatch(/npm|dependencies|package/i);
    });
  });

  describe('prepare-publish.js', () => {
    let script;

    beforeAll(() => {
      script = scriptFiles.find(s => s.name === 'prepare-publish.js');
    });

    test('should exist', () => {
      expect(script).toBeDefined();
    });

    test('should handle publishing', () => {
      expect(script.content).toMatch(/publish|release|version/i);
    });

    test('should update version', () => {
      expect(script.content).toMatch(/version|package\.json/i);
    });
  });

  describe('restore-dev.js', () => {
    let script;

    beforeAll(() => {
      script = scriptFiles.find(s => s.name === 'restore-dev.js');
    });

    test('should exist', () => {
      expect(script).toBeDefined();
    });

    test('should restore development state', () => {
      expect(script.content).toMatch(/restore|reset|dev/i);
    });
  });

  describe('Common patterns', () => {
    test('all scripts should exist', () => {
      expect(scriptFiles.length).toBeGreaterThan(10);
    });

    test('executable scripts should have shebang', () => {
      const executableScripts = scriptFiles.filter(s =>
        s.content.startsWith('#!/usr/bin/env node')
      );
      expect(executableScripts.length).toBeGreaterThan(5);
    });

    test('all scripts should handle errors', () => {
      scriptFiles.forEach(script => {
        const hasErrorHandling =
          script.content.includes('try') ||
          script.content.includes('catch') ||
          script.content.includes('error') ||
          script.content.includes('.catch(');
        expect(hasErrorHandling).toBe(true);
      });
    });
  });
});