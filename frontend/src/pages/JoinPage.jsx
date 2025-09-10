import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Container,
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  Alert
} from '@mui/material'
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material'
import { useGame } from '../context/GameContext'
import toast from 'react-hot-toast'

export default function JoinPage() {
  const navigate = useNavigate()
  const { roomId: urlRoomId } = useParams()
  const { joinRoom, connected } = useGame()
  const [playerName, setPlayerName] = useState('')
  const [roomId, setRoomId] = useState(urlRoomId || '')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (urlRoomId) {
      setRoomId(urlRoomId)
    }
  }, [urlRoomId])

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      toast.error('Please enter your name')
      return
    }

    if (!roomId.trim()) {
      toast.error('Please enter a room code')
      return
    }

    if (!connected) {
      toast.error('Not connected to server')
      return
    }

    setLoading(true)
    try {
      await joinRoom(roomId.trim().toUpperCase(), playerName.trim())
      navigate(`/room/${roomId.trim().toUpperCase()}`)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    navigate('/')
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={handleBack}
        sx={{ mb: 3 }}
      >
        Back to Home
      </Button>

      <Card>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom textAlign="center">
            Join Game Room
          </Typography>
          <Typography color="text.secondary" paragraph textAlign="center">
            Enter your name and the room code to join a game
          </Typography>

          {urlRoomId && (
            <Alert severity="info" sx={{ mb: 3 }}>
              Room code from invite link: <strong>{urlRoomId}</strong>
            </Alert>
          )}

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

            <TextField
              fullWidth
              label="Room Code"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              margin="normal"
              required
              placeholder="Enter 6-character room code"
              inputProps={{ maxLength: 6 }}
              disabled={!!urlRoomId}
            />

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleJoinRoom}
              disabled={loading || !connected}
              sx={{ mt: 3, py: 1.5 }}
            >
              {loading ? 'Joining...' : 'Join Room'}
            </Button>
          </Box>

          {!connected && (
            <Alert severity="warning" sx={{ mt: 3 }}>
              Connecting to server...
            </Alert>
          )}
        </CardContent>
      </Card>

      <Box textAlign="center" mt={4}>
        <Typography variant="body2" color="text.secondary">
          Don't have a room code? <Button onClick={handleBack}>Create a new room</Button>
        </Typography>
      </Box>
    </Container>
  )
}
