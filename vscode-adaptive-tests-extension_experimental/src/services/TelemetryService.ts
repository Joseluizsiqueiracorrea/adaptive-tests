/**
 * Telemetry Service
 * Privacy-first analytics and performance monitoring
 */

import * as vscode from 'vscode';
import { Logger } from '../core/logger';
import { ConfigService } from './ConfigService';
import * as crypto from 'crypto';

export interface TelemetryEvent {
  name: string;
  properties?: Record<string, any>;
  measurements?: Record<string, number>;
  timestamp?: number;
}

export interface PerformanceMetric {
  name: string;
  duration: number;
  success: boolean;
  metadata?: Record<string, any>;
}

interface TelemetrySession {
  sessionId: string;
  startTime: number;
  events: TelemetryEvent[];
  metrics: PerformanceMetric[];
  errors: Array<{ message: string; stack?: string; timestamp: number }>;
}

export class TelemetryService implements vscode.Disposable {
  private session: TelemetrySession;
  private queue: TelemetryEvent[] = [];
  private flushTimer!: NodeJS.Timeout;
  private performanceObserver?: any;
  private readonly MAX_QUEUE_SIZE = 100;
  private readonly FLUSH_INTERVAL = 30000; // 30 seconds
  private disposed = false;

  constructor(
    private logger: Logger,
    private config: ConfigService
  ) {
    this.session = this.createSession();
    this.logger.info('TelemetryService initialized', {
      sessionId: this.session.sessionId,
      enabled: this.config.get('telemetry').enabled
    });

    if (this.config.get('telemetry').enabled) {
      this.startFlushTimer();
      this.setupPerformanceObserver();
      this.setupErrorHandlers();
    }
  }

  /**
   * Track a telemetry event
   */
  public track(event: TelemetryEvent): void {
    if (!this.config.get('telemetry').enabled) return;

    const sanitized = this.sanitizeEvent(event);
    sanitized.timestamp = Date.now();

    this.session.events.push(sanitized);
    this.queue.push(sanitized);

    this.logger.debug('Telemetry event tracked', {
      name: sanitized.name,
      properties: sanitized.properties
    });

    if (this.queue.length >= this.MAX_QUEUE_SIZE) {
      this.flush();
    }
  }

  /**
   * Track a performance metric
   */
  public trackPerformance(metric: PerformanceMetric): void {
    if (!this.config.get('telemetry').performanceMetrics) return;

    this.session.metrics.push(metric);

    this.logger.debug('Performance metric tracked', {
      name: metric.name,
      duration: metric.duration,
      success: metric.success
    });

    // Alert on slow operations
    if (metric.duration > 5000) {
      this.logger.warn('Slow operation detected', {
        name: metric.name,
        duration: metric.duration
      });
    }
  }

  /**
   * Track an error
   */
  public trackError(error: Error, context?: Record<string, any>): void {
    if (!this.config.get('telemetry').crashReports) return;

    const errorInfo = {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now()
    };

    this.session.errors.push(errorInfo);

    this.track({
      name: 'error',
      properties: {
        message: error.message,
        ...context
      }
    });

    this.logger.error('Error tracked', error);
  }

  /**
   * Track command execution
   */
  public trackCommand(
    command: string,
    success: boolean,
    duration?: number
  ): void {
    this.track({
      name: 'command',
      properties: {
        command,
        success
      },
      measurements: duration ? { duration } : undefined
    });
  }

  /**
   * Track feature usage
   */
  public trackFeature(
    feature: string,
    action: string,
    metadata?: Record<string, any>
  ): void {
    this.track({
      name: 'feature',
      properties: {
        feature,
        action,
        ...metadata
      }
    });
  }

  /**
   * Start timing an operation
   */
  public startTimer(name: string): () => void {
    const start = performance.now();

    return () => {
      const duration = performance.now() - start;
      this.trackPerformance({
        name,
        duration,
        success: true
      });
      return duration;
    };
  }

  /**
   * Get session summary
   */
  public getSessionSummary(this: TelemetryService): {
    sessionId: string;
    duration: number;
    eventCount: number;
    errorCount: number;
    avgPerformance: number;
  } {
    const duration = Date.now() - this.session.startTime;
    const avgPerformance = this.session.metrics.length > 0
      ? this.session.metrics.reduce((sum, m) => sum + m.duration, 0) / this.session.metrics.length
      : 0;

    return {
      sessionId: this.session.sessionId,
      duration,
      eventCount: this.session.events.length,
      errorCount: this.session.errors.length,
      avgPerformance
    };
  }

  /**
   * Export telemetry data for analysis
   */
  public exportData(): {
    session: TelemetrySession;
    summary: {
      sessionId: string;
      duration: number;
      eventCount: number;
      errorCount: number;
      avgPerformance: number;
    };
  } {
    return {
      session: this.sanitizeSession(this.session),
      summary: this.getSessionSummary()
    };
  }

  /**
   * Opt out of telemetry
   */
  public async optOut(): Promise<void> {
    await this.config.update('telemetry', {
      ...this.config.get('telemetry'),
      enabled: false
    });
    this.dispose();
    this.logger.info('Telemetry opt-out complete');
  }

  private createSession(): TelemetrySession {
    return {
      sessionId: this.generateSessionId(),
      startTime: Date.now(),
      events: [],
      metrics: [],
      errors: []
    };
  }

  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(8).toString('hex');
    return `${timestamp}_${random}`;
  }

  private sanitizeEvent(event: TelemetryEvent): TelemetryEvent {
    const sanitized = { ...event };

    // Remove sensitive data
    if (sanitized.properties) {
      const cleaned: Record<string, any> = {};
      for (const [key, value] of Object.entries(sanitized.properties)) {
        // Skip sensitive keys
        if (this.isSensitiveKey(key)) continue;

        // Sanitize values
        if (typeof value === 'string') {
          cleaned[key] = this.sanitizeString(value);
        } else if (typeof value === 'object' && value !== null) {
          cleaned[key] = '[object]';
        } else {
          cleaned[key] = value;
        }
      }
      sanitized.properties = cleaned;
    }

    return sanitized;
  }

  private sanitizeSession(session: TelemetrySession): TelemetrySession {
    return {
      ...session,
      events: session.events.map(e => this.sanitizeEvent(e)),
      errors: session.errors.map(e => ({
        ...e,
        stack: e.stack ? this.sanitizeStackTrace(e.stack) : undefined
      }))
    };
  }

  private sanitizeString(str: string): string {
    // Remove file paths, emails, etc.
    return str
      .replace(/\/Users\/[^/]+/g, '/Users/[USER]')
      .replace(/\\Users\\[^\\]+/g, '\\Users\\[USER]')
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
      .replace(/\b\d{4,}\b/g, '[NUMBER]');
  }

  private sanitizeStackTrace(stack: string): string {
    return stack
      .split('\n')
      .map(line => this.sanitizeString(line))
      .join('\n');
  }

  private isSensitiveKey(key: string): boolean {
    const sensitive = [
      'password', 'token', 'secret', 'key', 'api',
      'credential', 'auth', 'private', 'ssn', 'email'
    ];
    const lower = key.toLowerCase();
    return sensitive.some(s => lower.includes(s));
  }

  private setupPerformanceObserver(): void {
    if (typeof (globalThis as any).PerformanceObserver === 'undefined') return;

    try {
      this.performanceObserver = new (globalThis as any).PerformanceObserver((entries: any) => {
        for (const entry of entries.getEntries()) {
          if (entry.duration > 100) {
            this.trackPerformance({
              name: entry.name,
              duration: entry.duration,
              success: true,
              metadata: {
                entryType: entry.entryType,
                startTime: entry.startTime
              }
            });
          }
        }
      });

      this.performanceObserver.observe({
        entryTypes: ['measure', 'navigation']
      });
    } catch (error) {
      this.logger.warn('Failed to setup performance observer', { error });
    }
  }

  private setupErrorHandlers(): void {
    // Track unhandled rejections
    process.on('unhandledRejection', (reason: any) => {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      this.trackError(error, { type: 'unhandledRejection' });
    });

    // Track uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      this.trackError(error, { type: 'uncaughtException' });
    });
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.FLUSH_INTERVAL);
  }

  private async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    try {
      // In production, this would send to analytics backend
      await this.sendTelemetry(events);
      this.logger.debug('Telemetry flushed', { count: events.length });
    } catch (error) {
      this.logger.error('Telemetry flush failed', error as Error);
      // Re-queue events if send failed
      this.queue = [...events, ...this.queue].slice(0, this.MAX_QUEUE_SIZE);
    }
  }

  private async sendTelemetry(events: TelemetryEvent[]): Promise<void> {
    // In production, implement actual sending logic
    // For now, just log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('[Telemetry]', events);
    }
  }

  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    clearInterval(this.flushTimer);
    this.performanceObserver?.disconnect();
    this.flush();

    this.logger.info('TelemetryService disposed', {
      summary: this.getSessionSummary()
    });
  }
}