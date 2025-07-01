import logger from './logger.js';

describe('Logger', () => {
  test('should be a valid winston logger', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  test('should handle logging without throwing errors', () => {
    expect(() => {
      logger.info('Test message', { test: true });
      logger.warn('Warning message', { action: 'test' });
      logger.error('Error message', { error: 'test' });
      logger.debug('Debug message', { debug: true });
    }).not.toThrow();
  });
});