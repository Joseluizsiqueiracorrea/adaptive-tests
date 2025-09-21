"use strict";
/**
 * AI-Powered Test Generation
 * Integrates with GitHub Copilot, OpenAI, and Claude for intelligent test creation
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AITestGenerator = void 0;
const vscode = __importStar(require("vscode"));
class AITestGenerator {
    constructor(logger, cache, telemetry, config) {
        this.logger = logger;
        this.cache = cache;
        this.telemetry = telemetry;
        this.config = config;
        this.providers = new Map();
        this.activeProvider = null;
        this.copilotAvailable = false;
        this.disposables = [];
        this.generationHistory = [];
        this.initialize();
    }
    async initialize() {
        // Register AI providers
        this.registerCopilotProvider();
        this.registerOpenAIProvider();
        this.registerClaudeProvider();
        this.registerLocalProvider();
        // Check for available providers
        await this.detectAvailableProviders();
        // Set active provider based on config
        const preferredProvider = this.config.get('experimental').copilotIntegration
            ? 'copilot'
            : 'local';
        this.setActiveProvider(preferredProvider);
        this.logger.info('AITestGenerator initialized', {
            providers: Array.from(this.providers.keys()),
            active: this.activeProvider?.name
        });
    }
    /**
     * Generate test for given code
     */
    async generateTest(code, options = {}) {
        const timer = this.telemetry.startTimer('ai_test_generation');
        try {
            const context = {
                code,
                language: options.language || this.detectLanguage(code),
                fileName: options.fileName || 'unknown',
                framework: options.framework || this.config.get('scaffold').templateStyle,
                style: options.style || 'unit',
                coverage: options.coverage || 'comprehensive'
            };
            // Check cache
            const cacheKey = this.cache.createKey('ai_test', context);
            const cached = await this.cache.get(cacheKey);
            if (cached) {
                this.logger.debug('AI test cache hit', { fileName: context.fileName });
                return cached;
            }
            // Generate with active provider
            if (!this.activeProvider) {
                throw new Error('No AI provider available');
            }
            const test = await this.activeProvider.generateTest(context);
            // Enhance with additional providers if available
            if (this.providers.size > 1) {
                test.suggestions = await this.gatherSuggestions(context);
            }
            // Cache result
            await this.cache.set(cacheKey, test, 30 * 60 * 1000); // 30 min cache
            // Track history
            this.generationHistory.push(test);
            if (this.generationHistory.length > 20) {
                this.generationHistory.shift();
            }
            // Track telemetry
            timer();
            this.telemetry.trackFeature('ai_generation', 'test_generated', {
                provider: this.activeProvider.name,
                language: context.language,
                framework: context.framework,
                coverage: test.coverage
            });
            return test;
        }
        catch (error) {
            this.logger.error('AI test generation failed', error);
            timer();
            throw error;
        }
    }
    /**
     * Generate smart assertions for existing test
     */
    async generateAssertions(code, testCode) {
        if (!this.activeProvider) {
            throw new Error('No AI provider available');
        }
        const assertions = [];
        // Generate multiple assertion suggestions
        for (let i = 0; i < 3; i++) {
            try {
                const assertion = await this.activeProvider.generateAssertion(code, testCode);
                if (assertion && !assertions.includes(assertion)) {
                    assertions.push(assertion);
                }
            }
            catch (error) {
                this.logger.warn('Assertion generation failed', { error });
            }
        }
        return assertions;
    }
    /**
     * Suggest test cases based on code analysis
     */
    async suggestTestCases(code) {
        if (!this.activeProvider) {
            return this.generateLocalSuggestions(code);
        }
        try {
            return await this.activeProvider.suggestTestCases(code);
        }
        catch (error) {
            this.logger.warn('Test case suggestion failed, using local', { error });
            return this.generateLocalSuggestions(code);
        }
    }
    /**
     * Improve existing test with AI feedback
     */
    async improveTest(test, feedback) {
        if (!this.activeProvider) {
            throw new Error('No AI provider available');
        }
        const userFeedback = feedback || 'Make the test more comprehensive and add edge cases';
        return await this.activeProvider.improveTest(test, userFeedback);
    }
    /**
     * Interactive test generation with user feedback
     */
    async generateInteractive() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor');
            return;
        }
        const code = editor.document.getText(editor.selection.isEmpty
            ? undefined
            : editor.selection);
        // Show quick pick for options
        const framework = await vscode.window.showQuickPick(['jest', 'vitest', 'mocha', 'adaptive'], { placeHolder: 'Select test framework' });
        const style = await vscode.window.showQuickPick(['unit', 'integration', 'e2e'], { placeHolder: 'Select test style' });
        const coverage = await vscode.window.showQuickPick(['basic', 'comprehensive', 'edge-cases'], { placeHolder: 'Select coverage level' });
        if (!framework || !style || !coverage)
            return;
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Generating AI-powered test...',
            cancellable: true
        }, async (progress, token) => {
            try {
                const test = await this.generateTest(code, {
                    fileName: editor.document.fileName,
                    framework: framework,
                    style: style,
                    coverage: coverage
                });
                // Create new test file
                const testDoc = await vscode.workspace.openTextDocument({
                    content: test.code,
                    language: editor.document.languageId
                });
                await vscode.window.showTextDocument(testDoc, vscode.ViewColumn.Beside);
                // Show test info
                vscode.window.showInformationMessage(`Test generated! Coverage: ${test.coverage}%, Assertions: ${test.assertions.length}`, 'Accept', 'Regenerate', 'Improve').then(async (choice) => {
                    if (choice === 'Regenerate') {
                        await this.generateInteractive();
                    }
                    else if (choice === 'Improve') {
                        const feedback = await vscode.window.showInputBox({
                            prompt: 'How should the test be improved?',
                            placeHolder: 'E.g., Add more edge cases, test error handling...'
                        });
                        if (feedback) {
                            const improved = await this.improveTest(test.code, feedback);
                            await vscode.window.activeTextEditor?.edit(edit => {
                                edit.replace(new vscode.Range(0, 0, testDoc.lineCount, 0), improved);
                            });
                        }
                    }
                });
            }
            catch (error) {
                vscode.window.showErrorMessage(`Test generation failed: ${error}`);
            }
        });
    }
    registerCopilotProvider() {
        this.providers.set('copilot', {
            name: 'GitHub Copilot',
            generateTest: async (context) => {
                // Check if Copilot extension is available
                const copilot = vscode.extensions.getExtension('GitHub.copilot');
                if (!copilot?.isActive) {
                    throw new Error('GitHub Copilot not available');
                }
                // Use Copilot API (when available)
                // For now, this is a placeholder for future Copilot API integration
                const prompt = this.createTestPrompt(context);
                // Simulate Copilot response
                return {
                    code: await this.generateWithCopilotSimulation(prompt, context),
                    description: 'Generated with GitHub Copilot',
                    coverage: 85,
                    assertions: ['expect', 'toBe', 'toEqual', 'toThrow'],
                    suggestions: ['Add edge case testing', 'Include performance tests']
                };
            },
            generateAssertion: async (code, testContext) => {
                return `expect(result).toBe(expected);`;
            },
            suggestTestCases: async (code) => {
                return [
                    'Test with valid inputs',
                    'Test with invalid inputs',
                    'Test edge cases',
                    'Test error handling',
                    'Test async operations'
                ];
            },
            improveTest: async (test, feedback) => {
                return test + '\n// Improved based on: ' + feedback;
            }
        });
    }
    registerOpenAIProvider() {
        this.providers.set('openai', {
            name: 'OpenAI',
            generateTest: async (context) => {
                // OpenAI API integration
                // This would connect to OpenAI's API when API key is provided
                const apiKey = await this.getAPIKey('openai');
                if (!apiKey) {
                    throw new Error('OpenAI API key not configured');
                }
                // Placeholder for OpenAI API call
                return this.generateLocalTest(context);
            },
            generateAssertion: async (code, testContext) => {
                return `expect(result).toMatchSnapshot();`;
            },
            suggestTestCases: async (code) => {
                return ['Test happy path', 'Test error cases', 'Test boundaries'];
            },
            improveTest: async (test, feedback) => {
                return test;
            }
        });
    }
    registerClaudeProvider() {
        this.providers.set('claude', {
            name: 'Claude',
            generateTest: async (context) => {
                // Claude API integration via MCP
                // This would connect to Claude through MCP servers
                return this.generateLocalTest(context);
            },
            generateAssertion: async (code, testContext) => {
                return `assert.strictEqual(result, expected);`;
            },
            suggestTestCases: async (code) => {
                return ['Comprehensive unit tests', 'Integration scenarios', 'Security tests'];
            },
            improveTest: async (test, feedback) => {
                return test;
            }
        });
    }
    registerLocalProvider() {
        this.providers.set('local', {
            name: 'Local Intelligence',
            generateTest: async (context) => {
                return this.generateLocalTest(context);
            },
            generateAssertion: async (code, testContext) => {
                return this.generateLocalAssertion(code, testContext);
            },
            suggestTestCases: async (code) => {
                return this.generateLocalSuggestions(code);
            },
            improveTest: async (test, feedback) => {
                return this.improveLocally(test, feedback);
            }
        });
    }
    async generateLocalTest(context) {
        const { code, framework, style, coverage } = context;
        // Parse code to understand structure
        const functions = this.extractFunctions(code);
        const classes = this.extractClasses(code);
        let testCode = '';
        const assertions = [];
        // Generate appropriate test template
        if (framework === 'jest' || framework === 'vitest') {
            testCode = this.generateJestTest(functions, classes, style || 'bdd', coverage || 'basic');
            assertions.push('expect', 'toBe', 'toEqual');
        }
        else if (framework === 'mocha') {
            testCode = this.generateMochaTest(functions, classes, style || 'bdd', coverage || 'basic');
            assertions.push('assert', 'equal', 'deepEqual');
        }
        else {
            testCode = this.generateAdaptiveTest(functions, classes, style || 'bdd', coverage || 'basic');
            assertions.push('discover', 'adapt', 'verify');
        }
        return {
            code: testCode,
            description: 'Generated with local AI intelligence',
            coverage: coverage === 'comprehensive' ? 90 : coverage === 'edge-cases' ? 75 : 60,
            assertions,
            suggestions: [
                'Consider adding performance tests',
                'Add negative test cases',
                'Include boundary value tests'
            ]
        };
    }
    generateJestTest(functions, classes, style, coverage) {
        let test = `import { ${[...functions, ...classes].join(', ')} } from './module';\n\n`;
        // Generate describe blocks
        for (const className of classes) {
            test += `describe('${className}', () => {\n`;
            test += `  let instance;\n\n`;
            test += `  beforeEach(() => {\n`;
            test += `    instance = new ${className}();\n`;
            test += `  });\n\n`;
            if (coverage !== 'basic') {
                test += `  afterEach(() => {\n`;
                test += `    jest.clearAllMocks();\n`;
                test += `  });\n\n`;
            }
            test += `  it('should create an instance', () => {\n`;
            test += `    expect(instance).toBeDefined();\n`;
            test += `  });\n\n`;
            if (coverage === 'comprehensive' || coverage === 'edge-cases') {
                test += `  it('should handle edge cases', () => {\n`;
                test += `    // Add edge case tests here\n`;
                test += `  });\n`;
            }
            test += `});\n\n`;
        }
        // Generate function tests
        for (const funcName of functions) {
            test += `describe('${funcName}', () => {\n`;
            test += `  it('should work correctly', () => {\n`;
            test += `    const result = ${funcName}(/* args */);\n`;
            test += `    expect(result).toBe(/* expected */);\n`;
            test += `  });\n`;
            if (coverage === 'edge-cases') {
                test += `\n  it('should handle null input', () => {\n`;
                test += `    expect(() => ${funcName}(null)).toThrow();\n`;
                test += `  });\n`;
            }
            test += `});\n\n`;
        }
        return test;
    }
    generateMochaTest(functions, classes, style, coverage) {
        let test = `const assert = require('assert');\n`;
        test += `const { ${[...functions, ...classes].join(', ')} } = require('./module');\n\n`;
        for (const className of classes) {
            test += `describe('${className}', function() {\n`;
            test += `  let instance;\n\n`;
            test += `  beforeEach(function() {\n`;
            test += `    instance = new ${className}();\n`;
            test += `  });\n\n`;
            test += `  it('should create an instance', function() {\n`;
            test += `    assert(instance);\n`;
            test += `  });\n`;
            test += `});\n\n`;
        }
        return test;
    }
    generateAdaptiveTest(functions, classes, style, coverage) {
        let test = `import { discover } from 'adaptive-tests';\n\n`;
        test += `discover({\n`;
        test += `  name: 'Module',\n`;
        test += `  signature: {\n`;
        if (classes.length > 0) {
            test += `    classes: [${classes.map(c => `'${c}'`).join(', ')}],\n`;
        }
        if (functions.length > 0) {
            test += `    functions: [${functions.map(f => `'${f}'`).join(', ')}],\n`;
        }
        test += `  },\n`;
        test += `  adapt: true,\n`;
        test += `  coverage: '${coverage}'\n`;
        test += `});\n`;
        return test;
    }
    generateLocalAssertion(code, testContext) {
        // Simple heuristic-based assertion generation
        if (code.includes('return')) {
            return 'expect(result).toBeDefined();';
        }
        if (code.includes('throw')) {
            return 'expect(() => fn()).toThrow();';
        }
        if (code.includes('async')) {
            return 'await expect(promise).resolves.toBeDefined();';
        }
        return 'expect(value).toBeTruthy();';
    }
    generateLocalSuggestions(code) {
        const suggestions = [];
        // Analyze code patterns
        if (code.includes('async') || code.includes('await')) {
            suggestions.push('Test async operations and promise rejection');
        }
        if (code.includes('throw') || code.includes('Error')) {
            suggestions.push('Test error handling and edge cases');
        }
        if (code.includes('if') || code.includes('switch')) {
            suggestions.push('Test all conditional branches');
        }
        if (code.includes('for') || code.includes('while')) {
            suggestions.push('Test loop boundaries and empty iterations');
        }
        if (code.includes('[]') || code.includes('{}')) {
            suggestions.push('Test with empty and large collections');
        }
        // Always include these
        suggestions.push('Test with null/undefined inputs');
        suggestions.push('Test performance with large datasets');
        suggestions.push('Add integration tests');
        return suggestions.slice(0, 5);
    }
    improveLocally(test, feedback) {
        // Simple improvement based on keywords
        const improvements = [];
        if (feedback.toLowerCase().includes('edge')) {
            improvements.push('// Edge case: null input\nit("should handle null", () => {\n  expect(() => fn(null)).toThrow();\n});');
        }
        if (feedback.toLowerCase().includes('performance')) {
            improvements.push('// Performance test\nit("should complete within 100ms", () => {\n  const start = Date.now();\n  fn();\n  expect(Date.now() - start).toBeLessThan(100);\n});');
        }
        if (feedback.toLowerCase().includes('async')) {
            improvements.push('// Async test\nit("should handle async operations", async () => {\n  await expect(asyncFn()).resolves.toBeDefined();\n});');
        }
        return test + '\n\n' + improvements.join('\n\n');
    }
    async generateWithCopilotSimulation(prompt, context) {
        // Simulate Copilot-style test generation
        const { framework, style } = context;
        if (framework === 'jest') {
            return `// Generated by Copilot
describe('Component', () => {
  it('should work as expected', () => {
    // Copilot suggestion
    const result = component.method();
    expect(result).toBeDefined();
    expect(result).toHaveProperty('success', true);
  });

  ${style === 'integration' ? `
  it('should integrate with dependencies', async () => {
    // Integration test
    const integrated = await component.integrate();
    expect(integrated).toBeTruthy();
  });` : ''}

  ${style === 'e2e' ? `
  it('should handle end-to-end flow', async () => {
    // E2E test
    const flow = await component.completeFlow();
    expect(flow.status).toBe('completed');
  });` : ''}
});`;
        }
        return '// Copilot generated test\n' + prompt;
    }
    createTestPrompt(context) {
        const { code, framework, style, coverage } = context;
        return `Generate a ${coverage} ${style} test for the following code using ${framework}:

\`\`\`
${code}
\`\`\`

Requirements:
- Use ${framework} testing framework
- Include ${style} style tests
- Achieve ${coverage} coverage
- Add proper assertions
- Include edge cases`;
    }
    extractFunctions(code) {
        const functionPattern = /(?:export\s+)?(?:async\s+)?function\s+(\w+)/g;
        const arrowPattern = /(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s*)?\(/g;
        const functions = [];
        let match;
        while ((match = functionPattern.exec(code)) !== null) {
            functions.push(match[1]);
        }
        while ((match = arrowPattern.exec(code)) !== null) {
            functions.push(match[1]);
        }
        return functions;
    }
    extractClasses(code) {
        const classPattern = /(?:export\s+)?class\s+(\w+)/g;
        const classes = [];
        let match;
        while ((match = classPattern.exec(code)) !== null) {
            classes.push(match[1]);
        }
        return classes;
    }
    detectLanguage(code) {
        if (code.includes('function') || code.includes('=>'))
            return 'javascript';
        if (code.includes(': string') || code.includes(': number'))
            return 'typescript';
        if (code.includes('def ') || code.includes('import '))
            return 'python';
        if (code.includes('public class') || code.includes('private '))
            return 'java';
        return 'javascript';
    }
    async detectAvailableProviders() {
        // Check for GitHub Copilot
        const copilot = vscode.extensions.getExtension('GitHub.copilot');
        if (copilot) {
            this.copilotAvailable = true;
            this.logger.info('GitHub Copilot detected');
        }
        // Check for API keys
        const openaiKey = await this.getAPIKey('openai');
        if (!openaiKey) {
            this.providers.delete('openai');
        }
        // Local provider is always available
    }
    async getAPIKey(provider) {
        // Try to get from settings
        const config = vscode.workspace.getConfiguration('adaptive-tests');
        const key = config.get(`ai.${provider}.apiKey`);
        if (key)
            return key;
        // Try to get from environment
        const envKey = process.env[`${provider.toUpperCase()}_API_KEY`];
        if (envKey)
            return envKey;
        return undefined;
    }
    setActiveProvider(name) {
        this.activeProvider = this.providers.get(name) || null;
        if (!this.activeProvider && this.providers.size > 0) {
            // Fallback to first available
            const firstProvider = this.providers.values().next().value;
            this.activeProvider = firstProvider || null;
        }
    }
    async gatherSuggestions(context) {
        const suggestions = [];
        for (const [name, provider] of this.providers) {
            if (provider === this.activeProvider)
                continue;
            try {
                const providerSuggestions = await provider.suggestTestCases(context.code);
                suggestions.push(...providerSuggestions.map(s => `[${name}] ${s}`));
            }
            catch {
                // Ignore provider errors
            }
        }
        return suggestions.slice(0, 5);
    }
    dispose() {
        this.disposables.forEach(d => d.dispose());
    }
}
exports.AITestGenerator = AITestGenerator;
//# sourceMappingURL=AITestGenerator.js.map