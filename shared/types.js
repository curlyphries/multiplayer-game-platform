// Shared type definitions and constants for both frontend and backend

export const GAME_PHASES = {
  WAITING: 'waiting',
  SUBMITTING: 'submitting', 
  VOTING: 'voting',
  RESULTS: 'results',
  FINISHED: 'finished'
}

export const ROOM_STATUS = {
  WAITING: 'waiting',
  PLAYING: 'playing', 
  FINISHED: 'finished'
}

export const MESSAGE_TYPES = {
  CHAT: 'chat',
  SYSTEM: 'system'
}

export const SOCKET_EVENTS = {
  // Room events
  CREATE_ROOM: 'create-room',
  JOIN_ROOM: 'join-room',
  ROOM_UPDATED: 'room-updated',
  PLAYER_JOINED: 'player-joined',
  PLAYER_LEFT: 'player-left',
  PLAYER_READY: 'player-ready',
  PLAYER_READY_CHANGED: 'player-ready-changed',
  KICK_PLAYER: 'kick-player',
  
  // Chat events
  SEND_CHAT: 'send-chat',
  CHAT_MESSAGE: 'chat-message',
  
  // Game events
  START_GAME: 'start-game',
  GAME_STARTED: 'game-started',
  GAME_ACTION: 'game-action',
  GAME_UPDATE: 'game-update',
  
  // System events
  KICKED: 'kicked',
  SERVER_STATS: 'server-stats'
}

export const GAME_ACTIONS = {
  SUBMIT_ANSWER: 'submit-answer',
  VOTE: 'vote',
  NEXT_ROUND: 'next-round',
  RESTART_GAME: 'restart-game'
}

export const DEFAULT_CONFIG = {
  MAX_PLAYERS: 8,
  MIN_PLAYERS: 2,
  ROOM_EXPIRY_MINUTES: 60,
  SUBMISSION_TIME_SECONDS: 60,
  VOTING_TIME_SECONDS: 45,
  RESULTS_TIME_SECONDS: 15,
  MAX_CHAT_MESSAGES: 100,
  ROOM_CODE_LENGTH: 6
}
