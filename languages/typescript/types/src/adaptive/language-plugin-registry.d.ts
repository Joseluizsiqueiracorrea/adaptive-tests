export class LanguagePluginRegistry {
    /**
     * Singleton pattern for global access
     */
    static getInstance(config?: {}): any;
    /**
     * Reset singleton (useful for testing)
     */
    static resetInstance(): void;
    constructor(config?: {});
    plugins: Map<any, any>;
    pluginClasses: Map<any, any>;
    extensionMap: Map<any, any>;
    pluginPaths: Map<any, any>;
    config: {};
    loaded: boolean;
    logger: {};
    errors: Map<any, any>;
    /**
     * Initialize the registry by discovering and registering plugins
     */
    initialize(): Promise<void>;
    /**
     * Discover language plugins by scanning the adaptive directory
     */
    discoverPlugins(): Promise<void>;
    /**
     * Discover plugin in a specific directory
     */
    discoverPluginInDirectory(dirPath: any): Promise<void>;
    /**
     * Register a plugin class
     */
    registerPlugin(language: any, PluginClass: any, filePath: any): void;
    /**
     * Check if a class is a valid plugin
     */
    isValidPlugin(PluginClass: any): boolean;
    /**
     * Get a plugin instance by language name
     */
    getPlugin(language: any, discoveryEngine?: null): Promise<any>;
    /**
     * Get a plugin by file extension
     */
    getPluginByExtension(extension: any, discoveryEngine?: null): Promise<any>;
    /**
     * Get all supported file extensions
     */
    getSupportedExtensions(): Promise<any[]>;
    /**
     * Get all supported languages
     */
    getSupportedLanguages(): Promise<any[]>;
    /**
     * Get plugin metadata
     */
    getPluginMetadata(): Promise<{}>;
    /**
     * Check if a plugin is disabled by configuration
     */
    isPluginDisabled(language: any): boolean;
    /**
     * Detect language from file path
     */
    detectLanguage(filePath: any): Promise<any>;
    /**
     * Clear plugin cache (useful for testing)
     */
    clearCache(): void;
    /**
     * Get registry statistics
     */
    getStats(): {
        totalPlugins: number;
        loadedInstances: number;
        supportedExtensions: number;
        errors: number;
        loaded: boolean;
    };
    /**
     * Capitalize first letter of string
     */
    capitalize(str: any): any;
}
