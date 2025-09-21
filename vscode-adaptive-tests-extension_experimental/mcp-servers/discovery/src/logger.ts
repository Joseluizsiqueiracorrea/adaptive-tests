import winston from 'winston';
import path from 'path';

export function createLogger(service: string): winston.Logger {
  const logLevel = process.env.LOG_LEVEL || 'info';

  return winston.createLogger({
    level: logLevel,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.metadata({
        fillWith: ['service', 'sessionId', 'requestId']
      }),
      winston.format.json()
    ),
    defaultMeta: { service },
    transports: [
      // Console transport for development
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ]
  });
}