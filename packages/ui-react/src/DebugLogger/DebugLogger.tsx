import React, { useEffect, useRef, useState, useCallback } from 'react';
import { initializeBrowserDebugLogger, BrowserDebugLogger } from '@npzr/logging';
import './DebugLogger.css';

export interface DebugLoggerProps {
  isVisible?: boolean;
  onToggle?: (visible: boolean) => void;
  className?: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxLogs?: number;
}

export const DebugLogger: React.FC<DebugLoggerProps> = ({
  isVisible = false,
  onToggle,
  className = '',
  position = 'top-right',
  maxLogs = 1000
}) => {
  const debugLoggerRef = useRef<BrowserDebugLogger | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [logs, setLogs] = useState<string>('');
  const [currentLevel, setCurrentLevel] = useState('info');
  const [autoScroll, setAutoScroll] = useState(true);

  // Initialize the browser debug logger
  useEffect(() => {
    if (typeof window !== 'undefined') {
      debugLoggerRef.current = initializeBrowserDebugLogger();
    }

    return () => {
      // Cleanup handled by the browser logger itself
    };
  }, []);

  // Mock log update functionality for React integration
  // In a real implementation, this would subscribe to the BrowserLogStore
  const updateLogs = useCallback(() => {
    if (debugLoggerRef.current) {
      // This is a simplified version - in practice, you'd get logs from BrowserLogStore
      const mockLogs = [
        '[2025-07-01 10:30:45] 🔵 INFO: Game initialized {"players":2,"mode":"classic"}',
        '[2025-07-01 10:30:46] 🟣 DEBUG: Deck shuffled {"cardCount":44,"seed":0.123}',
        '[2025-07-01 10:30:47] 🔵 INFO: AI (🔥 Hard): Playing card Ninja Head {"action":"play_card","value":1200}'
      ].join('\n');
      setLogs(mockLogs);
    }
  }, []);

  // Auto-scroll effect
  useEffect(() => {
    if (autoScroll && textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleToggle = () => {
    const newVisible = !isVisible;
    onToggle?.(newVisible);
  };

  const handleClear = () => {
    setLogs('');
    // Also clear the browser logger if available
    if (debugLoggerRef.current) {
      // Would call debugLoggerRef.current.clearLogs() in real implementation
    }
  };

  const handleLevelChange = (level: string) => {
    setCurrentLevel(level);
    updateLogs();
  };

  const handleAutoScrollToggle = () => {
    setAutoScroll(!autoScroll);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`debug-logger debug-logger--${position} ${className}`}>
      <div className="debug-logger__header">
        <span className="debug-logger__title">NPZR Debug Logs</span>
        
        <select 
          value={currentLevel}
          onChange={(e) => handleLevelChange(e.target.value)}
          className="debug-logger__level-select"
        >
          <option value="debug">Debug</option>
          <option value="info">Info</option>
          <option value="warn">Warn</option>
          <option value="error">Error</option>
        </select>

        <button 
          onClick={handleAutoScrollToggle}
          className={`debug-logger__btn ${autoScroll ? 'debug-logger__btn--active' : ''}`}
        >
          📜 Auto-scroll
        </button>

        <button 
          onClick={handleClear}
          className="debug-logger__btn debug-logger__btn--danger"
        >
          🗑️ Clear
        </button>

        <button 
          onClick={handleToggle}
          className="debug-logger__btn debug-logger__btn--close"
        >
          ✕
        </button>
      </div>

      <textarea
        ref={textareaRef}
        value={logs}
        readOnly
        className="debug-logger__content"
        placeholder="Debug logs will appear here..."
      />
    </div>
  );
};