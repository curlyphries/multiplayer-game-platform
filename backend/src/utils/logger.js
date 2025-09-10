const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, '../../logs');

// Define log levels and colors
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(logColors);

// Custom format for structured logging
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }
    return log;
  })
);

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: logLevels,
  format: logFormat,
  transports: [
    // Error logs - separate file, kept for 30 days
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '10m',
      maxFiles: '30d',
      zippedArchive: true,
    }),
    
    // Combined logs - all levels, kept for 14 days
    new DailyRotateFile({
      filename: path.join(logDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    }),
    
    // Game-specific logs for debugging gameplay
    new DailyRotateFile({
      filename: path.join(logDir, 'game-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'info',
      maxSize: '5m',
      maxFiles: '7d',
      zippedArchive: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format.label({ label: 'GAME' })
      )
    }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: 'debug'
  }));
}

// Helper functions for structured logging
const logHelpers = {
  // Room operations
  roomCreated: (roomId, gameType, maxPlayers, hostId) => {
    logger.info('Room created', {
      action: 'room_created',
      roomId,
      gameType,
      maxPlayers,
      hostId,
      timestamp: new Date().toISOString()
    });
  },

  roomJoined: (roomId, playerId, playerName) => {
    logger.info('Player joined room', {
      action: 'room_joined',
      roomId,
      playerId,
      playerName,
      timestamp: new Date().toISOString()
    });
  },

  roomLeft: (roomId, playerId, playerName, reason = 'voluntary') => {
    logger.info('Player left room', {
      action: 'room_left',
      roomId,
      playerId,
      playerName,
      reason,
      timestamp: new Date().toISOString()
    });
  },

  // Game operations
  gameStarted: (roomId, gameType, playerCount) => {
    logger.info('Game started', {
      action: 'game_started',
      roomId,
      gameType,
      playerCount,
      timestamp: new Date().toISOString()
    });
  },

  gameAction: (roomId, playerId, action, data = {}) => {
    logger.info('Game action', {
      action: 'game_action',
      roomId,
      playerId,
      gameAction: action,
      data,
      timestamp: new Date().toISOString()
    });
  },

  // Bot operations
  botAdded: (roomId, botId, botName) => {
    logger.info('Bot added to room', {
      action: 'bot_added',
      roomId,
      botId,
      botName,
      timestamp: new Date().toISOString()
    });
  },

  botAction: (roomId, botId, action, data = {}) => {
    logger.info('Bot performed action', {
      action: 'bot_action',
      roomId,
      botId,
      botAction: action,
      data,
      timestamp: new Date().toISOString()
    });
  },

  // Socket operations
  socketConnected: (socketId, userAgent = '') => {
    logger.info('Socket connected', {
      action: 'socket_connected',
      socketId,
      userAgent,
      timestamp: new Date().toISOString()
    });
  },

  socketDisconnected: (socketId, reason = '') => {
    logger.info('Socket disconnected', {
      action: 'socket_disconnected',
      socketId,
      reason,
      timestamp: new Date().toISOString()
    });
  },

  // Error logging
  error: (message, error, context = {}) => {
    logger.error(message, {
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
  },

  // Performance monitoring
  performance: (operation, duration, context = {}) => {
    logger.info('Performance metric', {
      action: 'performance',
      operation,
      duration,
      context,
      timestamp: new Date().toISOString()
    });
  }
};

// Middleware for HTTP request logging
const httpLogger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new DailyRotateFile({
      filename: path.join(logDir, 'http-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '10m',
      maxFiles: '7d',
      zippedArchive: true,
    })
  ]
});

const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    httpLogger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
  });
  
  next();
};

module.exports = {
  logger,
  logHelpers,
  requestLogger
};
