/**
 * Configuration Service
 * Centralized configuration management with validation and caching
 */

import * as vscode from 'vscode';
import { Logger } from '../core/logger';
import { z } from 'zod';

// Configuration schema with Zod validation
const ConfigSchema = z.object({
  discovery: z.object({
    showScores: z.boolean().default(true),
    maxResults: z.number().min(1).max(100).default(10),
    enableAI: z.boolean().default(true),
    cacheTimeout: z.number().min(0).default(900000), // 15 minutes
    performanceMode: z.enum(['balanced', 'performance', 'quality']).default('balanced')
  }),
  scaffold: z.object({
    outputDirectory: z.string().default('tests/adaptive'),
    autoOpen: z.boolean().default(true),
    generateCoverage: z.boolean().default(true),
    useAIAssertions: z.boolean().default(true),
    templateStyle: z.enum(['jest', 'vitest', 'mocha', 'adaptive']).default('adaptive')
  }),
  telemetry: z.object({
    enabled: z.boolean().default(true),
    crashReports: z.boolean().default(true),
    performanceMetrics: z.boolean().default(true),
    usageStatistics: z.boolean().default(false),
    anonymousId: z.string().optional()
  }),
  ui: z.object({
    theme: z.enum(['auto', 'light', 'dark', 'high-contrast']).default('auto'),
    animations: z.boolean().default(true),
    liquidGlass: z.boolean().default(true),
    compactMode: z.boolean().default(false),
    showTips: z.boolean().default(true)
  }),
  experimental: z.object({
    mcpServers: z.boolean().default(false),
    copilotIntegration: z.boolean().default(false),
    liveShare: z.boolean().default(false),
    remoteContainers: z.boolean().default(false)
  })
});

export type Config = z.infer<typeof ConfigSchema>;

export class ConfigService implements vscode.Disposable {
  private config: Config;
  private disposables: vscode.Disposable[] = [];
  private changeEmitter = new vscode.EventEmitter<Config>();
  public readonly onDidChangeConfiguration = this.changeEmitter.event;

  constructor(private logger: Logger) {
    this.config = this.loadConfiguration();
    this.setupConfigWatcher();
    this.logger.info('ConfigService initialized', { config: this.config });
  }

  private loadConfiguration(): Config {
    const vsConfig = vscode.workspace.getConfiguration('adaptive-tests');
    const rawConfig = {
      discovery: {
        showScores: vsConfig.get<boolean>('discovery.showScores'),
        maxResults: vsConfig.get<number>('discovery.maxResults'),
        enableAI: vsConfig.get<boolean>('discovery.enableAI'),
        cacheTimeout: vsConfig.get<number>('discovery.cacheTimeout'),
        performanceMode: vsConfig.get<string>('discovery.performanceMode')
      },
      scaffold: {
        outputDirectory: vsConfig.get<string>('scaffold.outputDirectory'),
        autoOpen: vsConfig.get<boolean>('scaffold.autoOpen'),
        generateCoverage: vsConfig.get<boolean>('scaffold.generateCoverage'),
        useAIAssertions: vsConfig.get<boolean>('scaffold.useAIAssertions'),
        templateStyle: vsConfig.get<string>('scaffold.templateStyle')
      },
      telemetry: {
        enabled: vsConfig.get<boolean>('telemetry.enabled'),
        crashReports: vsConfig.get<boolean>('telemetry.crashReports'),
        performanceMetrics: vsConfig.get<boolean>('telemetry.performanceMetrics'),
        usageStatistics: vsConfig.get<boolean>('telemetry.usageStatistics'),
        anonymousId: this.getOrCreateAnonymousId()
      },
      ui: {
        theme: vsConfig.get<string>('ui.theme'),
        animations: vsConfig.get<boolean>('ui.animations'),
        liquidGlass: vsConfig.get<boolean>('ui.liquidGlass'),
        compactMode: vsConfig.get<boolean>('ui.compactMode'),
        showTips: vsConfig.get<boolean>('ui.showTips')
      },
      experimental: {
        mcpServers: vsConfig.get<boolean>('experimental.mcpServers'),
        copilotIntegration: vsConfig.get<boolean>('experimental.copilotIntegration'),
        liveShare: vsConfig.get<boolean>('experimental.liveShare'),
        remoteContainers: vsConfig.get<boolean>('experimental.remoteContainers')
      }
    };

    try {
      return ConfigSchema.parse(rawConfig);
    } catch (error) {
      this.logger.warn('Configuration validation failed, using defaults', { error });
      return ConfigSchema.parse({});
    }
  }

  private setupConfigWatcher(): void {
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

  private getOrCreateAnonymousId(): string {
    const context = this.getExtensionContext();
    if (!context) return '';

    let id = context.globalState.get<string>('anonymousId');
    if (!id) {
      id = this.generateAnonymousId();
      context.globalState.update('anonymousId', id);
    }
    return id;
  }

  private generateAnonymousId(): string {
    return `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private getExtensionContext(): vscode.ExtensionContext | undefined {
    // This would be injected via DI in production
    return (globalThis as any).__extensionContext;
  }

  public get<K extends keyof Config>(key: K): Config[K] {
    return this.config[key];
  }

  public getAll(): Config {
    return { ...this.config };
  }

  public async update<K extends keyof Config>(
    key: K,
    value: Config[K],
    target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Workspace
  ): Promise<void> {
    const config = vscode.workspace.getConfiguration('adaptive-tests');

    // Flatten nested configuration
    const updates: Array<{ key: string; value: any }> = [];
    const flatten = (obj: any, prefix: string = '') => {
      for (const [k, v] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${k}` : k;
        if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
          flatten(v, fullKey);
        } else {
          updates.push({ key: fullKey, value: v });
        }
      }
    };

    flatten(value, key as string);

    // Apply all updates
    for (const { key: updateKey, value: updateValue } of updates) {
      await config.update(updateKey, updateValue, target);
    }

    this.logger.info('Configuration updated', { key, value, target });
  }

  public validate(): { valid: boolean; errors?: string[] } {
    try {
      ConfigSchema.parse(this.config);
      return { valid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`)
        };
      }
      return { valid: false, errors: ['Unknown validation error'] };
    }
  }

  public reset(): void {
    this.config = ConfigSchema.parse({});
    this.changeEmitter.fire(this.config);
    this.logger.info('Configuration reset to defaults');
  }

  public dispose(): void {
    this.changeEmitter.dispose();
    this.disposables.forEach(d => d.dispose());
  }
}