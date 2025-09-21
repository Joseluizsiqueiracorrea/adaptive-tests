"use strict";
/**
 * Advanced logging service with structured logging, performance tracking, and telemetry
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
exports.PerformanceTracker = exports.VSCodeLogger = exports.LogLevel = void 0;
exports.createLogger = createLogger;
const vscode = __importStar(require("vscode"));
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class VSCodeLogger {
    constructor(name, context = {}, outputChannel) {
        this.timers = new Map();
        this.outputChannel = outputChannel || vscode.window.createOutputChannel(`Adaptive Tests - ${name}`);
        this.contextData = { service: name, ...context };
        this.logLevel = this.getConfiguredLogLevel();
    }
    getConfiguredLogLevel() {
        const config = vscode.workspace.getConfiguration('adaptive-tests');
        const level = config.get('logLevel', 'info').toLowerCase();
        switch (level) {
            case 'debug': return LogLevel.DEBUG;
            case 'info': return LogLevel.INFO;
            case 'warn': return LogLevel.WARN;
            case 'error': return LogLevel.ERROR;
            default: return LogLevel.INFO;
        }
    }
    debug(message, context) {
        if (this.logLevel <= LogLevel.DEBUG) {
            this.log(LogLevel.DEBUG, message, context);
        }
    }
    info(message, context) {
        if (this.logLevel <= LogLevel.INFO) {
            this.log(LogLevel.INFO, message, context);
        }
    }
    warn(message, context) {
        if (this.logLevel <= LogLevel.WARN) {
            this.log(LogLevel.WARN, message, context);
        }
    }
    error(message, error) {
        if (this.logLevel <= LogLevel.ERROR) {
            const context = error instanceof Error
                ? { error: { message: error.message, stack: error.stack } }
                : error;
            this.log(LogLevel.ERROR, message, context, error instanceof Error ? error : undefined);
        }
    }
    time(label) {
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
    child(context) {
        return new VSCodeLogger(this.contextData.service, { ...this.contextData, ...context }, this.outputChannel);
    }
    log(level, message, context, error) {
        const logContext = {
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
    formatLog(log) {
        const { timestamp, level, message, context, duration } = log;
        const contextStr = context && Object.keys(context).length > 0
            ? ` ${JSON.stringify(context)}`
            : '';
        const durationStr = duration ? ` [${duration.toFixed(2)}ms]` : '';
        return `[${timestamp}] [${level}]${durationStr} ${message}${contextStr}`;
    }
    reportError(error, context) {
        // This would integrate with telemetry service
        // For now, just ensure error is visible
        if (context.level === 'ERROR') {
            vscode.window.showErrorMessage(`Adaptive Tests: ${error.message}`);
        }
    }
}
exports.VSCodeLogger = VSCodeLogger;
/**
 * Factory function to create loggers
 */
function createLogger(name, context) {
    return new VSCodeLogger(name, context);
}
/**
 * Performance tracking utility
 */
class PerformanceTracker {
    constructor(logger) {
        this.marks = new Map();
        this.measures = [];
        this.logger = logger;
    }
    mark(name) {
        this.marks.set(name, performance.now());
    }
    measure(name, startMark, endMark) {
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
    getReport() {
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
    clear() {
        this.marks.clear();
        this.measures = [];
    }
}
exports.PerformanceTracker = PerformanceTracker;
//# sourceMappingURL=logger.js.map