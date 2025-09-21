export class RubyDiscoveryIntegration extends BaseLanguageIntegration {
    constructor(discoveryEngine: any);
    collector: RubyDiscoveryCollector;
    getFileExtension(): string;
    parseFile(filePath: any): Promise<any>;
    extractCandidates(metadata: any): any[];
    buildExports(metadata: any): any[];
    generateTestContent(target: any, options?: {}): string;
    generateRSpecTest(options: any): string;
}
export class RubyDiscoveryCollector {
    getFileExtension(): string;
    errorHandler: ErrorHandler;
    astBridgeScript: string;
    rubyInfo: {
        available: boolean;
        executable: string;
        version: any;
        hasRipper: boolean;
    } | {
        available: boolean;
        executable?: undefined;
        version?: undefined;
        hasRipper?: undefined;
    };
    useNativeRuby: boolean;
    parseCache: Map<any, any>;
    maxCacheSize: number;
    /**
     * Detect Ruby executable
     */
    detectRubyExecutable(): {
        available: boolean;
        executable: string;
        version: any;
        hasRipper: boolean;
    } | {
        available: boolean;
        executable?: undefined;
        version?: undefined;
        hasRipper?: undefined;
    };
    /**
     * Extract Ruby version
     */
    extractVersion(output: any): any;
    /**
     * Check if Ruby has Ripper (AST parser)
     */
    checkRipperSupport(exe: any): boolean;
    parseFile(filePath: any): Promise<any>;
    /**
     * Parse using native Ruby AST bridge
     */
    parseWithNativeRuby(filePath: any): Promise<{
        success: boolean;
        data: any;
        error?: undefined;
        message?: undefined;
    } | {
        success: boolean;
        error: any;
        message: any;
        data?: undefined;
    }>;
    /**
     * Transform native Ruby metadata to our format
     */
    transformNativeMetadata(metadata: any): {
        classes: any;
        modules: any;
        methods: any;
        parseMethod: any;
    };
    /**
     * Get cached parse result
     */
    getCachedParse(filePath: any): any;
    /**
     * Set cached parse result
     */
    setCachedParse(filePath: any, metadata: any): void;
    /**
     * Fallback regex parsing
     */
    parseWithRegex(filePath: any): {
        classes: never[];
        modules: never[];
        methods: any[];
    } | null;
    extractCandidates(metadata: any): any[];
    buildExports(metadata: any): any[];
    generateTestContent(target: any, options?: {}): string;
    generateRSpecTest({ target, signature, requirePath }: {
        target: any;
        signature: any;
        requirePath: any;
    }): string;
}
import { BaseLanguageIntegration } from "../base-language-integration";
import { ErrorHandler } from "../error-handler";
