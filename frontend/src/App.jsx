import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { GameProvider } from './context/GameContext'
import HomePage from './pages/HomePage'
import JoinPage from './pages/JoinPage'
import RoomPage from './pages/RoomPage'
import GamePage from './pages/GamePage'
import GameSelectionPage from './pages/GameSelectionPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <GameProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/join/:roomId" element={<JoinPage />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
        <Route path="/game/:roomId" element={<GamePage />} />
        <Route path="/game-selection/:roomId" element={<GameSelectionPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </GameProvider>
  )
}

export default App
