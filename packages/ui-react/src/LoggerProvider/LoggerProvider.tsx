/* eslint-env browser */
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { BrowserLogStore, LogLevel, LOG_LEVELS } from '@npzr/logging';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  meta?: any;
}

interface LoggerContextValue {
  logs: LogEntry[];
  filteredLogs: LogEntry[];
  currentLevel: LogLevel;
  setCurrentLevel: (level: LogLevel) => void;
  clearLogs: () => void;
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
  toggle: () => void;
}

const LoggerContext = createContext<LoggerContextValue | null>(null);

interface LoggerProviderProps {
  children: ReactNode;
  defaultLevel?: LogLevel;
  defaultVisible?: boolean;
}

export const LoggerProvider: React.FC<LoggerProviderProps> = ({
  children,
  defaultLevel = 'info',
  defaultVisible = false
}) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [currentLevel, setCurrentLevel] = useState<LogLevel>(defaultLevel);
  const [isVisible, setIsVisible] = useState(defaultVisible);

  // Subscribe to log store changes
  useEffect(() => {
    const updateLogs = () => {
      setLogs(BrowserLogStore.getLogs());
    };

    // Initial load
    updateLogs();

    // Subscribe to changes
    const unsubscribe = BrowserLogStore.addListener(updateLogs);

    return unsubscribe;
  }, []);

  // Filter logs based on current level
  const filteredLogs = React.useMemo(() => {
    const currentLevelValue = LOG_LEVELS[currentLevel];
    return logs.filter(log => {
      const logLevel = LOG_LEVELS[log.level as LogLevel] ?? 999;
      return logLevel <= currentLevelValue;
    });
  }, [logs, currentLevel]);

  const clearLogs = useCallback(() => {
    BrowserLogStore.clearLogs();
  }, []);

  const toggle = useCallback(() => {
    setIsVisible(prev => !prev);
  }, []);

  // Global keyboard shortcut (Ctrl+Shift+L)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        toggle();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  const contextValue: LoggerContextValue = {
    logs,
    filteredLogs,
    currentLevel,
    setCurrentLevel,
    clearLogs,
    isVisible,
    setIsVisible,
    toggle
  };

  return (
    <LoggerContext.Provider value={contextValue}>
      {children}
    </LoggerContext.Provider>
  );
};

export const useLogger = (): LoggerContextValue => {
  const context = useContext(LoggerContext);
  if (!context) {
    throw new Error('useLogger must be used within a LoggerProvider');
  }
  return context;
};