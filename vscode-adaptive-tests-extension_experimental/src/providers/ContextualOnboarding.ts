import * as vscode from 'vscode';

/**
 * Contextual Onboarding - Provides nudges instead of modal dialogs
 * Shows help when and where developers need it most
 */
export class ContextualOnboarding {
    private context: vscode.ExtensionContext;
    private smartTestProvider: any;

    constructor(context: vscode.ExtensionContext, smartTestProvider: any) {
        this.context = context;
        this.smartTestProvider = smartTestProvider;
        this.initializeOnboarding();
    }

    private initializeOnboarding() {
        // Show contextual nudges based on user actions
        this.setupFileOpenListener();
        this.setupTestRunListener();
        this.setupRefactorListener();
        this.setupNewFileListener();
    }

    private setupFileOpenListener() {
        // When opening a test file, show smart test nudge
        vscode.workspace.onDidOpenTextDocument((document) => {
            if (this.isTestFile(document.fileName) && !this.hasUserSeenNudge('test-file-nudge')) {
                this.showTestFileNudge(document);
            }
        });
    }

    private setupTestRunListener() {
        // When running tests, show smart mode suggestion
        const testController = vscode.tests.createTestController('smart-tests', 'Smart Tests');
        this.context.subscriptions.push(testController);

        // Listen for test runs
        vscode.commands.registerCommand('testing.runAtCursor', () => {
            if (!this.hasUserSeenNudge('test-run-nudge')) {
                setTimeout(() => this.showTestRunNudge(), 1000);
            }
        });
    }

    private setupRefactorListener() {
        // When refactoring (file rename, move), show auto-fix benefit
        vscode.workspace.onDidRenameFiles((event) => {
            const hasTestFiles = event.files.some(file => this.isTestFile(file.oldUri.fsPath));
            if (hasTestFiles && !this.hasUserSeenNudge('refactor-nudge')) {
                this.showRefactorNudge();
            }
        });
    }

    private setupNewFileListener() {
        // When creating new files, suggest smart test creation
        vscode.workspace.onDidCreateFiles((event) => {
            const hasSourceFiles = event.files.some(file =>
                this.isSourceFile(file.fsPath) && !this.isTestFile(file.fsPath)
            );
            if (hasSourceFiles && !this.hasUserSeenNudge('new-file-nudge')) {
                this.showNewFileNudge();
            }
        });
    }

    private showTestFileNudge(document: vscode.TextDocument) {
        const message = '💡 Smart Tests can make this test file auto-adapt to code changes';
        const action = 'Enable Smart Mode';

        vscode.window.showInformationMessage(message, action).then(selection => {
            if (selection === action) {
                this.smartTestProvider.enableSmartMode();
            }
            this.markNudgeAsSeen('test-file-nudge');
        });
    }

    private showTestRunNudge() {
        const message = '🧪 Want tests that don\'t break when you refactor?';
        const action = 'Try Smart Tests';

        vscode.window.showInformationMessage(message, action).then(selection => {
            if (selection === action) {
                this.smartTestProvider.showSmartTestPanel();
            }
            this.markNudgeAsSeen('test-run-nudge');
        });
    }

    private showRefactorNudge() {
        const message = '🔄 Just refactored? Smart Tests can auto-fix broken imports';
        const action = 'Enable Auto-Fix';

        vscode.window.showInformationMessage(message, action).then(selection => {
            if (selection === action) {
                this.smartTestProvider.enableSmartMode();
            }
            this.markNudgeAsSeen('refactor-nudge');
        });
    }

    private showNewFileNudge() {
        const message = '📁 New file created! Want tests that adapt as your code grows?';
        const action = 'Create Smart Test';

        vscode.window.showInformationMessage(message, action).then(selection => {
            if (selection === action) {
                vscode.commands.executeCommand('adaptive-tests.scaffoldFile');
            }
            this.markNudgeAsSeen('new-file-nudge');
        });
    }

    private isTestFile(fileName: string): boolean {
        const testPatterns = [
            /\.test\.(js|ts|jsx|tsx)$/,
            /\.spec\.(js|ts|jsx|tsx)$/,
            /__tests__/,
            /\.test\.(py|java|php|go|rs)$/
        ];

        return testPatterns.some(pattern => pattern.test(fileName));
    }

    private isSourceFile(fileName: string): boolean {
        const sourcePatterns = [
            /\.(js|ts|jsx|tsx)$/,
            /\.(py|java|php|go|rs)$/,
            /\.(css|scss|less|html)$/
        ];

        return sourcePatterns.some(pattern => pattern.test(fileName)) && !this.isTestFile(fileName);
    }

    private hasUserSeenNudge(nudgeId: string): boolean {
        return this.context.globalState.get(`nudge.${nudgeId}`, false);
    }

    private markNudgeAsSeen(nudgeId: string) {
        this.context.globalState.update(`nudge.${nudgeId}`, true);
    }

    /**
     * Show contextual help based on current context
     */
    public showContextualHelp(context: 'test-file' | 'refactor' | 'new-file' | 'general'): void {
        const helpMessages = {
            'test-file': {
                message: '💡 Tip: Smart Tests can make this test auto-adapt to code changes',
                action: 'Learn More'
            },
            'refactor': {
                message: '🔄 Smart Tests auto-fix broken imports when you refactor',
                action: 'Enable Auto-Fix'
            },
            'new-file': {
                message: '📁 Smart Tests grow with your codebase automatically',
                action: 'Create Smart Test'
            },
            'general': {
                message: '🛡️ Smart Tests: Tests that don\'t break when you refactor',
                action: 'Get Started'
            }
        };

        const help = helpMessages[context];
        vscode.window.showInformationMessage(help.message, help.action).then(selection => {
            if (selection === help.action) {
                switch (context) {
                    case 'test-file':
                    case 'refactor':
                        this.smartTestProvider.enableSmartMode();
                        break;
                    case 'new-file':
                        vscode.commands.executeCommand('adaptive-tests.scaffoldFile');
                        break;
                    case 'general':
                        this.smartTestProvider.showSmartTestPanel();
                        break;
                }
            }
        });
    }

    /**
     * Show success nudge when auto-fix happens
     */
    public showSuccessNudge(fixCount: number) {
        if (fixCount > 0) {
            vscode.window.showInformationMessage(
                `✅ Smart Tests auto-fixed ${fixCount} broken import${fixCount > 1 ? 's' : ''}`,
                'Thanks!',
                'How does it work?'
            ).then(selection => {
                if (selection === 'How does it work?') {
                    this.smartTestProvider.showSmartTestPanel();
                }
            });
        }
    }
}