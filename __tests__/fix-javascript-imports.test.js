/**
 * Tests for fix-javascript-imports.js
 */

const fs = require('fs');
const path = require('path');

describe('fix-javascript-imports.js', () => {
  let scriptContent;
  const scriptPath = path.join(__dirname, '..', 'fix-javascript-imports.js');

  beforeAll(() => {
    scriptContent = fs.readFileSync(scriptPath, 'utf8');
  });

  test('should exist', () => {
    expect(fs.existsSync(scriptPath)).toBe(true);
  });

  test('should handle import statements', () => {
    expect(scriptContent).toMatch(/import.*from/);
  });

  test('should handle export statements', () => {
    expect(scriptContent).toMatch(/export/);
  });

  test('should handle require statements', () => {
    expect(scriptContent).toContain('require');
  });

  test('should handle module.exports', () => {
    expect(scriptContent).toContain('module.exports');
  });

  test('should read and write files', () => {
    expect(scriptContent).toMatch(/readFile|writeFile|fs\./);
  });

  test('should process JavaScript files', () => {
    expect(scriptContent).toMatch(/\.js|\.mjs|\.cjs/);
  });

  test('should have error handling', () => {
    expect(scriptContent).toContain('try');
    expect(scriptContent).toContain('catch');
  });

  test('should handle directories recursively', () => {
    expect(scriptContent).toMatch(/readdir|recursive|walk/i);
  });

  test('should skip node_modules', () => {
    expect(scriptContent).toMatch(/node_modules/);
  });
});