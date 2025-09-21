export type TargetType = "class" | "function" | "object" | "module";
export type DiscoverySignature = {
    name?: string | RegExp | undefined;
    type?: TargetType | undefined;
    exports?: string | undefined;
    methods?: string[] | undefined;
    properties?: string[] | undefined;
    extends?: string | Function | undefined;
    instanceof?: string | Function | undefined;
    language?: string | undefined;
};
export class DiscoveryEngine {
    constructor(rootPath?: string, config?: {});
    rootPath: string;
    config: any;
    scoringEngine: ScoringEngine;
    allowLooseNameMatch: boolean;
    looseNamePenalty: any;
    tsconfigResolver: {
        configPath: string;
        absoluteBaseUrl: string;
        paths: {
            [key: string]: string[];
        };
        matchPath: import("tsconfig-paths").MatchPath;
        aliasEntries: {
            aliasPattern: any;
            aliasPrefix: any;
            aliasHasWildcard: any;
            targetPattern: any;
            targetPrefix: string;
            targetHasWildcard: any;
        }[];
        resolveWithMatch: (specifier: any) => string | null;
        getAliasesForFile: (filePath: any) => any[];
        getBaseUrlRelativeImport: (filePath: any) => any;
    } | null;
    cacheLogWarnings: boolean;
    cacheTTLMs: number;
    discoveryCache: LRUCache;
    persistentCache: {};
    cacheLoaded: boolean;
    cacheLoadPromise: Promise<void> | null;
    cachedModules: Set<any>;
    moduleVersions: LRUCache;
    MAX_CACHED_MODULES: number;
    asyncManager: {
        defaultTimeout: any;
        defaultRetries: any;
        errorHandler: import("./error-handler").ErrorHandler;
        execute(operation: any, options?: {}): Promise<any>;
        withTimeout(operation: any, timeoutMs: any, context?: {}): Promise<any>;
        delay(ms: any): Promise<any>;
        executeParallel(operations: any, options?: {}): Promise<any[]>;
        processSettledResults(results: any, context?: {}): any[];
        debounce(fn: any, delayMs?: number): (...args: any[]) => Promise<any>;
        throttle(fn: any, limitMs?: number): (
        /**
         * Discover a target module/class/function
         * @template T
         * @param {DiscoverySignature} signature
         * @returns {Promise<T>}
         */
        ...args: any[]) => Promise<any>;
    };
    maxConcurrency: number;
    detectCallerExtension(): ".js" | ".ts";
    ensureCacheLoaded(): Promise<void>;
    /**
     * Discover a target module/class/function
     * @template T
     * @param {DiscoverySignature} signature
     * @returns {Promise<T>}
     */
    discoverTarget<T>(signature: DiscoverySignature): Promise<T>;
    /**
     * Collect all candidates matching the signature
     * @param {string} dir
     * @param {DiscoverySignature} signature
     * @param {number} [depth]
     * @param {Array} [candidates]
     */
    collectCandidates(dir: string, signature: DiscoverySignature, depth?: number, candidates?: any[]): Promise<any[]>;
    normalizeConcurrency(value: any): number;
    /**
     * Evaluate a file as a potential candidate
     * @param {string} filePath
     * @param {DiscoverySignature} signature
     */
    evaluateCandidate(filePath: string, signature: DiscoverySignature): Promise<{
        path: string;
        fileName: string;
        content: string;
        mtimeMs: number | null;
        quickNameMatched: boolean;
    } | null>;
    isCandidateSafe(candidate: any): boolean;
    selectExportFromMetadata(candidate: any, signature: any): any;
    matchesSignatureMetadata(entry: any, signature: any): boolean;
    extractExportByAccess(moduleExports: any, access: any): any;
    tokenizeName(name: any): any;
    /**
     * Quick check if file name could match signature
     * @param {string} fileName
     * @param {DiscoverySignature} signature
     */
    quickNameCheck(fileName: string, signature: DiscoverySignature): boolean;
    /**
     * Try to resolve a candidate by loading and validating it
     * @param {{ path: string, score: number, metadata?: any }} candidate
     * @param {DiscoverySignature} signature
     */
    tryResolveCandidate(candidate: {
        path: string;
        score: number;
        metadata?: any;
    }, signature: DiscoverySignature): Promise<{
        target: any;
        access: {
            type: string;
            name?: undefined;
        };
        score: number;
    } | {
        target: any;
        access: {
            type: string;
            name: string;
        };
        score: number;
    } | {
        target: any;
        access: any;
    } | null>;
    compileFreshModule(modulePath: any): any;
    /**
     * Resolve target from module exports
     * @param {any} moduleExports
     * @param {DiscoverySignature} signature
     * @param {{ path: string }} candidate
     */
    resolveTargetFromModule(moduleExports: any, signature: DiscoverySignature, candidate: {
        path: string;
    }): {
        target: any;
        access: {
            type: string;
            name?: undefined;
        };
        score: number;
    } | {
        target: any;
        access: {
            type: string;
            name: string;
        };
        score: number;
    } | null;
    /**
     * Validate that a target matches the signature requirements
     * @param {any} target
     * @param {DiscoverySignature} signature
     */
    validateTarget(target: any, signature: DiscoverySignature): {
        score: number;
    } | null;
    /**
     * Validate type
     */
    validateType(target: any, expectedType: any): any;
    /**
     * Validate name
     */
    validateName(targetName: any, expectedName: any): boolean;
    /**
     * Validate methods exist
     */
    validateMethods(target: any, methods: any): number | null;
    /**
     * Validate properties exist (NEW!)
     */
    validateProperties(target: any, properties: any): number | null;
    /**
     * Validate inheritance chain (NEW!)
     */
    validateInheritance(target: any, baseClass: any): boolean;
    /**
     * Validate instanceof (NEW!)
     */
    validateInstanceOf(target: any, expectedClass: any): boolean;
    /**
     * Get target name
     */
    getTargetName(target: any): any;
    /**
     * Should skip directory
     */
    shouldSkipDirectory(dirName: any): any;
    /**
     * Normalize signature
     * @param {DiscoverySignature} signature
     * @returns {DiscoverySignature}
     */
    normalizeSignature(signature: DiscoverySignature): DiscoverySignature;
    /**
     * Get cache key for signature
     * @param {DiscoverySignature} signature
     * @returns {string}
     */
    getCacheKey(signature: DiscoverySignature): string;
    serializeCacheValue(value: any): any;
    calculateRecencyBonus(mtimeMs: any): any;
    /**
     * Load module from cache entry
     * @param {{ path: string }} cacheEntry
     * @param {DiscoverySignature} signature
     */
    loadModule(cacheEntry: {
        path: string;
    }, signature: DiscoverySignature): any;
    /**
     * Create discovery error with helpful message
     * @param {DiscoverySignature} signature
     * @param {Array} [candidates]
     */
    createDiscoveryError(signature: DiscoverySignature, candidates?: any[]): Error;
    buildSignatureSuggestion(candidate: any): {
        name: any;
        type: any;
        exports: any;
        methods: any[];
        properties: any[];
        extends: any;
    } | null;
    logCacheWarning(message: any, error: any): void;
    isCacheEntryExpired(entry: any): boolean;
    analyzeModuleExports(content: any, fileName: any): any;
    /**
     * Load cache from disk
     */
    loadCache(): Promise<void>;
    /**
     * Save cache to disk
     */
    saveCache(): Promise<void>;
    /**
     * Clear all caches
     */
    clearCache(): Promise<void>;
    /**
     * Clean up cached modules to prevent unbounded growth
     */
    cleanupCachedModules(): void;
    /**
     * Ensure TypeScript support
     */
    ensureTypeScriptSupport(): void;
    _tsNodeRegistered: boolean | undefined;
}
export function getDiscoveryEngine(rootPath?: string, config?: {}): any;
import { ScoringEngine } from "./scoring-engine";
declare class LRUCache {
    constructor(maxSize: any);
    maxSize: any;
    cache: Map<any, any>;
    get(key: any): any;
    set(key: any, value: any): void;
    has(key: any): boolean;
    delete(key: any): boolean;
    clear(): void;
    get size(): number;
    keys(): MapIterator<any>;
    values(): MapIterator<any>;
    entries(): MapIterator<[any, any]>;
    forEach(callback: any, thisArg: any): void;
}
export {};
