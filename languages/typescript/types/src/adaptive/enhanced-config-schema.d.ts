export interface LanguageConfig {
    enabled: boolean;
    extensions: string[];
    skipPatterns: string[];
    scoring: Record<string, unknown>;
    parser: Record<string, unknown>;
    testGeneration: Record<string, unknown>;
}

export declare const LANGUAGE_EXTENSIONS: {
    javascript: string[];
    typescript: string[];
};

export declare const DEFAULT_LANGUAGE_CONFIG: LanguageConfig;

export declare const ENHANCED_CONFIG_SCHEMA: {
    discovery: {
        extensions: string[];
        maxDepth: number;
        concurrency: number;
        skipDirectories: string[];
        cache: Record<string, unknown>;
        scoring: Record<string, unknown>;
        security: Record<string, unknown>;
        languages: {
            javascript: LanguageConfig;
            typescript: LanguageConfig;
        };
    };
    scoring: Record<string, unknown>;
    testGeneration: Record<string, unknown>;
};

export declare class ConfigSchemaValidator {
    constructor();
    validate(config: unknown): {
        valid: boolean;
        errors: string[];
    };
    mergeWithDefaults(userConfig?: unknown): any;
    deepMerge(target: unknown, source: unknown): any;
}
