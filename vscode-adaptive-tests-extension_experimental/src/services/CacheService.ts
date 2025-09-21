/**
 * Cache Service
 * High-performance caching with LRU eviction and persistence
 */

import * as vscode from 'vscode';
import { Logger } from '../core/logger';
import * as crypto from 'crypto';

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
  hits: number;
  size?: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  entries: number;
}

export class CacheService implements vscode.Disposable {
  private cache = new Map<string, CacheEntry<any>>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    size: 0,
    entries: 0
  };

  private readonly maxSize: number = 100 * 1024 * 1024; // 100MB
  private readonly maxEntries: number = 1000;
  private readonly defaultTTL: number = 15 * 60 * 1000; // 15 minutes
  private cleanupInterval!: NodeJS.Timeout;
  private persistenceTimer!: NodeJS.Timeout;

  constructor(private logger: Logger) {
    this.logger.info('CacheService initialized');
    this.loadPersistedCache();
    this.startCleanupInterval();
    this.startPersistenceInterval();
  }

  /**
   * Get value from cache
   */
  public get<T>(key: string): T | undefined {
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
    return entry.value as T;
  }

  /**
   * Set value in cache
   */
  public set<T>(key: string, value: T, ttl?: number): void {
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

    const entry: CacheEntry<T> = {
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
  public delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    this.cache.delete(key);
    this.stats.size -= entry.size || 0;
    this.stats.entries = this.cache.size;

    this.logger.debug('Cache delete', { key });
    return true;
  }

  /**
   * Clear all cache entries
   */
  public clear(): void {
    const previousSize = this.cache.size;
    this.cache.clear();
    this.stats.size = 0;
    this.stats.entries = 0;

    this.logger.info('Cache cleared', { entries: previousSize });
  }

  /**
   * Get or set with factory function
   */
  public async getOrSet<T>(
    key: string,
    factory: () => T | Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
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
  public createKey(...parts: any[]): string {
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
  public getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get detailed cache info
   */
  public getInfo(): {
    stats: CacheStats;
    entries: Array<{ key: string; size: number; age: number; hits: number }>;
  } {
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
  public async warmup(
    loader: () => Promise<Array<{ key: string; value: any; ttl?: number }>>
  ): Promise<void> {
    try {
      const items = await loader();

      for (const { key, value, ttl } of items) {
        this.set(key, value, ttl);
      }

      this.logger.info('Cache warmed up', { entries: items.length });
    } catch (error) {
      this.logger.error('Cache warmup failed', error as Error);
    }
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private shouldEvict(newSize: number): boolean {
    return (
      this.cache.size >= this.maxEntries ||
      this.stats.size + newSize > this.maxSize
    );
  }

  private evictLRU(): void {
    let oldestKey: string | undefined;
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

  private estimateSize(value: any): number {
    try {
      const json = JSON.stringify(value);
      return json.length * 2; // Rough estimate for UTF-16
    } catch {
      return 1024; // Default size for non-serializable
    }
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const expired: string[] = [];

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

  private startPersistenceInterval(): void {
    this.persistenceTimer = setInterval(() => {
      this.persistCache();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private async persistCache(): Promise<void> {
    try {
      const context = this.getExtensionContext();
      if (!context) return;

      // Only persist small, important entries
      const toPersist = new Map<string, CacheEntry<any>>();

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
    } catch (error) {
      this.logger.error('Cache persistence failed', error as Error);
    }
  }

  private async loadPersistedCache(): Promise<void> {
    try {
      const context = this.getExtensionContext();
      if (!context) return;

      const persisted = context.globalState.get<{
        entries: Array<[string, CacheEntry<any>]>;
        timestamp: number;
      }>('cache');

      if (!persisted) return;

      // Only load if less than 1 hour old
      if (Date.now() - persisted.timestamp > 60 * 60 * 1000) return;

      for (const [key, entry] of persisted.entries) {
        this.cache.set(key, entry);
        this.stats.size += entry.size || 0;
      }

      this.stats.entries = this.cache.size;
      this.logger.info('Cache loaded from persistence', { entries: this.cache.size });
    } catch (error) {
      this.logger.error('Cache load failed', error as Error);
    }
  }

  private getExtensionContext(): vscode.ExtensionContext | undefined {
    return (globalThis as any).__extensionContext;
  }

  public dispose(): void {
    clearInterval(this.cleanupInterval);
    clearInterval(this.persistenceTimer);
    this.persistCache();
    this.clear();
  }
}