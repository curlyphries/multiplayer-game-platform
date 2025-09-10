import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Chip,
  Stack,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  Send as SendIcon,
  Brush as BrushIcon,
  Visibility as ViewIcon,
  Timer as TimerIcon
} from '@mui/icons-material';
import DrawingCanvas from './DrawingCanvas';

export default function DrawingGameUI({ 
  gameState, 
  currentPlayer, 
  onSubmitGuess, 
  onSubmitDrawing,
  onApproveGuess,
  timeRemaining 
}) {
  const [guess, setGuess] = useState('');
  const [currentDrawing, setCurrentDrawing] = useState(null);

  const currentRound = gameState?.currentRound || 1;
  const totalRounds = gameState?.totalRounds || 3;
  const prompt = gameState?.currentPrompt;
  const currentArtist = gameState?.currentArtist;
  const phase = gameState?.phase || 'waiting';
  const submissions = gameState?.submissions || {};
  const guesses = gameState?.submissions?.filter(s => s.type === 'guess') || [];
  const pendingGuesses = guesses.filter(g => g.isPending);
  const approvedGuesses = guesses.filter(g => g.isCorrect);
  const scores = gameState?.scores || {};

  // Check if current player is the artist
  const isCurrentArtist = currentPlayer?.id === currentArtist?.id;
  const hasSubmittedDrawing = submissions[currentPlayer?.id];
  const hasSubmittedGuess = guesses.some(g => g.playerId === currentPlayer?.id);

  useEffect(() => {
    // Reset guess when round changes
    setGuess('');
  }, [currentRound, currentArtist]);

  const handleDrawingChange = (drawingData) => {
    setCurrentDrawing(drawingData);
  };

  const handleSubmitDrawing = () => {
    if (currentDrawing && onSubmitDrawing) {
      try {
        onSubmitDrawing(currentDrawing);
      } catch (error) {
        console.error('Error submitting drawing:', error);
      }
    }
  };

  const handleSubmitGuess = () => {
    if (guess.trim() && onSubmitGuess) {
      onSubmitGuess(guess.trim());
      setGuess('');
    }
  };

  const handleApproveGuess = (guessId, approved) => {
    if (onApproveGuess) {
      onApproveGuess(guessId, approved);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSubmitGuess();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseTitle = () => {
    switch (phase) {
      case 'drawing':
        return isCurrentArtist ? 'Draw the prompt!' : 'Wait for the artist to draw...';
      case 'guessing':
        return isCurrentArtist ? 'Players are guessing your drawing!' : 'Guess what the drawing shows!';
      case 'results':
        return 'Round Results';
      default:
        return 'Waiting for game to start...';
    }
  };

  const getPhaseDescription = () => {
    switch (phase) {
      case 'drawing':
        return isCurrentArtist 
          ? `Draw: "${prompt}". You have ${formatTime(timeRemaining)} to complete your drawing.`
          : `${currentArtist?.name} is drawing. Get ready to guess!`;
      case 'guessing':
        return isCurrentArtist
          ? 'Watch as players try to guess your masterpiece!'
          : `What do you think ${currentArtist?.name} drew? Submit your guess!`;
      case 'results':
        return 'See how everyone did this round!';
      default:
        return '';
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h5" gutterBottom>
              <BrushIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Drawing Game
            </Typography>
            <Typography variant="h6" color="primary">
              {getPhaseTitle()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {getPhaseDescription()}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack direction="row" spacing={2} justifyContent="flex-end" alignItems="center">
              <Chip 
                icon={<TimerIcon />}
                label={`Round ${currentRound}/${totalRounds}`}
                color="primary"
                variant="outlined"
              />
              {timeRemaining > 0 && (
                <Chip 
                  icon={<TimerIcon />}
                  label={formatTime(timeRemaining)}
                  color={timeRemaining <= 30 ? "error" : "default"}
                />
              )}
            </Stack>
          </Grid>
        </Grid>

        {/* Progress Bar */}
        {timeRemaining > 0 && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={(timeRemaining / (gameState?.roundTime || 60)) * 100}
              color={timeRemaining <= 30 ? "error" : "primary"}
            />
          </Box>
        )}
      </Paper>

      <Grid container spacing={3}>
        {/* Main Game Area */}
        <Grid item xs={12} lg={8}>
          {phase === 'drawing' && isCurrentArtist && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Draw: "{prompt}"
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <DrawingCanvas 
                  onDrawingChange={handleDrawingChange}
                  width={Math.min(600, window.innerWidth - 100)}
                  height={Math.min(400, window.innerHeight - 300)}
                />
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Button
                  variant="contained"
                  onClick={handleSubmitDrawing}
                  disabled={!currentDrawing || hasSubmittedDrawing}
                  startIcon={<SendIcon />}
                  size="large"
                >
                  {hasSubmittedDrawing ? 'Drawing Submitted!' : 'Submit Drawing'}
                </Button>
              </Box>
            </Paper>
          )}

          {phase === 'drawing' && !isCurrentArtist && (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <BrushIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {currentArtist?.name} is creating their masterpiece...
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Get ready to guess what they're drawing!
              </Typography>
            </Paper>
          )}

          {(phase === 'guessing' || phase === 'results') && gameState?.currentDrawing && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                <ViewIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                {currentArtist?.name}'s Drawing
              </Typography>
              <Box sx={{ textAlign: 'center' }}>
                <img 
                  src={gameState.currentDrawing} 
                  alt="Current drawing"
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '400px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px'
                  }}
                />
              </Box>
              
              {phase === 'guessing' && !isCurrentArtist && (
                <Box sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="What do you think this drawing shows?"
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={hasSubmittedGuess}
                    InputProps={{
                      endAdornment: (
                        <Button
                          onClick={handleSubmitGuess}
                          disabled={!guess.trim() || hasSubmittedGuess}
                          startIcon={<SendIcon />}
                        >
                          {hasSubmittedGuess ? 'Submitted!' : 'Guess'}
                        </Button>
                      )
                    }}
                  />
                </Box>
              )}
              
              {/* Artist Approval Section */}
              {phase === 'guessing' && isCurrentArtist && pendingGuesses.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Approve Guesses:
                  </Typography>
                  <Stack spacing={1}>
                    {pendingGuesses.map((guess) => (
                      <Paper key={guess.id} sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="body1">
                              <strong>{guess.playerName}:</strong> "{guess.content.guess}"
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={1}>
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              onClick={() => handleApproveGuess(guess.id, true)}
                            >
                              ✓ Correct
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={() => handleApproveGuess(guess.id, false)}
                            >
                              ✗ Wrong
                            </Button>
                          </Stack>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              )}
            </Paper>
          )}

          {phase === 'results' && (
            <Paper sx={{ p: 2, mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Round Results
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>The prompt was:</strong> "{prompt}"
              </Typography>
              
              {/* Show correct guesses */}
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                Correct Guesses:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {approvedGuesses.map((guess, index) => (
                  <Chip 
                    key={index}
                    label={`${guess.playerName}: "${guess.content.guess}"`}
                    color="success"
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Paper>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} lg={4}>
          {/* Current Artist */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Current Artist
            </Typography>
            {currentArtist && (
              <Card variant="outlined">
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <BrushIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1">
                        {currentArtist.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Drawing the prompt
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Paper>

          {/* Scores */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Scores
            </Typography>
            <List dense>
              {Object.entries(scores)
                .sort(([,a], [,b]) => b - a)
                .map(([playerId, score], index) => {
                  const player = gameState?.players?.find(p => p.id === playerId);
                  return (
                    <ListItem key={playerId} divider={index < Object.keys(scores).length - 1}>
                      <ListItemAvatar>
                        <Avatar sx={{ 
                          bgcolor: index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? '#CD7F32' : 'grey.400',
                          color: 'white',
                          fontSize: '0.875rem'
                        }}>
                          {index + 1}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={player?.name || 'Unknown Player'}
                        secondary={`${score} points`}
                      />
                    </ListItem>
                  );
                })}
            </List>
          </Paper>

          {/* Recent Guesses */}
          {phase === 'guessing' && guesses.length > 0 && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Recent Guesses
              </Typography>
              <List dense>
                {guesses.slice(-5).reverse().map((guess, index) => (
                  <ListItem key={index}>
                    <ListItemText 
                      primary={`${guess.playerName}: "${guess.content.guess}"`}
                      secondary={
                        guess.isPending ? 'Awaiting approval...' :
                        guess.isCorrect ? 'Correct!' : 'Wrong'
                      }
                      primaryTypographyProps={{
                        color: guess.isCorrect ? 'success.main' : 
                               guess.isPending ? 'warning.main' : 'text.primary'
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
