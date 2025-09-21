"use strict";
/**
 * Cache Service
 * High-performance caching with LRU eviction and persistence
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const crypto = __importStar(require("crypto"));
class CacheService {
    constructor(logger) {
        this.logger = logger;
        this.cache = new Map();
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0,
            size: 0,
            entries: 0
        };
        this.maxSize = 100 * 1024 * 1024; // 100MB
        this.maxEntries = 1000;
        this.defaultTTL = 15 * 60 * 1000; // 15 minutes
        this.logger.info('CacheService initialized');
        this.loadPersistedCache();
        this.startCleanupInterval();
        this.startPersistenceInterval();
    }
    /**
     * Get value from cache
     */
    get(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            this.stats.misses++;
            this.logger.debug('Cache miss', { key });
            return undefined;
        }
        // Check TTL
        if (this.isExpired(entry)) {
            this.delete(key);
            this.stats.misses++;
            this.logger.debug('Cache expired', { key });
            return undefined;
        }
        // Update hit count
        entry.hits++;
        this.stats.hits++;
        this.logger.debug('Cache hit', { key, hits: entry.hits });
        return entry.value;
    }
    /**
     * Set value in cache
     */
    set(key, value, ttl) {
        const size = this.estimateSize(value);
        // Check size limits
        if (size > this.maxSize / 10) {
            this.logger.warn('Cache entry too large', { key, size });
            return;
        }
        // Evict if necessary
        while (this.shouldEvict(size)) {
            this.evictLRU();
        }
        const entry = {
            value,
            timestamp: Date.now(),
            ttl: ttl || this.defaultTTL,
            hits: 0,
            size
        };
        this.cache.set(key, entry);
        this.stats.size += size;
        this.stats.entries = this.cache.size;
        this.logger.debug('Cache set', { key, size, ttl: entry.ttl });
    }
    /**
     * Delete value from cache
     */
    delete(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return false;
        this.cache.delete(key);
        this.stats.size -= entry.size || 0;
        this.stats.entries = this.cache.size;
        this.logger.debug('Cache delete', { key });
        return true;
    }
    /**
     * Clear all cache entries
     */
    clear() {
        const previousSize = this.cache.size;
        this.cache.clear();
        this.stats.size = 0;
        this.stats.entries = 0;
        this.logger.info('Cache cleared', { entries: previousSize });
    }
    /**
     * Get or set with factory function
     */
    async getOrSet(key, factory, ttl) {
        const cached = this.get(key);
        if (cached !== undefined) {
            return cached;
        }
        const value = await factory();
        this.set(key, value, ttl);
        return value;
    }
    /**
     * Generate cache key from multiple parts
     */
    createKey(...parts) {
        const normalized = parts.map(p => {
            if (typeof p === 'object') {
                return JSON.stringify(p, Object.keys(p).sort());
            }
            return String(p);
        }).join(':');
        return crypto
            .createHash('sha256')
            .update(normalized)
            .digest('hex')
            .substring(0, 16);
    }
    /**
     * Get cache statistics
     */
    getStats() {
        return { ...this.stats };
    }
    /**
     * Get detailed cache info
     */
    getInfo() {
        const now = Date.now();
        const entries = Array.from(this.cache.entries())
            .map(([key, entry]) => ({
            key,
            size: entry.size || 0,
            age: now - entry.timestamp,
            hits: entry.hits
        }))
            .sort((a, b) => b.hits - a.hits);
        return {
            stats: this.getStats(),
            entries
        };
    }
    /**
     * Warmup cache with preloaded data
     */
    async warmup(loader) {
        try {
            const items = await loader();
            for (const { key, value, ttl } of items) {
                this.set(key, value, ttl);
            }
            this.logger.info('Cache warmed up', { entries: items.length });
        }
        catch (error) {
            this.logger.error('Cache warmup failed', error);
        }
    }
    isExpired(entry) {
        return Date.now() - entry.timestamp > entry.ttl;
    }
    shouldEvict(newSize) {
        return (this.cache.size >= this.maxEntries ||
            this.stats.size + newSize > this.maxSize);
    }
    evictLRU() {
        let oldestKey;
        let oldestTime = Infinity;
        let lowestHits = Infinity;
        // Find least recently/frequently used
        for (const [key, entry] of this.cache) {
            const score = entry.timestamp + (entry.hits * 60000); // Boost for hits
            if (score < oldestTime) {
                oldestTime = score;
                oldestKey = key;
                lowestHits = entry.hits;
            }
        }
        if (oldestKey) {
            this.delete(oldestKey);
            this.stats.evictions++;
            this.logger.debug('Cache evicted', { key: oldestKey, hits: lowestHits });
        }
    }
    estimateSize(value) {
        try {
            const json = JSON.stringify(value);
            return json.length * 2; // Rough estimate for UTF-16
        }
        catch {
            return 1024; // Default size for non-serializable
        }
    }
    startCleanupInterval() {
        this.cleanupInterval = setInterval(() => {
            const now = Date.now();
            const expired = [];
            for (const [key, entry] of this.cache) {
                if (this.isExpired(entry)) {
                    expired.push(key);
                }
            }
            for (const key of expired) {
                this.delete(key);
            }
            if (expired.length > 0) {
                this.logger.debug('Cache cleanup', { expired: expired.length });
            }
        }, 60000); // Every minute
    }
    startPersistenceInterval() {
        this.persistenceTimer = setInterval(() => {
            this.persistCache();
        }, 5 * 60 * 1000); // Every 5 minutes
    }
    async persistCache() {
        try {
            const context = this.getExtensionContext();
            if (!context)
                return;
            // Only persist small, important entries
            const toPersist = new Map();
            for (const [key, entry] of this.cache) {
                if (entry.hits > 5 && (entry.size || 0) < 10000) {
                    toPersist.set(key, entry);
                }
            }
            await context.globalState.update('cache', {
                entries: Array.from(toPersist.entries()),
                timestamp: Date.now()
            });
            this.logger.debug('Cache persisted', { entries: toPersist.size });
        }
        catch (error) {
            this.logger.error('Cache persistence failed', error);
        }
    }
    async loadPersistedCache() {
        try {
            const context = this.getExtensionContext();
            if (!context)
                return;
            const persisted = context.globalState.get('cache');
            if (!persisted)
                return;
            // Only load if less than 1 hour old
            if (Date.now() - persisted.timestamp > 60 * 60 * 1000)
                return;
            for (const [key, entry] of persisted.entries) {
                this.cache.set(key, entry);
                this.stats.size += entry.size || 0;
            }
            this.stats.entries = this.cache.size;
            this.logger.info('Cache loaded from persistence', { entries: this.cache.size });
        }
        catch (error) {
            this.logger.error('Cache load failed', error);
        }
    }
    getExtensionContext() {
        return globalThis.__extensionContext;
    }
    dispose() {
        clearInterval(this.cleanupInterval);
        clearInterval(this.persistenceTimer);
        this.persistCache();
        this.clear();
    }
}
exports.CacheService = CacheService;
//# sourceMappingURL=CacheService.js.map