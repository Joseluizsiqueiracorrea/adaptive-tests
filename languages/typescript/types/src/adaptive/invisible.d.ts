/**
 * Smart require with transparent adaptive fallback
 * Only works for relative imports to avoid npm module conflicts
 */
export function adaptiveRequire(modulePath: any, options?: {}): Promise<any>;
/**
 * Extract likely class/module name from require path
 */
export function extractModuleName(modulePath: any): string;
/**
 * Feature flags and configuration
 */
export function enableInvisibleMode(options?: {}): void;
export function disableInvisibleMode(): void;
export function addEscapePattern(pattern: any): void;
/**
 * Opt-in Jest setup (does not auto-enable)
 */
export function setupForJest(config?: {}): void;
/**
 * Safe Module.require patching with isolation
 */
export function patchRequireWithIsolation(): void;
/**
 * Cleanup function to restore original require
 */
export function restoreOriginalRequire(): void;
export declare function isInvisibleModeEnabled(): boolean;
export declare function getEscapePatterns(): any[];
