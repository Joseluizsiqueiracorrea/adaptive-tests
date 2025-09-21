/**
 * Standard async operation wrapper with timeout and retry
 */
export class AsyncOperationManager {
    constructor(options?: {});
    defaultTimeout: any;
    defaultRetries: any;
    errorHandler: ErrorHandler;
    /**
     * Execute an async operation with timeout and retry support
     */
    execute(operation: any, options?: {}): Promise<any>;
    /**
     * Wrap operation with timeout
     */
    withTimeout(operation: any, timeoutMs: any, context?: {}): Promise<any>;
    /**
     * Delay utility for retries
     */
    delay(ms: any): Promise<any>;
    /**
     * Execute multiple async operations in parallel with error isolation
     */
    executeParallel(operations: any, options?: {}): Promise<any[]>;
    /**
     * Process Promise.allSettled results
     */
    processSettledResults(results: any, context?: {}): any[];
    /**
     * Create a debounced async function
     */
    debounce(fn: any, delayMs?: number): (...args: any[]) => Promise<any>;
    /**
     * Create a throttled async function
     */
    throttle(fn: any, limitMs?: number): (...args: any[]) => Promise<any>;
}
/**
 * Standardized async file operations
 */
export class AsyncFileOperations {
    constructor(options?: {});
    operationManager: AsyncOperationManager;
    errorHandler: ErrorHandler;
    /**
     * Safe async file read with standardized error handling
     */
    readFile(filePath: any, options?: {}): Promise<any>;
    /**
     * Safe async file write with standardized error handling
     */
    writeFile(filePath: any, content: any, options?: {}): Promise<any>;
    /**
     * Safe async directory scan
     */
    readDirectory(dirPath: any, options?: {}): Promise<any>;
    /**
     * Safe async file stat
     */
    stat(filePath: any, options?: {}): Promise<any>;
    /**
     * Check if file exists (async)
     */
    exists(filePath: any, options?: {}): Promise<boolean>;
}
/**
 * Language integration async patterns
 */
export class LanguageIntegrationAsync {
    constructor(language: any, options?: {});
    language: any;
    operationManager: AsyncOperationManager;
    fileOps: AsyncFileOperations;
    errorHandler: ErrorHandler;
    /**
     * Standardized candidate evaluation pattern
     */
    evaluateCandidate(filePath: any, signature: {} | undefined, evaluationFn: any): Promise<any>;
    /**
     * Standardized file parsing pattern
     */
    parseFile(filePath: any, parseFn: any, options?: {}): Promise<any>;
    /**
     * Standardized test generation pattern
     */
    generateTest(target: any, generateFn: any, options?: {}): Promise<any>;
}
declare const defaultAsyncManager: AsyncOperationManager;
declare const defaultFileOps: AsyncFileOperations;
import { ErrorHandler } from "./error-handler";
export declare function withTimeout(operation: any, timeoutMs: any): Promise<any>;
export declare function delay(ms: any): Promise<any>;
export declare function executeParallel(operations: any, options: any): Promise<any[]>;
export { defaultAsyncManager as asyncManager, defaultFileOps as fileOps };
