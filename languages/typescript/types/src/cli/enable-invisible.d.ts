#!/usr/bin/env node
/**
 * Auto-enable invisible mode with framework detection
 */
export function enableInvisibleMode(options?: {}): Promise<{
    success: boolean;
    reason: string;
    dryRun?: undefined;
    error?: undefined;
} | {
    success: boolean;
    dryRun: boolean;
    reason?: undefined;
    error?: undefined;
} | {
    success: boolean;
    reason?: undefined;
    dryRun?: undefined;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    reason?: undefined;
    dryRun?: undefined;
}>;
/**
 * Disable invisible mode
 */
export function disableInvisibleMode(options?: {}): Promise<{
    success: boolean;
    reason: string;
    dryRun?: undefined;
    error?: undefined;
} | {
    success: boolean;
    dryRun: boolean;
    reason?: undefined;
    error?: undefined;
} | {
    success: boolean;
    reason?: undefined;
    dryRun?: undefined;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    reason?: undefined;
    dryRun?: undefined;
}>;
/**
 * Detect test framework and configuration
 */
export function detectTestFramework(): Promise<{
    framework: null;
    confidence: string;
    configFiles?: undefined;
    packageConfig?: undefined;
    setupFiles?: undefined;
    testDirs?: undefined;
} | {
    framework: string;
    confidence: string;
    configFiles: any;
    packageConfig: any;
    setupFiles: any;
    testDirs?: undefined;
} | {
    framework: string;
    confidence: string;
    configFiles: any;
    setupFiles: any;
    packageConfig?: undefined;
    testDirs?: undefined;
} | {
    framework: string;
    confidence: string;
    setupFiles: any;
    configFiles?: undefined;
    packageConfig?: undefined;
    testDirs?: undefined;
} | {
    framework: string;
    confidence: string;
    testDirs: string[];
    setupFiles: any;
    configFiles?: undefined;
    packageConfig?: undefined;
}>;
