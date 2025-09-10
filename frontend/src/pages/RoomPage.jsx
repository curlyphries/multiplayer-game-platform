import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Container,
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  TextField,
  Chip,
  Alert,
  Divider,
  Grid,
  Card,
  CardContent,
  Stack
} from '@mui/material'
import {
  Send as SendIcon,
  ExitToApp as ExitIcon,
  PersonRemove as KickIcon,
  PlayArrow as StartIcon,
  SmartToy as BotIcon,
  PersonAdd as AddBotIcon,
  ContentCopy as CopyIcon,
  Settings as SettingsIcon
} from '@mui/icons-material'
import { useGame } from '../context/GameContext'
import GameCreationModal from '../components/GameCreationModal'
import toast from 'react-hot-toast'

export default function RoomPage() {
  const navigate = useNavigate()
  const { roomId } = useParams()
  const { 
    room, 
    player, 
    chat: chatMessages, 
    sendChatMessage, 
    startGame, 
    setPlayerReady, 
    kickPlayer,
    leaveRoom,
    addBot,
    removeBot
  } = useGame()
  
  const [chatMessage, setChatMessage] = useState('')
  const [isReady, setIsReady] = useState(false)
  const [gameCreationModalOpen, setGameCreationModalOpen] = useState(false)

  useEffect(() => {
    console.log('🔍 RoomPage state check:', { room: !!room, player: !!player, roomId })
    if (!room || !player) {
      // Only redirect if we're sure the room doesn't exist
      // Give some time for the socket connection to establish
      const timer = setTimeout(() => {
        console.log('⏰ Timer expired, checking state again:', { room: !!room, player: !!player })
        if (!room || !player) {
          console.log('🔄 Redirecting to join page')
          navigate('/join/' + roomId)
        }
      }, 2000)
      
      return () => clearTimeout(timer)
    }

    if (room && room.status === 'playing') {
      navigate(`/game/${roomId}`)
    }
  }, [room, player, roomId, navigate])

  useEffect(() => {
    // Auto-scroll chat to bottom
    const chatContainer = document.getElementById('chat-container')
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight
    }
  }, [chatMessages])

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      sendChatMessage(chatMessage)
      setChatMessage('')
    }
  }

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSendMessage()
    }
  }

  const handleCopyRoomCode = () => {
    navigator.clipboard.writeText(roomId)
    toast.success('Room code copied!')
  }

  const handleCopyInviteLink = () => {
    const inviteLink = `${window.location.origin}/join/${roomId}`
    navigator.clipboard.writeText(inviteLink)
    toast.success('Invite link copied!')
  }

  const handleStartGame = async () => {
    try {
      // Use the room's game type for default game start
      await startGame(room?.gameType)
    } catch (error) {
      // Error already handled in context
    }
  }

  const handleToggleReady = () => {
    const newReady = !isReady
    setIsReady(newReady)
    setPlayerReady(newReady)
  }

  const handleKickPlayer = async (targetPlayerId) => {
    try {
      await kickPlayer(targetPlayerId)
      toast.success('Player kicked')
    } catch (error) {
      // Error already handled in context
    }
  }

  const handleLeaveRoom = () => {
    leaveRoom()
    navigate('/')
  }

  const handleAddBot = async () => {
    try {
      await addBot()
      toast.success('Bot added to room!')
    } catch (error) {
      toast.error('Failed to add bot')
    }
  }

  const handleRemoveBot = async (botId) => {
    try {
      await removeBot(botId)
      toast.success('Bot removed from room!')
    } catch (error) {
      toast.error('Failed to remove bot')
    }
  }

  const handleCreateCustomGame = async (gameType, config) => {
    try {
      await startGame(gameType, config)
      toast.success(`Starting ${gameType} with custom settings!`)
    } catch (error) {
      toast.error('Failed to start custom game')
    }
  }

  const isHost = player && room && player.id === room.host
  const connectedPlayers = room?.players?.filter(p => p.connected) || []
  // Count both human players and bots for game start requirement
  const totalPlayers = connectedPlayers.length
  const canStartGame = isHost && totalPlayers >= 2

  if (!room || !player) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="info">Loading room...</Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        {/* Room Info & Players */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h4">
                  Room {roomId}
                </Typography>
                <Button
                  startIcon={<ExitIcon />}
                  onClick={handleLeaveRoom}
                  color="error"
                  variant="outlined"
                >
                  Leave
                </Button>
              </Box>
              
              <Stack direction="row" spacing={2} mb={3}>
                <Chip 
                  label={`${connectedPlayers.length}/${room.maxPlayers} Players`} 
                  color="primary" 
                />
                <Chip label={room.gameType} />
                <Chip 
                  label={room.status} 
                  color={room.status === 'waiting' ? 'default' : 'success'} 
                />
              </Stack>

              <Box display="flex" gap={2} mb={3}>
                <Button
                  startIcon={<CopyIcon />}
                  onClick={handleCopyRoomCode}
                  variant="outlined"
                  size="small"
                >
                  Copy Code
                </Button>
                <Button
                  startIcon={<CopyIcon />}
                  onClick={handleCopyInviteLink}
                  variant="outlined"
                  size="small"
                >
                  Copy Invite Link
                </Button>
              </Box>

              <Typography variant="h6" gutterBottom>
                Players
              </Typography>
              <List dense>
                {connectedPlayers.map((p) => (
                  <ListItem key={p.id}>
                    <ListItemText 
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          {p.isBot ? <BotIcon color="info" /> : null}
                          <span>{p.name}</span>
                          {p.id === room.host && <Chip label="Host" size="small" color="warning" />}
                          {p.isBot && <Chip label="Bot" size="small" color="info" />}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box display="flex" alignItems="center" gap={1}>
                        {p.ready && <Chip label="Ready" size="small" color="success" />}
                        {isHost && p.id !== player.id && (
                          <IconButton
                            onClick={() => p.isBot ? handleRemoveBot(p.id) : handleKickPlayer(p.id)}
                            color="error"
                            size="small"
                          >
                            <KickIcon />
                          </IconButton>
                        )}
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>

              {isHost && connectedPlayers.length < room.maxPlayers && (
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AddBotIcon />}
                  onClick={handleAddBot}
                  sx={{ mt: 1, mb: 2 }}
                >
                  Add Bot Player
                </Button>
              )}

              {isHost ? (
                <Stack spacing={1} sx={{ mt: 2 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    startIcon={<StartIcon />}
                    onClick={handleStartGame}
                    disabled={!canStartGame}
                  >
                    {canStartGame ? 'Start Default Game' : 'Need at least 2 players'}
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="large"
                    startIcon={<SettingsIcon />}
                    onClick={() => setGameCreationModalOpen(true)}
                    disabled={!canStartGame}
                  >
                    Create Custom Game
                  </Button>
                </Stack>
              ) : (
                <Button
                  fullWidth
                  variant={isReady ? "contained" : "outlined"}
                  color={isReady ? "success" : "primary"}
                  size="large"
                  onClick={handleToggleReady}
                  sx={{ mt: 2 }}
                >
                  {isReady ? 'Ready!' : 'Mark as Ready'}
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Chat */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: 500, display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ pb: 1 }}>
              <Typography variant="h6">Chat</Typography>
            </CardContent>
            <Divider />
            
            <Box 
              id="chat-container"
              sx={{ 
                flex: 1, 
                overflow: 'auto', 
                p: 2,
                maxHeight: 350
              }}
            >
              {chatMessages.length === 0 ? (
                <Typography color="text.secondary" textAlign="center">
                  No messages yet. Say hello!
                </Typography>
              ) : (
                chatMessages.map((message) => (
                  <Box key={message.id} sx={{ mb: 1 }}>
                    {message.type === 'system' ? (
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        textAlign="center"
                        sx={{ fontStyle: 'italic' }}
                      >
                        {message.message}
                      </Typography>
                    ) : (
                      <Box>
                        <Typography variant="body2" color="primary" component="span">
                          {message.playerName}:
                        </Typography>
                        <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                          {message.message}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ))
              )}
            </Box>
            
            <Divider />
            <Box sx={{ p: 2 }}>
              <Box display="flex" gap={1}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Type a message..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <IconButton 
                  onClick={handleSendMessage}
                  disabled={!chatMessage.trim()}
                  color="primary"
                >
                  <SendIcon />
                </IconButton>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

      <GameCreationModal
        open={gameCreationModalOpen}
        onClose={() => setGameCreationModalOpen(false)}
        onCreateGame={handleCreateCustomGame}
      />
    </Container>
  )
}
