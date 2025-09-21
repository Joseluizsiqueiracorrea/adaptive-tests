"use strict";
/**
 * E2E Tests for Discovery Feature
 * Comprehensive testing of discovery functionality
 */
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const vscode_workbench_1 = require("../helpers/vscode-workbench");
const discovery_lens_page_1 = require("../pages/discovery-lens.page");
const workspace_helper_1 = require("../helpers/workspace-helper");
test_1.test.describe('Discovery Feature', () => {
    let workbench;
    let discoveryLens;
    let testWorkspacePath;
    test_1.test.beforeAll(async () => {
        testWorkspacePath = await (0, workspace_helper_1.createTestWorkspace)({
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
    test_1.test.beforeEach(async ({ page }) => {
        workbench = new vscode_workbench_1.VSCodeWorkbench(page);
        await workbench.open(testWorkspacePath);
        await workbench.waitForExtensionActivation('adaptive-tests');
        discoveryLens = new discovery_lens_page_1.DiscoveryLensPage(page);
    });
    test_1.test.afterAll(async () => {
        await (0, workspace_helper_1.cleanupTestWorkspace)(testWorkspacePath);
    });
    (0, test_1.test)('should open Discovery Lens from command palette', async () => {
        await workbench.openCommandPalette();
        await workbench.executeCommand('Adaptive Tests: Show Discovery Lens');
        await (0, test_1.expect)(discoveryLens.container).toBeVisible();
        await (0, test_1.expect)(discoveryLens.title).toContainText('Discovery Lens');
    });
    (0, test_1.test)('should discover Calculator class', async () => {
        await discoveryLens.open();
        await discoveryLens.setSignature({
            name: 'Calculator',
            type: 'class',
            methods: ['add', 'subtract']
        });
        await discoveryLens.runDiscovery();
        await discoveryLens.waitForResults();
        const results = await discoveryLens.getResults();
        (0, test_1.expect)(results.length).toBeGreaterThan(0);
        const calculatorResult = results.find(r => r.path.includes('Calculator.js'));
        (0, test_1.expect)(calculatorResult).toBeDefined();
        (0, test_1.expect)(calculatorResult.score).toBeGreaterThan(80);
    });
    (0, test_1.test)('should filter results by score', async () => {
        await discoveryLens.open();
        await discoveryLens.setSignature({ name: 'Utils' });
        await discoveryLens.runDiscovery();
        await discoveryLens.waitForResults();
        const initialResults = await discoveryLens.getResults();
        (0, test_1.expect)(initialResults.length).toBeGreaterThan(0);
        await discoveryLens.setMinScoreFilter(50);
        const filteredResults = await discoveryLens.getResults();
        (0, test_1.expect)(filteredResults.every(r => r.score >= 50)).toBe(true);
        (0, test_1.expect)(filteredResults.length).toBeLessThanOrEqual(initialResults.length);
    });
    (0, test_1.test)('should open file when result is double-clicked', async () => {
        await discoveryLens.open();
        await discoveryLens.setSignature({ name: 'StringUtils' });
        await discoveryLens.runDiscovery();
        await discoveryLens.waitForResults();
        const results = await discoveryLens.getResults();
        const stringUtilsResult = results.find(r => r.path.includes('StringUtils.ts'));
        (0, test_1.expect)(stringUtilsResult).toBeDefined();
        await discoveryLens.openResult(stringUtilsResult);
        const activeEditor = await workbench.getActiveEditor();
        (0, test_1.expect)(activeEditor.fileName).toContain('StringUtils.ts');
    });
    (0, test_1.test)('should export results to JSON', async () => {
        await discoveryLens.open();
        await discoveryLens.setSignature({ name: 'process' });
        await discoveryLens.runDiscovery();
        await discoveryLens.waitForResults();
        const downloadPromise = discoveryLens.page.waitForEvent('download');
        await discoveryLens.exportResults('json');
        const download = await downloadPromise;
        (0, test_1.expect)(download.suggestedFilename()).toContain('discovery-results');
        (0, test_1.expect)(download.suggestedFilename()).toEndWith('.json');
        const content = await download.createReadStream();
        const json = JSON.parse(content.toString());
        (0, test_1.expect)(Array.isArray(json)).toBe(true);
        (0, test_1.expect)(json.length).toBeGreaterThan(0);
    });
    (0, test_1.test)('should handle empty results gracefully', async () => {
        await discoveryLens.open();
        await discoveryLens.setSignature({ name: 'NonExistentClass' });
        await discoveryLens.runDiscovery();
        await (0, test_1.expect)(discoveryLens.noResultsMessage).toBeVisible();
        await (0, test_1.expect)(discoveryLens.noResultsMessage).toContainText('No results found');
    });
    (0, test_1.test)('should support keyboard navigation', async () => {
        await discoveryLens.open();
        await discoveryLens.setSignature({ name: 'Calculator' });
        await discoveryLens.runDiscovery();
        await discoveryLens.waitForResults();
        const results = await discoveryLens.getResults();
        (0, test_1.expect)(results.length).toBeGreaterThan(1);
        // Navigate with arrow keys
        await discoveryLens.page.keyboard.press('ArrowDown');
        let selectedIndex = await discoveryLens.getSelectedResultIndex();
        (0, test_1.expect)(selectedIndex).toBe(1);
        await discoveryLens.page.keyboard.press('ArrowDown');
        selectedIndex = await discoveryLens.getSelectedResultIndex();
        (0, test_1.expect)(selectedIndex).toBe(2);
        await discoveryLens.page.keyboard.press('ArrowUp');
        selectedIndex = await discoveryLens.getSelectedResultIndex();
        (0, test_1.expect)(selectedIndex).toBe(1);
        // Open with Enter
        await discoveryLens.page.keyboard.press('Enter');
        const activeEditor = await workbench.getActiveEditor();
        (0, test_1.expect)(activeEditor.fileName).toBeDefined();
    });
    (0, test_1.test)('should persist signature across sessions', async () => {
        const signature = {
            name: 'TestClass',
            type: 'class',
            methods: ['testMethod']
        };
        await discoveryLens.open();
        await discoveryLens.setSignature(signature);
        await discoveryLens.close();
        await discoveryLens.open();
        const persistedSignature = await discoveryLens.getSignature();
        (0, test_1.expect)(persistedSignature).toEqual(signature);
    });
    (0, test_1.test)('should handle cancellation correctly', async () => {
        await discoveryLens.open();
        await discoveryLens.setSignature({ name: 'LargeSearch' });
        const discoveryPromise = discoveryLens.runDiscovery();
        await discoveryLens.page.waitForTimeout(100);
        await discoveryLens.cancelDiscovery();
        await (0, test_1.expect)(discoveryPromise).rejects.toThrow();
        await (0, test_1.expect)(discoveryLens.loadingIndicator).not.toBeVisible();
    });
    (0, test_1.test)('should display performance metrics', async ({ page }) => {
        await discoveryLens.open();
        await discoveryLens.setSignature({ name: 'Calculator' });
        const metricsPromise = page.evaluate(() => {
            return new Promise(resolve => {
                // Listen for performance metrics
                window.addEventListener('discovery:metrics', (event) => {
                    resolve(event.detail);
                });
            });
        });
        await discoveryLens.runDiscovery();
        const metrics = await metricsPromise;
        (0, test_1.expect)(metrics).toHaveProperty('duration');
        (0, test_1.expect)(metrics).toHaveProperty('candidatesScanned');
        (0, test_1.expect)(metrics).toHaveProperty('memoryUsed');
    });
});
test_1.test.describe('Discovery Performance', () => {
    (0, test_1.test)('should handle large result sets efficiently', async ({ page }) => {
        const workbench = new vscode_workbench_1.VSCodeWorkbench(page);
        const discoveryLens = new discovery_lens_page_1.DiscoveryLensPage(page);
        const largeWorkspace = await (0, workspace_helper_1.createTestWorkspace)({
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
        (0, test_1.expect)(duration).toBeLessThan(5000); // Should complete within 5 seconds
        const results = await discoveryLens.getResults();
        (0, test_1.expect)(results.length).toBeGreaterThan(50);
        // Check virtual scrolling is working
        const visibleResults = await discoveryLens.getVisibleResultCount();
        (0, test_1.expect)(visibleResults).toBeLessThan(20); // Only a subset should be rendered
        await (0, workspace_helper_1.cleanupTestWorkspace)(largeWorkspace);
    });
    (0, test_1.test)('should not leak memory during repeated discoveries', async ({ page }) => {
        const workbench = new vscode_workbench_1.VSCodeWorkbench(page);
        const discoveryLens = new discovery_lens_page_1.DiscoveryLensPage(page);
        await workbench.open();
        await discoveryLens.open();
        const getMemoryUsage = () => page.evaluate(() => {
            return performance.memory?.usedJSHeapSize || 0;
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
            if (window.gc) {
                window.gc();
            }
        });
        const finalMemory = await getMemoryUsage();
        const memoryIncrease = finalMemory - initialMemory;
        // Memory increase should be minimal (< 10MB)
        (0, test_1.expect)(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
});
//# sourceMappingURL=discovery.spec.js.map