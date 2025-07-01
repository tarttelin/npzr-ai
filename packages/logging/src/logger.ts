// Simple console-based logger - no external dependencies

interface LogMethod {
  (message: string, meta?: any): void;
}

interface Logger {
  error: LogMethod;
  warn: LogMethod;
  info: LogMethod;
  debug: LogMethod;
}

// Browser log store for textarea debugging (only in browser)
class BrowserLogStore {
  private static logs: Array<{ timestamp: string; level: string; message: string; meta?: any }> = [];
  private static listeners: Array<() => void> = [];
  private static maxLogs = 1000;

  static addLog(timestamp: string, level: string, message: string, meta?: any) {
    this.logs.push({ timestamp, level, message, meta });
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    
    // Notify listeners
    this.listeners.forEach(listener => listener());
  }

  static getLogs(): Array<{ timestamp: string; level: string; message: string; meta?: any }> {
    return [...this.logs];
  }

  static clearLogs(): void {
    this.logs = [];
    this.listeners.forEach(listener => listener());
  }

  static addListener(callback: () => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
}

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';
const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

const formatMessage = (level: string, message: string, meta?: any): string => {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `${timestamp} [${level.toUpperCase()}]: ${message}${metaStr}`;
};

const shouldLog = (level: string): boolean => {
  if (isTest) return level === 'error'; // Only errors in tests
  if (isDevelopment) return true; // All levels in development
  return level !== 'debug'; // Production: error, warn, info but not debug
};

const logToConsole = (level: 'error' | 'warn' | 'info' | 'log', message: string, meta?: any) => {
  const levelName = level === 'log' ? 'debug' : level;
  
  if (!shouldLog(levelName)) return;
  
  const formattedMessage = formatMessage(levelName, message, meta);
  
  // Use appropriate console method
  if (console[level]) {
    console[level](formattedMessage);
  } else {
    console.log(formattedMessage);
  }
  
  // Also store in browser log store for textarea debugging (browser only)
  if (isBrowser && !isTest) {
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    BrowserLogStore.addLog(timestamp, levelName, message, meta);
  }
};

const logger: Logger = {
  error: (message: string, meta?: any) => logToConsole('error', message, meta),
  warn: (message: string, meta?: any) => logToConsole('warn', message, meta),
  info: (message: string, meta?: any) => logToConsole('info', message, meta),
  debug: (message: string, meta?: any) => logToConsole('log', message, meta)
};

// Export BrowserLogStore for use by debug UI
export { BrowserLogStore };
export default logger;