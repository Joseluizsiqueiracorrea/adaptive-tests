export class PHPDiscoveryCollector {
    constructor(config?: {});
    errorHandler: ErrorHandler;
    astBridgeScript: string;
    phpInfo: {
        available: boolean;
        executable: string;
        version: any;
        hasTokenizer: boolean;
    } | {
        available: boolean;
        executable?: undefined;
        version?: undefined;
        hasTokenizer?: undefined;
    };
    useNativePHP: boolean;
    parseCache: Map<any, any>;
    maxCacheSize: number;
    config: {
        extensions: string[];
        skipPatterns: string[];
    };
    /**
     * Detect PHP executable
     */
    detectPhpExecutable(): {
        available: boolean;
        executable: string;
        version: any;
        hasTokenizer: boolean;
    } | {
        available: boolean;
        executable?: undefined;
        version?: undefined;
        hasTokenizer?: undefined;
    };
    /**
     * Extract PHP version
     */
    extractVersion(output: any): any;
    /**
     * Check if a file should be scanned
     */
    shouldScanFile(filePath: any): boolean;
    /**
     * Parse a PHP file and extract metadata
     */
    parseFile(filePath: any): Promise<{
        path: any;
        namespace: null;
        imports: never[];
        classes: never[];
        interfaces: never[];
        traits: never[];
        functions: never[];
        constants: never[];
    } | null>;
    /**
     * Transform native PHP metadata to our format
     */
    transformNativeMetadata(metadata: any): {
        namespace: any;
        uses: any;
        classes: any;
        interfaces: any;
        traits: any;
        functions: any;
        constants: any;
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
     * Basic extraction fallback
     */
    basicExtraction(filePath: any): {
        namespace: null;
        classes: never[];
        interfaces: never[];
        traits: never[];
        functions: never[];
        parseMethod: string;
    } | null;
    /**
     * Extract metadata from PHP AST
     */
    extractMetadata(ast: any, filePath: any): {
        path: any;
        namespace: null;
        imports: never[];
        classes: never[];
        interfaces: never[];
        traits: never[];
        functions: never[];
        constants: never[];
    };
    /**
     * Extract class information
     */
    extractClassInfo(node: any): {
        name: any;
        type: string;
        isAbstract: any;
        isFinal: any;
        extends: any;
        implements: any;
        traits: never[];
        methods: never[];
        properties: never[];
        constants: never[];
    };
    /**
     * Extract interface information
     */
    extractInterfaceInfo(node: any): {
        name: any;
        type: string;
        extends: any;
        methods: any;
    };
    /**
     * Extract trait information
     */
    extractTraitInfo(node: any): {
        name: any;
        type: string;
        methods: any;
    };
    /**
     * Extract method information
     */
    extractMethodInfo(node: any): {
        name: any;
        visibility: any;
        isStatic: any;
        isAbstract: any;
        isFinal: any;
        parameters: any;
        returnType: any;
    };
    /**
     * Extract property information
     */
    extractPropertyInfo(node: any): {
        name: any;
        visibility: any;
        isStatic: any;
        type: any;
        hasDefault: boolean;
    };
    /**
     * Extract function information
     */
    extractFunctionInfo(node: any): {
        name: any;
        parameters: any;
        returnType: any;
    };
    /**
     * Generic AST traversal helper
     */
    traverse(node: any, visitors: any): void;
    /**
     * Create a discovery signature from PHP metadata
     */
    createSignature(metadata: any, targetName: any): {
        name: any;
        type: string;
        methods?: undefined;
        properties?: undefined;
    } | {
        name: any;
        type: string;
        methods: any;
        properties?: undefined;
    } | {
        name: any;
        type: string;
        methods: any;
        properties: any;
    } | null;
    /**
     * Format PHP namespace path
     */
    formatNamespace(namespace: any, className: any): any;
}
import { ErrorHandler } from "../error-handler";
