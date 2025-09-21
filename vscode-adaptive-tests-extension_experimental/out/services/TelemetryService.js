"use strict";
/**
 * Telemetry Service
 * Privacy-first analytics and performance monitoring
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
exports.TelemetryService = void 0;
const crypto = __importStar(require("crypto"));
class TelemetryService {
    constructor(logger, config) {
        this.logger = logger;
        this.config = config;
        this.queue = [];
        this.MAX_QUEUE_SIZE = 100;
        this.FLUSH_INTERVAL = 30000; // 30 seconds
        this.disposed = false;
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
    track(event) {
        if (!this.config.get('telemetry').enabled)
            return;
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
    trackPerformance(metric) {
        if (!this.config.get('telemetry').performanceMetrics)
            return;
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
    trackError(error, context) {
        if (!this.config.get('telemetry').crashReports)
            return;
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
    trackCommand(command, success, duration) {
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
    trackFeature(feature, action, metadata) {
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
    startTimer(name) {
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
    getSessionSummary() {
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
    exportData() {
        return {
            session: this.sanitizeSession(this.session),
            summary: this.getSessionSummary()
        };
    }
    /**
     * Opt out of telemetry
     */
    async optOut() {
        await this.config.update('telemetry', {
            ...this.config.get('telemetry'),
            enabled: false
        });
        this.dispose();
        this.logger.info('Telemetry opt-out complete');
    }
    createSession() {
        return {
            sessionId: this.generateSessionId(),
            startTime: Date.now(),
            events: [],
            metrics: [],
            errors: []
        };
    }
    generateSessionId() {
        const timestamp = Date.now().toString(36);
        const random = crypto.randomBytes(8).toString('hex');
        return `${timestamp}_${random}`;
    }
    sanitizeEvent(event) {
        const sanitized = { ...event };
        // Remove sensitive data
        if (sanitized.properties) {
            const cleaned = {};
            for (const [key, value] of Object.entries(sanitized.properties)) {
                // Skip sensitive keys
                if (this.isSensitiveKey(key))
                    continue;
                // Sanitize values
                if (typeof value === 'string') {
                    cleaned[key] = this.sanitizeString(value);
                }
                else if (typeof value === 'object' && value !== null) {
                    cleaned[key] = '[object]';
                }
                else {
                    cleaned[key] = value;
                }
            }
            sanitized.properties = cleaned;
        }
        return sanitized;
    }
    sanitizeSession(session) {
        return {
            ...session,
            events: session.events.map(e => this.sanitizeEvent(e)),
            errors: session.errors.map(e => ({
                ...e,
                stack: e.stack ? this.sanitizeStackTrace(e.stack) : undefined
            }))
        };
    }
    sanitizeString(str) {
        // Remove file paths, emails, etc.
        return str
            .replace(/\/Users\/[^/]+/g, '/Users/[USER]')
            .replace(/\\Users\\[^\\]+/g, '\\Users\\[USER]')
            .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
            .replace(/\b\d{4,}\b/g, '[NUMBER]');
    }
    sanitizeStackTrace(stack) {
        return stack
            .split('\n')
            .map(line => this.sanitizeString(line))
            .join('\n');
    }
    isSensitiveKey(key) {
        const sensitive = [
            'password', 'token', 'secret', 'key', 'api',
            'credential', 'auth', 'private', 'ssn', 'email'
        ];
        const lower = key.toLowerCase();
        return sensitive.some(s => lower.includes(s));
    }
    setupPerformanceObserver() {
        if (typeof globalThis.PerformanceObserver === 'undefined')
            return;
        try {
            this.performanceObserver = new globalThis.PerformanceObserver((entries) => {
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
        }
        catch (error) {
            this.logger.warn('Failed to setup performance observer', { error });
        }
    }
    setupErrorHandlers() {
        // Track unhandled rejections
        process.on('unhandledRejection', (reason) => {
            const error = reason instanceof Error ? reason : new Error(String(reason));
            this.trackError(error, { type: 'unhandledRejection' });
        });
        // Track uncaught exceptions
        process.on('uncaughtException', (error) => {
            this.trackError(error, { type: 'uncaughtException' });
        });
    }
    startFlushTimer() {
        this.flushTimer = setInterval(() => {
            this.flush();
        }, this.FLUSH_INTERVAL);
    }
    async flush() {
        if (this.queue.length === 0)
            return;
        const events = [...this.queue];
        this.queue = [];
        try {
            // In production, this would send to analytics backend
            await this.sendTelemetry(events);
            this.logger.debug('Telemetry flushed', { count: events.length });
        }
        catch (error) {
            this.logger.error('Telemetry flush failed', error);
            // Re-queue events if send failed
            this.queue = [...events, ...this.queue].slice(0, this.MAX_QUEUE_SIZE);
        }
    }
    async sendTelemetry(events) {
        // In production, implement actual sending logic
        // For now, just log in development mode
        if (process.env.NODE_ENV === 'development') {
            console.log('[Telemetry]', events);
        }
    }
    dispose() {
        if (this.disposed)
            return;
        this.disposed = true;
        clearInterval(this.flushTimer);
        this.performanceObserver?.disconnect();
        this.flush();
        this.logger.info('TelemetryService disposed', {
            summary: this.getSessionSummary()
        });
    }
}
exports.TelemetryService = TelemetryService;
//# sourceMappingURL=TelemetryService.js.map