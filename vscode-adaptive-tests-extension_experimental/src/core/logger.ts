/**
 * Advanced logging service with structured logging, performance tracking, and telemetry
 */

import * as vscode from 'vscode';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

interface LogContext {
  timestamp: string;
  level: string;
  message: string;
  context?: Record<string, any>;
  duration?: number;
  error?: Error;
}

export interface Logger {
  debug(message: string, context?: Record<string, any>): void;
  info(message: string, context?: Record<string, any>): void;
  warn(message: string, context?: Record<string, any>): void;
  error(message: string, error?: Error | Record<string, any>): void;
  time(label: string): () => void;
  child(context: Record<string, any>): Logger;
}

export class VSCodeLogger implements Logger {
  private outputChannel: vscode.OutputChannel;
  private logLevel: LogLevel;
  private contextData: Record<string, any>;
  private timers = new Map<string, number>();

  constructor(
    name: string,
    context: Record<string, any> = {},
    outputChannel?: vscode.OutputChannel
  ) {
    this.outputChannel = outputChannel || vscode.window.createOutputChannel(`Adaptive Tests - ${name}`);
    this.contextData = { service: name, ...context };
    this.logLevel = this.getConfiguredLogLevel();
  }

  private getConfiguredLogLevel(): LogLevel {
    const config = vscode.workspace.getConfiguration('adaptive-tests');
    const level = config.get<string>('logLevel', 'info').toLowerCase();

    switch (level) {
      case 'debug': return LogLevel.DEBUG;
      case 'info': return LogLevel.INFO;
      case 'warn': return LogLevel.WARN;
      case 'error': return LogLevel.ERROR;
      default: return LogLevel.INFO;
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      this.log(LogLevel.DEBUG, message, context);
    }
  }

  info(message: string, context?: Record<string, any>): void {
    if (this.logLevel <= LogLevel.INFO) {
      this.log(LogLevel.INFO, message, context);
    }
  }

  warn(message: string, context?: Record<string, any>): void {
    if (this.logLevel <= LogLevel.WARN) {
      this.log(LogLevel.WARN, message, context);
    }
  }

  error(message: string, error?: Error | Record<string, any>): void {
    if (this.logLevel <= LogLevel.ERROR) {
      const context = error instanceof Error
        ? { error: { message: error.message, stack: error.stack } }
        : error;
      this.log(LogLevel.ERROR, message, context, error instanceof Error ? error : undefined);
    }
  }

  time(label: string): () => void {
    const start = performance.now();
    this.timers.set(label, start);

    return () => {
      const end = performance.now();
      const duration = end - (this.timers.get(label) || start);
      this.timers.delete(label);

      this.debug(`${label} completed`, { duration: `${duration.toFixed(2)}ms` });
      return duration;
    };
  }

  child(context: Record<string, any>): Logger {
    return new VSCodeLogger(
      this.contextData.service as string,
      { ...this.contextData, ...context },
      this.outputChannel
    );
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    const logContext: LogContext = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message,
      context: { ...this.contextData, ...context },
      error
    };

    const formatted = this.formatLog(logContext);
    this.outputChannel.appendLine(formatted);

    // Also log to VS Code's developer console in debug mode
    if (level === LogLevel.DEBUG && process.env.NODE_ENV === 'development') {
      console.log(formatted, logContext.context);
    }

    // Report errors to telemetry (if enabled)
    if (level === LogLevel.ERROR && error) {
      this.reportError(error, logContext);
    }
  }

  private formatLog(log: LogContext): string {
    const { timestamp, level, message, context, duration } = log;
    const contextStr = context && Object.keys(context).length > 0
      ? ` ${JSON.stringify(context)}`
      : '';
    const durationStr = duration ? ` [${duration.toFixed(2)}ms]` : '';

    return `[${timestamp}] [${level}]${durationStr} ${message}${contextStr}`;
  }

  private reportError(error: Error, context: LogContext): void {
    // This would integrate with telemetry service
    // For now, just ensure error is visible
    if (context.level === 'ERROR') {
      vscode.window.showErrorMessage(`Adaptive Tests: ${error.message}`);
    }
  }
}

/**
 * Factory function to create loggers
 */
export function createLogger(name: string, context?: Record<string, any>): Logger {
  return new VSCodeLogger(name, context);
}

/**
 * Performance tracking utility
 */
export class PerformanceTracker {
  private marks = new Map<string, number>();
  private measures: Array<{ name: string; duration: number }> = [];
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string, endMark?: string): number {
    const start = this.marks.get(startMark);
    const end = endMark ? this.marks.get(endMark) : performance.now();

    if (!start) {
      this.logger.warn(`Performance mark not found: ${startMark}`);
      return 0;
    }

    const duration = (end || performance.now()) - start;
    this.measures.push({ name, duration });

    this.logger.debug(`Performance: ${name}`, {
      duration: `${duration.toFixed(2)}ms`,
      start: startMark,
      end: endMark || 'now'
    });

    return duration;
  }

  getReport(): Record<string, any> {
    const report = {
      measures: this.measures.map(m => ({
        name: m.name,
        duration: `${m.duration.toFixed(2)}ms`
      })),
      summary: {
        count: this.measures.length,
        total: `${this.measures.reduce((sum, m) => sum + m.duration, 0).toFixed(2)}ms`,
        average: `${(this.measures.reduce((sum, m) => sum + m.duration, 0) / this.measures.length).toFixed(2)}ms`
      }
    };

    return report;
  }

  clear(): void {
    this.marks.clear();
    this.measures = [];
  }
}