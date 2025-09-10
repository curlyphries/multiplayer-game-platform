import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Box,
  Chip,
  Stack,
  IconButton
} from '@mui/material'
import {
  Add as AddIcon,
  Login as LoginIcon,
  People as PeopleIcon,
  Games as GamesIcon,
  BugReport as LogIcon
} from '@mui/icons-material'
import { useGame } from '../context/GameContext'
import toast from 'react-hot-toast'
import LogViewer from '../components/LogViewer'
import logger from '../utils/logger'

export default function HomePage() {
  const navigate = useNavigate()
  const { createRoom, connected } = useGame()
  const [playerName, setPlayerName] = useState('')
  const [gameType, setGameType] = useState('word-game')
  const [maxPlayers, setMaxPlayers] = useState(6)
  const [loading, setLoading] = useState(false)
  const [logViewerOpen, setLogViewerOpen] = useState(false)

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      toast.error('Please enter your name')
      return
    }

    if (!connected) {
      toast.error('Not connected to server')
      return
    }

    setLoading(true)
    try {
      logger.userInteraction('create_room', 'create_room_button', { gameType, maxPlayers, playerName: playerName.trim() })
      const response = await createRoom(gameType, maxPlayers, playerName.trim())
      console.log('🏠 HomePage: Room created, navigating to:', `/room/${response.roomId}`)
      // Add a small delay to ensure state is updated
      setTimeout(() => {
        console.log('🏠 HomePage: Executing navigation to room')
        navigate(`/room/${response.roomId}`)
      }, 100)
    } catch (error) {
      console.error('🏠 HomePage: Room creation failed:', error)
      logger.error('Room creation failed', { error: error.message, gameType, maxPlayers })
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinRoom = () => {
    navigate('/join')
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box textAlign="center" mb={6}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box />
          {process.env.NODE_ENV !== 'production' && (
            <IconButton 
              onClick={() => setLogViewerOpen(true)}
              color="primary"
              title="View Application Logs"
            >
              <LogIcon />
            </IconButton>
          )}
        </Box>
        <Typography variant="h1" component="h1" gutterBottom sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' } }}>
          🎮 Multiplayer Games
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
          Create private rooms and play party games with friends
        </Typography>
        <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
          <Chip icon={<PeopleIcon />} label="Private Rooms" color="primary" />
          <Chip icon={<GamesIcon />} label="Real-time Games" color="secondary" />
          <Chip label="Cross-platform" />
        </Stack>
      </Box>

      <Grid container spacing={4} justifyContent="center">
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AddIcon color="primary" />
                Create Room
              </Typography>
              <Typography color="text.secondary" paragraph>
                Start a new game room and invite friends to join
              </Typography>

              <Box component="form" sx={{ mt: 3 }}>
                <TextField
                  fullWidth
                  label="Your Name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  margin="normal"
                  required
                  placeholder="Enter your display name"
                />

                <FormControl fullWidth margin="normal">
                  <InputLabel>Game Type</InputLabel>
                  <Select
                    value={gameType}
                    label="Game Type"
                    onChange={(e) => setGameType(e.target.value)}
                  >
                    <MenuItem value="word-game">Word Game</MenuItem>
                    <MenuItem value="trivia-game">Trivia Challenge</MenuItem>
                    <MenuItem value="drawing-game">Drawing Game</MenuItem>
                    <MenuItem value="music-game">Music Quiz</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth margin="normal">
                  <InputLabel>Max Players</InputLabel>
                  <Select
                    value={maxPlayers}
                    label="Max Players"
                    onChange={(e) => setMaxPlayers(e.target.value)}
                  >
                    <MenuItem value={4}>4 Players</MenuItem>
                    <MenuItem value={6}>6 Players</MenuItem>
                    <MenuItem value={8}>8 Players</MenuItem>
                  </Select>
                </FormControl>

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleCreateRoom}
                  disabled={loading || !connected}
                  sx={{ mt: 3, py: 1.5 }}
                >
                  {loading ? 'Creating...' : 'Create Room'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LoginIcon color="secondary" />
                Join Room
              </Typography>
              <Typography color="text.secondary" paragraph>
                Enter a room code or use an invite link to join a game
              </Typography>

              <Button
                fullWidth
                variant="outlined"
                size="large"
                onClick={handleJoinRoom}
                disabled={!connected}
                sx={{ mt: 4, py: 1.5 }}
              >
                Join Existing Room
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box textAlign="center" mt={6}>
        <Typography variant="h5" gutterBottom>
          How to Play
        </Typography>
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Box>
              <Typography variant="h6" color="primary">1. Create or Join</Typography>
              <Typography color="text.secondary">
                Start a room or join with a room code
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box>
              <Typography variant="h6" color="primary">2. Wait for Friends</Typography>
              <Typography color="text.secondary">
                Share the room code and wait for players
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box>
              <Typography variant="h6" color="primary">3. Play & Have Fun</Typography>
              <Typography color="text.secondary">
                Compete in real-time multiplayer games
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {!connected && (
        <Box textAlign="center" mt={4}>
          <Typography color="error">
            Connecting to server...
          </Typography>
        </Box>
      )}
      
      <LogViewer 
        open={logViewerOpen} 
        onClose={() => setLogViewerOpen(false)} 
      />
    </Container>
  )
}
