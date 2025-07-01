/* eslint-env browser */

// Import BrowserLogStore from main logger
import { BrowserLogStore } from './logger.js';

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

// Browser-specific log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 4,
};

// BrowserLogStore is now imported from logger.js

// Simple browser transport (no winston dependency)
// This is no longer used since we moved to direct BrowserLogStore usage

// Browser debug UI manager
export class BrowserDebugLogger {
  private container: HTMLElement | null = null;
  private textarea: HTMLTextAreaElement | null = null;
  private isVisible = false;
  private currentLevel = 'info';
  private autoScroll = true;
  private unsubscribe: (() => void) | null = null;

  constructor() {
    this.createDebugUI();
    this.setupListener();
  }

  private createDebugUI(): void {
    // Create container
    this.container = document.createElement('div');
    this.container.id = 'npzr-debug-logger';
    this.container.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 600px;
      height: 400px;
      background: #1e1e1e;
      border: 2px solid #333;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      z-index: 10000;
      display: none;
      flex-direction: column;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    `;

    // Create header with controls
    const header = document.createElement('div');
    header.style.cssText = `
      background: #2d2d2d;
      padding: 8px 12px;
      border-bottom: 1px solid #333;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 12px;
      color: #fff;
      border-radius: 6px 6px 0 0;
    `;

    // Title
    const title = document.createElement('span');
    title.textContent = 'NPZR Debug Logs';
    title.style.fontWeight = 'bold';
    title.style.flex = '1';

    // Log level selector
    const levelSelect = document.createElement('select');
    levelSelect.style.cssText = `
      background: #333;
      color: #fff;
      border: 1px solid #555;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 11px;
    `;
    levelSelect.innerHTML = `
      <option value="debug">Debug</option>
      <option value="info" selected>Info</option>
      <option value="warn">Warn</option>
      <option value="error">Error</option>
    `;
    levelSelect.addEventListener('change', (e: Event) => {
      this.currentLevel = (e.target as HTMLSelectElement).value;
      this.updateDisplay();
    });

    // Auto-scroll toggle
    const autoScrollBtn = document.createElement('button');
    autoScrollBtn.textContent = '📜 Auto-scroll';
    autoScrollBtn.style.cssText = `
      background: #4a9eff;
      color: white;
      border: none;
      padding: 4px 8px;
      border-radius: 3px;
      font-size: 11px;
      cursor: pointer;
    `;
    autoScrollBtn.addEventListener('click', () => {
      this.autoScroll = !this.autoScroll;
      autoScrollBtn.style.background = this.autoScroll ? '#4a9eff' : '#666';
      autoScrollBtn.textContent = this.autoScroll ? '📜 Auto-scroll' : '📜 Manual';
    });

    // Clear button
    const clearBtn = document.createElement('button');
    clearBtn.textContent = '🗑️ Clear';
    clearBtn.style.cssText = `
      background: #ff6b6b;
      color: white;
      border: none;
      padding: 4px 8px;
      border-radius: 3px;
      font-size: 11px;
      cursor: pointer;
    `;
    clearBtn.addEventListener('click', () => {
      BrowserLogStore.clearLogs();
    });

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = `
      background: #666;
      color: white;
      border: none;
      padding: 4px 8px;
      border-radius: 3px;
      font-size: 11px;
      cursor: pointer;
      margin-left: 5px;
    `;
    closeBtn.addEventListener('click', () => {
      this.hide();
    });

    header.appendChild(title);
    header.appendChild(levelSelect);
    header.appendChild(autoScrollBtn);
    header.appendChild(clearBtn);
    header.appendChild(closeBtn);

    // Create textarea
    this.textarea = document.createElement('textarea');
    this.textarea.readOnly = true;
    this.textarea.style.cssText = `
      flex: 1;
      background: #1e1e1e;
      color: #d4d4d4;
      border: none;
      padding: 10px;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      line-height: 1.4;
      resize: none;
      outline: none;
      white-space: pre;
    `;

    this.container.appendChild(header);
    this.container.appendChild(this.textarea);
    document.body.appendChild(this.container);
  }

  private setupListener(): void {
    this.unsubscribe = BrowserLogStore.addListener(() => {
      if (this.isVisible) {
        this.updateDisplay();
      }
    });
  }

  private updateDisplay(): void {
    if (!this.textarea) return;

    const logs = BrowserLogStore.getLogs();
    const filteredLogs = logs.filter(log => {
      const logLevel = levels[log.level as keyof typeof levels] ?? 0;
      const currentLevel = levels[this.currentLevel as keyof typeof levels] ?? 0;
      return logLevel <= currentLevel;
    });

    const logText = filteredLogs
      .map(log => {
        const levelIcon = this.getLevelIcon(log.level);
        const metaText = log.meta ? ` ${JSON.stringify(log.meta)}` : '';
        return `[${log.timestamp}] ${levelIcon} ${log.level.toUpperCase()}: ${log.message}${metaText}`;
      })
      .join('\n');

    this.textarea.value = logText;

    if (this.autoScroll) {
      this.textarea.scrollTop = this.textarea.scrollHeight;
    }
  }

  private getLevelIcon(level: string): string {
    switch (level) {
      case 'error': return '🔴';
      case 'warn': return '🟡';
      case 'info': return '🔵';
      case 'debug': return '🟣';
      default: return '⚪';
    }
  }

  show(): void {
    if (this.container) {
      this.container.style.display = 'flex';
      this.isVisible = true;
      this.updateDisplay();
    }
  }

  hide(): void {
    if (this.container) {
      this.container.style.display = 'none';
      this.isVisible = false;
    }
  }

  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    if (this.container) {
      document.body.removeChild(this.container);
    }
  }
}

// Global debug logger instance
let debugLoggerInstance: BrowserDebugLogger | null = null;

// Initialize browser debug logger
export const initializeBrowserDebugLogger = (): BrowserDebugLogger => {
  if (!debugLoggerInstance) {
    debugLoggerInstance = new BrowserDebugLogger();
    
    // Add global keyboard shortcut (Ctrl+Shift+L) to toggle debug logger
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        debugLoggerInstance?.toggle();
      }
    });
  }
  return debugLoggerInstance;
};