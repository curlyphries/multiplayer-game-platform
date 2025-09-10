import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Box,
  Chip,
  LinearProgress,
  Alert
} from '@mui/material'
import {
  Psychology as WordIcon,
  Quiz as TriviaIcon,
  Draw as DrawIcon,
  MusicNote as MusicIcon,
  ThumbUp as VoteIcon
} from '@mui/icons-material'
import { useGame } from '../context/GameContext'
import toast from 'react-hot-toast'

const AVAILABLE_GAMES = [
  {
    id: 'word-game',
    name: 'Word Game',
    description: 'Creative word prompts and voting',
    icon: WordIcon,
    color: '#4CAF50',
    rounds: 3,
    timePerRound: '60s'
  },
  {
    id: 'trivia-game',
    name: 'Trivia Challenge',
    description: 'Test your knowledge across categories',
    icon: TriviaIcon,
    color: '#2196F3',
    rounds: 5,
    timePerRound: '30s'
  },
  {
    id: 'drawing-game',
    name: 'Drawing Game',
    description: 'Draw prompts and guess what others drew',
    icon: DrawIcon,
    color: '#FF9800',
    rounds: 4,
    timePerRound: '90s'
  },
  {
    id: 'music-game',
    name: 'Music Quiz',
    description: 'Name that tune and artist challenges',
    icon: MusicIcon,
    color: '#9C27B0',
    rounds: 6,
    timePerRound: '20s'
  }
]

export default function GameSelectionPage() {
  const navigate = useNavigate()
  const { room, player, gameVote, gameState } = useGame()
  const [votes, setVotes] = useState({})
  const [timeLeft, setTimeLeft] = useState(30)
  const [hasVoted, setHasVoted] = useState(false)

  useEffect(() => {
    if (!room || !player) {
      navigate('/')
      return
    }

    // Initialize votes from room state
    if (room.gameVotes) {
      setVotes(room.gameVotes)
    }

    // Check if current player has voted
    if (room.gameVotes) {
      const playerVoted = Object.values(room.gameVotes).some(gameVotes => 
        gameVotes.includes(player.id)
      )
      setHasVoted(playerVoted)
    }

    // Start voting timer
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Auto-select most voted game
          selectWinningGame()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [room, player, navigate])

  const handleVote = async (gameId) => {
    if (hasVoted) return

    try {
      await gameVote(gameId)
      setHasVoted(true)
      toast.success('Vote cast!')
    } catch (error) {
      toast.error('Failed to vote')
    }
  }

  const selectWinningGame = () => {
    const voteCounts = {}
    
    // Count votes for each game
    Object.entries(votes).forEach(([gameId, voters]) => {
      voteCounts[gameId] = voters.length
    })

    // Find game with most votes
    const winningGame = Object.entries(voteCounts).reduce((a, b) => 
      voteCounts[a[0]] > voteCounts[b[0]] ? a : b
    )[0] || 'word-game'

    // Start the selected game
    startSelectedGame(winningGame)
  }

  const startSelectedGame = (gameId) => {
    toast.success(`Starting ${AVAILABLE_GAMES.find(g => g.id === gameId)?.name}!`)
    // Navigate back to room to start the selected game
    navigate(`/room/${room.id}`)
  }

  const getVoteCount = (gameId) => {
    return votes[gameId]?.length || 0
  }

  const getTotalVotes = () => {
    return Object.values(votes).reduce((sum, voters) => sum + voters.length, 0)
  }

  const getVotePercentage = (gameId) => {
    const total = getTotalVotes()
    if (total === 0) return 0
    return Math.round((getVoteCount(gameId) / total) * 100)
  }

  const connectedPlayers = room?.players?.filter(p => p.connected) || []
  const allPlayersVoted = getTotalVotes() >= connectedPlayers.length

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box textAlign="center" mb={4}>
        <Typography variant="h3" gutterBottom>
          Choose Next Game
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Vote for the game you'd like to play next
        </Typography>
        
        <Box display="flex" justifyContent="center" alignItems="center" gap={2} mt={2}>
          <Chip 
            label={`${getTotalVotes()}/${connectedPlayers.length} votes`}
            color="primary"
            variant="outlined"
          />
          <Chip 
            label={`${timeLeft}s remaining`}
            color={timeLeft <= 10 ? "error" : "default"}
          />
        </Box>

        {allPlayersVoted && (
          <Alert severity="success" sx={{ mt: 2, maxWidth: 400, mx: 'auto' }}>
            All players voted! Starting most popular game...
          </Alert>
        )}
      </Box>

      <Grid container spacing={3}>
        {AVAILABLE_GAMES.map((game) => {
          const IconComponent = game.icon
          const voteCount = getVoteCount(game.id)
          const percentage = getVotePercentage(game.id)
          const isWinning = voteCount > 0 && voteCount === Math.max(...Object.values(votes).map(v => v.length))

          return (
            <Grid item xs={12} md={6} key={game.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  border: isWinning ? `2px solid ${game.color}` : '1px solid rgba(255,255,255,0.12)',
                  backgroundColor: isWinning ? `${game.color}15` : 'background.paper',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: hasVoted ? 'none' : 'translateY(-4px)',
                    boxShadow: hasVoted ? 'none' : `0 8px 25px ${game.color}40`
                  }
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <IconComponent 
                      sx={{ 
                        fontSize: 40, 
                        color: game.color,
                        mr: 2 
                      }} 
                    />
                    <Box flex={1}>
                      <Typography variant="h5" component="h2">
                        {game.name}
                      </Typography>
                      <Typography color="text.secondary">
                        {game.description}
                      </Typography>
                    </Box>
                    {isWinning && (
                      <Chip 
                        label="Leading" 
                        color="primary" 
                        size="small"
                        sx={{ backgroundColor: game.color }}
                      />
                    )}
                  </Box>

                  <Box display="flex" gap={1} mb={2}>
                    <Chip label={`${game.rounds} rounds`} size="small" />
                    <Chip label={`${game.timePerRound} per round`} size="small" />
                  </Box>

                  {voteCount > 0 && (
                    <Box mb={2}>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">
                          {voteCount} vote{voteCount !== 1 ? 's' : ''} ({percentage}%)
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={percentage} 
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: game.color
                          }
                        }}
                      />
                    </Box>
                  )}
                </CardContent>

                <CardActions>
                  <Button
                    fullWidth
                    variant={hasVoted ? "outlined" : "contained"}
                    disabled={hasVoted || allPlayersVoted}
                    onClick={() => handleVote(game.id)}
                    startIcon={<VoteIcon />}
                    sx={{
                      backgroundColor: hasVoted ? 'transparent' : game.color,
                      borderColor: game.color,
                      color: hasVoted ? game.color : 'white',
                      '&:hover': {
                        backgroundColor: hasVoted ? `${game.color}15` : `${game.color}dd`
                      }
                    }}
                  >
                    {hasVoted ? 'Voted' : 'Vote for this game'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      <Box textAlign="center" mt={4}>
        <Button
          variant="outlined"
          onClick={() => navigate(`/room/${room.id}`)}
        >
          Back to Room
        </Button>
      </Box>
    </Container>
  )
}
