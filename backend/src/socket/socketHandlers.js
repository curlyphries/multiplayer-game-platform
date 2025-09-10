const { v4: uuidv4 } = require('uuid');
// const { logger, logHelpers } = require('../utils/logger');

function setupSocketHandlers(io, roomManager, gameManager) {
  io.on('connection', (socket) => {
    const userAgent = socket.handshake.headers['user-agent'] || '';
    // logHelpers.socketConnected(socket.id, userAgent);
    console.log(`🔌 Client connected: ${socket.id}`);

    // Handle room creation
    socket.on('create-room', (data, callback) => {
      try {
        const { gameType, maxPlayers, playerName } = data;
        const room = roomManager.createRoom(gameType, maxPlayers);
        
        // Auto-join creator as host
        const player = {
          id: uuidv4(),
          name: playerName,
          socketId: socket.id
        };
        
        roomManager.joinRoom(room.id, player);
        socket.join(room.id);
        
        // logHelpers.roomCreated(room.id, gameType, maxPlayers, player.id);
        // logHelpers.roomJoined(room.id, player.id, playerName);
        
        callback({
          success: true,
          roomId: room.id,
          player,
          room: sanitizeRoom(room)
        });
        
        // Emit room-created event to the creator
        socket.emit('room-created', {
          room: sanitizeRoom(room),
          player: sanitizePlayer(player)
        });
        
        // Broadcast room update
        socket.to(room.id).emit('room-updated', sanitizeRoom(room));
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    // Handle room joining
    socket.on('join-room', (data, callback) => {
      try {
        const { roomId, playerName } = data;
        const player = {
          id: uuidv4(),
          name: playerName,
          socketId: socket.id
        };
        
        const room = roomManager.joinRoom(roomId, player);
        socket.join(roomId);
        
        callback({
          success: true,
          player,
          room: sanitizeRoom(room)
        });
        
        // Broadcast to other players
        socket.to(roomId).emit('player-joined', {
          player: sanitizePlayer(player),
          room: sanitizeRoom(room)
        });
        
        // Send system message
        const systemMessage = {
          id: uuidv4(),
          type: 'system',
          message: `${playerName} joined the room`,
          timestamp: new Date()
        };
        io.to(roomId).emit('chat-message', systemMessage);
        
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    // Handle chat messages
    socket.on('send-chat', (data, callback) => {
      try {
        const { roomId, playerId, message } = data;
        const chatMessage = roomManager.addChatMessage(roomId, playerId, message);
        
        if (chatMessage) {
          io.to(roomId).emit('chat-message', chatMessage);
          callback({ success: true });
        } else {
          callback({ success: false, error: 'Failed to send message' });
        }
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    // Handle game start
    socket.on('start-game', (data, callback) => {
      try {
        const { roomId, gameType, customConfig } = data;
        const room = roomManager.getRoom(roomId);
        
        if (!room) {
          throw new Error('Room not found');
        }
        
        if (room.status !== 'waiting') {
          throw new Error('Game already in progress');
        }
        
        const players = room.players.filter(p => p.connected);
        if (players.length < 2) {
          throw new Error('Need at least 2 players to start');
        }
        
        // Create and start the game with custom config if provided
        const game = customConfig 
          ? gameManager.createCustomGame(roomId, gameType || room.gameType, players, customConfig)
          : gameManager.createGame(roomId, gameType || room.gameType, players);
        
        // Set up game state update callback
        game.onStateUpdate = (result) => {
          if (result.broadcast) {
            io.to(roomId).emit('game-state-updated', {
              gameState: result.gameState
            });
          }
        };

        // Set up timer broadcast callback
        game.broadcastUpdate = () => {
          io.to(roomId).emit('game-state-updated', {
            gameState: game.getState()
          });
        };
        
        // Start the game (transitions from waiting to submitting phase)
        const gameResult = game.start();
        
        // Update room status and attach game instance
        room.status = 'playing';
        room.game = game;
        room.gameState = game.getState();
        
        // Notify all players with the started game state
        io.to(roomId).emit('game-started', {
          gameState: game.getState(),
          room: sanitizeRoom(room)
        });
        
        // Broadcast initial game state update
        if (gameResult.broadcast) {
          io.to(roomId).emit('game-state-updated', {
            gameState: game.getState()
          });
        }
        
        callback({ success: true });
        
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    // Handle game actions
    socket.on('game-action', async (data, callback) => {
      try {
        console.log('🎮 Game action received:', JSON.stringify(data, null, 2));
        const { roomId, playerId, action, actionData } = data;
        console.log('🔍 Destructured:', { roomId, playerId, action, actionData });
        
        const room = roomManager.getRoom(roomId);
        console.log('🏠 Room found:', !!room, 'Game exists:', !!room?.game);
        
        if (!room || !room.game) {
          console.log('❌ Game not found - Room:', !!room, 'Game:', !!room?.game);
          throw new Error('Game not found');
        }

        const result = await room.game.handleAction(playerId, action, actionData);
        
        // Handle real-time drawing updates
        if (action === 'submit-drawing' && actionData.drawing) {
          // Broadcast drawing data immediately to all players
          socket.to(roomId).emit('drawing-updated', {
            drawing: actionData.drawing,
            artistId: playerId
          });
        }
        
        if (result.broadcast) {
          io.to(roomId).emit('game-state-updated', {
            gameState: room.game.getState(),
            room: sanitizeRoom(room)
          });
        }
        
        if (callback) {
          callback({ success: true, result });
        }
      } catch (error) {
        console.error('Game action error:', error);
        if (callback) {
          callback({ success: false, error: error.message });
        }
      }
    });

    // Add bot player
    socket.on('add-bot', async (data) => {
      try {
        const { roomId } = data;
        const result = roomManager.addBot(roomId);
        
        io.to(roomId).emit('player-joined', {
          player: result.bot,
          room: result.room
        });
        
        socket.emit('bot-added', { success: true, bot: result.bot });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Remove bot player
    socket.on('remove-bot', async (data) => {
      try {
        const { roomId, botId } = data;
        const result = roomManager.removeBot(roomId, botId);
        
        io.to(roomId).emit('player-left', {
          playerId: botId,
          room: result.room
        });
        
        socket.emit('bot-removed', { success: true, botId });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Handle player ready state
    socket.on('player-ready', (data) => {
      const { roomId, playerId, ready } = data;
      const room = roomManager.getRoom(roomId);
      
      if (room) {
        const player = room.players.find(p => p.id === playerId);
        if (player) {
          player.ready = ready;
          socket.to(roomId).emit('player-ready-changed', {
            playerId,
            ready,
            room: sanitizeRoom(room)
          });
        }
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
      
      const result = roomManager.leaveRoom(socket.id);
      if (result) {
        const { room, player } = result;
        
        // Notify other players
        socket.to(room.id).emit('player-left', {
          player: sanitizePlayer(player),
          room: sanitizeRoom(room)
        });
        
        // Send system message
        const systemMessage = {
          id: uuidv4(),
          type: 'system',
          message: `${player.name} left the room`,
          timestamp: new Date()
        };
        socket.to(room.id).emit('chat-message', systemMessage);
        
        // End game if no connected players
        const connectedPlayers = room.players.filter(p => p.connected);
        if (connectedPlayers.length === 0) {
          gameManager.endGame(room.id);
        }
      }
    });

    // Handle kick player (host only)
    socket.on('kick-player', (data, callback) => {
      try {
        const { roomId, hostId, targetPlayerId } = data;
        const room = roomManager.getRoom(roomId);
        
        if (!room || room.host !== hostId) {
          throw new Error('Only host can kick players');
        }
        
        const targetPlayer = room.players.find(p => p.id === targetPlayerId);
        if (!targetPlayer) {
          throw new Error('Player not found');
        }
        
        // Force disconnect the target player
        const targetSocket = io.sockets.sockets.get(targetPlayer.socketId);
        if (targetSocket) {
          targetSocket.emit('kicked', { reason: 'Kicked by host' });
          targetSocket.disconnect(true);
        }
        
        callback({ success: true });
        
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    // Game voting handlers
    socket.on('start-game-voting', (data, callback) => {
      try {
        const { roomId } = data;
        const room = roomManager.startGameVoting(roomId);
        
        io.to(roomId).emit('game-voting-started', {
          room: sanitizeRoom(room)
        });
        
        callback({ success: true });
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    socket.on('vote-for-game', (data, callback) => {
      try {
        const { roomId, playerId, gameId } = data;
        const room = roomManager.voteForGame(roomId, playerId, gameId);
        
        io.to(roomId).emit('game-vote-updated', {
          room: sanitizeRoom(room)
        });
        
        callback({ success: true });
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    socket.on('select-game', (data, callback) => {
      try {
        const { roomId, gameId } = data;
        const room = roomManager.selectGameAndStart(roomId, gameId);
        
        io.to(roomId).emit('game-selected', {
          room: sanitizeRoom(room),
          selectedGame: gameId
        });
        
        callback({ success: true });
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });
  });

  // Periodic room stats broadcast
  setInterval(() => {
    const stats = roomManager.getRoomStats();
    io.emit('server-stats', stats);
  }, 30000); // Every 30 seconds
}

// Helper functions to sanitize data before sending to clients
function sanitizeRoom(room) {
  return {
    id: room.id,
    gameType: room.gameType,
    maxPlayers: room.maxPlayers,
    status: room.status,
    host: room.host,
    players: room.players.map(sanitizePlayer),
    gameState: room.gameState,
    createdAt: room.createdAt,
    gameVotes: room.gameVotes,
    gameVotingActive: room.gameVotingActive
  };
}

function sanitizePlayer(player) {
  return {
    id: player.id,
    name: player.name,
    connected: player.connected,
    ready: player.ready || false,
    joinedAt: player.joinedAt,
    isBot: player.isBot || false
  };
}

module.exports = { setupSocketHandlers };
