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
exports.AdaptiveTestsCodeLensProvider = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
// Use a dynamic import for the engine to avoid making it a hard dependency.
let DiscoveryEngine;
class AdaptiveTestsCodeLensProvider {
    constructor() {
        this._onDidChangeCodeLenses = new vscode.EventEmitter();
        this.onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;
        vscode.workspace.onDidChangeConfiguration((_) => {
            this._onDidChangeCodeLenses.fire();
        });
        this.loadEngine();
    }
    async loadEngine() {
        if (!DiscoveryEngine) {
            try {
                // Dynamically import the engine from the workspace's version
                const adaptiveTests = require('@adaptive-tests/javascript');
                DiscoveryEngine = adaptiveTests.DiscoveryEngine;
            }
            catch (e) {
                console.error("Failed to load '@adaptive-tests/javascript'. CodeLens will be disabled.", e);
                return;
            }
        }
        if (DiscoveryEngine && !this.engine) {
            this.engine = new DiscoveryEngine();
        }
    }
    async provideCodeLenses(document, token) {
        await this.loadEngine();
        if (!this.engine) {
            return [];
        }
        const codeLenses = [];
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
                    if (line < 0 || line >= document.lineCount)
                        continue;
                    const range = new vscode.Range(line, 0, line, document.lineAt(line).text.length);
                    const testExists = await this.checkTestExists(document, info.name);
                    if (testExists) {
                        codeLenses.push(new vscode.CodeLens(range, {
                            title: '✓ Adaptive test exists',
                            tooltip: 'An adaptive test already exists for this item',
                            command: 'adaptive-tests.openTest',
                            arguments: [document.uri, info.name]
                        }));
                    }
                    else {
                        codeLenses.push(new vscode.CodeLens(range, {
                            title: '$(add) Generate adaptive test',
                            tooltip: 'Generate an adaptive test for this item',
                            command: 'adaptive-tests.scaffoldFile',
                            arguments: [document.uri]
                        }));
                    }
                }
            }
        }
        // Add general discovery lens at the beginning of the file if any exports were found
        if (metadata && metadata.exports && metadata.exports.length > 0 && codeLenses.length === 0) {
            const range = new vscode.Range(0, 0, 0, 0);
            codeLenses.push(new vscode.CodeLens(range, {
                title: '$(search) Run discovery',
                tooltip: 'See how elements in this file would be discovered',
                command: 'adaptive-tests.runDiscovery',
                arguments: [document.uri]
            }));
        }
        return codeLenses;
    }
    resolveCodeLens(codeLens, token) {
        return codeLens;
    }
    async checkTestExists(document, name) {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
        if (!workspaceFolder) {
            return false;
        }
        const config = vscode.workspace.getConfiguration('adaptive-tests');
        const testDir = config.get('scaffold.outputDirectory', 'tests/adaptive');
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
            }
            catch {
                // File does not exist, continue checking
            }
        }
        return false;
    }
}
exports.AdaptiveTestsCodeLensProvider = AdaptiveTestsCodeLensProvider;
//# sourceMappingURL=CodeLensProvider.js.map