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
exports.ExportCommand = void 0;
const vscode = __importStar(require("vscode"));
class ExportCommand {
    async execute(uri) {
        try {
            // Get discovery results from the current webview
            const results = await this.getCurrentResults();
            if (!results || results.length === 0) {
                vscode.window.showWarningMessage('No discovery results to export. Run a discovery first.');
                return;
            }
            // Show export options
            const exportOptions = await this.showExportDialog();
            if (!exportOptions) {
                return; // User cancelled
            }
            // Generate export content
            const content = this.generateExportContent(results, exportOptions);
            // Save file
            await this.saveExportFile(content, exportOptions);
            vscode.window.showInformationMessage(`Successfully exported ${results.length} results to ${exportOptions.filename}`);
        }
        catch (error) {
            vscode.window.showErrorMessage(`Export failed: ${error.message}`);
        }
    }
    async getCurrentResults() {
        // This would need to be implemented to get results from the webview
        // For now, return empty array as placeholder
        return [];
    }
    async showExportDialog() {
        const format = await vscode.window.showQuickPick([
            { label: 'JSON', description: 'JavaScript Object Notation', format: 'json' },
            { label: 'CSV', description: 'Comma Separated Values', format: 'csv' },
            { label: 'Markdown', description: 'Markdown Table', format: 'markdown' }
        ], {
            placeHolder: 'Select export format',
            title: 'Export Discovery Results'
        });
        if (!format)
            return;
        const includeScores = await vscode.window.showQuickPick([
            { label: 'Yes', value: true },
            { label: 'No', value: false }
        ], {
            placeHolder: 'Include discovery scores?',
            title: 'Include Scores'
        });
        if (includeScores === undefined)
            return;
        const includeMetadata = await vscode.window.showQuickPick([
            { label: 'Yes', value: true },
            { label: 'No', value: false }
        ], {
            placeHolder: 'Include metadata?',
            title: 'Include Metadata'
        });
        if (includeMetadata === undefined)
            return;
        const filename = await vscode.window.showInputBox({
            prompt: 'Enter filename (without extension)',
            value: `discovery-results-${new Date().toISOString().split('T')[0]}`,
            title: 'Export Filename'
        });
        if (!filename)
            return;
        return {
            format: format.format,
            includeScores: includeScores.value,
            includeMetadata: includeMetadata.value,
            filename: `${filename}.${format.format}`
        };
    }
    generateExportContent(results, options) {
        switch (options.format) {
            case 'json':
                return this.generateJSON(results, options);
            case 'csv':
                return this.generateCSV(results, options);
            case 'markdown':
                return this.generateMarkdown(results, options);
            default:
                throw new Error(`Unsupported format: ${options.format}`);
        }
    }
    generateJSON(results, options) {
        const exportData = results.map(result => {
            const item = {
                path: result.path,
                relativePath: result.relativePath,
                language: result.language
            };
            if (options.includeScores) {
                item.score = result.score;
                item.scoreBreakdown = result.scoreBreakdown;
            }
            if (options.includeMetadata) {
                item.metadata = result.metadata;
            }
            return item;
        });
        return JSON.stringify({
            exportDate: new Date().toISOString(),
            totalResults: results.length,
            filters: {
                includeScores: options.includeScores,
                includeMetadata: options.includeMetadata
            },
            results: exportData
        }, null, 2);
    }
    generateCSV(results, options) {
        const headers = ['Path', 'Relative Path', 'Language'];
        if (options.includeScores) {
            headers.push('Score');
        }
        if (options.includeMetadata) {
            headers.push('Metadata');
        }
        const rows = results.map(result => {
            const row = [
                result.path,
                result.relativePath,
                result.language || ''
            ];
            if (options.includeScores) {
                row.push(result.score.toString());
            }
            if (options.includeMetadata) {
                row.push(JSON.stringify(result.metadata || {}));
            }
            return row.map(field => `"${field}"`).join(',');
        });
        return [headers.join(','), ...rows].join('\n');
    }
    generateMarkdown(results, options) {
        let markdown = '# Discovery Results Export\n\n';
        markdown += `**Export Date:** ${new Date().toISOString()}\n`;
        markdown += `**Total Results:** ${results.length}\n\n`;
        if (options.includeScores || options.includeMetadata) {
            markdown += '**Export Options:**\n';
            if (options.includeScores)
                markdown += '- Discovery scores included\n';
            if (options.includeMetadata)
                markdown += '- Metadata included\n';
            markdown += '\n';
        }
        // Table headers
        const headers = ['Path', 'Language'];
        if (options.includeScores) {
            headers.push('Score');
        }
        markdown += '| ' + headers.join(' | ') + ' |\n';
        markdown += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
        // Table rows
        results.forEach(result => {
            const row = [
                result.relativePath,
                result.language || ''
            ];
            if (options.includeScores) {
                row.push(result.score.toString());
            }
            markdown += '| ' + row.join(' | ') + ' |\n';
        });
        return markdown;
    }
    async saveExportFile(content, options) {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder open');
        }
        // Default to workspace root, but let user choose
        const defaultUri = vscode.Uri.joinPath(workspaceFolder.uri, options.filename);
        const selectedUri = await vscode.window.showSaveDialog({
            defaultUri,
            filters: {
                'All Files': ['*'],
                [this.getFormatDescription(options.format)]: [options.format]
            },
            title: 'Save Export File'
        });
        if (!selectedUri) {
            throw new Error('No save location selected');
        }
        await vscode.workspace.fs.writeFile(selectedUri, Buffer.from(content, 'utf8'));
    }
    getFormatDescription(format) {
        switch (format) {
            case 'json': return 'JSON Files';
            case 'csv': return 'CSV Files';
            case 'markdown': return 'Markdown Files';
            default: return 'All Files';
        }
    }
}
exports.ExportCommand = ExportCommand;
//# sourceMappingURL=ExportCommand.js.map