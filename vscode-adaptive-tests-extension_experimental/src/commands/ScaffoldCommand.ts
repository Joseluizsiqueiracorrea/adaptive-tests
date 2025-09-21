import * as vscode from 'vscode';
import * as path from 'path';
import * as child_process from 'child_process';

function execCommand(command: string, options: child_process.ExecOptions) {
    return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
        child_process.exec(command, options, (error, stdout = '', stderr = '') => {
            if (error) {
                reject(error);
                return;
            }
            resolve({ stdout: String(stdout ?? ''), stderr: String(stderr ?? '') });
        });
    });
}

export class ScaffoldCommand {
    public async execute(uri?: vscode.Uri) {
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
            const outputDir = config.get<string>('scaffold.outputDirectory', 'tests/adaptive');
            const autoOpen = config.get<boolean>('scaffold.autoOpen', true);

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Scaffolding Adaptive Test',
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: 'Loading adaptive-tests API...' });

                const adaptiveModule = await import('@adaptive-tests/javascript');
                const { DiscoveryEngine, processSingleFile } = adaptiveModule as any;
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

                try {
                    await processSingleFile(engine, filePath, options, results);

                    progress.report({ increment: 75, message: 'Finalizing test file...' });

                    if (results.created.length > 0) {
                        const testFile = results.created[0];
                        progress.report({ increment: 100, message: 'Test scaffolded successfully!' });

                        const action = await vscode.window.showInformationMessage(
                            `Test scaffolded: ${path.relative(workspaceFolder.uri.fsPath, testFile)}`,
                            'Open Test File'
                        );

                        if (action === 'Open Test File' || autoOpen) {
                            const doc = await vscode.workspace.openTextDocument(testFile);
                            await vscode.window.showTextDocument(doc);
                        }
                    } else if (results.skippedExisting.length > 0) {
                        const overwrite = await vscode.window.showWarningMessage(
                            'Test file already exists. Overwrite?',
                            'Overwrite',
                            'Cancel'
                        );

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
                    } else if (results.skippedNoExport.length > 0) {
                        vscode.window.showWarningMessage('No exportable code found in file. Make sure your file exports classes, functions, or other testable code.');
                    } else {
                        throw new Error('Scaffolding did not produce a file and reported no specific errors.');
                    }
                } catch (error: any) {
                    throw new Error(`Scaffolding failed: ${error.message}`);
                }
            });
        } catch (error: any) {
            const action = await vscode.window.showErrorMessage(
                `Failed to scaffold test: ${error.message}`,
                'Show Details',
                'Open Logs'
            );

            if (action === 'Show Details') {
                const outputChannel = vscode.window.createOutputChannel('Adaptive Tests');
                outputChannel.appendLine('Scaffold Error Details:');
                outputChannel.appendLine(`Error: ${error.message}`);
                outputChannel.appendLine(`Stack: ${error.stack}`);
                outputChannel.show();
            } else if (action === 'Open Logs') {
                vscode.commands.executeCommand('workbench.action.showLogs');
            }
            console.error('Scaffold error:', error);
        }
    }
}