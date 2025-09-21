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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const util_1 = require("util");
const child_process_1 = require("child_process");
const DiscoveryLensAPIFactory_1 = require("./api/DiscoveryLensAPIFactory");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
async function activate(context) {
    console.log('Adaptive Tests extension is now active!');
    const apiFactory = DiscoveryLensAPIFactory_1.DiscoveryLensAPIFactory.getInstance();
    apiFactory.initialize(context);
    const showDiscoveryLensCommand = vscode.commands.registerCommand('adaptive-tests.showDiscoveryLens', () => {
        apiFactory.getDiscoveryLensAPI({ autoShow: true });
    });
    const scaffoldFileCommand = vscode.commands.registerCommand('adaptive-tests.scaffoldFile', async (uri) => {
        const { ScaffoldCommand } = await Promise.resolve().then(() => __importStar(require('./commands/ScaffoldCommand')));
        await new ScaffoldCommand().execute(uri);
    });
    const scaffoldBatchCommand = vscode.commands.registerCommand('adaptive-tests.scaffoldBatch', async (uri) => {
        const { BatchScaffoldCommand } = await Promise.resolve().then(() => __importStar(require('./commands/BatchScaffoldCommand')));
        await new BatchScaffoldCommand().execute(uri);
    });
    const openTestCommand = vscode.commands.registerCommand('adaptive-tests.openTest', async (uri) => {
        const { OpenTestCommand } = await Promise.resolve().then(() => __importStar(require('./commands/OpenTestCommand')));
        await new OpenTestCommand().execute(uri);
    });
    const runDiscoveryCommand = vscode.commands.registerCommand('adaptive-tests.runDiscovery', async (uri) => {
        try {
            const { DiscoveryCommand } = await Promise.resolve().then(() => __importStar(require('./commands/DiscoveryCommand')));
            await new DiscoveryCommand().execute(uri);
        }
        catch (error) {
            console.error('Discovery command failed:', error);
            const message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Discovery failed: ${message}`);
        }
    });
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = '$(search) Discovery Lens';
    statusBarItem.tooltip = 'Open Adaptive Tests Discovery Lens';
    statusBarItem.command = 'adaptive-tests.showDiscoveryLens';
    statusBarItem.show();
    context.subscriptions.push(showDiscoveryLensCommand, scaffoldFileCommand, scaffoldBatchCommand, openTestCommand, runDiscoveryCommand, statusBarItem);
    const [{ DiscoveryTreeProvider }, { AdaptiveTestsCodeLensProvider }] = await Promise.all([
        Promise.resolve().then(() => __importStar(require('./providers/DiscoveryTreeProvider'))),
        Promise.resolve().then(() => __importStar(require('./providers/CodeLensProvider')))
    ]);
    const discoveryTreeProvider = new DiscoveryTreeProvider();
    const treeDisposable = vscode.window.registerTreeDataProvider('adaptive-tests.discoveryView', discoveryTreeProvider);
    context.subscriptions.push(treeDisposable);
    const codeLensProvider = new AdaptiveTestsCodeLensProvider();
    const codeLensDisposable = vscode.languages.registerCodeLensProvider([
        { language: 'javascript' },
        { language: 'typescript' },
        { language: 'javascriptreact' },
        { language: 'typescriptreact' },
        { language: 'java' },
        { language: 'go' },
        { language: 'php' },
        { language: 'python' },
        { language: 'rust' }
    ], codeLensProvider);
    context.subscriptions.push(codeLensDisposable);
    void Promise.resolve().then(() => __importStar(require('./providers/SmartContextMenuProvider'))).then(({ SmartContextMenuProvider, TestContextProvider }) => {
        const smartMenuProvider = new SmartContextMenuProvider();
        smartMenuProvider.registerCommands(context);
        TestContextProvider.getInstance().startWatching(context);
    })
        .catch(error => {
        console.error('Failed to initialize smart context menu provider:', error);
    });
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? null;
    if (workspaceRoot) {
        setTimeout(() => {
            setupInvisibleIntegration(workspaceRoot, context, statusBarItem).catch(error => {
                console.error('Failed to integrate invisible mode:', error);
            });
        }, 1000);
    }
    const hasShownWelcome = context.globalState.get('hasShownWelcome', false);
    if (!hasShownWelcome) {
        vscode.window
            .showInformationMessage('Welcome to Adaptive Tests! Click the Discovery Lens button in the status bar to start exploring.', 'Open Discovery Lens', 'Later')
            .then(selection => {
            if (selection === 'Open Discovery Lens') {
                vscode.commands.executeCommand('adaptive-tests.showDiscoveryLens');
            }
            context.globalState.update('hasShownWelcome', true);
        });
    }
    // Export API for cross-extension communication
    return {
        getDiscoveryLensAPI: DiscoveryLensAPIFactory_1.getDiscoveryLensAPI,
        getDiscoveryEngine: async () => {
            try {
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (workspaceFolder) {
                    const adaptiveTests = require('adaptive-tests');
                    return adaptiveTests.getDiscoveryEngine(workspaceFolder);
                }
            }
            catch (error) {
                console.error('Failed to load discovery engine:', error);
            }
            return null;
        }
    };
}
async function setupInvisibleIntegration(workspaceRoot, context, statusBarItem) {
    await maybePromptForInvisibleEnable(workspaceRoot, context);
    setupInvisibleHistoryWatcher(workspaceRoot, context, statusBarItem);
}
async function maybePromptForInvisibleEnable(workspaceRoot, context) {
    const workspaceUri = vscode.Uri.file(workspaceRoot);
    const markerUri = vscode.Uri.joinPath(workspaceUri, '.adaptive-tests', 'invisible-enabled.json');
    const promptedKey = 'adaptive-tests.promptedInvisible';
    if (await fileExists(markerUri)) {
        return;
    }
    if (context.workspaceState.get(promptedKey)) {
        return;
    }
    const selection = await vscode.window.showInformationMessage('Adaptive Tests invisible mode can automatically repair broken imports. Enable it now?', 'Enable Invisible Mode', 'Not Now');
    if (selection === 'Enable Invisible Mode') {
        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Enabling Adaptive Tests invisible mode...'
            }, async () => {
                const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
                await execAsync(`${npxCommand} adaptive-tests enable-invisible`, { cwd: workspaceRoot });
            });
            vscode.window.showInformationMessage('Adaptive Tests invisible mode enabled. Break an import and rerun your tests to see it in action.');
        }
        catch (error) {
            vscode.window.showErrorMessage('Failed to enable invisible mode. Run "npx adaptive-tests enable-invisible" manually for more details.');
        }
    }
    context.workspaceState.update(promptedKey, true);
}
function setupInvisibleHistoryWatcher(workspaceRoot, context, statusBarItem) {
    const historyPattern = new vscode.RelativePattern(workspaceRoot, '.adaptive-tests/invisible-history.json');
    const watcher = vscode.workspace.createFileSystemWatcher(historyPattern);
    const refresh = () => refreshInvisibleHistory(workspaceRoot, statusBarItem, context);
    watcher.onDidChange(refresh, undefined, context.subscriptions);
    watcher.onDidCreate(refresh, undefined, context.subscriptions);
    watcher.onDidDelete(() => clearInvisibleStatus(statusBarItem), undefined, context.subscriptions);
    context.subscriptions.push(watcher);
    refresh();
}
function clearInvisibleStatus(statusBarItem) {
    statusBarItem.text = '$(search) Discovery Lens';
    statusBarItem.tooltip = 'Open Adaptive Tests Discovery Lens';
}
async function refreshInvisibleHistory(workspaceRoot, statusBarItem, context) {
    const workspaceUri = vscode.Uri.file(workspaceRoot);
    const historyUri = vscode.Uri.joinPath(workspaceUri, '.adaptive-tests', 'invisible-history.json');
    if (!(await fileExists(historyUri))) {
        clearInvisibleStatus(statusBarItem);
        return;
    }
    try {
        const fileContents = await vscode.workspace.fs.readFile(historyUri);
        const history = JSON.parse(Buffer.from(fileContents).toString('utf8'));
        if (!Array.isArray(history) || history.length === 0) {
            clearInvisibleStatus(statusBarItem);
            return;
        }
        const latest = history[0];
        const lastTimestamp = context.workspaceState.get('adaptive-tests.lastInvisibleNotification');
        statusBarItem.text = '$(zap) Adaptive Tests';
        statusBarItem.tooltip = latest?.suggestion
            ? `Invisible mode recovered ${history.length} modules (latest: ${latest.suggestion})`
            : 'Adaptive Tests invisible mode is active';
        if (latest?.timestamp && latest.timestamp !== lastTimestamp) {
            const recent = history
                .slice(0, 3)
                .map((entry) => entry.suggestion || entry.modulePath)
                .filter(Boolean)
                .join(', ');
            if (recent) {
                vscode.window
                    .showInformationMessage(`Adaptive Tests invisible mode recovered: ${recent}.`, 'Open Invisible History')
                    .then(selection => {
                    if (selection === 'Open Invisible History') {
                        openInvisibleHistory(historyUri);
                    }
                });
            }
            context.workspaceState.update('adaptive-tests.lastInvisibleNotification', latest.timestamp);
        }
    }
    catch (error) {
        console.error('Failed to read invisible history:', error);
        clearInvisibleStatus(statusBarItem);
    }
}
async function openInvisibleHistory(historyUri) {
    try {
        const document = await vscode.workspace.openTextDocument(historyUri);
        await vscode.window.showTextDocument(document, { preview: false });
    }
    catch (error) {
        vscode.window.showErrorMessage('Unable to open invisible history file.');
    }
}
async function fileExists(uri) {
    try {
        await vscode.workspace.fs.stat(uri);
        return true;
    }
    catch {
        return false;
    }
}
function deactivate() {
    DiscoveryLensAPIFactory_1.DiscoveryLensAPIFactory.getInstance().dispose();
}
//# sourceMappingURL=extension.js.map