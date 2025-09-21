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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscoveryEngine = void 0;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const fast_glob_1 = require("fast-glob");
class DiscoveryEngine {
    async discover(workspaceRoot, signature, options) {
        // Lazy load the adaptive tests module
        if (!this.adaptiveTests) {
            this.adaptiveTests = await Promise.resolve().then(() => __importStar(require('@adaptive-tests/javascript')));
        }
        const engine = new this.adaptiveTests.DiscoveryEngine(workspaceRoot);
        const candidates = await engine.collectCandidates(workspaceRoot, signature);
        // Sort by score
        candidates.sort((a, b) => (b.score || 0) - (a.score || 0));
        // Limit results
        const limited = candidates.slice(0, options.maxResults || 10);
        // Format results
        return limited.map((candidate) => ({
            path: candidate.path || candidate.absolutePath,
            relativePath: path_1.default.relative(workspaceRoot, candidate.path || candidate.absolutePath),
            score: options.includeScores ? candidate.score : undefined,
            language: candidate.language || this.detectLanguage(candidate.path || candidate.absolutePath),
            metadata: candidate.metadata || {}
        }));
    }
    async analyzeWorkspace(workspaceRoot) {
        const stats = {
            totalFiles: 0,
            languages: {},
            testFiles: 0,
            sourceFiles: 0,
            frameworks: [],
            recommendations: []
        };
        // Find all source files
        const files = await (0, fast_glob_1.glob)('**/*.{js,ts,jsx,tsx,java,php,py,go,rs}', {
            cwd: workspaceRoot,
            ignore: ['**/node_modules/**', '**/vendor/**', '**/.git/**', '**/dist/**', '**/build/**'],
            onlyFiles: true
        });
        stats.totalFiles = files.length;
        // Analyze file types
        for (const file of files) {
            const ext = path_1.default.extname(file);
            const lang = this.getLanguageFromExt(ext);
            stats.languages[lang] = (stats.languages[lang] || 0) + 1;
            if (file.includes('test') || file.includes('spec')) {
                stats.testFiles++;
            }
            else {
                stats.sourceFiles++;
            }
        }
        // Detect frameworks
        try {
            const packageJsonPath = path_1.default.join(workspaceRoot, 'package.json');
            const packageJson = JSON.parse(await fs_1.promises.readFile(packageJsonPath, 'utf8'));
            const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
            if (deps['react'])
                stats.frameworks.push('React');
            if (deps['vue'])
                stats.frameworks.push('Vue');
            if (deps['@angular/core'])
                stats.frameworks.push('Angular');
            if (deps['express'])
                stats.frameworks.push('Express');
            if (deps['jest'])
                stats.frameworks.push('Jest');
            if (deps['vitest'])
                stats.frameworks.push('Vitest');
            if (deps['mocha'])
                stats.frameworks.push('Mocha');
        }
        catch {
            // No package.json or error reading it
        }
        // Generate recommendations
        if (stats.testFiles < stats.sourceFiles * 0.3) {
            stats.recommendations.push('Consider adding more test coverage (currently ' +
                Math.round(stats.testFiles / stats.sourceFiles * 100) + '%)');
        }
        if (!stats.frameworks.some(f => ['Jest', 'Vitest', 'Mocha'].includes(f))) {
            stats.recommendations.push('Consider adding a test framework');
        }
        const mainLanguage = Object.entries(stats.languages)
            .sort(([, a], [, b]) => b - a)[0]?.[0];
        if (mainLanguage) {
            stats.recommendations.push(`Primary language detected: ${mainLanguage}`);
        }
        return stats;
    }
    detectLanguage(filePath) {
        const ext = path_1.default.extname(filePath).toLowerCase();
        return this.getLanguageFromExt(ext);
    }
    getLanguageFromExt(ext) {
        const langMap = {
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.java': 'java',
            '.php': 'php',
            '.py': 'python',
            '.go': 'go',
            '.rs': 'rust'
        };
        return langMap[ext] || 'unknown';
    }
}
exports.DiscoveryEngine = DiscoveryEngine;
//# sourceMappingURL=discovery-engine.js.map