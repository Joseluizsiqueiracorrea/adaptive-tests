import { ConfigSchemaValidator, ENHANCED_CONFIG_SCHEMA } from "./enhanced-config-schema";

export declare class ConfigLoader {
    constructor(rootPath?: string);
    rootPath: string;
    config: any;
    validator: ConfigSchemaValidator;
    logger: any;
    load(inlineConfig?: Record<string, unknown>): any;
    loadFromPackageJson(): any;
    loadFromJsonFile(): any;
    loadFromJsFile(): any;
    validateConfig(config: any): any;
    deepClone<T>(obj: T): T;
    deepMerge<T>(target: T, source: Partial<T>): T;
    autoConfigureLanguages(config: any): any;
    detectProjectLanguages(): string[];
    scanDirectoryForLanguages(dirPath: string, languages: Set<string>, depth?: number): void;
    validateEnhancedConfig(config: any): any;
    normalizeConfig(config: any): any;
    getLanguageConfig(language: string): any;
    isLanguageEnabled(language: string): boolean;
    clearCache(): void;
}

export declare const DEFAULT_CONFIG: typeof ENHANCED_CONFIG_SCHEMA;
