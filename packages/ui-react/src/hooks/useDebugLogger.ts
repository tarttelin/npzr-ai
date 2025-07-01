import { useState, useEffect, useCallback } from 'react';
import { initializeBrowserDebugLogger, BrowserDebugLogger } from '@npzr/logging';

export interface UseDebugLoggerReturn {
  isVisible: boolean;
  toggle: () => void;
  show: () => void;
  hide: () => void;
  debugLogger: BrowserDebugLogger | null;
}

/**
 * React hook for managing the browser debug logger state
 */
export const useDebugLogger = (): UseDebugLoggerReturn => {
  const [isVisible, setIsVisible] = useState(false);
  const [debugLogger, setDebugLogger] = useState<BrowserDebugLogger | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const logger = initializeBrowserDebugLogger();
      setDebugLogger(logger);
    }
  }, []);

  const show = useCallback(() => {
    setIsVisible(true);
    debugLogger?.show();
  }, [debugLogger]);

  const hide = useCallback(() => {
    setIsVisible(false);
    debugLogger?.hide();
  }, [debugLogger]);

  const toggle = useCallback(() => {
    if (isVisible) {
      hide();
    } else {
      show();
    }
  }, [isVisible, show, hide]);

  return {
    isVisible,
    toggle,
    show,
    hide,
    debugLogger
  };
};