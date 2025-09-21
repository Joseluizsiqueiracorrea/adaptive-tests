export class WolframDiscoveryCollector {
    errorHandler: ErrorHandler;
    astBridgeScript: string;
    fallbackBridgeScript: string;
    kernelInfo: {
        available: boolean;
        executable: string;
        version: any;
        priority: number;
        hasCodeParse: boolean;
    } | {
        available: boolean;
        executable?: undefined;
        version?: undefined;
        priority?: undefined;
        hasCodeParse?: undefined;
    };
    useKernel: boolean;
    supportedExtensions: string[];
    parseCache: Map<any, any>;
    maxCacheSize: number;
    /**
     * Detect Wolfram kernel availability and version
     */
    detectWolframKernel(): {
        available: boolean;
        executable: string;
        version: any;
        priority: number;
        hasCodeParse: boolean;
    } | {
        available: boolean;
        executable?: undefined;
        version?: undefined;
        priority?: undefined;
        hasCodeParse?: undefined;
    };
    /**
     * Extract version from Wolfram output
     */
    extractVersion(output: any): any;
    /**
     * Check if CodeParse is supported (Wolfram 11.2+)
     */
    checkCodeParseSupport(version: any): boolean;
    shouldScanFile(filePath: any): boolean;
    parseFile(filePath: any): Promise<any>;
    /**
     * Parse file using Wolfram kernel for enhanced accuracy
     */
    parseWithKernel(filePath: any): Promise<{
        success: boolean;
        data: any;
        error?: undefined;
        message?: undefined;
    } | {
        success: boolean;
        error: any;
        message: any;
        data?: undefined;
    } | {
        success: boolean;
        metadata: any;
    } | {
        success: boolean;
        metadata?: undefined;
    }>;
    /**
     * Parse using advanced AST bridge
     */
    parseWithASTBridge(filePath: any): Promise<{
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
     * Parse using fallback bridge
     */
    parseWithFallbackBridge(filePath: any): Promise<{
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
    parseWolframCode(content: any, filePath: any): Promise<{
        path: any;
        packages: never[];
        contexts: never[];
        functions: never[];
        patterns: never[];
        symbols: never[];
        rules: never[];
        tests: never[];
        options: never[];
    }>;
    parseNotebook(content: any, filePath: any): Promise<{
        path: any;
        packages: never[];
        contexts: never[];
        functions: never[];
        patterns: never[];
        symbols: never[];
        rules: never[];
        tests: never[];
        options: never[];
        cells: never[];
    }>;
    parseParameters(paramString: any): {
        name: any;
        pattern: null;
        optional: boolean;
        sequence: boolean;
    }[];
    parseDependencies(depString: any): any[];
    parseOptions(optString: any): {
        name: any;
        defaultValue: any;
    }[];
    removeComments(content: any): any;
    extractBalancedExpression(lines: any, startLine: any, functionName: any): string | null;
    extractCellContent(cellExpression: any): any;
    unescapeNotebookCode(code: any): any;
    mergeMetadata(target: any, source: any): void;
    /**
     * Extract exports from metadata
     */
    extractExports(metadata: any): ({
        name: any;
        type: string;
        exports: any;
        context: any;
        fullName?: undefined;
        hasPattern?: undefined;
        parameters?: undefined;
        isConstant?: undefined;
    } | {
        name: any;
        type: string;
        fullName: any;
        context: any;
        hasPattern: any;
        parameters: any;
        exports?: undefined;
        isConstant?: undefined;
    } | {
        name: any;
        type: string;
        fullName: any;
        context: any;
        isConstant: any;
        exports?: undefined;
        hasPattern?: undefined;
        parameters?: undefined;
    })[];
    /**
     * Get all supported file extensions
     */
    getSupportedExtensions(): string[];
    /**
     * Get cached parse result
     */
    getCachedParse(filePath: any): any;
    /**
     * Set cached parse result
     */
    setCachedParse(filePath: any, metadata: any): void;
    /**
     * Clear parse cache
     */
    clearCache(): void;
    /**
     * Validate metadata structure
     */
    validateMetadata(metadata: any): boolean;
    /**
     * Clean and normalize metadata
     */
    normalizeMetadata(metadata: any): any;
}
import { ErrorHandler } from "../error-handler";
