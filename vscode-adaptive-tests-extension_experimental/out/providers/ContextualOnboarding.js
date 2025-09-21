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
exports.ContextualOnboarding = void 0;
const vscode = __importStar(require("vscode"));
/**
 * Contextual Onboarding - Provides nudges instead of modal dialogs
 * Shows help when and where developers need it most
 */
class ContextualOnboarding {
    constructor(context, smartTestProvider) {
        this.context = context;
        this.smartTestProvider = smartTestProvider;
        this.initializeOnboarding();
    }
    initializeOnboarding() {
        // Show contextual nudges based on user actions
        this.setupFileOpenListener();
        this.setupTestRunListener();
        this.setupRefactorListener();
        this.setupNewFileListener();
    }
    setupFileOpenListener() {
        // When opening a test file, show smart test nudge
        vscode.workspace.onDidOpenTextDocument((document) => {
            if (this.isTestFile(document.fileName) && !this.hasUserSeenNudge('test-file-nudge')) {
                this.showTestFileNudge(document);
            }
        });
    }
    setupTestRunListener() {
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
    setupRefactorListener() {
        // When refactoring (file rename, move), show auto-fix benefit
        vscode.workspace.onDidRenameFiles((event) => {
            const hasTestFiles = event.files.some(file => this.isTestFile(file.oldUri.fsPath));
            if (hasTestFiles && !this.hasUserSeenNudge('refactor-nudge')) {
                this.showRefactorNudge();
            }
        });
    }
    setupNewFileListener() {
        // When creating new files, suggest smart test creation
        vscode.workspace.onDidCreateFiles((event) => {
            const hasSourceFiles = event.files.some(file => this.isSourceFile(file.fsPath) && !this.isTestFile(file.fsPath));
            if (hasSourceFiles && !this.hasUserSeenNudge('new-file-nudge')) {
                this.showNewFileNudge();
            }
        });
    }
    showTestFileNudge(document) {
        const message = '💡 Smart Tests can make this test file auto-adapt to code changes';
        const action = 'Enable Smart Mode';
        vscode.window.showInformationMessage(message, action).then(selection => {
            if (selection === action) {
                this.smartTestProvider.enableSmartMode();
            }
            this.markNudgeAsSeen('test-file-nudge');
        });
    }
    showTestRunNudge() {
        const message = '🧪 Want tests that don\'t break when you refactor?';
        const action = 'Try Smart Tests';
        vscode.window.showInformationMessage(message, action).then(selection => {
            if (selection === action) {
                this.smartTestProvider.showSmartTestPanel();
            }
            this.markNudgeAsSeen('test-run-nudge');
        });
    }
    showRefactorNudge() {
        const message = '🔄 Just refactored? Smart Tests can auto-fix broken imports';
        const action = 'Enable Auto-Fix';
        vscode.window.showInformationMessage(message, action).then(selection => {
            if (selection === action) {
                this.smartTestProvider.enableSmartMode();
            }
            this.markNudgeAsSeen('refactor-nudge');
        });
    }
    showNewFileNudge() {
        const message = '📁 New file created! Want tests that adapt as your code grows?';
        const action = 'Create Smart Test';
        vscode.window.showInformationMessage(message, action).then(selection => {
            if (selection === action) {
                vscode.commands.executeCommand('adaptive-tests.scaffoldFile');
            }
            this.markNudgeAsSeen('new-file-nudge');
        });
    }
    isTestFile(fileName) {
        const testPatterns = [
            /\.test\.(js|ts|jsx|tsx)$/,
            /\.spec\.(js|ts|jsx|tsx)$/,
            /__tests__/,
            /\.test\.(py|java|php|go|rs)$/
        ];
        return testPatterns.some(pattern => pattern.test(fileName));
    }
    isSourceFile(fileName) {
        const sourcePatterns = [
            /\.(js|ts|jsx|tsx)$/,
            /\.(py|java|php|go|rs)$/,
            /\.(css|scss|less|html)$/
        ];
        return sourcePatterns.some(pattern => pattern.test(fileName)) && !this.isTestFile(fileName);
    }
    hasUserSeenNudge(nudgeId) {
        return this.context.globalState.get(`nudge.${nudgeId}`, false);
    }
    markNudgeAsSeen(nudgeId) {
        this.context.globalState.update(`nudge.${nudgeId}`, true);
    }
    /**
     * Show contextual help based on current context
     */
    showContextualHelp(context) {
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
    showSuccessNudge(fixCount) {
        if (fixCount > 0) {
            vscode.window.showInformationMessage(`✅ Smart Tests auto-fixed ${fixCount} broken import${fixCount > 1 ? 's' : ''}`, 'Thanks!', 'How does it work?').then(selection => {
                if (selection === 'How does it work?') {
                    this.smartTestProvider.showSmartTestPanel();
                }
            });
        }
    }
}
exports.ContextualOnboarding = ContextualOnboarding;
//# sourceMappingURL=ContextualOnboarding.js.map