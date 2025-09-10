const WordGame = require('./WordGame');
const TriviaGame = require('./TriviaGame');
const DrawingGame = require('./DrawingGame');
const MusicQuizGame = require('./MusicQuizGame');

/**
 * Game Factory - Creates game instances based on game type
 * Provides centralized game instantiation and configuration
 */
class GameFactory {
  static GAME_TYPES = {
    'word-game': {
      class: WordGame,
      name: 'Word Game',
      description: 'Creative word prompts and voting',
      defaultConfig: {
        maxRounds: 3,
        timePerRound: 60,
        votingTime: 30
      }
    },
    'trivia-game': {
      class: TriviaGame,
      name: 'Trivia Challenge',
      description: 'Test your knowledge across categories',
      defaultConfig: {
        maxRounds: 5,
        timePerRound: 30,
        categories: ['general', 'science', 'history', 'entertainment', 'sports']
      }
    },
    'drawing-game': {
      class: DrawingGame,
      name: 'Drawing Game',
      description: 'Draw prompts and guess what others drew',
      defaultConfig: {
        maxRounds: 4,
        timePerRound: 90,
        votingTime: 30
      }
    },
    'music-game': {
      class: MusicQuizGame,
      name: 'Music Quiz',
      description: 'Name that tune and artist challenges',
      defaultConfig: {
        maxRounds: 6,
        timePerRound: 20,
        categories: ['pop', 'rock', 'classic', 'soundtrack', 'mixed']
      }
    }
  };

  /**
   * Create a new game instance
   * @param {string} gameType - Type of game to create
   * @param {string} roomId - Room ID for the game
   * @param {Array} players - Array of player objects
   * @param {Object} customConfig - Custom configuration overrides
   * @returns {BaseGame} Game instance
   */
  static createGame(gameType, roomId, players, customConfig = {}) {
    const gameDefinition = this.GAME_TYPES[gameType];
    
    if (!gameDefinition) {
      throw new Error(`Unknown game type: ${gameType}`);
    }

    const GameClass = gameDefinition.class;
    const config = { ...gameDefinition.defaultConfig, ...customConfig };

    console.log(`🎮 Creating ${gameDefinition.name} for room ${roomId} with ${players.length} players`);
    
    return new GameClass(roomId, players, config);
  }

  /**
   * Get available game types
   * @returns {Array} Array of game type information
   */
  static getAvailableGames() {
    return Object.entries(this.GAME_TYPES).map(([id, definition]) => ({
      id,
      name: definition.name,
      description: definition.description,
      defaultConfig: definition.defaultConfig
    }));
  }

  /**
   * Get game type information
   * @param {string} gameType - Game type to get info for
   * @returns {Object} Game type information
   */
  static getGameInfo(gameType) {
    const gameDefinition = this.GAME_TYPES[gameType];
    
    if (!gameDefinition) {
      throw new Error(`Unknown game type: ${gameType}`);
    }

    return {
      id: gameType,
      name: gameDefinition.name,
      description: gameDefinition.description,
      defaultConfig: gameDefinition.defaultConfig
    };
  }

  /**
   * Validate game type
   * @param {string} gameType - Game type to validate
   * @returns {boolean} True if valid game type
   */
  static isValidGameType(gameType) {
    return gameType in this.GAME_TYPES;
  }

  /**
   * Get default configuration for a game type
   * @param {string} gameType - Game type
   * @returns {Object} Default configuration
   */
  static getDefaultConfig(gameType) {
    const gameDefinition = this.GAME_TYPES[gameType];
    
    if (!gameDefinition) {
      throw new Error(`Unknown game type: ${gameType}`);
    }

    return { ...gameDefinition.defaultConfig };
  }

  /**
   * Register a new game type (for extensibility)
   * @param {string} gameType - Game type identifier
   * @param {Object} gameDefinition - Game definition object
   */
  static registerGameType(gameType, gameDefinition) {
    if (!gameDefinition.class || !gameDefinition.name || !gameDefinition.description) {
      throw new Error('Game definition must include class, name, and description');
    }

    this.GAME_TYPES[gameType] = {
      class: gameDefinition.class,
      name: gameDefinition.name,
      description: gameDefinition.description,
      defaultConfig: gameDefinition.defaultConfig || {}
    };

    console.log(`📝 Registered new game type: ${gameType} (${gameDefinition.name})`);
  }

  /**
   * Create game with host-specified configuration
   * @param {string} gameType - Game type
   * @param {string} roomId - Room ID
   * @param {Array} players - Players array
   * @param {Object} hostConfig - Host-specified configuration
   * @returns {BaseGame} Game instance
   */
  static createCustomGame(gameType, roomId, players, hostConfig = {}) {
    const gameDefinition = this.GAME_TYPES[gameType];
    
    if (!gameDefinition) {
      throw new Error(`Unknown game type: ${gameType}`);
    }

    // Validate host configuration
    const validatedConfig = this.validateHostConfig(gameType, hostConfig);
    const finalConfig = { ...gameDefinition.defaultConfig, ...validatedConfig };

    console.log(`🎮 Creating custom ${gameDefinition.name} with config:`, finalConfig);
    
    return new gameDefinition.class(roomId, players, finalConfig);
  }

  /**
   * Validate host-provided configuration
   * @param {string} gameType - Game type
   * @param {Object} hostConfig - Host configuration
   * @returns {Object} Validated configuration
   */
  static validateHostConfig(gameType, hostConfig) {
    const validated = {};
    const defaults = this.getDefaultConfig(gameType);

    // Validate maxRounds
    if (hostConfig.maxRounds !== undefined) {
      const rounds = parseInt(hostConfig.maxRounds);
      if (rounds >= 1 && rounds <= 10) {
        validated.maxRounds = rounds;
      }
    }

    // Validate timePerRound
    if (hostConfig.timePerRound !== undefined) {
      const time = parseInt(hostConfig.timePerRound);
      if (time >= 10 && time <= 300) { // 10 seconds to 5 minutes
        validated.timePerRound = time;
      }
    }

    // Validate votingTime
    if (hostConfig.votingTime !== undefined) {
      const time = parseInt(hostConfig.votingTime);
      if (time >= 10 && time <= 120) { // 10 seconds to 2 minutes
        validated.votingTime = time;
      }
    }

    // Game-specific validations
    switch (gameType) {
      case 'trivia-game':
        if (hostConfig.categories && Array.isArray(hostConfig.categories)) {
          const validCategories = ['general', 'science', 'history', 'entertainment', 'sports'];
          validated.categories = hostConfig.categories.filter(cat => validCategories.includes(cat));
        }
        break;

      case 'music-game':
        if (hostConfig.categories && Array.isArray(hostConfig.categories)) {
          const validCategories = ['pop', 'rock', 'classic', 'soundtrack', 'mixed'];
          validated.categories = hostConfig.categories.filter(cat => validCategories.includes(cat));
        }
        break;

      case 'drawing-game':
        if (hostConfig.maxGuesses !== undefined) {
          const guesses = parseInt(hostConfig.maxGuesses);
          if (guesses >= 1 && guesses <= 5) {
            validated.maxGuesses = guesses;
          }
        }
        break;
    }

    return validated;
  }
}

module.exports = GameFactory;
