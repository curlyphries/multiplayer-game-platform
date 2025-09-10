const { v4: uuidv4 } = require('uuid');
const GameManager = require('./GameManager');
const BotManager = require('./BotManager');

class RoomManager {
  constructor() {
    this.rooms = new Map();
    this.playerRooms = new Map(); // Track which room each player is in
    this.botManager = new BotManager();
    
    // Clean up expired rooms every 5 minutes
    setInterval(() => this.cleanupExpiredRooms(), 5 * 60 * 1000);
  }

  createRoom(gameType = 'word-game', maxPlayers = 8) {
    const roomId = this.generateRoomCode();
    const room = {
      id: roomId,
      gameType,
      maxPlayers,
      players: [],
      host: null,
      status: 'waiting', // waiting, playing, finished
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + (process.env.ROOM_EXPIRY_MINUTES || 60) * 60 * 1000),
      gameState: null,
      chat: [],
      gameVotes: {}, // Track votes for next game selection
      gameVotingActive: false
    };

    this.rooms.set(roomId, room);
    console.log(`📝 Created room ${roomId} for game: ${gameType}`);
    return room;
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  joinRoom(roomId, player) {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    if (room.status === 'finished') {
      throw new Error('Room has ended');
    }

    if (room.players.length >= room.maxPlayers) {
      throw new Error('Room is full');
    }

    // Check if player is already in the room
    const existingPlayer = room.players.find(p => p.id === player.id);
    if (existingPlayer) {
      // Update socket ID for reconnection
      existingPlayer.socketId = player.socketId;
      existingPlayer.connected = true;
      return room;
    }

    // Add new player
    room.players.push({
      ...player,
      connected: true,
      joinedAt: new Date()
    });

    // Set first player as host
    if (!room.host) {
      room.host = player.id;
    }

    this.playerRooms.set(player.socketId, roomId);
    console.log(`👤 Player ${player.name} joined room ${roomId}`);
    return room;
  }

  leaveRoom(socketId) {
    const roomId = this.playerRooms.get(socketId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    const playerIndex = room.players.findIndex(p => p.socketId === socketId);
    if (playerIndex === -1) return null;

    const player = room.players[playerIndex];
    
    // Mark as disconnected instead of removing immediately
    player.connected = false;
    player.disconnectedAt = new Date();

    // If host left, assign new host
    if (room.host === player.id && room.players.length > 1) {
      const connectedPlayer = room.players.find(p => p.connected && p.id !== player.id);
      if (connectedPlayer) {
        room.host = connectedPlayer.id;
      }
    }

    // Remove from tracking
    this.playerRooms.delete(socketId);

    // If no connected players, mark room for cleanup
    const connectedPlayers = room.players.filter(p => p.connected);
    if (connectedPlayers.length === 0) {
      room.status = 'finished';
    }

    console.log(`👋 Player ${player.name} left room ${roomId}`);
    return { room, player };
  }

  addChatMessage(roomId, playerId, message) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return null;

    const chatMessage = {
      id: uuidv4(),
      playerId,
      playerName: player.name,
      message: message.trim(),
      timestamp: new Date(),
      type: 'chat'
    };

    room.chat.push(chatMessage);
    
    // Keep only last 100 messages
    if (room.chat.length > 100) {
      room.chat = room.chat.slice(-100);
    }

    return chatMessage;
  }

  updateGameState(roomId, gameState) {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    room.gameState = gameState;
    return true;
  }

  generateRoomCode() {
    // Generate a 6-character alphanumeric code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Ensure uniqueness
    if (this.rooms.has(result)) {
      return this.generateRoomCode();
    }
    
    return result;
  }

  addBot(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    if (room.players.length >= room.maxPlayers) {
      throw new Error('Room is full');
    }

    const bot = this.botManager.createBot(roomId);
    room.players.push(bot);
    room.lastActivity = new Date();

    return {
      room: this.getRoomInfo(roomId),
      bot
    };
  }

  removeBot(roomId, botId) {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const botIndex = room.players.findIndex(p => p.id === botId && p.isBot);
    if (botIndex === -1) {
      throw new Error('Bot not found');
    }

    room.players.splice(botIndex, 1);
    room.lastActivity = new Date();

    return {
      room: this.getRoomInfo(roomId),
      removedBotId: botId
    };
  }

  simulateBotActions(roomId, gameState) {
    const room = this.rooms.get(roomId);
    if (!room || !room.game) return;

    const bots = room.players.filter(p => p.isBot);
    
    bots.forEach(bot => {
      if (gameState.phase === 'submitting' && !this.hasPlayerSubmitted(gameState, bot.id)) {
        // Schedule bot submission
        setTimeout(() => {
          this.submitBotAnswer(roomId, bot.id, gameState.currentPrompt);
        }, this.botManager.getBotActionDelay('submit'));
      } else if (gameState.phase === 'voting' && !this.hasPlayerVoted(gameState, bot.id)) {
        // Schedule bot vote
        setTimeout(() => {
          this.submitBotVote(roomId, bot.id, gameState.submissions);
        }, this.botManager.getBotActionDelay('vote'));
      }
    });
  }

  submitBotAnswer(roomId, botId, prompt) {
    try {
      const room = this.rooms.get(roomId);
      if (!room || !room.game) return;

      const response = this.botManager.generateBotResponse(prompt);
      room.game.handleAction(botId, 'submit-answer', { answer: response });
    } catch (error) {
      console.log(`Bot submission error: ${error.message}`);
    }
  }

  submitBotVote(roomId, botId, submissions) {
    try {
      const room = this.rooms.get(roomId);
      if (!room || !room.game) return;

      const submissionId = this.botManager.simulateBotVoting(submissions, botId);
      if (submissionId) {
        room.game.handleAction(botId, 'vote', { submissionId });
      }
    } catch (error) {
      console.log(`Bot voting error: ${error.message}`);
    }
  }

  hasPlayerSubmitted(gameState, playerId) {
    return gameState.submissions && gameState.submissions.some(s => s.playerId === playerId);
  }

  hasPlayerVoted(gameState, playerId) {
    return gameState.submissions && gameState.submissions.some(s => s.voters.includes(playerId));
  }

  cleanupExpiredRooms() {
    const now = new Date();
    let cleanedCount = 0;

    for (const [roomId, room] of this.rooms.entries()) {
      if (now > room.expiresAt || room.status === 'finished') {
        // Remove disconnected players after 10 minutes
        const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
        room.players = room.players.filter(p => 
          p.connected || p.isBot || (p.disconnectedAt && p.disconnectedAt > tenMinutesAgo)
        );

        // Delete room if expired or no human players
        const humanPlayers = room.players.filter(p => !p.isBot);
        if (now > room.expiresAt || humanPlayers.length === 0) {
          this.rooms.delete(roomId);
          cleanedCount++;
        }
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired rooms`);
    }
  }

  // Game voting methods
  startGameVoting(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    room.gameVotes = {};
    room.gameVotingActive = true;
    console.log(`🗳️ Started game voting in room ${roomId}`);
    return room;
  }

  voteForGame(roomId, playerId, gameId) {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    if (!room.gameVotingActive) {
      throw new Error('Game voting is not active');
    }

    // Remove player's previous vote
    Object.keys(room.gameVotes).forEach(gId => {
      room.gameVotes[gId] = room.gameVotes[gId]?.filter(pId => pId !== playerId) || [];
    });

    // Add new vote
    if (!room.gameVotes[gameId]) {
      room.gameVotes[gameId] = [];
    }
    room.gameVotes[gameId].push(playerId);

    console.log(`🗳️ Player ${playerId} voted for ${gameId} in room ${roomId}`);
    return room;
  }

  getGameVoteResults(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const voteCounts = {};
    Object.entries(room.gameVotes).forEach(([gameId, voters]) => {
      voteCounts[gameId] = voters.length;
    });

    // Find winning game
    const winningGame = Object.entries(voteCounts).reduce((a, b) => 
      voteCounts[a[0]] > voteCounts[b[0]] ? a : b
    )[0] || 'word-game';

    return {
      votes: room.gameVotes,
      voteCounts,
      winningGame
    };
  }

  selectGameAndStart(roomId, selectedGameId) {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    // Reset game voting
    room.gameVotingActive = false;
    room.gameVotes = {};
    
    // Update room game type
    room.gameType = selectedGameId;
    room.status = 'waiting';
    room.gameState = null;

    console.log(`🎮 Selected ${selectedGameId} for room ${roomId}`);
    return room;
  }

  getRoomStats() {
    return {
      totalRooms: this.rooms.size,
      activeRooms: Array.from(this.rooms.values()).filter(r => r.status !== 'finished').length,
      totalPlayers: Array.from(this.rooms.values()).reduce((sum, room) => 
        sum + room.players.filter(p => p.connected).length, 0
      )
    };
  }
}

module.exports = RoomManager;
