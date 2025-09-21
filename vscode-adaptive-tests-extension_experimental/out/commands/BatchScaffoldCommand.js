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
exports.BatchScaffoldCommand = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
class BatchScaffoldCommand {
    constructor() {
        this.supportedExtensions = ['.js', '.ts', '.jsx', '.tsx', '.php', '.java', '.py', '.go', '.rs'];
    }
    async execute(uri) {
        try {
            const folderPath = uri ? uri.fsPath : vscode.window.activeTextEditor?.document.uri.fsPath;
            if (!folderPath) {
                vscode.window.showErrorMessage('No folder selected. Please select a folder to scaffold.');
                return;
            }
            const stats = await fs.promises.stat(folderPath);
            if (!stats.isDirectory()) {
                vscode.window.showErrorMessage('Please select a folder, not a file.');
                return;
            }
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(folderPath));
            if (!workspaceFolder) {
                vscode.window.showErrorMessage('Folder is not in a workspace.');
                return;
            }
            const files = await this.findEligibleFiles(folderPath);
            if (files.length === 0) {
                vscode.window.showInformationMessage('No eligible files found in the selected folder.');
                return;
            }
            const relativePath = path.relative(workspaceFolder.uri.fsPath, folderPath);
            const confirmation = await vscode.window.showInformationMessage(`Found ${files.length} file(s) to scaffold in ${relativePath}. Continue?`, 'Scaffold All', 'Preview Files', 'Cancel');
            if (confirmation === 'Cancel' || !confirmation)
                return;
            let filesToScaffold = files;
            if (confirmation === 'Preview Files') {
                const fileItems = files.map(file => ({
                    label: path.basename(file),
                    description: path.relative(folderPath, path.dirname(file)),
                    detail: path.relative(workspaceFolder.uri.fsPath, file),
                    picked: true,
                    file
                }));
                const selectedItems = await vscode.window.showQuickPick(fileItems, {
                    canPickMany: true,
                    placeHolder: 'Select files to scaffold tests for',
                    title: 'Batch Scaffold Preview'
                });
                if (!selectedItems || selectedItems.length === 0)
                    return;
                filesToScaffold = selectedItems.map(item => item.file);
            }
            const config = vscode.workspace.getConfiguration('adaptive-tests');
            const outputDir = config.get('scaffold.outputDirectory', 'tests/adaptive');
            const autoOpen = config.get('scaffold.autoOpen', true);
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Scaffolding Adaptive Tests',
                cancellable: true
            }, async (progress, token) => {
                const { DiscoveryEngine, processSingleFile } = require('@adaptive-tests/javascript');
                const engine = new DiscoveryEngine(workspaceFolder.uri.fsPath);
                const summary = { success: [], skipped: [], failed: [] };
                for (let i = 0; i < filesToScaffold.length; i++) {
                    if (token.isCancellationRequested)
                        break;
                    const file = filesToScaffold[i];
                    const fileName = path.basename(file);
                    progress.report({ increment: (i / filesToScaffold.length) * 100, message: `Processing ${fileName} (${i + 1}/${filesToScaffold.length})` });
                    try {
                        const result = await this.scaffoldSingleFile(engine, processSingleFile, file, workspaceFolder.uri.fsPath, outputDir);
                        if (result.created) {
                            summary.success.push(result.testFile);
                        }
                        else if (result.skipped) {
                            summary.skipped.push(file);
                        }
                    }
                    catch (error) {
                        summary.failed.push(file);
                        console.error(`Failed to scaffold ${file}:`, error);
                    }
                }
                this.showResults(summary, autoOpen);
            });
        }
        catch (error) {
            vscode.window.showErrorMessage(`Batch scaffolding failed: ${error.message}`);
            console.error('Batch scaffold error:', error);
        }
    }
    async findEligibleFiles(folderPath) {
        const files = [];
        const supportedExtensions = this.supportedExtensions;
        async function walk(dir) {
            const entries = await fs.promises.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    if (!['node_modules', '.git', 'tests', '__tests__', 'test'].includes(entry.name)) {
                        await walk(fullPath);
                    }
                }
                else if (entry.isFile()) {
                    const ext = path.extname(entry.name);
                    if (!entry.name.includes('.test.') && !entry.name.includes('.spec.') && supportedExtensions.includes(ext)) {
                        files.push(fullPath);
                    }
                }
            }
        }
        await walk(folderPath);
        return files;
    }
    async scaffoldSingleFile(engine, processSingleFile, filePath, workspaceRoot, outputDir) {
        const results = { created: [], skippedExisting: [], skippedNoExport: [], errors: [] };
        const ext = path.extname(filePath);
        const options = {
            root: workspaceRoot,
            outputDir: outputDir,
            force: false, // Batch scaffold never forces overwrite
            isTypeScript: ext === '.ts' || ext === '.tsx',
            applyAssertions: true
        };
        await processSingleFile(engine, filePath, options, results);
        if (results.created.length > 0) {
            return { created: true, skipped: false, testFile: results.created[0] };
        }
        if (results.skippedExisting.length > 0 || results.skippedNoExport.length > 0) {
            return { created: false, skipped: true, testFile: '' };
        }
        return { created: false, skipped: false, testFile: '' };
    }
    async showResults(results, autoOpen) {
        let message = `Batch scaffolding complete:\n✅ Created: ${results.success.length}\n⏭️ Skipped: ${results.skipped.length}`;
        if (results.failed.length > 0) {
            message += `\n❌ Failed: ${results.failed.length}`;
        }
        const options = ['OK'];
        if (results.success.length > 0) {
            options.unshift('Open Tests');
        }
        const action = await vscode.window.showInformationMessage(message, ...options);
        if (action === 'Open Tests' && autoOpen && results.success.length > 0) {
            const filesToOpen = results.success.slice(0, 3);
            for (const testFile of filesToOpen) {
                try {
                    const doc = await vscode.workspace.openTextDocument(testFile);
                    await vscode.window.showTextDocument(doc, { preview: false });
                }
                catch (error) {
                    console.error(`Failed to open ${testFile}:`, error);
                }
            }
            if (results.success.length > 3) {
                vscode.window.showInformationMessage(`Opened first 3 of ${results.success.length} test files.`);
            }
        }
    }
}
exports.BatchScaffoldCommand = BatchScaffoldCommand;
//# sourceMappingURL=BatchScaffoldCommand.js.map