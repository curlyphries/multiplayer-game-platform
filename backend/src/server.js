const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// const { logger, logHelpers, requestLogger } = require('./utils/logger');
// const LogCleanup = require('./utils/logCleanup');
const RoomManager = require('./managers/RoomManager');
const GameManager = require('./managers/GameManager');
const { setupSocketHandlers } = require('./socket/socketHandlers');

// Ensure logs directory exists
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:4000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
// app.use(requestLogger);

// Initialize managers
const roomManager = new RoomManager();
const gameManager = new GameManager();
// const logCleanup = new LogCleanup();

// Setup socket handlers
setupSocketHandlers(io, roomManager, gameManager);

// REST API Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Multiplayer Game Platform API',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      rooms: '/api/rooms',
      createRoom: 'POST /api/rooms'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/rooms/:roomId', (req, res) => {
  const room = roomManager.getRoom(req.params.roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  res.json({
    id: room.id,
    playerCount: room.players.length,
    maxPlayers: room.maxPlayers,
    gameType: room.gameType,
    status: room.status
  });
});

app.post('/api/rooms', (req, res) => {
  const { gameType, maxPlayers } = req.body;
  const room = roomManager.createRoom(gameType, maxPlayers);
  
  res.json({
    roomId: room.id,
    joinUrl: `${req.protocol}://${req.get('host')}/join/${room.id}`,
    roomKey: room.id
  });
});

const PORT = process.env.PORT || 4001;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 CORS enabled for: ${process.env.CORS_ORIGIN || "http://localhost:4000"}`);
});
