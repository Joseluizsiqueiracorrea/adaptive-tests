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
exports.DiscoveryLensPanel = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
class DiscoveryLensPanel {
    constructor(context) {
        this.disposables = [];
        // State management for API
        this.currentState = {
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
        this.stateChangeEmitter = new vscode.EventEmitter();
        this.resultsEmitter = new vscode.EventEmitter();
        this.context = context;
        // Load configuration
        this.loadConfiguration();
        // Create webview panel
        this.panel = vscode.window.createWebviewPanel('adaptiveTestsDiscovery', 'Discovery Lens', vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [
                vscode.Uri.joinPath(context.extensionUri, 'media'),
                vscode.Uri.joinPath(context.extensionUri, 'out', 'webview')
            ]
        });
        // Set icon
        this.panel.iconPath = {
            light: vscode.Uri.joinPath(context.extensionUri, 'media', 'search-light.svg'),
            dark: vscode.Uri.joinPath(context.extensionUri, 'media', 'search-dark.svg')
        };
        // Set HTML content
        this.panel.webview.html = this.getWebviewContent();
        // Handle messages from webview
        this.panel.webview.onDidReceiveMessage(async (message) => {
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
        }, undefined, this.disposables);
        // Handle panel disposal
        this.panel.onDidDispose(() => this.dispose(), undefined, this.disposables);
    }
    reveal() {
        this.panel.reveal();
    }
    onDidDispose(callback) {
        this.panel.onDidDispose(callback);
    }
    dispose() {
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
    async handleRunDiscovery(rawSignature) {
        try {
            const signature = this.validateSignature(rawSignature);
            // Update state
            this.updateState({ isLoading: true, signature, lastError: null });
            // Get workspace root
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (!workspaceRoot) {
                throw new Error('No workspace folder open');
            }
            // Detect language and use appropriate discovery method
            const language = this.detectLanguageFromWorkspace(workspaceRoot);
            let candidates;
            if (language === 'javascript' || language === 'typescript') {
                // Use JavaScript/TypeScript engine
                const adaptiveTests = await this.loadAdaptiveTests();
                const engine = adaptiveTests.getDiscoveryEngine();
                candidates = await engine.collectCandidates(workspaceRoot, signature);
            }
            else {
                // Use language-specific CLI
                candidates = await this.runLanguageSpecificDiscovery(workspaceRoot, signature, language);
            }
            // Sort by score
            candidates.sort((a, b) => b.score - a.score);
            const maxResults = this.currentState.config.maxResults;
            const showScores = this.currentState.config.showScores;
            const sanitizedResults = [];
            for (const candidate of candidates) {
                const resolved = this.resolvePathInsideRoot(workspaceRoot, candidate.path ?? candidate.absolutePath ?? '');
                if (!resolved) {
                    continue;
                }
                sanitizedResults.push({
                    path: resolved.absolute,
                    relativePath: resolved.relative,
                    score: candidate.score,
                    scoreBreakdown: this.extractScoreBreakdown(candidate, signature),
                    metadata: candidate.metadata,
                    language: candidate.language ?? this.detectLanguage(resolved.absolute)
                });
                if (sanitizedResults.length >= maxResults) {
                    break;
                }
            }
            // Update state with results
            this.updateState({
                isLoading: false,
                results: sanitizedResults,
                lastRunTimestamp: Date.now()
            });
            // Emit results event
            this.resultsEmitter.fire(sanitizedResults);
            // Send results to webview
            this.panel.webview.postMessage({
                command: 'displayResults',
                results: sanitizedResults.map(r => ({
                    ...r,
                    absolutePath: r.path,
                    path: r.relativePath,
                    showScores
                })),
                signature,
                totalCandidates: candidates.length
            });
        }
        catch (error) {
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
    extractScoreBreakdown(candidate, signature) {
        const factors = [];
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
    detectLanguage(filePath) {
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
    async handleOpenFile(filePath) {
        try {
            const folders = vscode.workspace.workspaceFolders ?? [];
            let resolved = null;
            for (const folder of folders) {
                resolved = this.resolvePathInsideRoot(folder.uri.fsPath, filePath);
                if (resolved) {
                    break;
                }
            }
            if (!resolved) {
                throw new Error('Requested file is outside of the current workspace.');
            }
            const document = await vscode.workspace.openTextDocument(resolved.absolute);
            await vscode.window.showTextDocument(document);
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to open file: ${error.message}`);
        }
    }
    async handleScaffoldTest(filePath) {
        try {
            const folders = vscode.workspace.workspaceFolders ?? [];
            let resolved = null;
            for (const folder of folders) {
                resolved = this.resolvePathInsideRoot(folder.uri.fsPath, filePath);
                if (resolved) {
                    break;
                }
            }
            if (!resolved) {
                throw new Error('Requested file is outside of the current workspace.');
            }
            await vscode.commands.executeCommand('adaptive-tests.scaffoldFile', vscode.Uri.file(resolved.absolute));
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to scaffold test: ${error.message}`);
        }
    }
    async loadAdaptiveTests() {
        try {
            // Try to load from workspace node_modules first
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (workspaceRoot) {
                const localPath = path.join(workspaceRoot, 'node_modules', 'adaptive-tests');
                return require(localPath);
            }
        }
        catch (e) {
            // Fall back to bundled version
        }
        // Load bundled version
        return require('@adaptive-tests/javascript');
    }
    // ==================== API Implementation ====================
    /**
     * Run discovery with a given signature
     */
    async runDiscovery(signature) {
        await this.handleRunDiscovery(signature);
        return this.currentState.results;
    }
    /**
     * Set the signature in the Discovery Lens UI
     */
    setSignature(signature) {
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
    getState() {
        return { ...this.currentState };
    }
    /**
     * Show the Discovery Lens panel
     */
    show() {
        this.panel.reveal();
    }
    /**
     * Hide the Discovery Lens panel
     */
    hide() {
        this.panel.dispose();
    }
    /**
     * Clear current results and signature
     */
    clear() {
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
    onStateChange(callback) {
        return this.stateChangeEmitter.event(callback);
    }
    /**
     * Subscribe to discovery results
     */
    onResults(callback) {
        return this.resultsEmitter.event(callback);
    }
    // ==================== Helper Methods ====================
    updateState(partial) {
        this.currentState = { ...this.currentState, ...partial };
        this.stateChangeEmitter.fire(this.currentState);
    }
    async collectStream(stream) {
        if (!stream) {
            return '';
        }
        const chunks = [];
        for await (const chunk of stream) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        return Buffer.concat(chunks).toString('utf8');
    }
    resolvePathInsideRoot(workspaceRoot, targetPath) {
        if (!targetPath) {
            return null;
        }
        const absolute = path.isAbsolute(targetPath)
            ? path.resolve(targetPath)
            : path.resolve(workspaceRoot, targetPath);
        const relative = path.relative(workspaceRoot, absolute);
        if (relative.startsWith('..') || path.isAbsolute(relative)) {
            return null;
        }
        return { absolute, relative };
    }
    validateSignature(raw) {
        if (typeof raw !== 'object' || raw === null) {
            throw new Error('Discovery signature must be an object.');
        }
        const candidate = raw;
        const name = typeof candidate.name === 'string' ? candidate.name.trim() : '';
        if (!name) {
            throw new Error('Signature must include a non-empty string "name".');
        }
        if (name.length > 256) {
            throw new Error('Signature name is too long. Please keep it under 256 characters.');
        }
        const sanitizeList = (value, label) => {
            if (value === undefined) {
                return undefined;
            }
            if (!Array.isArray(value)) {
                throw new Error(`Signature property "${label}" must be an array of strings.`);
            }
            const normalised = value
                .filter(item => typeof item === 'string')
                .map(item => item.trim())
                .filter(Boolean)
                .slice(0, 32);
            return normalised.length ? normalised : undefined;
        };
        const extras = {};
        for (const [key, value] of Object.entries(candidate)) {
            if (['name', 'type', 'methods', 'properties', 'extends', 'implements'].includes(key)) {
                continue;
            }
            extras[key] = value;
        }
        return {
            ...extras,
            name,
            type: typeof candidate.type === 'string' ? candidate.type : undefined,
            methods: sanitizeList(candidate.methods, 'methods'),
            properties: sanitizeList(candidate.properties, 'properties'),
            extends: typeof candidate.extends === 'string' ? candidate.extends.trim() : undefined,
            implements: sanitizeList(candidate.implements, 'implements')
        };
    }
    loadConfiguration() {
        const config = vscode.workspace.getConfiguration('adaptive-tests');
        this.currentState.config = {
            showScores: config.get('discovery.showScores', true),
            maxResults: config.get('discovery.maxResults', 10),
            outputDirectory: config.get('scaffold.outputDirectory', 'tests/adaptive'),
            autoOpen: config.get('scaffold.autoOpen', true)
        };
    }
    getWebviewContent() {
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
    loadHtmlTemplate() {
        try {
            const htmlPath = vscode.Uri.joinPath(this.context.extensionUri, 'media', 'discovery.html');
            const htmlContent = require('fs').readFileSync(htmlPath.fsPath, 'utf8');
            return htmlContent;
        }
        catch (error) {
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
    getWebviewUri(fileName) {
        return this.panel.webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', fileName));
    }
    createNonce() {
        const crypto = require('crypto');
        return crypto.randomBytes(16).toString('base64');
    }
    detectLanguageFromWorkspace(workspaceRoot) {
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
    async runLanguageSpecificDiscovery(workspaceRoot, signature, language) {
        const { spawn } = require('child_process');
        const fg = require('fast-glob');
        const signatureJson = JSON.stringify(signature);
        let executable;
        let spawnArgs;
        switch (language) {
            case 'java': {
                const matches = await fg('cli/target/adaptive-tests-java-cli-*-shaded.jar', {
                    cwd: workspaceRoot,
                    absolute: true,
                    unique: true,
                    suppressErrors: true
                });
                const jarPath = matches[0];
                if (!jarPath) {
                    throw new Error('Adaptive Tests Java CLI not found under cli/target.');
                }
                executable = 'java';
                spawnArgs = ['-jar', jarPath, 'discover', '--root', workspaceRoot, '--signature', signatureJson];
                break;
            }
            case 'php': {
                executable = process.platform === 'win32' ? 'npx.cmd' : 'npx';
                spawnArgs = ['adaptive-tests', 'why', signatureJson, '--json'];
                break;
            }
            case 'python': {
                executable = process.platform === 'win32' ? 'python.exe' : 'python3';
                spawnArgs = ['-m', 'adaptive_tests_py', 'discover', '--root', workspaceRoot, '--signature', signatureJson];
                break;
            }
            default:
                throw new Error(`Unsupported language: ${language}`);
        }
        const abortController = new AbortController();
        const timeout = setTimeout(() => abortController.abort(), 30000);
        try {
            const child = spawn(executable, spawnArgs, {
                cwd: workspaceRoot,
                stdio: ['ignore', 'pipe', 'pipe'],
                signal: abortController.signal
            });
            const [stdout, stderr, exitCode] = await Promise.all([
                this.collectStream(child.stdout),
                this.collectStream(child.stderr),
                new Promise((resolve, reject) => {
                    child.once('error', reject);
                    child.once('close', resolve);
                })
            ]);
            if (stderr) {
                console.warn(`Discovery CLI stderr (${language}):`, stderr);
            }
            if (exitCode !== null && exitCode !== 0) {
                throw new Error(`Discovery CLI exited with code ${exitCode}`);
            }
            const parsed = JSON.parse(stdout);
            if (Array.isArray(parsed)) {
                return parsed;
            }
            if (Array.isArray(parsed?.candidates)) {
                return parsed.candidates;
            }
            return [];
        }
        catch (error) {
            if (error?.name === 'AbortError') {
                throw new Error(`Discovery CLI timed out after 30s for ${language}.`);
            }
            console.error(`Language-specific discovery failed for ${language}:`, error);
            // Fallback to basic file system search
            return this.fallbackFileSystemSearch(workspaceRoot, signature, language);
        }
        finally {
            clearTimeout(timeout);
        }
    }
    async fallbackFileSystemSearch(workspaceRoot, signature, language) {
        const fg = require('fast-glob');
        const { promises: fs } = require('fs');
        const patterns = {
            java: ['**/*.java'],
            php: ['**/*.php'],
            python: ['**/*.py'],
            javascript: ['**/*.js', '**/*.jsx'],
            typescript: ['**/*.ts', '**/*.tsx']
        };
        const filePatterns = patterns[language] || patterns.javascript;
        const ignore = ['**/node_modules/**', '**/vendor/**', '**/.git/**', '**/target/**'];
        const candidates = [];
        for (const pattern of filePatterns) {
            try {
                const files = await fg(pattern, {
                    cwd: workspaceRoot,
                    ignore,
                    onlyFiles: true,
                    unique: true,
                    absolute: true,
                    suppressErrors: true
                });
                for (const file of files.slice(0, 20)) {
                    const content = await fs.readFile(file, 'utf8');
                    if (signature.name && content.toLowerCase().includes(signature.name.toLowerCase())) {
                        candidates.push({
                            path: file,
                            relativePath: path.relative(workspaceRoot, file),
                            score: 50,
                            reason: 'Name match in content',
                            language
                        });
                    }
                }
            }
            catch (error) {
                console.warn(`Failed to search pattern ${pattern}:`, error);
            }
        }
        return candidates;
    }
}
exports.DiscoveryLensPanel = DiscoveryLensPanel;
//# sourceMappingURL=DiscoveryLensPanel.js.map