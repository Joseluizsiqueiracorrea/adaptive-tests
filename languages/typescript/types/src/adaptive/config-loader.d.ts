export class ConfigLoader {
    /**
     * Get the default configuration
     */
    static getDefaultConfig(): any;
    constructor(rootPath?: string);
    rootPath: string;
    config: any;
    validator: ConfigSchemaValidator;
    logger: {};
    /**
     * Load configuration from all sources and merge
     * @param {object} inlineConfig - Configuration passed directly
     * @returns {object} Merged configuration
     */
    load(inlineConfig?: object): object;
    /**
     * Load config from package.json
     */
    loadFromPackageJson(): any;
    /**
     * Load config from .adaptive-testsrc.json
     */
    loadFromJsonFile(): any;
    /**
     * Load config from adaptive-tests.config.js
     */
    loadFromJsFile(): any;
    /**
     * Validate configuration
     */
    validateConfig(config: any): any;
    /**
     * Deep clone an object
     */
    deepClone(obj: any): any;
    /**
     * Deep merge two objects
     */
    deepMerge(target: any, source: any): any;
    /**
     * Auto-detect and configure languages based on project structure
     */
    autoConfigureLanguages(config: any): any;
    /**
     * Detect project languages based on files and dependencies
     */
    detectProjectLanguages(): any[];
    /**
     * Recursively scan directory for language files
     */
    scanDirectoryForLanguages(dirPath: any, languages: any, depth?: number): void;
    /**
     * Validate configuration using enhanced schema
     */
    validateEnhancedConfig(config: any): any;
    /**
     * Normalize configuration values
     */
    normalizeConfig(config: any): any;
    /**
     * Get language-specific configuration
     */
    getLanguageConfig(language: any): any;
    /**
     * Check if a language is enabled
     */
    isLanguageEnabled(language: any): boolean;
    /**
     * Clear cached configuration
     */
    clearCache(): void;
}
import { ConfigSchemaValidator } from "./enhanced-config-schema";
export declare let DEFAULT_CONFIG: any;
