/**
 * Interactive Onboarding Flow
 * Premium first-run experience with guided tour and sample workspace
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { Logger } from '../core/logger';
import { TelemetryService } from '../services/TelemetryService';
import { ConfigService } from '../services/ConfigService';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  action?: () => Promise<void>;
  highlight?: string; // UI element to highlight
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  skippable?: boolean;
}

export class OnboardingFlow implements vscode.Disposable {
  private currentStep = 0;
  private steps: OnboardingStep[] = [];
  private disposables: vscode.Disposable[] = [];
  private sampleWorkspacePath?: string;
  private completionCallback?: () => void;

  constructor(
    private logger: Logger,
    private telemetry: TelemetryService,
    private config: ConfigService,
    private context: vscode.ExtensionContext
  ) {
    this.initializeSteps();
  }

  private initializeSteps() {
    this.steps = [
      {
        id: 'welcome',
        title: '🎉 Welcome to Adaptive Tests!',
        description: 'Let\'s take a quick tour to help you discover the power of adaptive testing. This will only take 2 minutes.',
        action: async () => {
          await this.showWelcomeAnimation();
          this.telemetry.trackFeature('onboarding', 'started');
        }
      },
      {
        id: 'create-sample',
        title: '📁 Creating Sample Project',
        description: 'We\'ll create a sample project to demonstrate the features. Feel free to explore!',
        action: async () => {
          await this.createSampleWorkspace();
          await this.openSampleWorkspace();
        }
      },
      {
        id: 'discovery-lens',
        title: '🔍 Discovery Lens',
        description: 'The Discovery Lens helps you find code elements across your entire codebase using AI-powered pattern matching.',
        highlight: 'statusBar.adaptive-tests',
        action: async () => {
          await vscode.commands.executeCommand('adaptive-tests.showDiscoveryLens');
          await this.waitForUserInteraction();
        }
      },
      {
        id: 'try-discovery',
        title: '🚀 Try Discovery',
        description: 'Let\'s discover the Calculator class in our sample project. Type "Calculator" in the signature field and click "Run Discovery".',
        action: async () => {
          await this.demonstrateDiscovery();
        }
      },
      {
        id: 'scaffold-test',
        title: '🧪 Scaffold Adaptive Tests',
        description: 'Right-click on any source file to scaffold adaptive tests. These tests automatically adapt when your code changes!',
        highlight: 'explorer',
        action: async () => {
          await this.demonstrateScaffolding();
        }
      },
      {
        id: 'codelens',
        title: '👁️ CodeLens Integration',
        description: 'See test coverage and quick actions directly in your code with our CodeLens integration.',
        action: async () => {
          await this.showCodeLensExample();
        }
      },
      {
        id: 'ai-features',
        title: '🤖 AI-Powered Features',
        description: 'Enable AI features for smart test generation, assertion suggestions, and automatic test updates.',
        action: async () => {
          await this.configureAIFeatures();
        }
      },
      {
        id: 'keyboard-shortcuts',
        title: '⌨️ Keyboard Shortcuts',
        description: 'Master these shortcuts for maximum productivity:\n\n• Cmd+Shift+D: Open Discovery Lens\n• Cmd+Shift+T: Scaffold test for current file\n• Cmd+K Cmd+T: Run adaptive tests',
        skippable: true
      },
      {
        id: 'customize',
        title: '⚙️ Customize Your Experience',
        description: 'Configure Adaptive Tests to match your workflow.',
        action: async () => {
          await this.showSettings();
        }
      },
      {
        id: 'complete',
        title: '✨ You\'re All Set!',
        description: 'You\'ve completed the onboarding! Here are some resources to help you get the most out of Adaptive Tests:\n\n• [Documentation](https://adaptive-tests.dev/docs)\n• [Video Tutorials](https://adaptive-tests.dev/tutorials)\n• [Discord Community](https://discord.gg/adaptive-tests)',
        action: async () => {
          await this.completeOnboarding();
        }
      }
    ];
  }

  public async start(): Promise<void> {
    // Check if onboarding was already completed
    const hasCompletedOnboarding = this.context.globalState.get('onboarding.completed', false);
    if (hasCompletedOnboarding && !this.shouldRepeatOnboarding()) {
      return;
    }

    // Show initial prompt
    const choice = await vscode.window.showInformationMessage(
      'Welcome to Adaptive Tests! Would you like a quick tour of the features?',
      { modal: false },
      'Start Tour (2 min)',
      'Skip Tour',
      'Remind Me Later'
    );

    if (choice === 'Skip Tour') {
      await this.skipOnboarding();
      return;
    } else if (choice === 'Remind Me Later') {
      await this.scheduleReminder();
      return;
    }

    // Start the onboarding flow
    await this.runStep(0);
  }

  private async runStep(stepIndex: number): Promise<void> {
    if (stepIndex >= this.steps.length) {
      await this.completeOnboarding();
      return;
    }

    const step = this.steps[stepIndex];
    this.currentStep = stepIndex;

    // Create progress indicator
    const progress = `Step ${stepIndex + 1}/${this.steps.length}`;

    // Show step dialog
    const buttons: string[] = [];
    if (stepIndex > 0) buttons.push('Previous');
    if (step.skippable) buttons.push('Skip');
    buttons.push(stepIndex < this.steps.length - 1 ? 'Next' : 'Finish');

    const choice = await vscode.window.showInformationMessage(
      `${step.title}\n\n${step.description}\n\n${progress}`,
      { modal: true },
      ...buttons
    );

    // Execute step action
    if (step.action && choice !== 'Skip') {
      try {
        await step.action();
      } catch (error) {
        this.logger.error('Onboarding step failed', error as Error);
        vscode.window.showErrorMessage(`Step failed: ${error}`);
      }
    }

    // Track progress
    this.telemetry.trackFeature('onboarding', 'step_completed', {
      step: step.id,
      stepIndex,
      choice
    });

    // Handle navigation
    if (choice === 'Previous') {
      await this.runStep(stepIndex - 1);
    } else if (choice === 'Skip' || choice === 'Next') {
      await this.runStep(stepIndex + 1);
    } else if (choice === 'Finish') {
      await this.completeOnboarding();
    }
  }

  private async showWelcomeAnimation(): Promise<void> {
    // Show animated welcome screen
    const panel = vscode.window.createWebviewPanel(
      'adaptiveTestsWelcome',
      'Welcome to Adaptive Tests',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'media')]
      }
    );

    panel.webview.html = this.getWelcomeHTML(panel.webview);

    // Auto-close after 3 seconds
    setTimeout(() => {
      panel.dispose();
    }, 3000);
  }

  private getWelcomeHTML(webview: vscode.Webview): string {
    return `<!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .welcome {
          text-align: center;
          color: white;
          animation: fadeInScale 1s ease-out;
        }
        .logo {
          font-size: 100px;
          margin-bottom: 20px;
          animation: bounce 2s infinite;
        }
        h1 {
          font-size: 48px;
          margin: 20px 0;
          font-weight: 300;
        }
        p {
          font-size: 20px;
          opacity: 0.9;
        }
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
      </style>
    </head>
    <body>
      <div class="welcome">
        <div class="logo">🚀</div>
        <h1>Welcome to Adaptive Tests</h1>
        <p>Your journey to resilient testing starts here</p>
      </div>
    </body>
    </html>`;
  }

  private async createSampleWorkspace(): Promise<void> {
    const workspacePath = path.join(
      require('os').tmpdir(),
      'adaptive-tests-sample',
      Date.now().toString()
    );

    this.sampleWorkspacePath = workspacePath;
    await fs.mkdir(workspacePath, { recursive: true });

    // Create sample files
    const sampleFiles = [
      {
        path: 'src/Calculator.js',
        content: `// Sample Calculator class for demonstration
export class Calculator {
  constructor() {
    this.history = [];
  }

  add(a, b) {
    const result = a + b;
    this.history.push({ operation: 'add', a, b, result });
    return result;
  }

  subtract(a, b) {
    const result = a - b;
    this.history.push({ operation: 'subtract', a, b, result });
    return result;
  }

  multiply(a, b) {
    const result = a * b;
    this.history.push({ operation: 'multiply', a, b, result });
    return result;
  }

  divide(a, b) {
    if (b === 0) {
      throw new Error('Division by zero');
    }
    const result = a / b;
    this.history.push({ operation: 'divide', a, b, result });
    return result;
  }

  getHistory() {
    return [...this.history];
  }

  clearHistory() {
    this.history = [];
  }
}`
      },
      {
        path: 'src/StringUtils.js',
        content: `// String utility functions
export class StringUtils {
  static capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  static reverse(str) {
    return str.split('').reverse().join('');
  }

  static isPalindrome(str) {
    const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, '');
    return cleaned === this.reverse(cleaned);
  }

  static wordCount(str) {
    return str.trim().split(/\\s+/).filter(word => word.length > 0).length;
  }
}`
      },
      {
        path: 'src/UserService.js',
        content: `// User management service
export class UserService {
  constructor() {
    this.users = new Map();
  }

  async createUser(userData) {
    const id = this.generateId();
    const user = {
      id,
      ...userData,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async getUser(id) {
    return this.users.get(id) || null;
  }

  async updateUser(id, updates) {
    const user = this.users.get(id);
    if (!user) {
      throw new Error('User not found');
    }
    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  async deleteUser(id) {
    return this.users.delete(id);
  }

  generateId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}`
      },
      {
        path: 'package.json',
        content: JSON.stringify({
          name: 'adaptive-tests-sample',
          version: '1.0.0',
          description: 'Sample project for Adaptive Tests onboarding',
          type: 'module',
          scripts: {
            test: 'adaptive-tests test'
          }
        }, null, 2)
      },
      {
        path: 'README.md',
        content: `# Adaptive Tests Sample Project

This is a sample project created for your Adaptive Tests onboarding experience.

## Files Included

- **Calculator.js**: A simple calculator class with basic arithmetic operations
- **StringUtils.js**: Utility functions for string manipulation
- **UserService.js**: A basic user management service

## Try These Features

1. **Discovery Lens**: Search for "Calculator" or "User" to find related code
2. **Scaffold Tests**: Right-click on any .js file to generate adaptive tests
3. **CodeLens**: Open any file to see inline test suggestions

## Next Steps

- Explore the Discovery Lens (Cmd+Shift+D)
- Generate tests for the Calculator class
- Try modifying the code and watch tests adapt

Happy testing! 🚀`
      }
    ];

    for (const file of sampleFiles) {
      const filePath = path.join(workspacePath, file.path);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, file.content);
    }

    this.logger.info('Sample workspace created', { path: workspacePath });
  }

  private async openSampleWorkspace(): Promise<void> {
    if (!this.sampleWorkspacePath) return;

    const uri = vscode.Uri.file(this.sampleWorkspacePath);
    await vscode.commands.executeCommand('vscode.openFolder', uri, { forceNewWindow: false });
  }

  private async demonstrateDiscovery(): Promise<void> {
    // Send discovery command with Calculator signature
    await vscode.commands.executeCommand('adaptive-tests.showDiscoveryLens');

    // Wait a bit for UI to load
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Send message to webview to populate signature
    const panel = (global as any).discoveryLensPanel;
    if (panel) {
      panel.webview.postMessage({
        command: 'setSignature',
        signature: JSON.stringify({
          name: 'Calculator',
          type: 'class',
          methods: ['add', 'subtract', 'multiply', 'divide']
        }, null, 2)
      });

      // Auto-run discovery after a delay
      setTimeout(() => {
        panel.webview.postMessage({ command: 'runDiscovery' });
      }, 2000);
    }
  }

  private async demonstrateScaffolding(): Promise<void> {
    // Open Calculator.js
    const calculatorPath = path.join(this.sampleWorkspacePath!, 'src', 'Calculator.js');
    const doc = await vscode.workspace.openTextDocument(calculatorPath);
    await vscode.window.showTextDocument(doc);

    // Show scaffold command
    await vscode.commands.executeCommand('adaptive-tests.scaffoldFile', vscode.Uri.file(calculatorPath));
  }

  private async showCodeLensExample(): Promise<void> {
    // Ensure CodeLens is enabled
    const config = vscode.workspace.getConfiguration('editor');
    await config.update('codeLens', true, vscode.ConfigurationTarget.Global);

    // Open a file to show CodeLens
    if (this.sampleWorkspacePath) {
      const filePath = path.join(this.sampleWorkspacePath, 'src', 'StringUtils.js');
      const doc = await vscode.workspace.openTextDocument(filePath);
      await vscode.window.showTextDocument(doc);
    }
  }

  private async configureAIFeatures(): Promise<void> {
    const enableAI = await vscode.window.showQuickPick(
      ['Yes, enable AI features', 'Maybe later'],
      {
        placeHolder: 'Would you like to enable AI-powered features?',
        title: 'AI Configuration'
      }
    );

    if (enableAI === 'Yes, enable AI features') {
      await this.config.update('discovery', {
        ...this.config.get('discovery'),
        enableAI: true
      });

      await this.config.update('scaffold', {
        ...this.config.get('scaffold'),
        useAIAssertions: true
      });

      vscode.window.showInformationMessage('AI features enabled! You can configure them in settings.');
    }
  }

  private async showSettings(): Promise<void> {
    await vscode.commands.executeCommand('workbench.action.openSettings', 'adaptive-tests');
  }

  private async waitForUserInteraction(timeout: number = 5000): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, timeout));
  }

  private async completeOnboarding(): Promise<void> {
    await this.context.globalState.update('onboarding.completed', true);
    await this.context.globalState.update('onboarding.completedAt', Date.now());

    this.telemetry.trackFeature('onboarding', 'completed', {
      steps: this.currentStep + 1,
      totalSteps: this.steps.length
    });

    // Show completion message with confetti
    vscode.window.showInformationMessage(
      '🎉 Congratulations! You\'ve completed the Adaptive Tests onboarding!',
      'Open Discovery Lens',
      'View Documentation'
    ).then(choice => {
      if (choice === 'Open Discovery Lens') {
        vscode.commands.executeCommand('adaptive-tests.showDiscoveryLens');
      } else if (choice === 'View Documentation') {
        vscode.env.openExternal(vscode.Uri.parse('https://adaptive-tests.dev/docs'));
      }
    });

    // Clean up sample workspace after a delay
    if (this.sampleWorkspacePath) {
      setTimeout(async () => {
        try {
          await fs.rmdir(this.sampleWorkspacePath!, { recursive: true });
        } catch {
          // Ignore cleanup errors
        }
      }, 60000); // Clean up after 1 minute
    }

    this.completionCallback?.();
  }

  private async skipOnboarding(): Promise<void> {
    await this.context.globalState.update('onboarding.skipped', true);
    this.telemetry.trackFeature('onboarding', 'skipped');
  }

  private async scheduleReminder(): Promise<void> {
    await this.context.globalState.update('onboarding.remindAt', Date.now() + 24 * 60 * 60 * 1000);
    this.telemetry.trackFeature('onboarding', 'postponed');
  }

  private shouldRepeatOnboarding(): boolean {
    // Check if major version changed
    const lastVersion = this.context.globalState.get<string>('lastVersion');
    const currentVersion = this.context.extension.packageJSON.version;

    if (lastVersion && lastVersion.split('.')[0] !== currentVersion.split('.')[0]) {
      return true; // Major version change
    }

    // Check if reminder time has passed
    const remindAt = this.context.globalState.get<number>('onboarding.remindAt');
    if (remindAt && Date.now() > remindAt) {
      return true;
    }

    return false;
  }

  public onComplete(callback: () => void): void {
    this.completionCallback = callback;
  }

  public dispose(): void {
    this.disposables.forEach(d => d.dispose());
  }
}