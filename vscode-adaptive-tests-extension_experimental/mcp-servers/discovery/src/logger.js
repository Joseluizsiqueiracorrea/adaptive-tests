"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogger = createLogger;
const winston_1 = __importDefault(require("winston"));
function createLogger(service) {
    const logLevel = process.env.LOG_LEVEL || 'info';
    return winston_1.default.createLogger({
        level: logLevel,
        format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.metadata({
            fillWith: ['service', 'sessionId', 'requestId']
        }), winston_1.default.format.json()),
        defaultMeta: { service },
        transports: [
            // Console transport for development
            new winston_1.default.transports.Console({
                format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple())
            })
        ]
    });
}
//# sourceMappingURL=logger.js.map