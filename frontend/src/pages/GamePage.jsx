import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  List,
  ListItem,
  ListItemText,
  Chip,
  LinearProgress,
  Alert,
  Stack,
  Divider
} from '@mui/material'
import {
  Timer as TimerIcon,
  Send as SendIcon,
  ThumbUp as ThumbUpIcon,
  EmojiEvents as TrophyIcon,
  Refresh as RefreshIcon,
  ExitToApp as ExitIcon
} from '@mui/icons-material'
import { useGame } from '../context/GameContext'
import DrawingGameUI from '../components/DrawingGameUI'
import MusicQuizUI from '../components/MusicQuizUI'
import toast from 'react-hot-toast'

export default function GamePage() {
  const navigate = useNavigate()
  const { roomId } = useParams()
  const { 
    room, 
    player, 
    gameState, 
    connected, 
    gameAction, 
    leaveRoom 
  } = useGame()
  
  const [answer, setAnswer] = useState('')
  const [selectedSubmission, setSelectedSubmission] = useState(null)

  useEffect(() => {
    if (!room || !player) {
      navigate('/join/' + roomId)
      return
    }

    if (room.status !== 'playing') {
      navigate(`/room/${roomId}`)
    }
  }, [room, player, roomId, navigate])

  const handleSubmitAnswer = async () => {
    if (!answer) {
      toast.error('Please enter an answer')
      return
    }

    try {
      await gameAction('submit-answer', { answer: answer })
      setAnswer('')
      toast.success('Answer submitted!')
    } catch (error) {
      // Error already handled in context
    }
  }

  const handleSubmitDrawing = async (drawingData) => {
    try {
      await gameAction('submit-drawing', { drawing: drawingData })
      toast.success('Drawing submitted!')
    } catch (error) {
      // Error already handled in context
    }
  }

  const handleSubmitGuess = async (guess) => {
    try {
      await gameAction('submit-guess', { guess })
      toast.success('Guess submitted!')
    } catch (error) {
      // Error already handled in context
    }
  }

  const handleApproveGuess = async (guessId, approved) => {
    try {
      await gameAction('approve-guess', { guessId, approved })
      toast.success(approved ? 'Guess approved!' : 'Guess rejected')
    } catch (error) {
      // Error already handled in context
    }
  }

  const handleVote = async (submissionId) => {
    try {
      await gameAction('vote', { submissionId })
      setSelectedSubmission(submissionId)
      toast.success('Vote cast!')
    } catch (error) {
      // Error already handled in context
    }
  }

  const handleNextRound = async () => {
    try {
      await gameAction('next-round', {})
    } catch (error) {
      // Error already handled in context
    }
  }

  const handleRestartGame = async () => {
    try {
      await gameAction('restart-game', {})
    } catch (error) {
      // Error already handled in context
    }
  }

  const handleLeaveGame = () => {
    leaveRoom()
    navigate('/')
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmitAnswer()
    }
  }

  if (!room || !player || !gameState) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="info">Loading game...</Alert>
      </Container>
    )
  }

  const isHost = player.id === room.host
  const currentPlayer = gameState.players?.find(p => p.id === player.id)
  const hasSubmitted = currentPlayer?.hasSubmitted || false
  const hasVoted = currentPlayer?.hasVoted || false

  // Debug game type detection
  console.log('🎮 GamePage gameState:', { gameType: gameState.gameType, roomGameType: room?.gameType });
  
  // Check game type for specialized UIs
  const isDrawingGame = gameState.gameType === 'drawing-game';
  const isMusicGame = gameState.gameType === 'music-game';

  // For drawing games, use the specialized UI
  if (isDrawingGame) {
    return (
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <DrawingGameUI
          gameState={gameState}
          currentPlayer={currentPlayer}
          onSubmitGuess={handleSubmitGuess}
          onSubmitDrawing={handleSubmitDrawing}
          onApproveGuess={handleApproveGuess}
          timeRemaining={gameState.timeLeft || 0}
        />
      </Container>
    );
  }

  // For music quiz games, use the specialized UI
  if (isMusicGame) {
    const handleMusicQuizAnswer = async (selectedAnswer) => {
      if (!selectedAnswer) {
        toast.error('Please select an answer')
        return
      }

      try {
        await gameAction('submit-answer', { answer: selectedAnswer })
        toast.success('Answer submitted!')
      } catch (error) {
        // Error already handled in context
      }
    }

    return (
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <MusicQuizUI
          gameState={gameState}
          currentPlayer={currentPlayer}
          onSubmitAnswer={handleMusicQuizAnswer}
          timeRemaining={gameState.timeLeft || 0}
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Game Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
            <Typography variant="h4">
              {gameState.gameType === 'trivia-game' ? 'Trivia Challenge' : 
               gameState.gameType === 'music-game' ? 'Music Quiz' : 
               gameState.gameType === 'drawing-game' ? 'Drawing Game' : 'Word Game'} - Round {gameState.round}/{gameState.maxRounds}
            </Typography>
            <Button
              startIcon={<ExitIcon />}
              onClick={handleLeaveGame}
              color="error"
              variant="outlined"
            >
              Leave Game
            </Button>
          </Box>
          
          <Stack direction="row" spacing={2} alignItems="center">
            <Chip 
              icon={<TimerIcon />}
              label={`${gameState.timeLeft}s`}
              color={gameState.timeLeft <= 10 ? 'error' : 'primary'}
            />
            <Chip 
              label={gameState.phase}
              color={
                gameState.phase === 'submitting' ? 'info' : 
                gameState.phase === 'voting' ? 'warning' : 
                gameState.phase === 'results' ? 'success' : 'default'
              }
            />
          </Stack>

          {gameState.timeLeft > 0 && (
            <LinearProgress 
              variant="determinate" 
              value={(gameState.timeLeft / (gameState.phase === 'submitting' ? 60 : gameState.phase === 'voting' ? 45 : 15)) * 100}
              sx={{ mt: 2 }}
            />
          )}
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Main Game Area */}
        <Grid item xs={12} md={8}>
          {gameState.phase === 'submitting' && (
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Submit Your Answer
                </Typography>
                <Typography variant="h6" color="primary" paragraph>
                  "{gameState.currentPrompt}"
                </Typography>
                
                {hasSubmitted ? (
                  <Alert severity="success">
                    Answer submitted! Waiting for other players...
                  </Alert>
                ) : (
                  <Box>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="Type your creative answer here..."
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      onKeyPress={handleKeyPress}
                      sx={{ mb: 2 }}
                    />
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<SendIcon />}
                      onClick={handleSubmitAnswer}
                      disabled={!answer.trim() || !connected}
                    >
                      Submit Answer
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {gameState.phase === 'voting' && (
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Vote for the Best Answer
                </Typography>
                <Typography variant="h6" color="primary" paragraph>
                  "{gameState.currentPrompt}"
                </Typography>
                
                {hasVoted ? (
                  <Alert severity="success">
                    Vote cast! Waiting for other players...
                  </Alert>
                ) : (
                  <List>
                    {gameState.submissions?.map((submission) => (
                      <ListItem 
                        key={submission.id}
                        sx={{ 
                          border: 1, 
                          borderColor: 'divider', 
                          borderRadius: 2, 
                          mb: 1,
                          cursor: submission.playerId === player.id ? 'not-allowed' : 'pointer',
                          opacity: submission.playerId === player.id ? 0.5 : 1,
                          '&:hover': submission.playerId !== player.id ? {
                            backgroundColor: 'action.hover'
                          } : {}
                        }}
                        onClick={() => submission.playerId !== player.id && handleVote(submission.id)}
                      >
                        <ListItemText 
                          primary={submission.answer}
                          secondary={submission.playerId === player.id ? 'Your answer' : 'Click to vote'}
                        />
                        {submission.playerId !== player.id && (
                          <ThumbUpIcon color="action" />
                        )}
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          )}

          {gameState.phase === 'results' && (
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Round {gameState.round} Results
                </Typography>
                <Typography variant="h6" color="primary" paragraph>
                  "{gameState.currentPrompt}"
                </Typography>
                
                <List>
                  {gameState.results?.map((result, index) => (
                    <ListItem 
                      key={result.id}
                      sx={{ 
                        border: 1, 
                        borderColor: index === 0 ? 'gold' : 'divider', 
                        borderRadius: 2, 
                        mb: 1,
                        backgroundColor: index === 0 ? 'action.selected' : 'transparent'
                      }}
                    >
                      <ListItemText 
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            {index === 0 && <TrophyIcon color="warning" />}
                            <Typography variant="body1">
                              {result.answer}
                            </Typography>
                          </Box>
                        }
                        secondary={`by ${result.playerName} • ${result.votes} votes`}
                      />
                      <Chip 
                        label={`${result.votes} votes`}
                        color={index === 0 ? 'warning' : 'default'}
                        size="small"
                      />
                    </ListItem>
                  ))}
                </List>

                {isHost && (
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleNextRound}
                    sx={{ mt: 2 }}
                  >
                    {gameState.round >= gameState.maxRounds ? 'View Final Results' : 'Next Round'}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {gameState.phase === 'finished' && (
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <TrophyIcon sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
                <Typography variant="h4" gutterBottom>
                  Game Over!
                </Typography>
                <Typography variant="h5" color="primary" paragraph>
                  🎉 {gameState.winner?.name} Wins! 🎉
                </Typography>
                
                <Divider sx={{ my: 3 }} />
                
                <Typography variant="h6" gutterBottom>
                  Final Scores
                </Typography>
                <List>
                  {gameState.players
                    ?.sort((a, b) => b.score - a.score)
                    .map((p, index) => (
                      <ListItem key={p.id}>
                        <ListItemText 
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              {index === 0 && <TrophyIcon color="warning" />}
                              <Typography variant="body1">
                                {index + 1}. {p.name}
                              </Typography>
                            </Box>
                          }
                        />
                        <Chip 
                          label={`${p.score} points`}
                          color={index === 0 ? 'warning' : 'default'}
                        />
                      </ListItem>
                    ))}
                </List>

                {isHost && (
                  <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
                    <Button
                      variant="contained"
                      startIcon={<RefreshIcon />}
                      onClick={() => navigate(`/game-selection/${room.id}`)}
                    >
                      Choose Next Game
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleLeaveGame}
                    >
                      Leave Game
                    </Button>
                  </Stack>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Scoreboard */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Scoreboard
              </Typography>
              <List dense>
                {gameState.players
                  ?.sort((a, b) => b.score - a.score)
                  .map((p, index) => (
                    <ListItem key={p.id}>
                      <ListItemText 
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            {index === 0 && gameState.phase === 'finished' && <TrophyIcon color="warning" fontSize="small" />}
                            <Typography 
                              variant="body2"
                              color={p.id === player.id ? 'primary' : 'text.primary'}
                              fontWeight={p.id === player.id ? 'bold' : 'normal'}
                            >
                              {p.name}
                            </Typography>
                          </Box>
                        }
                      />
                      <Chip 
                        label={p.score}
                        size="small"
                        color={p.id === player.id ? 'primary' : 'default'}
                      />
                    </ListItem>
                  ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {!connected && (
        <Alert severity="warning" sx={{ mt: 3 }}>
          Disconnected from server. Trying to reconnect...
        </Alert>
      )}
    </Container>
  )
}
