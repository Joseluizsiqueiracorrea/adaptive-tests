/**
 * Performance monitoring for Adaptive Tests
 * Provides insights into discovery performance in production
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.enabled = process.env.ADAPTIVE_PERF === 'true';
  }

  startTimer(operation) {
    if (!this.enabled) return null;

    const id = `${operation}-${Date.now()}-${Math.random()}`;
    this.metrics.set(id, {
      operation,
      startTime: performance.now(),
      startMemory: process.memoryUsage()
    });
    return id;
  }

  endTimer(id) {
    if (!this.enabled || !id) return null;

    const metric = this.metrics.get(id);
    if (!metric) return null;

    const endTime = performance.now();
    const endMemory = process.memoryUsage();

    const result = {
      operation: metric.operation,
      duration: endTime - metric.startTime,
      memoryDelta: {
        heapUsed: endMemory.heapUsed - metric.startMemory.heapUsed,
        external: endMemory.external - metric.startMemory.external
      }
    };

    this.metrics.delete(id);

    if (process.env.ADAPTIVE_PERF_LOG === 'true') {
      console.log('[PERF]', JSON.stringify(result));
    }

    return result;
  }

  getStats() {
    if (!this.enabled) return null;

    const stats = {
      activeOperations: this.metrics.size,
      timestamp: Date.now()
    };

    return stats;
  }

  clear() {
    this.metrics.clear();
  }
}

module.exports = { PerformanceMonitor };