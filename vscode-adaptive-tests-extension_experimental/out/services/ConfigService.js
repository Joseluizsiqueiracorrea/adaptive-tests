"use strict";
/**
 * Configuration Service
 * Centralized configuration management with validation and caching
 */
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
exports.ConfigService = void 0;
const vscode = __importStar(require("vscode"));
const zod_1 = require("zod");
// Configuration schema with Zod validation
const ConfigSchema = zod_1.z.object({
    discovery: zod_1.z.object({
        showScores: zod_1.z.boolean().default(true),
        maxResults: zod_1.z.number().min(1).max(100).default(10),
        enableAI: zod_1.z.boolean().default(true),
        cacheTimeout: zod_1.z.number().min(0).default(900000), // 15 minutes
        performanceMode: zod_1.z.enum(['balanced', 'performance', 'quality']).default('balanced')
    }),
    scaffold: zod_1.z.object({
        outputDirectory: zod_1.z.string().default('tests/adaptive'),
        autoOpen: zod_1.z.boolean().default(true),
        generateCoverage: zod_1.z.boolean().default(true),
        useAIAssertions: zod_1.z.boolean().default(true),
        templateStyle: zod_1.z.enum(['jest', 'vitest', 'mocha', 'adaptive']).default('adaptive')
    }),
    telemetry: zod_1.z.object({
        enabled: zod_1.z.boolean().default(true),
        crashReports: zod_1.z.boolean().default(true),
        performanceMetrics: zod_1.z.boolean().default(true),
        usageStatistics: zod_1.z.boolean().default(false),
        anonymousId: zod_1.z.string().optional()
    }),
    ui: zod_1.z.object({
        theme: zod_1.z.enum(['auto', 'light', 'dark', 'high-contrast']).default('auto'),
        animations: zod_1.z.boolean().default(true),
        liquidGlass: zod_1.z.boolean().default(true),
        compactMode: zod_1.z.boolean().default(false),
        showTips: zod_1.z.boolean().default(true)
    }),
    experimental: zod_1.z.object({
        mcpServers: zod_1.z.boolean().default(false),
        copilotIntegration: zod_1.z.boolean().default(false),
        liveShare: zod_1.z.boolean().default(false),
        remoteContainers: zod_1.z.boolean().default(false)
    })
});
class ConfigService {
    constructor(logger) {
        this.logger = logger;
        this.disposables = [];
        this.changeEmitter = new vscode.EventEmitter();
        this.onDidChangeConfiguration = this.changeEmitter.event;
        this.config = this.loadConfiguration();
        this.setupConfigWatcher();
        this.logger.info('ConfigService initialized', { config: this.config });
    }
    loadConfiguration() {
        const vsConfig = vscode.workspace.getConfiguration('adaptive-tests');
        const rawConfig = {
            discovery: {
                showScores: vsConfig.get('discovery.showScores'),
                maxResults: vsConfig.get('discovery.maxResults'),
                enableAI: vsConfig.get('discovery.enableAI'),
                cacheTimeout: vsConfig.get('discovery.cacheTimeout'),
                performanceMode: vsConfig.get('discovery.performanceMode')
            },
            scaffold: {
                outputDirectory: vsConfig.get('scaffold.outputDirectory'),
                autoOpen: vsConfig.get('scaffold.autoOpen'),
                generateCoverage: vsConfig.get('scaffold.generateCoverage'),
                useAIAssertions: vsConfig.get('scaffold.useAIAssertions'),
                templateStyle: vsConfig.get('scaffold.templateStyle')
            },
            telemetry: {
                enabled: vsConfig.get('telemetry.enabled'),
                crashReports: vsConfig.get('telemetry.crashReports'),
                performanceMetrics: vsConfig.get('telemetry.performanceMetrics'),
                usageStatistics: vsConfig.get('telemetry.usageStatistics'),
                anonymousId: this.getOrCreateAnonymousId()
            },
            ui: {
                theme: vsConfig.get('ui.theme'),
                animations: vsConfig.get('ui.animations'),
                liquidGlass: vsConfig.get('ui.liquidGlass'),
                compactMode: vsConfig.get('ui.compactMode'),
                showTips: vsConfig.get('ui.showTips')
            },
            experimental: {
                mcpServers: vsConfig.get('experimental.mcpServers'),
                copilotIntegration: vsConfig.get('experimental.copilotIntegration'),
                liveShare: vsConfig.get('experimental.liveShare'),
                remoteContainers: vsConfig.get('experimental.remoteContainers')
            }
        };
        try {
            return ConfigSchema.parse(rawConfig);
        }
        catch (error) {
            this.logger.warn('Configuration validation failed, using defaults', { error });
            return ConfigSchema.parse({});
        }
    }
    setupConfigWatcher() {
        const watcher = vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('adaptive-tests')) {
                const oldConfig = this.config;
                this.config = this.loadConfiguration();
                this.changeEmitter.fire(this.config);
                this.logger.info('Configuration changed', {
                    old: oldConfig,
                    new: this.config
                });
            }
        });
        this.disposables.push(watcher);
    }
    getOrCreateAnonymousId() {
        const context = this.getExtensionContext();
        if (!context)
            return '';
        let id = context.globalState.get('anonymousId');
        if (!id) {
            id = this.generateAnonymousId();
            context.globalState.update('anonymousId', id);
        }
        return id;
    }
    generateAnonymousId() {
        return `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
    getExtensionContext() {
        // This would be injected via DI in production
        return globalThis.__extensionContext;
    }
    get(key) {
        return this.config[key];
    }
    getAll() {
        return { ...this.config };
    }
    async update(key, value, target = vscode.ConfigurationTarget.Workspace) {
        const config = vscode.workspace.getConfiguration('adaptive-tests');
        // Flatten nested configuration
        const updates = [];
        const flatten = (obj, prefix = '') => {
            for (const [k, v] of Object.entries(obj)) {
                const fullKey = prefix ? `${prefix}.${k}` : k;
                if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
                    flatten(v, fullKey);
                }
                else {
                    updates.push({ key: fullKey, value: v });
                }
            }
        };
        flatten(value, key);
        // Apply all updates
        for (const { key: updateKey, value: updateValue } of updates) {
            await config.update(updateKey, updateValue, target);
        }
        this.logger.info('Configuration updated', { key, value, target });
    }
    validate() {
        try {
            ConfigSchema.parse(this.config);
            return { valid: true };
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return {
                    valid: false,
                    errors: error.issues.map((e) => `${e.path.join('.')}: ${e.message}`)
                };
            }
            return { valid: false, errors: ['Unknown validation error'] };
        }
    }
    reset() {
        this.config = ConfigSchema.parse({});
        this.changeEmitter.fire(this.config);
        this.logger.info('Configuration reset to defaults');
    }
    dispose() {
        this.changeEmitter.dispose();
        this.disposables.forEach(d => d.dispose());
    }
}
exports.ConfigService = ConfigService;
//# sourceMappingURL=ConfigService.js.map