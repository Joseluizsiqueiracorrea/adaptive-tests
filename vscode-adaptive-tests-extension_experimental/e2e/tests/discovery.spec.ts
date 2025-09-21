/**
 * E2E Tests for Discovery Feature
 * Comprehensive testing of discovery functionality
 */

import { test, expect } from '@playwright/test';
import { VSCodeWorkbench } from '../helpers/vscode-workbench';
import { DiscoveryLensPage } from '../pages/discovery-lens.page';
import { createTestWorkspace, cleanupTestWorkspace } from '../helpers/workspace-helper';

test.describe('Discovery Feature', () => {
  let workbench: VSCodeWorkbench;
  let discoveryLens: DiscoveryLensPage;
  let testWorkspacePath: string;

  test.beforeAll(async () => {
    testWorkspacePath = await createTestWorkspace({
      files: [
        {
          path: 'src/Calculator.js',
          content: `
            export class Calculator {
              add(a, b) { return a + b; }
              subtract(a, b) { return a - b; }
              multiply(a, b) { return a * b; }
              divide(a, b) { return b !== 0 ? a / b : null; }
            }
          `
        },
        {
          path: 'src/StringUtils.ts',
          content: `
            export class StringUtils {
              capitalize(str: string): string {
                return str.charAt(0).toUpperCase() + str.slice(1);
              }

              reverse(str: string): string {
                return str.split('').reverse().join('');
              }
            }
          `
        },
        {
          path: 'src/DataProcessor.js',
          content: `
            export function processData(data) {
              return data.map(item => ({
                ...item,
                processed: true,
                timestamp: Date.now()
              }));
            }
          `
        }
      ]
    });
  });

  test.beforeEach(async ({ page }) => {
    workbench = new VSCodeWorkbench(page);
    await workbench.open(testWorkspacePath);
    await workbench.waitForExtensionActivation('adaptive-tests');

    discoveryLens = new DiscoveryLensPage(page);
  });

  test.afterAll(async () => {
    await cleanupTestWorkspace(testWorkspacePath);
  });

  test('should open Discovery Lens from command palette', async () => {
    await workbench.openCommandPalette();
    await workbench.executeCommand('Adaptive Tests: Show Discovery Lens');

    await expect(discoveryLens.container).toBeVisible();
    await expect(discoveryLens.title).toContainText('Discovery Lens');
  });

  test('should discover Calculator class', async () => {
    await discoveryLens.open();
    await discoveryLens.setSignature({
      name: 'Calculator',
      type: 'class',
      methods: ['add', 'subtract']
    });

    await discoveryLens.runDiscovery();
    await discoveryLens.waitForResults();

    const results = await discoveryLens.getResults();
    expect(results.length).toBeGreaterThan(0);

    const calculatorResult = results.find(r => r.path.includes('Calculator.js'));
    expect(calculatorResult).toBeDefined();
    expect(calculatorResult!.score).toBeGreaterThan(80);
  });

  test('should filter results by score', async () => {
    await discoveryLens.open();
    await discoveryLens.setSignature({ name: 'Utils' });
    await discoveryLens.runDiscovery();
    await discoveryLens.waitForResults();

    const initialResults = await discoveryLens.getResults();
    expect(initialResults.length).toBeGreaterThan(0);

    await discoveryLens.setMinScoreFilter(50);
    const filteredResults = await discoveryLens.getResults();

    expect(filteredResults.every(r => r.score >= 50)).toBe(true);
    expect(filteredResults.length).toBeLessThanOrEqual(initialResults.length);
  });

  test('should open file when result is double-clicked', async () => {
    await discoveryLens.open();
    await discoveryLens.setSignature({ name: 'StringUtils' });
    await discoveryLens.runDiscovery();
    await discoveryLens.waitForResults();

    const results = await discoveryLens.getResults();
    const stringUtilsResult = results.find(r => r.path.includes('StringUtils.ts'));
    expect(stringUtilsResult).toBeDefined();

    await discoveryLens.openResult(stringUtilsResult!);

    const activeEditor = await workbench.getActiveEditor();
    expect(activeEditor.fileName).toContain('StringUtils.ts');
  });

  test('should export results to JSON', async () => {
    await discoveryLens.open();
    await discoveryLens.setSignature({ name: 'process' });
    await discoveryLens.runDiscovery();
    await discoveryLens.waitForResults();

    const downloadPromise = discoveryLens.page.waitForEvent('download');
    await discoveryLens.exportResults('json');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain('discovery-results');
    expect(download.suggestedFilename()).toEndWith('.json');

    const content = await download.createReadStream();
    const json = JSON.parse(content.toString());
    expect(Array.isArray(json)).toBe(true);
    expect(json.length).toBeGreaterThan(0);
  });

  test('should handle empty results gracefully', async () => {
    await discoveryLens.open();
    await discoveryLens.setSignature({ name: 'NonExistentClass' });
    await discoveryLens.runDiscovery();

    await expect(discoveryLens.noResultsMessage).toBeVisible();
    await expect(discoveryLens.noResultsMessage).toContainText('No results found');
  });

  test('should support keyboard navigation', async () => {
    await discoveryLens.open();
    await discoveryLens.setSignature({ name: 'Calculator' });
    await discoveryLens.runDiscovery();
    await discoveryLens.waitForResults();

    const results = await discoveryLens.getResults();
    expect(results.length).toBeGreaterThan(1);

    // Navigate with arrow keys
    await discoveryLens.page.keyboard.press('ArrowDown');
    let selectedIndex = await discoveryLens.getSelectedResultIndex();
    expect(selectedIndex).toBe(1);

    await discoveryLens.page.keyboard.press('ArrowDown');
    selectedIndex = await discoveryLens.getSelectedResultIndex();
    expect(selectedIndex).toBe(2);

    await discoveryLens.page.keyboard.press('ArrowUp');
    selectedIndex = await discoveryLens.getSelectedResultIndex();
    expect(selectedIndex).toBe(1);

    // Open with Enter
    await discoveryLens.page.keyboard.press('Enter');
    const activeEditor = await workbench.getActiveEditor();
    expect(activeEditor.fileName).toBeDefined();
  });

  test('should persist signature across sessions', async () => {
    const signature = {
      name: 'TestClass',
      type: 'class' as const,
      methods: ['testMethod']
    };

    await discoveryLens.open();
    await discoveryLens.setSignature(signature);
    await discoveryLens.close();

    await discoveryLens.open();
    const persistedSignature = await discoveryLens.getSignature();
    expect(persistedSignature).toEqual(signature);
  });

  test('should handle cancellation correctly', async () => {
    await discoveryLens.open();
    await discoveryLens.setSignature({ name: 'LargeSearch' });

    const discoveryPromise = discoveryLens.runDiscovery();
    await discoveryLens.page.waitForTimeout(100);
    await discoveryLens.cancelDiscovery();

    await expect(discoveryPromise).rejects.toThrow();
    await expect(discoveryLens.loadingIndicator).not.toBeVisible();
  });

  test('should display performance metrics', async ({ page }) => {
    await discoveryLens.open();
    await discoveryLens.setSignature({ name: 'Calculator' });

    const metricsPromise = page.evaluate(() => {
      return new Promise(resolve => {
        // Listen for performance metrics
        window.addEventListener('discovery:metrics', (event: any) => {
          resolve(event.detail);
        });
      });
    });

    await discoveryLens.runDiscovery();
    const metrics = await metricsPromise;

    expect(metrics).toHaveProperty('duration');
    expect(metrics).toHaveProperty('candidatesScanned');
    expect(metrics).toHaveProperty('memoryUsed');
  });
});

test.describe('Discovery Performance', () => {
  test('should handle large result sets efficiently', async ({ page }) => {
    const workbench = new VSCodeWorkbench(page);
    const discoveryLens = new DiscoveryLensPage(page);

    const largeWorkspace = await createTestWorkspace({
      files: Array.from({ length: 100 }, (_, i) => ({
        path: `src/Component${i}.js`,
        content: `export class Component${i} { render() {} }`
      }))
    });

    await workbench.open(largeWorkspace);
    await discoveryLens.open();

    const startTime = Date.now();
    await discoveryLens.setSignature({ name: 'Component' });
    await discoveryLens.runDiscovery();
    await discoveryLens.waitForResults();
    const endTime = Date.now();

    const duration = endTime - startTime;
    expect(duration).toBeLessThan(5000); // Should complete within 5 seconds

    const results = await discoveryLens.getResults();
    expect(results.length).toBeGreaterThan(50);

    // Check virtual scrolling is working
    const visibleResults = await discoveryLens.getVisibleResultCount();
    expect(visibleResults).toBeLessThan(20); // Only a subset should be rendered

    await cleanupTestWorkspace(largeWorkspace);
  });

  test('should not leak memory during repeated discoveries', async ({ page }) => {
    const workbench = new VSCodeWorkbench(page);
    const discoveryLens = new DiscoveryLensPage(page);

    await workbench.open();
    await discoveryLens.open();

    const getMemoryUsage = () => page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    const initialMemory = await getMemoryUsage();

    // Run discovery multiple times
    for (let i = 0; i < 10; i++) {
      await discoveryLens.setSignature({ name: `Test${i}` });
      await discoveryLens.runDiscovery();
      await page.waitForTimeout(100);
    }

    // Force garbage collection if available
    await page.evaluate(() => {
      if ((window as any).gc) {
        (window as any).gc();
      }
    });

    const finalMemory = await getMemoryUsage();
    const memoryIncrease = finalMemory - initialMemory;

    // Memory increase should be minimal (< 10MB)
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
  });
});