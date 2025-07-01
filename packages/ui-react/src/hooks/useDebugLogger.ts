import { useCallback } from 'react';
import { useLogger } from '../LoggerProvider';

export interface UseDebugLoggerReturn {
  isVisible: boolean;
  toggle: () => void;
  show: () => void;
  hide: () => void;
  debugLogger: null; // Deprecated - kept for backward compatibility
}

/**
 * React hook for managing the browser debug logger state
 * @deprecated Use useLogger from LoggerProvider instead
 */
export const useDebugLogger = (): UseDebugLoggerReturn => {
  const { isVisible, setIsVisible, toggle } = useLogger();

  const show = useCallback(() => {
    setIsVisible(true);
  }, [setIsVisible]);

  const hide = useCallback(() => {
    setIsVisible(false);
  }, [setIsVisible]);

  return {
    isVisible,
    toggle,
    show,
    hide,
    debugLogger: null // Deprecated
  };
};