import * as vscode from 'vscode';
import * as path from 'path';
import {
    IDiscoveryLensAPI,
    DiscoveryResult,
    DiscoverySignature,
    DiscoveryState,
    ScoreBreakdown
} from '../types/api';

export class DiscoveryLensPanel implements IDiscoveryLensAPI {
    private readonly panel: vscode.WebviewPanel;
    private readonly context: vscode.ExtensionContext;
    private disposables: vscode.Disposable[] = [];

    // State management for API
    private currentState: DiscoveryState = {
        signature: null,
        results: [],
        isLoading: false,
        lastError: null,
        lastRunTimestamp: null,
        config: {
            showScores: true,
            maxResults: 10,
            outputDirectory: 'tests/adaptive',
            autoOpen: true
        }
    };

    // Event emitters for API subscribers
    private stateChangeEmitter = new vscode.EventEmitter<DiscoveryState>();
    private resultsEmitter = new vscode.EventEmitter<DiscoveryResult[]>();

    constructor(context: vscode.ExtensionContext) {
        this.context = context;

        // Load configuration
        this.loadConfiguration();

        // Create webview panel
        this.panel = vscode.window.createWebviewPanel(
            'adaptiveTestsDiscovery',
            'Discovery Lens',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(context.extensionUri, 'media'),
                    vscode.Uri.joinPath(context.extensionUri, 'out', 'webview')
                ]
            }
        );

        // Set icon
        this.panel.iconPath = {
            light: vscode.Uri.joinPath(context.extensionUri, 'media', 'search-light.svg'),
            dark: vscode.Uri.joinPath(context.extensionUri, 'media', 'search-dark.svg')
        };

        // Set HTML content
        this.panel.webview.html = this.getWebviewContent();

        // Handle messages from webview
        this.panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'runDiscovery':
                        await this.handleRunDiscovery(message.signature);
                        break;
                    case 'openFile':
                        await this.handleOpenFile(message.path);
                        break;
                    case 'scaffoldTest':
                        await this.handleScaffoldTest(message.path);
                        break;
                }
            },
            undefined,
            this.disposables
        );

        // Handle panel disposal
        this.panel.onDidDispose(
            () => this.dispose(),
            undefined,
            this.disposables
        );
    }

    public reveal() {
        this.panel.reveal();
    }

    public onDidDispose(callback: () => void) {
        this.panel.onDidDispose(callback);
    }

    public dispose() {
        this.panel.dispose();
        while (this.disposables.length) {
            const disposable = this.disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
        this.stateChangeEmitter.dispose();
        this.resultsEmitter.dispose();
    }

    private async handleRunDiscovery(signature: any) {
        try {
            // Update state
            this.updateState({ isLoading: true, signature, lastError: null });

            // Get workspace root
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (!workspaceRoot) {
                throw new Error('No workspace folder open');
            }

            // Detect language and use appropriate discovery method
            const language = this.detectLanguageFromWorkspace(workspaceRoot);
            let candidates: any[];

            if (language === 'javascript' || language === 'typescript') {
                // Use JavaScript/TypeScript engine
                const adaptiveTests = await this.loadAdaptiveTests();
                const engine = adaptiveTests.getDiscoveryEngine();
                candidates = await engine.collectCandidates(workspaceRoot, signature);
            } else {
                // Use language-specific CLI
                candidates = await this.runLanguageSpecificDiscovery(workspaceRoot, signature, language);
            }

            // Sort by score
            candidates.sort((a: any, b: any) => b.score - a.score);

            // Limit results based on configuration
            const maxResults = this.currentState.config.maxResults;
            const showScores = this.currentState.config.showScores;

            const results: DiscoveryResult[] = candidates.slice(0, maxResults).map((candidate: any) => ({
                path: candidate.path,
                relativePath: path.relative(workspaceRoot, candidate.path),
                score: candidate.score,
                scoreBreakdown: this.extractScoreBreakdown(candidate, signature),
                metadata: candidate.metadata,
                language: this.detectLanguage(candidate.path)
            }));

            // Update state with results
            this.updateState({
                isLoading: false,
                results,
                lastRunTimestamp: Date.now()
            });

            // Emit results event
            this.resultsEmitter.fire(results);

            // Send results to webview
            this.panel.webview.postMessage({
                command: 'displayResults',
                results: results.map(r => ({
                    ...r,
                    absolutePath: r.path,
                    path: r.relativePath,
                    showScores
                })),
                signature,
                totalCandidates: candidates.length
            });

        } catch (error: any) {
            const errorMessage = error.message || 'Discovery failed';

            // Update state with error
            this.updateState({
                isLoading: false,
                lastError: errorMessage
            });

            // Send error to webview
            this.panel.webview.postMessage({
                command: 'showError',
                error: errorMessage
            });
        }
    }

    private extractScoreBreakdown(candidate: any, signature: any): ScoreBreakdown {
        const factors: ScoreBreakdown['factors'] = [];

        // Extract scoring factors from candidate
        if (candidate.nameMatch) {
            factors.push({
                factor: 'name',
                points: candidate.nameMatch,
                description: 'Name similarity match'
            });
        }
        if (candidate.pathBonus) {
            factors.push({
                factor: 'path',
                points: candidate.pathBonus,
                description: 'Standard path location'
            });
        }
        if (candidate.methodMatches) {
            factors.push({
                factor: 'methods',
                points: candidate.methodMatches * 10,
                description: `${candidate.methodMatches} method matches`
            });
        }
        if (candidate.typeMatch) {
            factors.push({
                factor: 'type',
                points: candidate.typeMatch,
                description: 'Type match'
            });
        }

        // Add base score if no other factors
        if (factors.length === 0) {
            factors.push({
                factor: 'base',
                points: candidate.score,
                description: 'Base discovery score'
            });
        }

        return {
            factors,
            total: candidate.score
        };
    }

    private detectLanguage(filePath: string): DiscoveryResult['language'] {
        const ext = path.extname(filePath).toLowerCase();
        switch (ext) {
            case '.js':
            case '.jsx':
                return 'javascript';
            case '.ts':
            case '.tsx':
                return 'typescript';
            case '.php':
                return 'php';
            case '.java':
                return 'java';
            case '.py':
                return 'python';
            default:
                return undefined;
        }
    }

    private async handleOpenFile(filePath: string) {
        try {
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (!workspaceRoot) {
                throw new Error('No workspace folder open');
            }

            const absolutePath = path.isAbsolute(filePath)
                ? filePath
                : path.join(workspaceRoot, filePath);

            const document = await vscode.workspace.openTextDocument(absolutePath);
            await vscode.window.showTextDocument(document);
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to open file: ${error.message}`);
        }
    }

    private async handleScaffoldTest(filePath: string) {
        try {
            const uri = vscode.Uri.file(filePath);
            await vscode.commands.executeCommand('adaptive-tests.scaffoldFile', uri);
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to scaffold test: ${error.message}`);
        }
    }

    private async loadAdaptiveTests() {
        try {
            // Try to load from workspace node_modules first
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (workspaceRoot) {
                const localPath = path.join(workspaceRoot, 'node_modules', 'adaptive-tests');
                return require(localPath);
            }
        } catch (e) {
            // Fall back to bundled version
        }

        // Load bundled version
        return require('@adaptive-tests/javascript');
    }

    // ==================== API Implementation ====================

    /**
     * Run discovery with a given signature
     */
    public async runDiscovery(signature: DiscoverySignature): Promise<DiscoveryResult[]> {
        await this.handleRunDiscovery(signature);
        return this.currentState.results;
    }

    /**
     * Set the signature in the Discovery Lens UI
     */
    public setSignature(signature: DiscoverySignature): void {
        this.updateState({ signature });

        // Send to webview
        this.panel.webview.postMessage({
            command: 'setSignature',
            signature: JSON.stringify(signature, null, 2)
        });
    }

    /**
     * Get the current state
     */
    public getState(): DiscoveryState {
        return { ...this.currentState };
    }

    /**
     * Show the Discovery Lens panel
     */
    public show(): void {
        this.panel.reveal();
    }

    /**
     * Hide the Discovery Lens panel
     */
    public hide(): void {
        this.panel.dispose();
    }

    /**
     * Clear current results and signature
     */
    public clear(): void {
        this.updateState({
            signature: null,
            results: [],
            lastError: null,
            lastRunTimestamp: null
        });

        // Clear webview
        this.panel.webview.postMessage({
            command: 'clear'
        });
    }

    /**
     * Subscribe to state changes
     */
    public onStateChange(callback: (state: DiscoveryState) => void): { dispose(): void } {
        return this.stateChangeEmitter.event(callback);
    }

    /**
     * Subscribe to discovery results
     */
    public onResults(callback: (results: DiscoveryResult[]) => void): { dispose(): void } {
        return this.resultsEmitter.event(callback);
    }

    // ==================== Helper Methods ====================

    private updateState(partial: Partial<DiscoveryState>): void {
        const previousState = { ...this.currentState };
        this.currentState = { ...this.currentState, ...partial };
        this.stateChangeEmitter.fire(this.currentState);
    }

    private loadConfiguration(): void {
        const config = vscode.workspace.getConfiguration('adaptive-tests');
        this.currentState.config = {
            showScores: config.get<boolean>('discovery.showScores', true),
            maxResults: config.get<number>('discovery.maxResults', 10),
            outputDirectory: config.get<string>('scaffold.outputDirectory', 'tests/adaptive'),
            autoOpen: config.get<boolean>('scaffold.autoOpen', true)
        };
    }

    private getWebviewContent(): string {
        const webview = this.panel.webview;
        const styleUri = this.getWebviewUri('style.css');
        const scriptUri = this.getWebviewUri('script.js');
        const cspSource = webview.cspSource;
        const nonce = this.createNonce();
        const htmlTemplate = this.loadHtmlTemplate();

        return htmlTemplate
            .replace(/{{STYLE_URI}}/g, styleUri.toString())
            .replace(/{{SCRIPT_URI}}/g, scriptUri.toString())
            .replace(/{{CSP_SOURCE}}/g, cspSource)
            .replace(/{{NONCE}}/g, nonce);
    }

    private loadHtmlTemplate(): string {
        try {
            const htmlPath = vscode.Uri.joinPath(this.context.extensionUri, 'media', 'discovery.html');
            const htmlContent = require('fs').readFileSync(htmlPath.fsPath, 'utf8');
            return htmlContent;
        } catch (error) {
            // Fallback to inline HTML if template file doesn't exist
            return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src {{CSP_SOURCE}} https: data:; style-src {{CSP_SOURCE}} 'unsafe-inline'; script-src 'nonce-{{NONCE}}'; font-src {{CSP_SOURCE}} https: data:;">
    <meta name="color-scheme" content="light dark">
    <title>Discovery Lens</title>
    <link href="{{STYLE_URI}}" rel="stylesheet">
</head>
<body>
    <div class="container">
        <h1>🔍 Discovery Lens</h1>
        <p>HTML template not found. Please check media/discovery.html</p>
    </div>
    <script nonce="{{NONCE}}" src="{{SCRIPT_URI}}"></script>
</body>
</html>`;
        }
    }

    private getWebviewUri(fileName: string): vscode.Uri {
        return this.panel.webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'media', fileName)
        );
    }

    private createNonce(): string {
        const crypto = require('crypto');
        return crypto.randomBytes(16).toString('base64');
    }

    private detectLanguageFromWorkspace(workspaceRoot: string): string {
        const fs = require('fs');
        const path = require('path');

        // Check for language-specific files and config
        if (fs.existsSync(path.join(workspaceRoot, 'package.json'))) {
            const packageJson = JSON.parse(fs.readFileSync(path.join(workspaceRoot, 'package.json'), 'utf8'));
            if (packageJson.devDependencies?.typescript || packageJson.dependencies?.typescript) {
                return 'typescript';
            }
            return 'javascript';
        }

        if (fs.existsSync(path.join(workspaceRoot, 'pom.xml')) || fs.existsSync(path.join(workspaceRoot, 'build.gradle'))) {
            return 'java';
        }

        if (fs.existsSync(path.join(workspaceRoot, 'composer.json'))) {
            return 'php';
        }

        if (fs.existsSync(path.join(workspaceRoot, 'requirements.txt')) || fs.existsSync(path.join(workspaceRoot, 'pyproject.toml'))) {
            return 'python';
        }

        // Default to JavaScript for mixed or unknown projects
        return 'javascript';
    }

    private async runLanguageSpecificDiscovery(workspaceRoot: string, signature: any, language: string): Promise<any[]> {
        const { exec } = require('child_process');
        const util = require('util');
        const execAsync = util.promisify(exec);

        try {
            let command: string;
            let args: string;

            switch (language) {
                case 'java':
                    // Use Maven/Gradle CLI for Java discovery
                    command = 'java';
                    args = `-jar ${workspaceRoot}/cli/target/adaptive-tests-java-cli-*-shaded.jar discover --root "${workspaceRoot}" --signature '${JSON.stringify(signature)}'`;
                    break;

                case 'php':
                    // Use npm CLI for PHP discovery
                    command = 'npx';
                    args = `adaptive-tests why '${JSON.stringify(signature)}' --json`;
                    break;

                case 'python':
                    // Use Python CLI for Python discovery
                    command = 'python3';
                    args = `-m adaptive_tests_py discover --root "${workspaceRoot}" --signature '${JSON.stringify(signature)}'`;
                    break;

                default:
                    throw new Error(`Unsupported language: ${language}`);
            }

            const { stdout, stderr } = await execAsync(`${command} ${args}`, {
                cwd: workspaceRoot,
                timeout: 30000, // 30 second timeout
                maxBuffer: 1024 * 1024 // 1MB max buffer
            });

            if (stderr) {
                console.warn('Discovery CLI stderr:', stderr);
            }

            // Parse JSON output
            const result = JSON.parse(stdout);
            return Array.isArray(result) ? result : result.candidates || [];

        } catch (error: any) {
            console.error(`Language-specific discovery failed for ${language}:`, error);

            // Fallback to basic file system search
            return this.fallbackFileSystemSearch(workspaceRoot, signature, language);
        }
    }

    private async fallbackFileSystemSearch(workspaceRoot: string, signature: any, language: string): Promise<any[]> {
        const fs = require('fs');
        const path = require('path');
        const glob = require('glob');

        // Define file patterns for each language
        const patterns: { [key: string]: string[] } = {
            java: ['**/*.java'],
            php: ['**/*.php'],
            python: ['**/*.py'],
            javascript: ['**/*.js', '**/*.jsx'],
            typescript: ['**/*.ts', '**/*.tsx']
        };

        const filePatterns = patterns[language] || patterns.javascript;
        const candidates: any[] = [];

        for (const pattern of filePatterns) {
            try {
                const files = glob.sync(pattern, {
                    cwd: workspaceRoot,
                    ignore: ['**/node_modules/**', '**/vendor/**', '**/.git/**', '**/target/**']
                });

                for (const file of files.slice(0, 20)) { // Limit to first 20 files
                    const fullPath = path.join(workspaceRoot, file);
                    const content = fs.readFileSync(fullPath, 'utf8');

                    // Basic name matching
                    if (signature.name && content.toLowerCase().includes(signature.name.toLowerCase())) {
                        candidates.push({
                            path: fullPath,
                            relativePath: file,
                            score: 50,
                            reason: 'Name match in content',
                            language
                        });
                    }
                }
            } catch (error) {
                console.warn(`Failed to search pattern ${pattern}:`, error);
            }
        }

        return candidates;
    }
}