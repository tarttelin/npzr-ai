import winston from 'winston';

// Detect browser environment
const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Set level based on environment
const level = () => {
  if (isTest) return 'error'; // Only errors in tests
  return isDevelopment ? 'debug' : 'warn';
};

// Color configuration for console output
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Format configuration
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf((info) => {
    // Custom format for better readability
    if (isDevelopment || isTest) {
      return `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`;
    }
    // Structured JSON for production
    return JSON.stringify({
      timestamp: info.timestamp,
      level: info.level,
      message: info.message,
      ...(typeof info.meta === 'object' && info.meta ? info.meta : {})
    });
  })
);

// Transport configuration
const transports: winston.transport[] = [];

// Always add console transport for development and testing
if (isDevelopment || isTest) {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        format
      )
    })
  );
}

// Production transports - different for browser vs Node.js
if (!isDevelopment && !isTest) {
  if (isBrowser) {
    // Browser environment - only console logging (browser logger will handle the debug UI separately)
    transports.push(
      new winston.transports.Console({
        format: winston.format.json()
      })
    );
  } else {
    // Node.js environment - use file transports
    transports.push(
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: winston.format.json()
      })
    );
    
    transports.push(
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: winston.format.json()
      })
    );
    
    transports.push(
      new winston.transports.Console({
        format: winston.format.json()
      })
    );
  }
}

const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  // Prevent winston from exiting on error
  exitOnError: false,
});

export default logger;