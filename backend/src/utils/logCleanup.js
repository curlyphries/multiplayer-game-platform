const fs = require('fs');
const path = require('path');
const { logger } = require('./logger');

class LogCleanup {
  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    this.maxLogAge = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    this.maxLogSize = 100 * 1024 * 1024; // 100MB in bytes
  }

  async cleanupLogs() {
    try {
      if (!fs.existsSync(this.logDir)) {
        return;
      }

      const files = fs.readdirSync(this.logDir);
      const now = Date.now();
      let totalSize = 0;
      let filesRemoved = 0;

      // Get file stats
      const fileStats = files.map(file => {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          path: filePath,
          size: stats.size,
          mtime: stats.mtime.getTime()
        };
      });

      // Calculate total size
      totalSize = fileStats.reduce((sum, file) => sum + file.size, 0);

      // Remove old files
      for (const file of fileStats) {
        const age = now - file.mtime;
        
        if (age > this.maxLogAge) {
          fs.unlinkSync(file.path);
          filesRemoved++;
          totalSize -= file.size;
          logger.info('Removed old log file', { 
            filename: file.name, 
            age: Math.round(age / (24 * 60 * 60 * 1000)) + ' days'
          });
        }
      }

      // If still too large, remove oldest files
      if (totalSize > this.maxLogSize) {
        const sortedFiles = fileStats
          .filter(file => fs.existsSync(file.path)) // Still exists after age cleanup
          .sort((a, b) => a.mtime - b.mtime); // Oldest first

        for (const file of sortedFiles) {
          if (totalSize <= this.maxLogSize) break;
          
          fs.unlinkSync(file.path);
          filesRemoved++;
          totalSize -= file.size;
          logger.info('Removed log file due to size limit', { 
            filename: file.name,
            size: Math.round(file.size / 1024) + 'KB'
          });
        }
      }

      if (filesRemoved > 0) {
        logger.info('Log cleanup completed', {
          filesRemoved,
          remainingSize: Math.round(totalSize / 1024) + 'KB'
        });
      }

    } catch (error) {
      logger.error('Log cleanup failed', error);
    }
  }

  startCleanupSchedule() {
    // Run cleanup every 6 hours
    setInterval(() => {
      this.cleanupLogs();
    }, 6 * 60 * 60 * 1000);

    // Run initial cleanup after 1 minute
    setTimeout(() => {
      this.cleanupLogs();
    }, 60 * 1000);

    logger.info('Log cleanup scheduler started');
  }
}

module.exports = LogCleanup;
