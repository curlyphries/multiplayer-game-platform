# PRD: Multiplayer Game Platform with Private Key Rooms

## 1. Overview
We are building a cross-platform multiplayer game platform where players can join a shared game session using a private URL + room key. The focus is on enabling lightweight, social, party-style games (inspired by Jackbox-style mechanics) but with original titles.

**Initial scope:**
- Provide a game server that creates and manages game rooms
- Allow joining via private URL or room key
- Provide real-time interaction, chat, and basic multiplayer synchronization
- Launch with a single simple game to validate architecture

**Future scope:**
- Expand with multiple unique games
- Add stronger security, moderation tools, and scalable hosting options

## 2. Goals & Non-Goals

### Goals
- Enable friends to join a private room with minimal friction (URL or room key)
- Provide at least one working multiplayer game at launch
- Support cross-device (desktop, mobile browser, tablet)
- Include in-room chat (text first; voice optional later)
- Lay groundwork for extensibility (adding new games should be modular)

### Non-Goals (for MVP)
- Large-scale matchmaking or public lobbies
- Mobile app store deployments (MVP is browser-based)
- Full Jackbox-style variety pack at launch

## 3. Core Features

### 3.1 Room Creation & Access
- **Create Room**: Game server generates unique room ID + join key
- **Join Room**: Players enter via unique URL (e.g., game.com/join/abcd1234) or manually input key
- **Room Capacity**: Configurable, e.g., 4–8 players
- **Host Privileges**: Host controls game start, settings, and can kick players

### 3.2 Game Server
- **Lobby System**: Show player list, readiness, chat before game starts
- **Game Instance Management**: Each room runs its own isolated game state
- **Sync Engine**: Ensure consistent state across clients (real-time via WebSockets)
- **Persistence (Future)**: Option to save/replay past games

### 3.3 Multiplayer Games
- **MVP Game (Example)**: A simple word/phrase game where players submit text and vote on funniest/most clever
- **Extensibility**: Games should be modular plug-ins to the core server

### 3.4 Communication
- **Text Chat**: Room-based chat visible to all
- **Future Roadmap**: Emoji reactions, private whispers, optional voice chat

### 3.5 Security & Privacy
- **Room Key**: Only those with key/URL can join
- **Session Expiry**: Keys expire after host ends game or set timeout
- **Cheat Prevention**: Server-authoritative state, clients cannot alter rules
- **Roadmap**: Add encryption in transit, stronger authentication (optional user accounts)

## 4. Technical Architecture

### 4.1 Frontend
- Web app (React or Vue) optimized for mobile + desktop browsers
- Responsive UI, minimal download size
- Connects to backend via WebSocket for real-time game state

### 4.2 Backend
Game server handles:
- Room/session management
- Game logic & synchronization
- Chat
- Built using Node.js (Socket.IO or ws) or Go (low-latency)
- Stateless scaling possible (Redis or Postgres for session persistence)

### 4.3 Hosting
- Start with single VPS or containerized server (Docker)
- Roadmap: scale with Kubernetes or cloud functions if player base grows

## 5. User Flow (MVP)

1. Host visits site → Clicks "Create Room" → Picks a game → Gets room key + shareable URL
2. Friends join → Open URL or enter room key → Appear in lobby
3. Lobby → Players chat, set display names → Host starts game
4. Game Phase → Play through rounds → Server manages state → Players interact in real-time
5. Results Phase → Show scores/winners → Option to replay or exit

## 6. Roadmap

### Phase 1 (MVP):
- Room key system
- One multiplayer game
- Lobby + chat
- Simple server hosting

### Phase 2:
- Add 2–3 more games
- User authentication (optional accounts)
- Better moderation tools (kick, mute, ban)
- Mobile optimization

### Phase 3:
- Advanced features: voice chat, reactions, replay history
- Cloud scaling (multi-server support)
- Public lobby/matchmaking options
- Game marketplace (custom games by devs)

## 7. Success Metrics
- **MVP goal**: 10+ concurrent rooms running smoothly with no sync issues
- **Player feedback**: 80%+ report game as easy to join & play
- **Engagement**: Average session length >15 min

## 8. Risks & Mitigations
- **Latency issues** → Start simple, use proven real-time libraries (Socket.IO)
- **Security (key leaks)** → Limit room lifetime, allow host to kick unwanted users
- **Scalability** → Containerize server early, add Redis/Postgres for session storage
