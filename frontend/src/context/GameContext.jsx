import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { io } from 'socket.io-client'
import toast from 'react-hot-toast'
import logger from '../utils/logger'

const GameContext = createContext()

const initialState = {
  socket: null,
  connected: false,
  player: null,
  room: null,
  gameState: null,
  chat: [],
  loading: false,
  error: null
}

// Load persisted state from localStorage
const loadPersistedState = () => {
  try {
    const room = localStorage.getItem('gameRoom')
    const player = localStorage.getItem('gamePlayer')
    return {
      ...initialState,
      room: room ? JSON.parse(room) : null,
      player: player ? JSON.parse(player) : null
    }
  } catch {
    return initialState
  }
}

function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false }
    
    case 'SOCKET_CONNECTED':
      return { ...state, socket: action.payload, connected: true }
    
    case 'SOCKET_DISCONNECTED':
      return { ...state, connected: false }
    
    case 'SET_PLAYER':
      return { ...state, player: action.payload }
    
    case 'SET_ROOM':
      return { ...state, room: action.payload }
    
    case 'UPDATE_ROOM':
      return { ...state, room: { ...state.room, ...action.payload } }
    
    case 'SET_GAME_STATE':
      return { ...state, gameState: action.payload }
    
    case 'UPDATE_DRAWING':
      return { 
        ...state, 
        gameState: state.gameState ? {
          ...state.gameState,
          currentDrawing: action.payload.drawing,
          currentArtist: state.gameState.players?.find(p => p.id === action.payload.artistId) || state.gameState.currentArtist
        } : state.gameState
      }
    
    case 'ADD_CHAT_MESSAGE':
      return { ...state, chat: [...state.chat, action.payload] }
    
    case 'CLEAR_CHAT':
      return { ...state, chat: [] }
    
    case 'RESET':
      localStorage.removeItem('gameRoom')
      localStorage.removeItem('gamePlayer')
      return { ...initialState, socket: state.socket, connected: state.connected }
    
    default:
      return state
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, loadPersistedState())

  useEffect(() => {
    const socket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:4001')
    
    socket.on('connect', () => {
      console.log('Connected to server')
      logger.socketEvent('connected', { socketId: socket.id })
      dispatch({ type: 'SOCKET_CONNECTED', payload: socket })
    })
    
    socket.on('disconnect', () => {
      console.log('Disconnected from server')
      logger.socketEvent('disconnected')
      dispatch({ type: 'SOCKET_DISCONNECTED' })
      toast.error('Disconnected from server')
    })
    
    socket.on('room-updated', (room) => {
      dispatch({ type: 'SET_ROOM', payload: room })
    })
    
    socket.on('player-joined', ({ player, room }) => {
      dispatch({ type: 'SET_ROOM', payload: room })
      toast.success(`${player.name} joined the room`)
    })
    
    socket.on('player-left', ({ player, room }) => {
      dispatch({ type: 'SET_ROOM', payload: room })
      toast(`${player.name} left the room`)
    })
    
    socket.on('chat-message', (message) => {
      dispatch({ type: 'ADD_CHAT_MESSAGE', payload: message })
    })
    
    socket.on('room-created', ({ room, player }) => {
      console.log('🎯 Room created event received:', { room, player })
      dispatch({ type: 'SET_ROOM', payload: room })
      dispatch({ type: 'SET_PLAYER', payload: player })
      // Store in localStorage for persistence
      localStorage.setItem('gameRoom', JSON.stringify(room))
      localStorage.setItem('gamePlayer', JSON.stringify(player))
      toast.success(`Room ${room.id} created!`)
    })
    
    socket.on('game-started', ({ gameState, room }) => {
      dispatch({ type: 'SET_GAME_STATE', payload: gameState })
      dispatch({ type: 'SET_ROOM', payload: room })
      toast.success('Game started!')
    })
    
    socket.on('game-update', (gameState) => {
      dispatch({ type: 'SET_GAME_STATE', payload: gameState })
    })
    
    // Listen for real-time game state updates (timer, phase changes)
    socket.on('game-state-updated', ({ gameState }) => {
      console.log('🎮 Game state updated:', gameState)
      dispatch({ type: 'SET_GAME_STATE', payload: gameState })
    })
    
    socket.on('player-ready-changed', ({ room }) => {
      dispatch({ type: 'SET_ROOM', payload: room })
    })
    
    socket.on('kicked', ({ reason }) => {
      toast.error(`You were kicked: ${reason}`)
      dispatch({ type: 'RESET' })
    })
    
    // Listen for real-time drawing updates
    socket.on('drawing-updated', ({ drawing, artistId }) => {
      dispatch({ 
        type: 'UPDATE_DRAWING', 
        payload: { drawing, artistId } 
      })
    })

    // Game voting event listeners
    socket.on('game-voting-started', ({ room }) => {
      dispatch({ type: 'SET_ROOM', payload: room })
      toast.success('Game voting started!')
    })

    socket.on('game-vote-updated', ({ room }) => {
      dispatch({ type: 'SET_ROOM', payload: room })
    })

    socket.on('game-selected', ({ room, selectedGame }) => {
      dispatch({ type: 'SET_ROOM', payload: room })
      toast.success(`${selectedGame} selected! Returning to room...`)
    })
    
    socket.on('server-stats', (stats) => {
      // Could display server stats if needed
      console.log('Server stats:', stats)
    })
    
    return () => {
      socket.disconnect()
    }
  }, [])

  const createRoom = async (gameType, maxPlayers, playerName) => {
    if (!state.socket) throw new Error('Not connected to server')
    
    dispatch({ type: 'SET_LOADING', payload: true })
    
    return new Promise((resolve, reject) => {
      console.log('🚀 Emitting create-room event:', { gameType, maxPlayers, playerName })
      state.socket.emit('create-room', { gameType, maxPlayers, playerName }, (response) => {
        console.log('📨 Create-room response received:', response)
        dispatch({ type: 'SET_LOADING', payload: false })
        
        if (response.success) {
          dispatch({ type: 'SET_PLAYER', payload: response.player })
          dispatch({ type: 'SET_ROOM', payload: response.room })
          dispatch({ type: 'CLEAR_CHAT' })
          // Store in localStorage immediately
          localStorage.setItem('gameRoom', JSON.stringify(response.room))
          localStorage.setItem('gamePlayer', JSON.stringify(response.player))
          console.log('✅ Room state set in context and localStorage')
          resolve(response)
        } else {
          dispatch({ type: 'SET_ERROR', payload: response.error })
          reject(new Error(response.error))
        }
      })
    })
  }

  const joinRoom = async (roomId, playerName) => {
    if (!state.socket) throw new Error('Not connected to server')
    
    dispatch({ type: 'SET_LOADING', payload: true })
    
    return new Promise((resolve, reject) => {
      state.socket.emit('join-room', { roomId, playerName }, (response) => {
        dispatch({ type: 'SET_LOADING', payload: false })
        
        if (response.success) {
          dispatch({ type: 'SET_PLAYER', payload: response.player })
          dispatch({ type: 'SET_ROOM', payload: response.room })
          dispatch({ type: 'CLEAR_CHAT' })
          resolve(response)
        } else {
          dispatch({ type: 'SET_ERROR', payload: response.error })
          reject(new Error(response.error))
        }
      })
    })
  }

  const sendChatMessage = (message) => {
    if (!state.socket || !state.player || !state.room) return
    
    state.socket.emit('send-chat', {
      roomId: state.room.id,
      playerId: state.player.id,
      message
    }, (response) => {
      if (!response.success) {
        toast.error('Failed to send message')
      }
    })
  }

  const startGame = (gameType = null, customConfig = null) => {
    if (!state.socket || !state.player || !state.room) return
    
    return new Promise((resolve, reject) => {
      const gameData = {
        roomId: state.room.id,
        playerId: state.player.id
      };
      
      if (gameType) {
        gameData.gameType = gameType;
      }
      
      if (customConfig) {
        gameData.customConfig = customConfig;
      }
      
      state.socket.emit('start-game', gameData, (response) => {
        if (response.success) {
          resolve(response)
        } else {
          toast.error(response.error)
          reject(new Error(response.error))
        }
      })
    })
  }

  const gameAction = (action, data) => {
    if (!state.socket || !state.player || !state.room) return
    
    console.log('🎯 Frontend sending game-action:', { action, data, roomId: state.room.id, playerId: state.player.id });
    
    return new Promise((resolve, reject) => {
      state.socket.emit('game-action', {
        roomId: state.room.id,
        playerId: state.player.id,
        action,
        actionData: data
      }, (response) => {
        console.log('📥 Backend response:', response);
        if (response.success) {
          resolve(response)
        } else {
          toast.error(response.error)
          reject(new Error(response.error))
        }
      })
    })
  }

  const setPlayerReady = (ready) => {
    if (!state.socket || !state.player || !state.room) return
    
    state.socket.emit('player-ready', {
      roomId: state.room.id,
      playerId: state.player.id,
      ready
    })
  }

  const kickPlayer = (targetPlayerId) => {
    if (!state.socket || !state.player || !state.room) return
    
    return new Promise((resolve, reject) => {
      state.socket.emit('kick-player', {
        roomId: state.room.id,
        hostId: state.player.id,
        targetPlayerId
      }, (response) => {
        if (response.success) {
          resolve(response)
        } else {
          toast.error(response.error)
          reject(new Error(response.error))
        }
      })
    })
  }

  const leaveRoom = () => {
    dispatch({ type: 'RESET' })
  }

  const addMessage = (message) => {
    dispatch({ type: 'ADD_CHAT_MESSAGE', payload: message });
  };

  const gameVote = (gameId) => {
    if (!state.socket || !state.player || !state.room) return Promise.reject(new Error('Not connected'))
    
    return new Promise((resolve, reject) => {
      state.socket.emit('vote-for-game', {
        roomId: state.room.id,
        playerId: state.player.id,
        gameId
      }, (response) => {
        if (response.success) {
          resolve(response)
        } else {
          toast.error(response.error)
          reject(new Error(response.error))
        }
      })
    })
  }

  const startGameVoting = () => {
    if (!state.socket || !state.room) return Promise.reject(new Error('Not connected'))
    
    return new Promise((resolve, reject) => {
      state.socket.emit('start-game-voting', {
        roomId: state.room.id
      }, (response) => {
        if (response.success) {
          resolve(response)
        } else {
          toast.error(response.error)
          reject(new Error(response.error))
        }
      })
    })
  }

  const selectGame = (gameId) => {
    if (!state.socket || !state.room) return Promise.reject(new Error('Not connected'))
    
    return new Promise((resolve, reject) => {
      state.socket.emit('select-game', {
        roomId: state.room.id,
        gameId
      }, (response) => {
        if (response.success) {
          resolve(response)
        } else {
          toast.error(response.error)
          reject(new Error(response.error))
        }
      })
    })
  }

  const addBot = async () => {
    if (!state.socket || !state.room) return;
    
    state.socket.emit('add-bot', { roomId: state.room.id });
  };

  const removeBot = async (botId) => {
    if (!state.socket || !state.room) return;
    
    state.socket.emit('remove-bot', { roomId: state.room.id, botId });
  };

  const value = {
    ...state,
    createRoom,
    joinRoom,
    sendChatMessage,
    startGame,
    gameAction,
    setPlayerReady,
    kickPlayer,
    leaveRoom,
    addBot,
    removeBot,
    gameVote,
    startGameVoting,
    selectGame
  }

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}
