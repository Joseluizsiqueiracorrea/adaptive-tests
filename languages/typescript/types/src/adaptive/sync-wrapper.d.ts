/**
 * Synchronous discovery (uses cache + fallback)
 */
export function discoverSync(signature: any): any;
/**
 * Clear sync cache (for testing)
 */
export function clearSyncCache(): void;
/**
 * Pre-warm common patterns
 */
export function prewarmSyncCache(patterns?: any[]): void;
/**
 * Initialize discovery engine (call once)
 */
export function initSyncDiscovery(): void;
