import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface ExportOptions {
    format: 'json' | 'csv' | 'markdown';
    includeScores: boolean;
    includeMetadata: boolean;
    filename?: string;
}

export class ExportCommand {
    async execute(uri?: vscode.Uri): Promise<void> {
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

            vscode.window.showInformationMessage(
                `Successfully exported ${results.length} results to ${exportOptions.filename}`
            );

        } catch (error: any) {
            vscode.window.showErrorMessage(`Export failed: ${error.message}`);
        }
    }

    private async getCurrentResults(): Promise<any[]> {
        // This would need to be implemented to get results from the webview
        // For now, return empty array as placeholder
        return [];
    }

    private async showExportDialog(): Promise<ExportOptions | undefined> {
        const format = await vscode.window.showQuickPick(
            [
                { label: 'JSON', description: 'JavaScript Object Notation', format: 'json' },
                { label: 'CSV', description: 'Comma Separated Values', format: 'csv' },
                { label: 'Markdown', description: 'Markdown Table', format: 'markdown' }
            ] as const,
            {
                placeHolder: 'Select export format',
                title: 'Export Discovery Results'
            }
        );

        if (!format) return;

        const includeScores = await vscode.window.showQuickPick(
            [
                { label: 'Yes', value: true },
                { label: 'No', value: false }
            ],
            {
                placeHolder: 'Include discovery scores?',
                title: 'Include Scores'
            }
        );

        if (includeScores === undefined) return;

        const includeMetadata = await vscode.window.showQuickPick(
            [
                { label: 'Yes', value: true },
                { label: 'No', value: false }
            ],
            {
                placeHolder: 'Include metadata?',
                title: 'Include Metadata'
            }
        );

        if (includeMetadata === undefined) return;

        const filename = await vscode.window.showInputBox({
            prompt: 'Enter filename (without extension)',
            value: `discovery-results-${new Date().toISOString().split('T')[0]}`,
            title: 'Export Filename'
        });

        if (!filename) return;

        return {
            format: format.format,
            includeScores: includeScores.value,
            includeMetadata: includeMetadata.value,
            filename: `${filename}.${format.format}`
        };
    }

    private generateExportContent(results: any[], options: ExportOptions): string {
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

    private generateJSON(results: any[], options: ExportOptions): string {
        const exportData = results.map(result => {
            const item: any = {
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

    private generateCSV(results: any[], options: ExportOptions): string {
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

    private generateMarkdown(results: any[], options: ExportOptions): string {
        let markdown = '# Discovery Results Export\n\n';
        markdown += `**Export Date:** ${new Date().toISOString()}\n`;
        markdown += `**Total Results:** ${results.length}\n\n`;

        if (options.includeScores || options.includeMetadata) {
            markdown += '**Export Options:**\n';
            if (options.includeScores) markdown += '- Discovery scores included\n';
            if (options.includeMetadata) markdown += '- Metadata included\n';
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

    private async saveExportFile(content: string, options: ExportOptions): Promise<void> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

        if (!workspaceFolder) {
            throw new Error('No workspace folder open');
        }

        // Default to workspace root, but let user choose
        const defaultUri = vscode.Uri.joinPath(workspaceFolder.uri, options.filename!);
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

    private getFormatDescription(format: string): string {
        switch (format) {
            case 'json': return 'JSON Files';
            case 'csv': return 'CSV Files';
            case 'markdown': return 'Markdown Files';
            default: return 'All Files';
        }
    }
}