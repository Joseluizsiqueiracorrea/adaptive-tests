export class BaseLanguageIntegration {
    constructor(discoveryEngine: any, language: any);
    engine: any;
    language: any;
    errorHandler: ErrorHandler;
    asyncHelper: {
        language: any;
        operationManager: {
            defaultTimeout: any;
            defaultRetries: any;
            errorHandler: ErrorHandler;
            execute(operation: any, options?: {}): Promise<any>;
            withTimeout(operation: any, timeoutMs: any, context?: {}): Promise<any>;
            delay(ms: any): Promise<any>;
            executeParallel(operations: any, options?: {}): Promise<any[]>;
            processSettledResults(results: any, context?: {}): any[];
            debounce(fn: any, delayMs?: number): (...args: any[]) => Promise<any>;
            throttle(fn: any, limitMs?: number): (...args: any[]) => Promise<any>;
        };
        fileOps: {
            operationManager: {
                defaultTimeout: any;
                defaultRetries: any;
                errorHandler: ErrorHandler;
                execute(operation: any, options?: {}): Promise<any>;
                withTimeout(operation: any, timeoutMs: any, context?: {}): Promise<any>;
                delay(ms: any): Promise<any>;
                executeParallel(operations: any, options?: {}): Promise<any[]>;
                processSettledResults(results: any, context?: {}): any[];
                debounce(fn: any, delayMs?: number): (...args: any[]) => Promise<any>;
                throttle(fn: any, limitMs?: number): (...args: any[]) => Promise<any>;
            };
            errorHandler: ErrorHandler;
            readFile(filePath: any, options?: {}): Promise<any>;
            writeFile(filePath: any, content: any, options?: {}): Promise<any>;
            readDirectory(dirPath: any, options?: {}): Promise<any>;
            stat(filePath: any, options?: {}): Promise<any>;
            exists(filePath: any, options?: {}): Promise<boolean>;
        };
        errorHandler: ErrorHandler;
        evaluateCandidate(filePath: any, signature: {} | undefined, evaluationFn: any): Promise<any>;
        parseFile(filePath: any, parseFn: any, options?: {}): Promise<any>;
        generateTest(target: any, generateFn: any, options?: {}): Promise<any>;
    };
    /**
     * Add language extension to discovery engine config if not present
     */
    addExtensionToConfig(): void;
    /**
     * Get the file extension for this language
     * Must be implemented by subclasses
     */
    getFileExtension(): void;
    /**
     * Shared candidate scoring algorithm
     * Uses common patterns found across all language integrations
     */
    scoreCandidate(candidate: any, signature: any, normalizedTargetName: any, metadata: any): number;
    /**
     * Score based on name matching patterns
     * Common algorithm used across all language integrations
     */
    scoreNameMatching(candidate: any, normalizedTargetName: any): number;
    /**
     * Score based on type matching
     * Common algorithm with language-specific type mappings
     */
    scoreTypeMatching(candidate: any, signature: any): number;
    /**
     * Score based on package/namespace matching
     * Default implementation - can be overridden by language-specific integrations
     */
    scorePackageMatching(candidate: any, signature: any, metadata: any): number;
    /**
     * Score based on method matching
     * Common algorithm across most languages
     */
    scoreMethodMatching(candidate: any, signature: any, metadata: any): number;
    /**
     * Get candidate methods for scoring
     * Default implementation - can be overridden by language-specific integrations
     */
    getCandidateMethods(candidate: any, metadata: any): Set<any>;
    /**
     * Score based on visibility preferences
     * Common algorithm preferring public/exported items
     */
    scoreVisibility(candidate: any): number;
    /**
     * Language-specific scoring extensions
     * Override in subclasses to add language-specific scoring logic
     */
    scoreLanguageSpecific(candidate: any, signature: any, metadata: any): number;
    /**
     * Check if candidate type matches signature type
     * Default implementation - should be overridden by language-specific integrations
     */
    matchesType(candidateType: any, signatureType: any): boolean;
    /**
     * Check if candidate type is compatible with signature type
     * Override in subclasses for language-specific type compatibility rules
     */
    isCompatibleType(candidateType: any, signatureType: any): boolean;
    /**
     * Evaluate a candidate file
     * Common structure across all language integrations
     */
    evaluateCandidate(filePath: any, signature?: {}): Promise<{
        path: any;
        score: number;
        metadata: never;
        match: null;
        language: any;
    } | null>;
    /**
     * Calculate score for metadata
     * Common structure across all language integrations
     */
    calculateScore(metadata: any, signature?: {}): {
        score: number;
        match: null;
    } | null;
    /**
     * Extract candidates from metadata
     * Must be implemented by subclasses to return language-specific candidates
     */
    extractCandidates(metadata: any): void;
    /**
     * Parse a file and extract metadata
     * Must be implemented by subclasses
     */
    parseFile(filePath: any): Promise<void>;
    /**
     * Generate test content for a target
     * Must be implemented by subclasses
     */
    generateTestContent(target: any, options?: {}): void;
    /**
     * Safe wrapper for file parsing operations (legacy - use standardized async methods)
     * @deprecated Use evaluateCandidateAsync or parseFileAsync instead
     */
    safeParseFile(filePath: any, parseOperation: any): Promise<{
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
     * Standardized async candidate evaluation
     */
    evaluateCandidateAsync(filePath: any, signature?: {}): Promise<any>;
    /**
     * Standardized async file parsing
     */
    parseFileAsync(filePath: any, options?: {}): Promise<any>;
    /**
     * Standardized async test generation
     */
    generateTestAsync(target: any, options?: {}): Promise<any>;
    /**
     * Handle evaluation errors consistently across all language integrations
     */
    handleEvaluationError(error: any, filePath: any, signature: any): null;
    /**
     * Validate signature before processing
     */
    validateSignature(signature: any): boolean;
    /**
     * Log debug information for scoring
     */
    logScoreDebug(candidate: any, signature: any, score: any): void;
}
import { ErrorHandler } from "./error-handler";
