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
exports.ScaffoldCommand = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
class ScaffoldCommand {
    async execute(uri) {
        try {
            const filePath = uri ? uri.fsPath : vscode.window.activeTextEditor?.document.uri.fsPath;
            if (!filePath) {
                vscode.window.showErrorMessage('No file selected. Please open or select a file to scaffold.');
                return;
            }
            const ext = path.extname(filePath);
            const supportedExtensions = ['.js', '.ts', '.jsx', '.tsx', '.php', '.java', '.py', '.go', '.rs'];
            if (!supportedExtensions.includes(ext)) {
                vscode.window.showWarningMessage(`File type ${ext} is not supported for scaffolding.`);
                return;
            }
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(filePath));
            if (!workspaceFolder) {
                vscode.window.showErrorMessage('File is not in a workspace folder.');
                return;
            }
            const config = vscode.workspace.getConfiguration('adaptive-tests');
            const outputDir = config.get('scaffold.outputDirectory', 'tests/adaptive');
            const autoOpen = config.get('scaffold.autoOpen', true);
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Scaffolding Adaptive Test',
                cancellable: true
            }, async (progress, cancellationToken) => {
                progress.report({ increment: 0, message: 'Loading adaptive-tests API...' });
                const adaptiveModule = await Promise.resolve().then(() => __importStar(require('@adaptive-tests/javascript')));
                const { DiscoveryEngine, processSingleFile } = adaptiveModule;
                const engine = new DiscoveryEngine(workspaceFolder.uri.fsPath);
                const results = { created: [], skippedExisting: [], skippedNoExport: [], errors: [] };
                const options = {
                    root: workspaceFolder.uri.fsPath,
                    outputDir: outputDir,
                    force: false,
                    isTypeScript: ext === '.ts' || ext === '.tsx',
                    applyAssertions: true // Or get from config
                };
                progress.report({ increment: 25, message: 'Analyzing file...' });
                // Check for cancellation
                if (cancellationToken.isCancellationRequested) {
                    throw new Error('Operation cancelled by user');
                }
                try {
                    // Check cancellation before heavy operation
                    if (cancellationToken.isCancellationRequested) {
                        throw new Error('Operation cancelled by user');
                    }
                    await processSingleFile(engine, filePath, options, results);
                    progress.report({ increment: 75, message: 'Finalizing test file...' });
                    if (results.created.length > 0) {
                        const testFile = results.created[0];
                        progress.report({ increment: 100, message: 'Test scaffolded successfully!' });
                        const action = await vscode.window.showInformationMessage(`Test scaffolded: ${path.relative(workspaceFolder.uri.fsPath, testFile)}`, 'Open Test File');
                        if (action === 'Open Test File' || autoOpen) {
                            const doc = await vscode.workspace.openTextDocument(testFile);
                            await vscode.window.showTextDocument(doc);
                        }
                    }
                    else if (results.skippedExisting.length > 0) {
                        const overwrite = await vscode.window.showWarningMessage('Test file already exists. Overwrite?', 'Overwrite', 'Cancel');
                        if (overwrite === 'Overwrite') {
                            const forceOptions = { ...options, force: true };
                            const forceResults = { created: [], skippedExisting: [], skippedNoExport: [], errors: [] };
                            await processSingleFile(engine, filePath, forceOptions, forceResults);
                            if (forceResults.created.length > 0) {
                                const testFile = forceResults.created[0];
                                if (autoOpen) {
                                    const doc = await vscode.workspace.openTextDocument(testFile);
                                    await vscode.window.showTextDocument(doc);
                                }
                                vscode.window.showInformationMessage(`Test file overwritten: ${path.relative(workspaceFolder.uri.fsPath, testFile)}`);
                            }
                        }
                    }
                    else if (results.skippedNoExport.length > 0) {
                        vscode.window.showWarningMessage('No exportable code found in file. Make sure your file exports classes, functions, or other testable code.');
                    }
                    else {
                        throw new Error('Scaffolding did not produce a file and reported no specific errors.');
                    }
                }
                catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    throw new Error(`Scaffolding failed: ${message}`);
                }
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            const action = await vscode.window.showErrorMessage(`Failed to scaffold test: ${message}`, 'Show Details', 'Open Logs');
            if (action === 'Show Details') {
                const outputChannel = vscode.window.createOutputChannel('Adaptive Tests');
                outputChannel.appendLine('Scaffold Error Details:');
                const err = error instanceof Error ? error : new Error(String(error));
                outputChannel.appendLine(`Error: ${err.message}`);
                outputChannel.appendLine(`Stack: ${err.stack}`);
                outputChannel.show();
            }
            else if (action === 'Open Logs') {
                vscode.commands.executeCommand('workbench.action.showLogs');
            }
            console.error('Scaffold error:', error);
        }
    }
}
exports.ScaffoldCommand = ScaffoldCommand;
//# sourceMappingURL=ScaffoldCommand.js.map