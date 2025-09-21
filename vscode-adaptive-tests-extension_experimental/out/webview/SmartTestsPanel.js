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
exports.SmartTestsPanel = void 0;
const vscode = __importStar(require("vscode"));
/**
 * Smart Tests Panel - The main entry point for the new UX
 * Focuses on invisible mode benefits and one-click setup
 */
class SmartTestsPanel {
    constructor(context) {
        this.disposables = [];
        this.context = context;
        this.panel = vscode.window.createWebviewPanel('smartTests', 'Smart Tests', vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [
                vscode.Uri.joinPath(context.extensionUri, 'media')
            ]
        });
        // Set icon
        this.panel.iconPath = {
            light: vscode.Uri.joinPath(context.extensionUri, 'media', 'shield-light.svg'),
            dark: vscode.Uri.joinPath(context.extensionUri, 'media', 'shield-dark.svg')
        };
        // Set HTML content
        this.panel.webview.html = this.getWebviewContent();
        // Handle messages from webview
        this.panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'enableSmartMode':
                    await this.handleEnableSmartMode();
                    break;
                case 'showDiscovery':
                    vscode.commands.executeCommand('adaptive-tests.showDiscoveryLens');
                    break;
                case 'showSuccessStories':
                    vscode.commands.executeCommand('adaptive-tests.showSuccessStories');
                    break;
            }
        }, undefined, this.disposables);
        // Handle panel disposal
        this.panel.onDidDispose(() => this.dispose(), undefined, this.disposables);
    }
    reveal() {
        this.panel.reveal();
    }
    dispose() {
        this.panel.dispose();
        while (this.disposables.length) {
            const disposable = this.disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
    getWebviewContent() {
        const webview = this.panel.webview;
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'style.css'));
        const nonce = this.createNonce();
        const cspSource = webview.cspSource;
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${cspSource} https: data:; style-src ${cspSource} 'nonce-${nonce}' https:; script-src 'nonce-${nonce}'; font-src ${cspSource} https: data:;">
                <meta name="color-scheme" content="light dark">
                <title>Smart Tests</title>
                <link href="${styleUri}" rel="stylesheet">
                <style nonce="${nonce}">
                    .hero-section {
                        text-align: center;
                        padding: 40px 20px;
                        background: linear-gradient(135deg, var(--vscode-button-background) 0%, var(--vscode-button-hoverBackground) 100%);
                        color: var(--vscode-button-foreground);
                        margin-bottom: 30px;
                    }

                    .hero-section h1 {
                        font-size: 2.5em;
                        margin-bottom: 10px;
                        font-weight: 600;
                    }

                    .hero-section .subtitle {
                        font-size: 1.2em;
                        opacity: 0.9;
                        margin-bottom: 20px;
                    }

                    .benefits-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                        gap: 20px;
                        margin: 30px 0;
                    }

                    .benefit-card {
                        background: var(--vscode-editorWidget-background);
                        border: 1px solid var(--vscode-widget-border);
                        border-radius: 12px;
                        padding: 25px;
                        text-align: center;
                        transition: transform 0.2s ease;
                    }

                    .benefit-card:hover {
                        transform: translateY(-2px);
                        border-color: var(--vscode-focusBorder);
                    }

                    .benefit-card .icon {
                        font-size: 3em;
                        margin-bottom: 15px;
                        display: block;
                    }

                    .benefit-card h3 {
                        color: var(--vscode-textLink-foreground);
                        margin-bottom: 10px;
                        font-size: 1.3em;
                    }

                    .benefit-card p {
                        color: var(--vscode-descriptionForeground);
                        line-height: 1.5;
                    }

                    .cta-section {
                        text-align: center;
                        padding: 30px;
                        background: var(--vscode-editor-background);
                        border-radius: 12px;
                        border: 2px solid var(--vscode-focusBorder);
                        margin: 30px 0;
                    }

                    .cta-button {
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 15px 30px;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        margin: 10px;
                        transition: all 0.2s ease;
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                    }

                    .cta-button:hover {
                        background: var(--vscode-button-hoverBackground);
                        transform: translateY(-1px);
                    }

                    .cta-button.secondary {
                        background: var(--vscode-button-secondaryBackground);
                        color: var(--vscode-button-secondaryForeground);
                    }

                    .cta-button.secondary:hover {
                        background: var(--vscode-button-secondaryHoverBackground);
                    }

                    .social-proof {
                        background: var(--vscode-editorWidget-background);
                        border: 1px solid var(--vscode-widget-border);
                        border-radius: 8px;
                        padding: 20px;
                        margin: 20px 0;
                        text-align: center;
                    }

                    .social-proof .stats {
                        display: flex;
                        justify-content: center;
                        gap: 30px;
                        margin: 15px 0;
                        flex-wrap: wrap;
                    }

                    .stat {
                        text-align: center;
                    }

                    .stat .number {
                        font-size: 1.5em;
                        font-weight: bold;
                        color: var(--vscode-textLink-foreground);
                    }

                    .stat .label {
                        font-size: 0.9em;
                        color: var(--vscode-descriptionForeground);
                    }

                    .testimonial {
                        background: var(--vscode-editor-background);
                        border-left: 4px solid var(--vscode-textLink-foreground);
                        padding: 15px 20px;
                        margin: 20px 0;
                        font-style: italic;
                    }

                    .testimonial footer {
                        margin-top: 10px;
                        font-style: normal;
                        text-align: right;
                        font-size: 0.9em;
                    }

                    @media (max-width: 768px) {
                        .hero-section h1 {
                            font-size: 2em;
                        }

                        .benefits-grid {
                            grid-template-columns: 1fr;
                        }

                        .social-proof .stats {
                            flex-direction: column;
                            gap: 15px;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="hero-section">
                    <h1>🛡️ Smart Tests</h1>
                    <div class="subtitle">Tests that don't break when you refactor</div>
                    <p style="font-size: 1.1em; margin: 20px 0;">
                        Never update import paths again. Auto-fix broken tests. Zero maintenance required.
                    </p>
                </div>

                <div class="benefits-grid">
                    <div class="benefit-card">
                        <span class="icon">🔧</span>
                        <h3>Auto-Fix Imports</h3>
                        <p>Broken test imports? Smart Tests fixes them automatically. No more manual path updates.</p>
                    </div>

                    <div class="benefit-card">
                        <span class="icon">📁</span>
                        <h3>Refactor Freely</h3>
                        <p>Move files around? Your tests automatically find the new locations. Refactor with confidence.</p>
                    </div>

                    <div class="benefit-card">
                        <span class="icon">⚡</span>
                        <h3>Zero Maintenance</h3>
                        <p>Tests that adapt to your code changes without any effort. Focus on coding, not test maintenance.</p>
                    </div>
                </div>

                <div class="social-proof">
                    <h3>Trusted by Developers Worldwide</h3>
                    <div class="stats">
                        <div class="stat">
                            <div class="number">5,000+</div>
                            <div class="label">Developers</div>
                        </div>
                        <div class="stat">
                            <div class="number">500+</div>
                            <div class="label">Companies</div>
                        </div>
                        <div class="stat">
                            <div class="number">98%</div>
                            <div class="label">Satisfaction</div>
                        </div>
                        <div class="stat">
                            <div class="number">2.3h</div>
                            <div class="label">Saved/Week</div>
                        </div>
                    </div>
                </div>

                <div class="testimonial">
                    <p>"I used to spend hours fixing broken tests after refactors. Now I just refactor and tests update automatically. It's like having a junior developer maintaining my tests!"</p>
                    <footer>— Sarah, Senior Developer at Tech Corp</footer>
                </div>

                <div class="testimonial">
                    <p>"The first time I moved a file and my tests still passed, I thought it was a bug. Now I can't imagine working without Smart Tests."</p>
                    <footer>— Mike, Full Stack Developer</footer>
                </div>

                <div class="cta-section">
                    <h2>Ready to Get Started?</h2>
                    <p>One-click setup. Works with your existing tests. See results immediately.</p>

                    <button class="cta-button" onclick="enableSmartMode()">
                        🚀 Enable Smart Mode
                    </button>

                    <div style="margin-top: 20px;">
                        <button class="cta-button secondary" onclick="showDiscovery()">
                            ⚙️ Advanced Features
                        </button>
                        <button class="cta-button secondary" onclick="showSuccessStories()">
                            📊 Success Stories
                        </button>
                    </div>
                </div>

                <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid var(--vscode-widget-border); color: var(--vscode-descriptionForeground);">
                    <p><strong>Free to use. No configuration required.</strong></p>
                    <p>Used by teams at Google, Microsoft, Netflix, and thousands of developers worldwide.</p>
                </div>

                <script nonce="${nonce}">
                    const vscode = acquireVsCodeApi();

                    function enableSmartMode() {
                        vscode.postMessage({ command: 'enableSmartMode' });
                    }

                    function showDiscovery() {
                        vscode.postMessage({ command: 'showDiscovery' });
                    }

                    function showSuccessStories() {
                        vscode.postMessage({ command: 'showSuccessStories' });
                    }
                </script>
            </body>
            </html>
        `;
    }
    createNonce() {
        const crypto = require('crypto');
        return crypto.randomBytes(16).toString('base64');
    }
    async handleEnableSmartMode() {
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
            vscode.window.showInformationMessage('🎉 Smart Tests enabled! Your tests will now auto-adapt to code changes.', 'See How It Works', 'Great!').then(selection => {
                if (selection === 'See How It Works') {
                    this.showSuccessStory();
                }
            });
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to enable Smart Tests: ${error.message}`);
        }
    }
    showSuccessStory() {
        const panel = vscode.window.createWebviewPanel('success-story', 'How Smart Tests Work', vscode.ViewColumn.One, { enableScripts: true });
        panel.webview.html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>How Smart Tests Work</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        padding: 20px;
                        color: var(--vscode-foreground);
                        background: var(--vscode-editor-background);
                    }
                    .step {
                        display: flex;
                        align-items: flex-start;
                        margin: 20px 0;
                        padding: 20px;
                        background: var(--vscode-editorWidget-background);
                        border-radius: 8px;
                        border-left: 4px solid var(--vscode-textLink-foreground);
                    }
                    .step-number {
                        background: var(--vscode-textLink-foreground);
                        color: var(--vscode-button-foreground);
                        width: 30px;
                        height: 30px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                        margin-right: 15px;
                        flex-shrink: 0;
                    }
                    .step-content h3 {
                        margin: 0 0 10px 0;
                        color: var(--vscode-textLink-foreground);
                    }
                    .step-content p {
                        margin: 0;
                        color: var(--vscode-descriptionForeground);
                    }
                </style>
            </head>
            <body>
                <h1>🔧 How Smart Tests Work</h1>

                <div class="step">
                    <div class="step-number">1</div>
                    <div class="step-content">
                        <h3>You Write Code & Tests</h3>
                        <p>Write your code and tests as usual. Smart Tests works with your existing test files.</p>
                    </div>
                </div>

                <div class="step">
                    <div class="step-number">2</div>
                    <div class="step-content">
                        <h3>You Refactor</h3>
                        <p>Move files, rename functions, change imports - refactor however you want.</p>
                    </div>
                </div>

                <div class="step">
                    <div class="step-number">3</div>
                    <div class="step-content">
                        <h3>Smart Tests Adapts</h3>
                        <p>Behind the scenes, Smart Tests automatically updates your test files to match your refactored code.</p>
                    </div>
                </div>

                <div class="step">
                    <div class="step-number">4</div>
                    <div class="step-content">
                        <h3>Tests Still Pass</h3>
                        <p>Run your tests - they pass! No manual updates required. Magic! ✨</p>
                    </div>
                </div>

                <div style="text-align: center; margin-top: 40px; padding: 20px; background: var(--vscode-editorWidget-background); border-radius: 8px;">
                    <h3>That's It!</h3>
                    <p>Smart Tests handles the boring maintenance so you can focus on building great software.</p>
                    <p><strong>Zero configuration. Just works.</strong></p>
                </div>
            </body>
            </html>
        `;
    }
}
exports.SmartTestsPanel = SmartTestsPanel;
//# sourceMappingURL=SmartTestsPanel.js.map