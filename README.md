
<img width="1461" height="1079" alt="screenplay" src="https://github.com/user-attachments/assets/7932bf4f-d553-44b4-be52-f49ae69cedee" />

# Multiplayer Game Platform

A cross-platform multiplayer game platform where players can join shared game sessions using private URLs and room keys. Inspired by Jackbox-style mechanics with original titles.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [Testing & Validation](#testing--validation)
- [Troubleshooting](#troubleshooting)
- [Environment Configuration](#environment-configuration)
- [Development Status](#development-status)

## Prerequisites

### Required Software
- **Docker & Docker Compose** (recommended) OR
- **Node.js** v18+ and **npm** v9+
- **Git** for version control
- **Modern web browser** (Chrome, Firefox, Safari, Edge)

### System Requirements
- **Ports**: 4000 (frontend), 4001 (backend), 6379 (Redis)
- **Memory**: 2GB RAM minimum
- **Storage**: 1GB free space

## Project Structure

```
multiplayer-game-platform/
├── backend/                 # Node.js game server
│   ├── src/
│   │   ├── games/          # Game implementations
│   │   ├── managers/       # Room & game managers
│   │   ├── socket/         # WebSocket handlers
│   │   └── server.js       # Main server file
│   ├── package.json
│   ├── .env.example
│   └── Dockerfile
├── frontend/               # React web application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── context/        # React context providers
│   │   ├── pages/          # Application pages
│   │   └── main.jsx        # Entry point
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
├── shared/                 # Shared utilities
├── docs/                   # Documentation
├── docker-compose.yml      # Docker configuration
└── README.md
```

## Installation & Setup

### Option 1: Docker Setup (Recommended)

**Step 1: Clone Repository**
```bash
git clone https://github.com/curlyphries/multiplayer-game-platform
cd multiplayer-game-platform
```

**Step 2: Start Services**
```bash
# Start all containers in background
docker-compose up -d

# View startup logs
docker-compose logs -f
```

**Step 3: Verify Installation**
```bash
# Check container status
docker-compose ps

# Should show 3 containers running:
# - backend (port 4001)
# - frontend (port 4000) 
# - redis (port 6379)
```

### Option 2: Local Development Setup

**Step 1: Clone Repository**
```bash
git clone https://github.com/curlyphries/multiplayer-game-platform
cd multiplayer-game-platform
```

**Step 2: Backend Setup**
```bash
cd backend

# Create environment file
copy .env.example .env
# On Mac/Linux: cp .env.example .env

# Install dependencies
npm install

# Start development server
npm run dev
```

**Step 3: Frontend Setup** (New Terminal)
```bash
cd frontend

# Create environment file
copy .env.example .env
# On Mac/Linux: cp .env.example .env

# Install dependencies
npm install

# Start development server
npm run dev
```

## Running the Application

### Access Points
- **Frontend**: http://localhost:4000
- **Backend API**: http://localhost:4001
- **Redis**: localhost:6379

### First-Time Setup Verification

**Step 1: Check Services**
```bash
# For Docker
docker-compose ps

# For Local Development
# Check if processes are running on correct ports
netstat -an | findstr :4000
netstat -an | findstr :4001
```

**Step 2: Test Frontend**
1. Open browser to http://localhost:4000
2. Should see dark-themed homepage with "Create Room" and "Join Room" buttons
3. If blank page, check browser console (F12) for errors

**Step 3: Test Backend API**
```bash
# Health check endpoint
curl http://localhost:4001/api/health

# Should return: {"status":"ok","timestamp":"..."}
```

**Step 4: Test Full Flow**
1. Click "Create Room" on homepage
2. Enter player name and click "Create Room"
3. Note the 6-character room code displayed
4. Open second browser tab/window
5. Click "Join Room" and enter the room code
6. Verify both players appear in room lobby

## Testing & Validation

### Automated Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests (if available)
cd frontend
npm test
```

### Manual Testing Checklist
- [ ] Homepage loads with dark theme
- [ ] Room creation works and generates 6-character code
- [ ] Room joining works with valid code
- [ ] Multiple players can join same room
- [ ] Chat messages appear in real-time
- [ ] Host can start game
- [ ] Game phases work (submission, voting, results)
- [ ] Players can leave/rejoin rooms
- [ ] Room expires after inactivity

### Performance Testing
```bash
# Check container resource usage
docker stats

# Monitor logs for errors
docker-compose logs -f --tail=100
```

## Troubleshooting

### Common Issues

**1. Blank Frontend Page**
- **Cause**: Build errors or missing dependencies
- **Solution**:
  ```bash
  # Check build logs
  docker-compose logs frontend
  
  # Rebuild containers
  docker-compose down
  docker-compose up -d --build
  ```

**2. Port Already in Use**
- **Cause**: Another service using ports 4000/4001
- **Solution**:
  ```bash
  # Find process using port
  netstat -ano | findstr :4000
  
  # Kill process (replace PID)
  taskkill /PID <PID> /F
  ```

**3. Cannot Connect to Backend**
- **Cause**: CORS issues or backend not running
- **Solution**:
  ```bash
  # Check backend status
  curl http://localhost:4001/api/health
  
  # Check backend logs
  docker-compose logs backend
  ```

**4. Redis Connection Failed**
- **Cause**: Redis container not running
- **Solution**:
  ```bash
  # Restart Redis
  docker-compose restart redis
  
  # Check Redis logs
  docker-compose logs redis
  ```

**5. Build Failures**
- **Cause**: Missing dependencies or syntax errors
- **Solution**:
  ```bash
  # Clean rebuild
  docker-compose down -v
  docker-compose build --no-cache
  docker-compose up -d
  ```

### Debug Commands

```bash
# Container inspection
docker-compose exec frontend sh
docker-compose exec backend sh

# View all logs
docker-compose logs

# Follow specific service logs
docker-compose logs -f frontend
docker-compose logs -f backend

# Check network connectivity
docker-compose exec frontend ping backend
docker-compose exec backend ping redis

# Restart specific service
docker-compose restart frontend
```

### Emergency Reset
```bash
# Complete cleanup and restart
docker-compose down -v
docker system prune -f
docker-compose up -d --build
```

## Environment Configuration

### Backend Environment Variables

Create `backend/.env` from `backend/.env.example`:

```bash
# Server Configuration
PORT=4001
NODE_ENV=development

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Game Configuration
ROOM_EXPIRY_MINUTES=60
MAX_PLAYERS_PER_ROOM=8

# CORS Configuration
CORS_ORIGIN=http://localhost:4000
```

### Frontend Environment Variables

Create `frontend/.env` from `frontend/.env.example`:

```bash
# API Configuration
VITE_SERVER_URL=http://localhost:4001
```

### Production Configuration

For production deployment, update:

```bash
# Backend .env
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
REDIS_URL=redis://your-redis-host:6379

# Frontend .env
VITE_SERVER_URL=https://api.yourdomain.com
```

## Development Status

### ✅ Completed Features
- Private room creation with 6-character codes
- Real-time multiplayer synchronization via WebSockets
- MVP word game with submission/voting phases
- In-room text chat system
- Host privileges (start game, kick players)
- Cross-platform browser compatibility
- Docker deployment configuration
- Responsive dark theme UI

### 🔄 Known Issues
- Deprecated npm package warnings (non-critical)
- Room persistence limited to memory (Redis integration planned)
- No user authentication system yet

### 🚀 Roadmap
- Additional game types
- User accounts and authentication
- Room history and statistics
- Mobile app versions
- Advanced moderation tools

## Core Features

- **Private Room System**: Create and join rooms with unique 6-character codes
- **Real-time Multiplayer**: WebSocket-based synchronization with Socket.IO
- **Cross-platform**: Works on desktop, mobile, and tablet browsers
- **Modular Games**: Extensible architecture for adding new game types
- **In-room Chat**: Real-time text communication during games
- **Host Controls**: Room creators can start games and manage players
- **Dark Theme**: Modern, responsive UI optimized for all devices

## MVP Game: Word Voting Game

### Game Overview
A creative word/phrase game where players submit humorous responses to prompts and vote on the best submissions. Think "Cards Against Humanity" meets "Jackbox Games" with original prompts.

### Detailed Game Flow

**🎯 Game Setup**
- **Players**: 2-8 players per room
- **Rounds**: 3 rounds total
- **Duration**: ~8-12 minutes per game
- **Host Controls**: Room creator starts the game

**📝 Phase 1: Submission (60 seconds)**
- All players see the same creative prompt
- Players type their funniest/most creative response
- Submissions are anonymous during voting
- Timer counts down from 60 seconds
- Phase auto-advances when all players submit

**🗳️ Phase 2: Voting (45 seconds)**
- All submissions displayed anonymously in random order
- Players vote for their favorite (cannot vote for own)
- One vote per player per round
- Timer counts down from 45 seconds
- Phase auto-advances when all eligible players vote

**🏆 Phase 3: Results (15 seconds)**
- Submissions ranked by votes received
- Player names revealed for each submission
- Round scores added to total scores
- Leaderboard updated
- Auto-advances to next round

**🎊 Game End**
- After 3 rounds, final scores calculated
- Winner announced (highest total score)
- Option to restart game or return to lobby

### Sample Prompts
The game includes 8 built-in prompts that rotate randomly:
- "The worst possible superhero name"
- "What aliens would think about humans after watching reality TV"
- "A terrible name for a restaurant"
- "The most useless invention ever"
- "What your pet really thinks about you"
- "A bad excuse for being late to work"
- "The worst possible dating profile bio"
- "What happens in the afterlife waiting room"

### Scoring System

**Points Awarded:**
- **+1 point per vote** received on your submission
- **No penalty** for not receiving votes
- **No bonus points** for voting (encourages honest voting)

**Scoring Examples:**
- Submission gets 3 votes = +3 points
- Submission gets 0 votes = 0 points
- Total score = sum across all 3 rounds

**Tiebreaker:**
- In case of tied final scores, all tied players share victory

### Game Mechanics

**Submission Rules:**
- Text-based responses only
- Maximum length: ~200 characters
- Cannot submit empty responses
- Cannot edit after submission
- Submissions are anonymous until results

**Voting Rules:**
- Cannot vote for your own submission
- Must vote (no abstaining)
- One vote per player per round
- Voting is anonymous
- Cannot change vote after casting

**Timer System:**
- **Submission Phase**: 60 seconds
- **Voting Phase**: 45 seconds  
- **Results Phase**: 15 seconds (auto-advance)
- Phases auto-advance when all players complete actions
- Visual countdown timer displayed

**Player States:**
- **Waiting**: Game hasn't started
- **Submitting**: Typing response to prompt
- **Submitted**: Waiting for other players
- **Voting**: Selecting favorite submission
- **Voted**: Waiting for voting to end
- **Viewing Results**: Seeing round results

### Technical Features

**Real-time Synchronization:**
- All players see the same game state
- Live updates when players submit/vote
- Automatic phase transitions
- Timer synchronization across all clients

**Reconnection Handling:**
- Players can rejoin mid-game
- Game state preserved on reconnect
- Missed phases handled gracefully

**Host Privileges:**
- Start game when ready
- Restart game after completion
- Kick disruptive players
- Game continues if host leaves

### Strategy & Tips

**For Players:**
- **Be Creative**: Unexpected answers often get more votes
- **Read the Room**: Consider your audience's humor
- **Vote Honestly**: No points for strategic voting
- **Think Fast**: Limited time encourages quick wit

**For Hosts:**
- **Wait for All Players**: Ensure everyone's ready before starting
- **Set Expectations**: Explain rules to new players
- **Keep It Fun**: Use kick feature sparingly
- **Restart Wisely**: Ask group before restarting

## Bot Players (Testing Feature)

### Overview
Bot players are AI-controlled participants that can join rooms to help with testing and provide gameplay when you don't have enough human players.

### Bot Features
- **Smart Responses**: Bots generate contextual answers for each prompt
- **Human-like Timing**: Realistic delays for submissions and voting
- **Intelligent Voting**: Bots prefer shorter, funnier responses
- **Easy Management**: Add/remove bots with one click

### Bot Names
Bots use fun, themed names:
- CodeBot, GameMaster, QuipBot, WittyAI, JokeBot
- CleverBot, PunBot, SnarkBot, ChatterBot, BanterBot

### How to Use Bots

**Adding Bots:**
1. Host creates a room
2. Click "Add Bot Player" button in lobby
3. Bot joins immediately and shows as "Ready"
4. Repeat to add more bots (up to room limit)

**Managing Bots:**
- Bots appear with 🤖 icon and "Bot" chip
- Host can remove bots using the kick button
- Bots automatically participate in all game phases
- Bots persist until manually removed

**Bot Behavior:**
- **Submission Phase**: Bots submit answers after 10-40 seconds
- **Voting Phase**: Bots vote after 5-20 seconds
- **Scoring**: Bots earn points like human players
- **Cleanup**: Bots are preserved during room cleanup

### Sample Bot Responses
Bots have pre-written responses for each prompt with creative variations:

**"The worst possible superhero name":**
- "Captain Obvious", "The Procrastinator", "Mild Mannered Man"
- "Doctor Awkward 2.0", "Super Sleepy (Premium Edition)"

**"A terrible name for a restaurant":**
- "Food Poisoning Palace", "The Greasy Spoon", "Burnt Offerings"
- "Questionable Cuisine: The Musical"

### Testing Benefits
- **Solo Testing**: Test game flow without other players
- **Load Testing**: Fill rooms to test maximum capacity
- **UI Testing**: Verify player list, scoring, and game phases
- **Timing Testing**: Ensure phases advance correctly with mixed human/bot players

## Technology Stack

- **Backend**: Node.js, Express, Socket.IO, Redis
- **Frontend**: React, Vite, Material-UI, Socket.IO Client
- **Database**: Redis (for session storage)
- **Deployment**: Docker & Docker Compose
- **Development**: Hot reload, ESLint, modern ES6+

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review container logs: `docker-compose logs`
3. Verify environment configuration
4. Test with manual validation steps

---

**Quick Start Summary:**
```bash
# Clone and start
git clone <repo>
cd multiplayer-game-platform
docker-compose up -d

# Test
open http://localhost:4000
curl http://localhost:4001/api/health
```

## Files & Documentation

- `docs/prd.md` - Product Requirements Document
- `DOCKER-TROUBLESHOOTING.md` - Docker-specific debugging
- `CHANGELOG.md` - Version history and fixes
