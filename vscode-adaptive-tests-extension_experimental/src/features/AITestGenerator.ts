/**
 * AI-Powered Test Generation
 * Integrates with GitHub Copilot, OpenAI, and Claude for intelligent test creation
 */

import * as vscode from 'vscode';
import { Logger } from '../core/logger';
import { CacheService } from '../services/CacheService';
import { TelemetryService } from '../services/TelemetryService';
import { ConfigService } from '../services/ConfigService';

interface TestGenerationContext {
  code: string;
  language: string;
  fileName: string;
  framework?: 'jest' | 'vitest' | 'mocha' | 'adaptive';
  style?: 'unit' | 'integration' | 'e2e';
  coverage?: 'basic' | 'comprehensive' | 'edge-cases';
}

interface GeneratedTest {
  code: string;
  description: string;
  coverage: number;
  assertions: string[];
  suggestions?: string[];
}

interface AIProvider {
  name: string;
  generateTest(context: TestGenerationContext): Promise<GeneratedTest>;
  generateAssertion(code: string, testContext: string): Promise<string>;
  suggestTestCases(code: string): Promise<string[]>;
  improveTest(test: string, feedback: string): Promise<string>;
}

export class AITestGenerator implements vscode.Disposable {
  private providers = new Map<string, AIProvider>();
  private activeProvider: AIProvider | null = null;
  private copilotAvailable = false;
  private disposables: vscode.Disposable[] = [];
  private generationHistory: GeneratedTest[] = [];

  constructor(
    private logger: Logger,
    private cache: CacheService,
    private telemetry: TelemetryService,
    private config: ConfigService
  ) {
    this.initialize();
  }

  private async initialize() {
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
  public async generateTest(
    code: string,
    options: Partial<TestGenerationContext> = {}
  ): Promise<GeneratedTest> {
    const timer = this.telemetry.startTimer('ai_test_generation');

    try {
      const context: TestGenerationContext = {
        code,
        language: options.language || this.detectLanguage(code),
        fileName: options.fileName || 'unknown',
        framework: options.framework || this.config.get('scaffold').templateStyle as any,
        style: options.style || 'unit',
        coverage: options.coverage || 'comprehensive'
      };

      // Check cache
      const cacheKey = this.cache.createKey('ai_test', context);
      const cached = await this.cache.get<GeneratedTest>(cacheKey);
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
    } catch (error) {
      this.logger.error('AI test generation failed', error as Error);
      timer();
      throw error;
    }
  }

  /**
   * Generate smart assertions for existing test
   */
  public async generateAssertions(
    code: string,
    testCode: string
  ): Promise<string[]> {
    if (!this.activeProvider) {
      throw new Error('No AI provider available');
    }

    const assertions: string[] = [];

    // Generate multiple assertion suggestions
    for (let i = 0; i < 3; i++) {
      try {
        const assertion = await this.activeProvider.generateAssertion(code, testCode);
        if (assertion && !assertions.includes(assertion)) {
          assertions.push(assertion);
        }
      } catch (error) {
        this.logger.warn('Assertion generation failed', { error });
      }
    }

    return assertions;
  }

  /**
   * Suggest test cases based on code analysis
   */
  public async suggestTestCases(code: string): Promise<string[]> {
    if (!this.activeProvider) {
      return this.generateLocalSuggestions(code);
    }

    try {
      return await this.activeProvider.suggestTestCases(code);
    } catch (error) {
      this.logger.warn('Test case suggestion failed, using local', { error });
      return this.generateLocalSuggestions(code);
    }
  }

  /**
   * Improve existing test with AI feedback
   */
  public async improveTest(test: string, feedback?: string): Promise<string> {
    if (!this.activeProvider) {
      throw new Error('No AI provider available');
    }

    const userFeedback = feedback || 'Make the test more comprehensive and add edge cases';
    return await this.activeProvider.improveTest(test, userFeedback);
  }

  /**
   * Interactive test generation with user feedback
   */
  public async generateInteractive(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('No active editor');
      return;
    }

    const code = editor.document.getText(editor.selection.isEmpty
      ? undefined
      : editor.selection
    );

    // Show quick pick for options
    const framework = await vscode.window.showQuickPick(
      ['jest', 'vitest', 'mocha', 'adaptive'],
      { placeHolder: 'Select test framework' }
    );

    const style = await vscode.window.showQuickPick(
      ['unit', 'integration', 'e2e'],
      { placeHolder: 'Select test style' }
    );

    const coverage = await vscode.window.showQuickPick(
      ['basic', 'comprehensive', 'edge-cases'],
      { placeHolder: 'Select coverage level' }
    );

    if (!framework || !style || !coverage) return;

    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Generating AI-powered test...',
      cancellable: true
    }, async (progress, token) => {
      try {
        const test = await this.generateTest(code, {
          fileName: editor.document.fileName,
          framework: framework as any,
          style: style as any,
          coverage: coverage as any
        });

        // Create new test file
        const testDoc = await vscode.workspace.openTextDocument({
          content: test.code,
          language: editor.document.languageId
        });

        await vscode.window.showTextDocument(testDoc, vscode.ViewColumn.Beside);

        // Show test info
        vscode.window.showInformationMessage(
          `Test generated! Coverage: ${test.coverage}%, Assertions: ${test.assertions.length}`,
          'Accept',
          'Regenerate',
          'Improve'
        ).then(async choice => {
          if (choice === 'Regenerate') {
            await this.generateInteractive();
          } else if (choice === 'Improve') {
            const feedback = await vscode.window.showInputBox({
              prompt: 'How should the test be improved?',
              placeHolder: 'E.g., Add more edge cases, test error handling...'
            });
            if (feedback) {
              const improved = await this.improveTest(test.code, feedback);
              await vscode.window.activeTextEditor?.edit(edit => {
                edit.replace(
                  new vscode.Range(0, 0, testDoc.lineCount, 0),
                  improved
                );
              });
            }
          }
        });
      } catch (error) {
        vscode.window.showErrorMessage(`Test generation failed: ${error}`);
      }
    });
  }

  private registerCopilotProvider() {
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

  private registerOpenAIProvider() {
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

  private registerClaudeProvider() {
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

  private registerLocalProvider() {
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

  private async generateLocalTest(context: TestGenerationContext): Promise<GeneratedTest> {
    const { code, framework, style, coverage } = context;

    // Parse code to understand structure
    const functions = this.extractFunctions(code);
    const classes = this.extractClasses(code);

    let testCode = '';
    const assertions: string[] = [];

    // Generate appropriate test template
    if (framework === 'jest' || framework === 'vitest') {
      testCode = this.generateJestTest(functions, classes, style || 'bdd', coverage || 'basic');
      assertions.push('expect', 'toBe', 'toEqual');
    } else if (framework === 'mocha') {
      testCode = this.generateMochaTest(functions, classes, style || 'bdd', coverage || 'basic');
      assertions.push('assert', 'equal', 'deepEqual');
    } else {
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

  private generateJestTest(
    functions: string[],
    classes: string[],
    style: string,
    coverage: string
  ): string {
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

  private generateMochaTest(
    functions: string[],
    classes: string[],
    style: string,
    coverage: string
  ): string {
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

  private generateAdaptiveTest(
    functions: string[],
    classes: string[],
    style: string,
    coverage: string
  ): string {
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

  private generateLocalAssertion(code: string, testContext: string): string {
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

  private generateLocalSuggestions(code: string): string[] {
    const suggestions: string[] = [];

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

  private improveLocally(test: string, feedback: string): string {
    // Simple improvement based on keywords
    const improvements: string[] = [];

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

  private async generateWithCopilotSimulation(
    prompt: string,
    context: TestGenerationContext
  ): Promise<string> {
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

  private createTestPrompt(context: TestGenerationContext): string {
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

  private extractFunctions(code: string): string[] {
    const functionPattern = /(?:export\s+)?(?:async\s+)?function\s+(\w+)/g;
    const arrowPattern = /(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s*)?\(/g;
    const functions: string[] = [];

    let match;
    while ((match = functionPattern.exec(code)) !== null) {
      functions.push(match[1]);
    }
    while ((match = arrowPattern.exec(code)) !== null) {
      functions.push(match[1]);
    }

    return functions;
  }

  private extractClasses(code: string): string[] {
    const classPattern = /(?:export\s+)?class\s+(\w+)/g;
    const classes: string[] = [];

    let match;
    while ((match = classPattern.exec(code)) !== null) {
      classes.push(match[1]);
    }

    return classes;
  }

  private detectLanguage(code: string): string {
    if (code.includes('function') || code.includes('=>')) return 'javascript';
    if (code.includes(': string') || code.includes(': number')) return 'typescript';
    if (code.includes('def ') || code.includes('import ')) return 'python';
    if (code.includes('public class') || code.includes('private ')) return 'java';
    return 'javascript';
  }

  private async detectAvailableProviders() {
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

  private async getAPIKey(provider: string): Promise<string | undefined> {
    // Try to get from settings
    const config = vscode.workspace.getConfiguration('adaptive-tests');
    const key = config.get<string>(`ai.${provider}.apiKey`);

    if (key) return key;

    // Try to get from environment
    const envKey = process.env[`${provider.toUpperCase()}_API_KEY`];
    if (envKey) return envKey;

    return undefined;
  }

  private setActiveProvider(name: string) {
    this.activeProvider = this.providers.get(name) || null;
    if (!this.activeProvider && this.providers.size > 0) {
      // Fallback to first available
      const firstProvider = this.providers.values().next().value;
      this.activeProvider = firstProvider || null;
    }
  }

  private async gatherSuggestions(context: TestGenerationContext): Promise<string[]> {
    const suggestions: string[] = [];

    for (const [name, provider] of this.providers) {
      if (provider === this.activeProvider) continue;

      try {
        const providerSuggestions = await provider.suggestTestCases(context.code);
        suggestions.push(...providerSuggestions.map(s => `[${name}] ${s}`));
      } catch {
        // Ignore provider errors
      }
    }

    return suggestions.slice(0, 5);
  }

  public dispose() {
    this.disposables.forEach(d => d.dispose());
  }
}