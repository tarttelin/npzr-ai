// NPZR Logging System - Simple console-based logging

// Export simple console logger
export { default as logger } from './logger.js';

// Browser debug logger (only available in browser environment)
export { initializeBrowserDebugLogger, BrowserDebugLogger } from './browserLogger.js';