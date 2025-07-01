/* eslint-env browser */
import React, { useRef, useEffect, useState } from 'react';
import { useLogger } from '../LoggerProvider';
import './LoggerOutput.css';

export interface LoggerOutputProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  width?: number;
  height?: number;
  autoScroll?: boolean;
  className?: string;
}

export const LoggerOutput: React.FC<LoggerOutputProps> = ({
  position = 'top-right',
  width = 600,
  height = 400,
  autoScroll: defaultAutoScroll = true,
  className = ''
}) => {
  const {
    filteredLogs,
    currentLevel,
    setCurrentLevel,
    clearLogs,
    isVisible,
    toggle
  } = useLogger();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [autoScroll, setAutoScroll] = useState(defaultAutoScroll);

  // Format logs for display
  const logText = filteredLogs
    .map(log => {
      const metaStr = log.meta ? ` ${JSON.stringify(log.meta)}` : '';
      return `${log.timestamp} [${log.level.toUpperCase()}]: ${log.message}${metaStr}`;
    })
    .join('\n');

  // Auto-scroll effect
  useEffect(() => {
    if (autoScroll && textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [logText, autoScroll]);

  const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentLevel(e.target.value as any);
  };

  const toggleAutoScroll = () => {
    setAutoScroll(prev => !prev);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div 
      className={`logger-output logger-output--${position} ${className}`}
      style={{ width, height }}
    >
      <div className="logger-output__header">
        <span className="logger-output__title">🎮 NPZR Debug Logs</span>
        
        <select 
          value={currentLevel} 
          onChange={handleLevelChange}
          className="logger-output__level-select"
        >
          <option value="debug">Debug</option>
          <option value="info">Info</option>
          <option value="warn">Warn</option>
          <option value="error">Error</option>
        </select>

        <button 
          onClick={toggleAutoScroll}
          className={`logger-output__btn ${autoScroll ? 'logger-output__btn--active' : ''}`}
          title="Toggle auto-scroll"
        >
          📜 {autoScroll ? 'Auto' : 'Manual'}
        </button>

        <button 
          onClick={clearLogs}
          className="logger-output__btn logger-output__btn--danger"
          title="Clear logs"
        >
          🗑️ Clear
        </button>

        <button 
          onClick={toggle}
          className="logger-output__btn logger-output__btn--close"
          title="Close debug logger"
        >
          ✕
        </button>
      </div>

      <textarea
        ref={textareaRef}
        value={logText}
        readOnly
        className="logger-output__content"
        placeholder="Debug logs will appear here..."
        data-testid="logger-output-textarea"
      />
    </div>
  );
};