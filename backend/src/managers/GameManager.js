const GameFactory = require('../games/GameFactory');

class GameManager {
  constructor() {
    this.games = new Map();
  }

  createGame(roomId, gameType, players, customConfig = {}) {
    const game = GameFactory.createGame(gameType, roomId, players, customConfig);
    this.games.set(roomId, game);
    
    console.log(`🎯 Created ${gameType} for room ${roomId} with ${players.length} players`);
    return game;
  }

  createCustomGame(roomId, gameType, players, hostConfig = {}) {
    const game = GameFactory.createCustomGame(gameType, roomId, players, hostConfig);
    this.games.set(roomId, game);
    
    console.log(`🎯 Created custom ${gameType} for room ${roomId} with host config`);
    return game;
  }

  getAvailableGames() {
    return GameFactory.getAvailableGames();
  }

  getGameInfo(gameType) {
    return GameFactory.getGameInfo(gameType);
  }

  isValidGameType(gameType) {
    return GameFactory.isValidGameType(gameType);
  }

  getGame(roomId) {
    return this.games.get(roomId);
  }

  handleGameAction(roomId, playerId, action, data) {
    const room = this.roomManager.getRoom(roomId);
    if (!room || !room.game) {
      throw new Error('Game not found');
    }

    const result = room.game.handleAction(playerId, action, data);
    
    // Trigger bot actions after game state changes
    if (result.broadcast) {
      setTimeout(() => {
        this.roomManager.simulateBotActions(roomId, result.gameState);
      }, 1000); // Small delay to let UI update
    }
    
    return result;
  }

  endGame(roomId) {
    const game = this.games.get(roomId);
    if (game) {
      game.end();
      this.games.delete(roomId);
      console.log(`🏁 Ended game for room ${roomId}`);
    }
  }

  getGameState(roomId) {
    const game = this.games.get(roomId);
    return game ? game.getState() : null;
  }

  getAvailableGameTypes() {
    return Object.keys(this.gameTypes);
  }
}

module.exports = GameManager;
