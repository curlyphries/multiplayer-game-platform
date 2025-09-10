// Frontend logging utility with local storage and size management
class FrontendLogger {
  constructor() {
    this.maxLogSize = 1000; // Maximum number of log entries
    this.storageKey = 'game_logs';
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    
    // Initialize logging
    this.initializeLogging();
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  initializeLogging() {
    // Capture console errors
    this.setupConsoleCapture();
    
    // Capture unhandled errors
    window.addEventListener('error', (event) => {
      this.error('Unhandled Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled Promise Rejection', {
        reason: event.reason,
        stack: event.reason?.stack
      });
    });

    // Log session start
    this.info('Frontend session started', {
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    });
  }

  setupConsoleCapture() {
    const originalConsole = { ...console };
    
    console.error = (...args) => {
      this.error('Console Error', { args: args.map(arg => this.serializeArg(arg)) });
      originalConsole.error(...args);
    };

    console.warn = (...args) => {
      this.warn('Console Warning', { args: args.map(arg => this.serializeArg(arg)) });
      originalConsole.warn(...args);
    };

    // Store original console for internal use
    this.originalConsole = originalConsole;
  }

  serializeArg(arg) {
    if (typeof arg === 'object' && arg !== null) {
      try {
        return JSON.stringify(arg, null, 2);
      } catch (e) {
        return '[Object - could not serialize]';
      }
    }
    return String(arg);
  }

  createLogEntry(level, message, data = {}) {
    return {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      level,
      message,
      data,
      url: window.location.href,
      userAgent: navigator.userAgent
    };
  }

  writeLog(level, message, data = {}) {
    const entry = this.createLogEntry(level, message, data);
    
    try {
      // Get existing logs
      const existingLogs = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
      
      // Add new entry
      existingLogs.push(entry);
      
      // Trim logs if too large
      if (existingLogs.length > this.maxLogSize) {
        existingLogs.splice(0, existingLogs.length - this.maxLogSize);
      }
      
      // Store back
      localStorage.setItem(this.storageKey, JSON.stringify(existingLogs));
      
    } catch (error) {
      // If localStorage is full, clear old logs and try again
      this.clearOldLogs();
      try {
        localStorage.setItem(this.storageKey, JSON.stringify([entry]));
      } catch (e) {
        this.originalConsole.error('Failed to write log:', e);
      }
    }
  }

  // Log level methods
  debug(message, data = {}) {
    this.writeLog('debug', message, data);
  }

  info(message, data = {}) {
    this.writeLog('info', message, data);
  }

  warn(message, data = {}) {
    this.writeLog('warn', message, data);
  }

  error(message, data = {}) {
    this.writeLog('error', message, data);
  }

  // Game-specific logging helpers
  gameAction(action, roomId, data = {}) {
    this.info('Game Action', {
      action,
      roomId,
      ...data
    });
  }

  socketEvent(event, data = {}) {
    this.debug('Socket Event', {
      event,
      ...data
    });
  }

  userInteraction(interaction, element, data = {}) {
    this.debug('User Interaction', {
      interaction,
      element,
      ...data
    });
  }

  performance(operation, startTime, endTime = Date.now()) {
    const duration = endTime - startTime;
    this.info('Performance Metric', {
      operation,
      duration,
      startTime,
      endTime
    });
  }

  // Log management
  getLogs(level = null, limit = 100) {
    try {
      const logs = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
      let filteredLogs = logs;
      
      if (level) {
        filteredLogs = logs.filter(log => log.level === level);
      }
      
      return filteredLogs.slice(-limit);
    } catch (error) {
      this.originalConsole.error('Failed to retrieve logs:', error);
      return [];
    }
  }

  clearLogs() {
    try {
      localStorage.removeItem(this.storageKey);
      this.info('Logs cleared');
    } catch (error) {
      this.originalConsole.error('Failed to clear logs:', error);
    }
  }

  clearOldLogs() {
    try {
      const logs = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
      const recentLogs = logs.slice(-Math.floor(this.maxLogSize / 2));
      localStorage.setItem(this.storageKey, JSON.stringify(recentLogs));
    } catch (error) {
      this.originalConsole.error('Failed to clear old logs:', error);
    }
  }

  exportLogs() {
    const logs = this.getLogs();
    const exportData = {
      sessionId: this.sessionId,
      exportTime: new Date().toISOString(),
      logs
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `game-logs-${this.sessionId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Debug utilities
  getLogStats() {
    const logs = this.getLogs();
    const stats = {
      total: logs.length,
      byLevel: {},
      sessionDuration: Date.now() - this.startTime,
      oldestLog: logs[0]?.timestamp,
      newestLog: logs[logs.length - 1]?.timestamp
    };

    logs.forEach(log => {
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
    });

    return stats;
  }
}

// Create singleton instance
const logger = new FrontendLogger();

// Add to window for debugging
if (process.env.NODE_ENV !== 'production') {
  window.gameLogger = logger;
}

export default logger;
