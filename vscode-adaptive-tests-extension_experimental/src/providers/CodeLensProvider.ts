import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// Use a dynamic import for the engine to avoid making it a hard dependency.
let DiscoveryEngine: any;

export class AdaptiveTestsCodeLensProvider implements vscode.CodeLensProvider {
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;
    private engine: any;

    constructor() {
        vscode.workspace.onDidChangeConfiguration((_) => {
            this._onDidChangeCodeLenses.fire();
        });
        this.loadEngine();
    }

    private async loadEngine() {
        if (!DiscoveryEngine) {
            try {
                // Dynamically import the engine from the workspace's version
                const adaptiveTests = require('@adaptive-tests/javascript');
                DiscoveryEngine = adaptiveTests.DiscoveryEngine;
            } catch (e) {
                console.error("Failed to load '@adaptive-tests/javascript'. CodeLens will be disabled.", e);
                return;
            }
        }
        if (DiscoveryEngine && !this.engine) {
            this.engine = new DiscoveryEngine();
        }
    }

    public async provideCodeLenses(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): Promise<vscode.CodeLens[]> {
        await this.loadEngine();
        if (!this.engine) {
            return [];
        }

        const codeLenses: vscode.CodeLens[] = [];
        const supportedExtensions = ['.js', '.ts', '.jsx', '.tsx'];
        const ext = path.extname(document.fileName);

        if (!supportedExtensions.includes(ext)) {
            return [];
        }

        const text = document.getText();
        const fileName = path.basename(document.fileName);
        const metadata = this.engine.analyzeModuleExports(text, fileName);

        if (token.isCancellationRequested) {
            return [];
        }

        if (metadata && metadata.exports) {
            for (const exp of metadata.exports) {
                const info = exp.info;
                if (info && info.line && info.name) {
                    const line = info.line - 1; // Convert to 0-based index
                    if (line < 0 || line >= document.lineCount) continue;

                    const range = new vscode.Range(line, 0, line, document.lineAt(line).text.length);
                    const testExists = await this.checkTestExists(document, info.name);

                    if (testExists) {
                        codeLenses.push(
                            new vscode.CodeLens(range, {
                                title: '✓ Adaptive test exists',
                                tooltip: 'An adaptive test already exists for this item',
                                command: 'adaptive-tests.openTest',
                                arguments: [document.uri, info.name]
                            })
                        );
                    } else {
                        codeLenses.push(
                            new vscode.CodeLens(range, {
                                title: '$(add) Generate adaptive test',
                                tooltip: 'Generate an adaptive test for this item',
                                command: 'adaptive-tests.scaffoldFile',
                                arguments: [document.uri]
                            })
                        );
                    }
                }
            }
        }

        // Add general discovery lens at the beginning of the file if any exports were found
        if (metadata && metadata.exports && metadata.exports.length > 0 && codeLenses.length === 0) {
            const range = new vscode.Range(0, 0, 0, 0);
            codeLenses.push(
                new vscode.CodeLens(range, {
                    title: '$(search) Run discovery',
                    tooltip: 'See how elements in this file would be discovered',
                    command: 'adaptive-tests.runDiscovery',
                    arguments: [document.uri]
                })
            );
        }

        return codeLenses;
    }

    public resolveCodeLens(
        codeLens: vscode.CodeLens,
        token: vscode.CancellationToken
    ): vscode.CodeLens {
        return codeLens;
    }

    private async checkTestExists(document: vscode.TextDocument, name: string): Promise<boolean> {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
        if (!workspaceFolder) {
            return false;
        }

        const config = vscode.workspace.getConfiguration('adaptive-tests');
        const testDir = config.get<string>('scaffold.outputDirectory', 'tests/adaptive');

        const testPatterns = [
            path.join(workspaceFolder.uri.fsPath, testDir, `${name}.test.js`),
            path.join(workspaceFolder.uri.fsPath, testDir, `${name}.test.ts`),
            path.join(workspaceFolder.uri.fsPath, testDir, `${name}.spec.js`),
            path.join(workspaceFolder.uri.fsPath, testDir, `${name}.spec.ts`),
        ];

        for (const pattern of testPatterns) {
            try {
                await vscode.workspace.fs.stat(vscode.Uri.file(pattern));
                return true; // File exists
            } catch {
                // File does not exist, continue checking
            }
        }

        return false;
    }
}
