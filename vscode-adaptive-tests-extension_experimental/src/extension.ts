import * as vscode from 'vscode';
import { promisify } from 'util';
import { exec } from 'child_process';
import { DiscoveryLensAPIFactory, getDiscoveryLensAPI } from './api/DiscoveryLensAPIFactory';

const execAsync = promisify(exec);

export async function activate(context: vscode.ExtensionContext) {
    console.log('Adaptive Tests extension is now active!');

    const apiFactory = DiscoveryLensAPIFactory.getInstance();
    apiFactory.initialize(context);

    const showDiscoveryLensCommand = vscode.commands.registerCommand('adaptive-tests.showDiscoveryLens', () => {
        apiFactory.getDiscoveryLensAPI({ autoShow: true });
    });

    const scaffoldFileCommand = vscode.commands.registerCommand(
        'adaptive-tests.scaffoldFile',
        async (uri: vscode.Uri) => {
            const { ScaffoldCommand } = await import('./commands/ScaffoldCommand');
            await new ScaffoldCommand().execute(uri);
        }
    );

    const scaffoldBatchCommand = vscode.commands.registerCommand(
        'adaptive-tests.scaffoldBatch',
        async (uri: vscode.Uri) => {
            const { BatchScaffoldCommand } = await import('./commands/BatchScaffoldCommand');
            await new BatchScaffoldCommand().execute(uri);
        }
    );

    const openTestCommand = vscode.commands.registerCommand(
        'adaptive-tests.openTest',
        async (uri: vscode.Uri) => {
            const { OpenTestCommand } = await import('./commands/OpenTestCommand');
            await new OpenTestCommand().execute(uri);
        }
    );

    const runDiscoveryCommand = vscode.commands.registerCommand(
        'adaptive-tests.runDiscovery',
        async (uri: vscode.Uri) => {
            try {
                const { DiscoveryCommand } = await import('./commands/DiscoveryCommand');
                await new DiscoveryCommand().execute(uri);
            } catch (error) {
                console.error('Discovery command failed:', error);
                const message = error instanceof Error ? error.message : String(error);
                vscode.window.showErrorMessage(`Discovery failed: ${message}`);
            }
        }
    );

    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = '$(search) Discovery Lens';
    statusBarItem.tooltip = 'Open Adaptive Tests Discovery Lens';
    statusBarItem.command = 'adaptive-tests.showDiscoveryLens';
    statusBarItem.show();

    context.subscriptions.push(
        showDiscoveryLensCommand,
        scaffoldFileCommand,
        scaffoldBatchCommand,
        openTestCommand,
        runDiscoveryCommand,
        statusBarItem
    );

    const [{ DiscoveryTreeProvider }, { AdaptiveTestsCodeLensProvider }] = await Promise.all([
        import('./providers/DiscoveryTreeProvider'),
        import('./providers/CodeLensProvider')
    ]);

    const discoveryTreeProvider = new DiscoveryTreeProvider();
    const treeDisposable = vscode.window.registerTreeDataProvider('adaptive-tests.discoveryView', discoveryTreeProvider);
    context.subscriptions.push(treeDisposable);

    const codeLensProvider = new AdaptiveTestsCodeLensProvider();
    const codeLensDisposable = vscode.languages.registerCodeLensProvider(
        [
            { language: 'javascript' },
            { language: 'typescript' },
            { language: 'javascriptreact' },
            { language: 'typescriptreact' },
            { language: 'java' },
            { language: 'go' },
            { language: 'php' },
            { language: 'python' },
            { language: 'rust' }
        ],
        codeLensProvider
    );
    context.subscriptions.push(codeLensDisposable);

    void import('./providers/SmartContextMenuProvider')
        .then(({ SmartContextMenuProvider, TestContextProvider }) => {
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
            .showInformationMessage(
                'Welcome to Adaptive Tests! Click the Discovery Lens button in the status bar to start exploring.',
                'Open Discovery Lens',
                'Later'
            )
            .then(selection => {
                if (selection === 'Open Discovery Lens') {
                    vscode.commands.executeCommand('adaptive-tests.showDiscoveryLens');
                }
                context.globalState.update('hasShownWelcome', true);
            });
    }

    // Export API for cross-extension communication
    return {
        getDiscoveryLensAPI,
        getDiscoveryEngine: async () => {
            try {
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (workspaceFolder) {
                    const adaptiveTests = require('adaptive-tests');
                    return adaptiveTests.getDiscoveryEngine(workspaceFolder);
                }
            } catch (error) {
                console.error('Failed to load discovery engine:', error);
            }
            return null;
        }
    };
}

async function setupInvisibleIntegration(
    workspaceRoot: string,
    context: vscode.ExtensionContext,
    statusBarItem: vscode.StatusBarItem
) {
    await maybePromptForInvisibleEnable(workspaceRoot, context);
    setupInvisibleHistoryWatcher(workspaceRoot, context, statusBarItem);
}

async function maybePromptForInvisibleEnable(workspaceRoot: string, context: vscode.ExtensionContext) {
    const workspaceUri = vscode.Uri.file(workspaceRoot);
    const markerUri = vscode.Uri.joinPath(workspaceUri, '.adaptive-tests', 'invisible-enabled.json');
    const promptedKey = 'adaptive-tests.promptedInvisible';

    if (await fileExists(markerUri)) {
        return;
    }

    if (context.workspaceState.get<boolean>(promptedKey)) {
        return;
    }

    const selection = await vscode.window.showInformationMessage(
        'Adaptive Tests invisible mode can automatically repair broken imports. Enable it now?',
        'Enable Invisible Mode',
        'Not Now'
    );

    if (selection === 'Enable Invisible Mode') {
        try {
            await vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: 'Enabling Adaptive Tests invisible mode...'
                },
                async () => {
                    const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
                    await execAsync(`${npxCommand} adaptive-tests enable-invisible`, { cwd: workspaceRoot });
                }
            );

            vscode.window.showInformationMessage(
                'Adaptive Tests invisible mode enabled. Break an import and rerun your tests to see it in action.'
            );
        } catch (error) {
            vscode.window.showErrorMessage(
                'Failed to enable invisible mode. Run "npx adaptive-tests enable-invisible" manually for more details.'
            );
        }
    }

    context.workspaceState.update(promptedKey, true);
}

function setupInvisibleHistoryWatcher(
    workspaceRoot: string,
    context: vscode.ExtensionContext,
    statusBarItem: vscode.StatusBarItem
) {
    const historyPattern = new vscode.RelativePattern(workspaceRoot, '.adaptive-tests/invisible-history.json');
    const watcher = vscode.workspace.createFileSystemWatcher(historyPattern);

    const refresh = () => refreshInvisibleHistory(workspaceRoot, statusBarItem, context);

    watcher.onDidChange(refresh, undefined, context.subscriptions);
    watcher.onDidCreate(refresh, undefined, context.subscriptions);
    watcher.onDidDelete(() => clearInvisibleStatus(statusBarItem), undefined, context.subscriptions);

    context.subscriptions.push(watcher);

    refresh();
}

function clearInvisibleStatus(statusBarItem: vscode.StatusBarItem) {
    statusBarItem.text = '$(search) Discovery Lens';
    statusBarItem.tooltip = 'Open Adaptive Tests Discovery Lens';
}

async function refreshInvisibleHistory(
    workspaceRoot: string,
    statusBarItem: vscode.StatusBarItem,
    context: vscode.ExtensionContext
) {
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
        const lastTimestamp = context.workspaceState.get<string>('adaptive-tests.lastInvisibleNotification');

        statusBarItem.text = '$(zap) Adaptive Tests';
        statusBarItem.tooltip = latest?.suggestion
            ? `Invisible mode recovered ${history.length} modules (latest: ${latest.suggestion})`
            : 'Adaptive Tests invisible mode is active';

        if (latest?.timestamp && latest.timestamp !== lastTimestamp) {
            const recent = history
                .slice(0, 3)
                .map((entry: any) => entry.suggestion || entry.modulePath)
                .filter(Boolean)
                .join(', ');

            if (recent) {
                vscode.window
                    .showInformationMessage(
                        `Adaptive Tests invisible mode recovered: ${recent}.`,
                        'Open Invisible History'
                    )
                    .then(selection => {
                        if (selection === 'Open Invisible History') {
                            openInvisibleHistory(historyUri);
                        }
                    });
            }

            context.workspaceState.update('adaptive-tests.lastInvisibleNotification', latest.timestamp);
        }
    } catch (error) {
        console.error('Failed to read invisible history:', error);
        clearInvisibleStatus(statusBarItem);
    }
}

async function openInvisibleHistory(historyUri: vscode.Uri) {
    try {
        const document = await vscode.workspace.openTextDocument(historyUri);
        await vscode.window.showTextDocument(document, { preview: false });
    } catch (error) {
        vscode.window.showErrorMessage('Unable to open invisible history file.');
    }
}

async function fileExists(uri: vscode.Uri): Promise<boolean> {
    try {
        await vscode.workspace.fs.stat(uri);
        return true;
    } catch {
        return false;
    }
}

export function deactivate() {
    DiscoveryLensAPIFactory.getInstance().dispose();
}
