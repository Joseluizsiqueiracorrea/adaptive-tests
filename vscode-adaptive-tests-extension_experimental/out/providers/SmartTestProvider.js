"use strict";
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
exports.SmartTestProvider = void 0;
const vscode = __importStar(require("vscode"));
/**
 * Smart Test Provider - Makes testing invisible and delightful
 * Focuses on auto-fixing broken imports and providing contextual guidance
 */
class SmartTestProvider {
    constructor(context) {
        this.context = context;
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.initializeSmartTestMode();
    }
    initializeSmartTestMode() {
        // Set up the smart test status bar
        this.statusBarItem.text = '$(shield-check) Smart Tests';
        this.statusBarItem.tooltip = 'Smart Tests: Auto-fix broken imports and never update test paths again';
        this.statusBarItem.command = 'adaptive-tests.showSmartTests';
        this.statusBarItem.show();
        // Register the smart test command
        const smartTestCommand = vscode.commands.registerCommand('adaptive-tests.showSmartTests', () => this.showSmartTestPanel());
        // Register enable smart mode command
        const enableSmartModeCommand = vscode.commands.registerCommand('adaptive-tests.enableSmartMode', () => this.enableSmartMode());
        this.context.subscriptions.push(this.statusBarItem, smartTestCommand, enableSmartModeCommand);
    }
    async showSmartTestPanel() {
        const panel = vscode.window.createWebviewPanel('smartTests', 'Smart Tests', vscode.ViewColumn.One, { enableScripts: true });
        panel.webview.html = this.getSmartTestWebviewContent();
        // Handle messages from webview
        panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'enableSmartMode':
                    await this.enableSmartMode();
                    break;
                case 'showDiscovery':
                    vscode.commands.executeCommand('adaptive-tests.showDiscoveryLens');
                    break;
            }
        });
    }
    getSmartTestWebviewContent() {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Smart Tests</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        padding: 20px;
                        color: var(--vscode-foreground);
                        background: var(--vscode-editor-background);
                    }
                    .hero {
                        text-align: center;
                        margin-bottom: 30px;
                    }
                    .hero h1 {
                        color: var(--vscode-textLink-foreground);
                        margin-bottom: 10px;
                    }
                    .features {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                        gap: 20px;
                        margin-bottom: 30px;
                    }
                    .feature {
                        padding: 20px;
                        background: var(--vscode-editorWidget-background);
                        border-radius: 8px;
                        border: 1px solid var(--vscode-widget-border);
                    }
                    .feature h3 {
                        color: var(--vscode-textLink-foreground);
                        margin-bottom: 10px;
                    }
                    .cta-button {
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 12px 24px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 16px;
                        margin: 10px;
                    }
                    .cta-button:hover {
                        background: var(--vscode-button-hoverBackground);
                    }
                </style>
            </head>
            <body>
                <div class="hero">
                    <h1>🛡️ Smart Tests</h1>
                    <p>Tests that don't break when you refactor</p>
                </div>

                <div class="features">
                    <div class="feature">
                        <h3>🔧 Auto-Fix Imports</h3>
                        <p>Broken test imports? Smart Tests fixes them automatically.</p>
                    </div>
                    <div class="feature">
                        <h3>📁 Never Update Paths</h3>
                        <p>Move files around? Your tests automatically find the new locations.</p>
                    </div>
                    <div class="feature">
                        <h3>⚡ Zero Maintenance</h3>
                        <p>Tests that adapt to your code changes without any effort.</p>
                    </div>
                </div>

                <div style="text-align: center;">
                    <button class="cta-button" onclick="enableSmartMode()">
                        Enable Smart Mode
                    </button>
                    <button class="cta-button" onclick="showDiscovery()">
                        Advanced Features
                    </button>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();

                    function enableSmartMode() {
                        vscode.postMessage({ command: 'enableSmartMode' });
                    }

                    function showDiscovery() {
                        vscode.postMessage({ command: 'showDiscovery' });
                    }
                </script>
            </body>
            </html>
        `;
    }
    async enableSmartMode() {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceRoot) {
            vscode.window.showErrorMessage('No workspace folder open');
            return;
        }
        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Enabling Smart Tests...',
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: 'Setting up auto-fix mode...' });
                // Enable invisible mode
                const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
                const { exec } = require('child_process');
                const { promisify } = require('util');
                const execAsync = promisify(exec);
                try {
                    await execAsync(`${npxCommand} adaptive-tests enable-invisible`, { cwd: workspaceRoot });
                    progress.report({ increment: 100, message: 'Smart Tests enabled!' });
                }
                catch (error) {
                    throw new Error('Failed to enable Smart Tests. Try running "npx adaptive-tests enable-invisible" manually.');
                }
            });
            vscode.window.showInformationMessage('🎉 Smart Tests enabled! Your tests will now auto-adapt to code changes.', 'See How It Works').then(selection => {
                if (selection === 'See How It Works') {
                    this.showSmartTestPanel();
                }
            });
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to enable Smart Tests: ${error.message}`);
        }
    }
    updateStatusBar(successCount = 0) {
        if (successCount > 0) {
            this.statusBarItem.text = `($(check) ${successCount}) Smart Tests`;
            this.statusBarItem.tooltip = `Smart Tests: ${successCount} auto-fixes applied`;
        }
        else {
            this.statusBarItem.text = '$(shield-check) Smart Tests';
            this.statusBarItem.tooltip = 'Smart Tests: Auto-fix broken imports and never update test paths again';
        }
    }
}
exports.SmartTestProvider = SmartTestProvider;
//# sourceMappingURL=SmartTestProvider.js.map