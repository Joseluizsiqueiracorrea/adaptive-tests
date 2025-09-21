export class ErrorHandler {
    constructor(component?: string);
    component: string;
    isDebugMode: boolean;
    /**
     * Log error with consistent formatting
     */
    logError(error: any, context?: {}): void;
    /**
     * Log warning with consistent formatting
     */
    logWarning(message: any, context?: {}): void;
    /**
     * Log debug information
     */
    logDebug(message: any, context?: {}): void;
    /**
     * Handle file operation errors
     */
    handleFileError(error: any, filePath: any, operation?: string): {
        success: boolean;
        error: string;
        message: any;
    };
    /**
     * Handle parsing errors
     */
    handleParseError(error: any, filePath: any, language: any): {
        success: boolean;
        error: string;
        message: any;
    };
    /**
     * Handle process execution errors (for Python, etc.)
     */
    handleProcessError(error: any, command: any, filePath: any): {
        success: boolean;
        error: string;
        message: any;
    };
    /**
     * Safe async wrapper for operations
     */
    safeAsync(operation: any, context?: {}): Promise<{
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
     * Safe sync wrapper for operations
     */
    safeSync(operation: any, context?: {}): {
        success: boolean;
        data: any;
        error?: undefined;
        message?: undefined;
    } | {
        success: boolean;
        error: any;
        message: any;
        data?: undefined;
    };
    /**
     * Create a child error handler for a specific component
     */
    createChild(component: any): ErrorHandler;
}
/**
 * Standardized Error Handling for Adaptive Tests
 *
 * Provides consistent error handling, logging, and recovery patterns
 * across all language integrations and collectors.
 */
export class AdaptiveError extends Error {
    constructor(message: any, code: any, context?: {});
    code: any;
    context: {};
    timestamp: string;
    toJSON(): {
        name: string;
        message: string;
        code: any;
        context: {};
        timestamp: string;
        stack: string | undefined;
    };
}
export namespace ErrorCodes {
    let FILE_NOT_FOUND: string;
    let ACCESS_DENIED: string;
    let IS_DIRECTORY: string;
    let SYNTAX_ERROR: string;
    let PARSE_ERROR: string;
    let COMMAND_NOT_FOUND: string;
    let COMMAND_TIMEOUT: string;
    let PROCESS_ERROR: string;
    let PLUGIN_NOT_FOUND: string;
    let INVALID_SIGNATURE: string;
    let METADATA_INVALID: string;
}
