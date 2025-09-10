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
  Divider,
  Alert
} from '@mui/material';
import {
  Send as SendIcon,
  MusicNote as MusicIcon,
  Timer as TimerIcon,
  Star as StarIcon,
  Album as AlbumIcon,
  Person as ArtistIcon,
  DateRange as YearIcon
} from '@mui/icons-material';

export default function MusicQuizUI({ 
  gameState, 
  currentPlayer, 
  onSubmitAnswer, 
  timeRemaining 
}) {
  const [answer, setAnswer] = useState('');

  const currentRound = gameState?.round || 1;
  const totalRounds = gameState?.maxRounds || 6;
  const prompt = gameState?.currentPrompt;
  const phase = gameState?.phase || 'waiting';
  const submissions = gameState?.submissions || [];
  const scores = gameState?.scores || {};
  const trackInfo = gameState?.trackInfo;

  // Check if current player has submitted
  const hasSubmitted = submissions.some(s => s.playerId === currentPlayer?.id);

  useEffect(() => {
    // Reset answer when round changes
    setAnswer('');
  }, [currentRound]);

  const handleSubmitAnswer = () => {
    if (answer && onSubmitAnswer) {
      onSubmitAnswer(answer);
      setAnswer('');
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSubmitAnswer();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionIcon = (questionType) => {
    switch (questionType) {
      case 'artist': return <ArtistIcon />;
      case 'song': return <MusicIcon />;
      case 'year': return <YearIcon />;
      case 'album': return <AlbumIcon />;
      default: return <MusicIcon />;
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Game Header */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Stack direction="row" spacing={2} alignItems="center">
              <MusicIcon sx={{ fontSize: 32, color: 'primary.main' }} />
              <Box>
                <Typography variant="h5" component="h1">
                  Music Quiz
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Round {currentRound} of {totalRounds}
                </Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack direction="row" spacing={2} justifyContent="flex-end" alignItems="center">
              <Chip 
                icon={<StarIcon />}
                label={`Phase: ${phase.charAt(0).toUpperCase() + phase.slice(1)}`}
                color="primary"
              />
              {timeRemaining > 0 && (
                <Chip 
                  icon={<TimerIcon />}
                  label={formatTime(timeRemaining)}
                  color={timeRemaining <= 10 ? "error" : "default"}
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
              value={(timeRemaining / (gameState?.roundTime || 20)) * 100}
              color={timeRemaining <= 10 ? "error" : "primary"}
            />
          </Box>
        )}
      </Paper>

      <Grid container spacing={3}>
        {/* Main Game Area */}
        <Grid item xs={12} lg={8}>
          {phase === 'playing' && prompt && (
            <Paper sx={{ p: 3 }}>
              <Stack spacing={3}>
                {/* Question */}
                <Box sx={{ textAlign: 'center' }}>
                  <Stack direction="row" justifyContent="center" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    {getQuestionIcon(prompt.questionType)}
                    <Typography variant="h6">
                      {prompt.question}
                    </Typography>
                  </Stack>
                  
                  {prompt.difficulty && (
                    <Chip 
                      label={`${prompt.difficulty.toUpperCase()} Question`}
                      color={getDifficultyColor(prompt.difficulty)}
                      size="small"
                    />
                  )}
                </Box>

                {/* Hints */}
                {prompt.hints && prompt.hints.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Hints:
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {prompt.hints.map((hint, index) => (
                        <Chip 
                          key={index}
                          label={hint}
                          variant="outlined"
                          size="small"
                        />
                      ))}
                    </Stack>
                  </Box>
                )}

                {/* Multiple Choice Options */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Choose your answer:
                  </Typography>
                  <Stack spacing={1}>
                    {prompt.options && prompt.options.map((option, index) => (
                      <Button
                        key={index}
                        variant={answer === option ? "contained" : "outlined"}
                        color={answer === option ? "primary" : "inherit"}
                        onClick={() => setAnswer(option)}
                        disabled={hasSubmitted}
                        sx={{ 
                          justifyContent: 'flex-start',
                          textAlign: 'left',
                          py: 1.5,
                          px: 2
                        }}
                      >
                        <Typography variant="body1">
                          {String.fromCharCode(65 + index)}. {option}
                        </Typography>
                      </Button>
                    ))}
                  </Stack>
                  
                  <Button
                    fullWidth
                    onClick={handleSubmitAnswer}
                    disabled={!answer || hasSubmitted}
                    startIcon={<SendIcon />}
                    variant="contained"
                    size="large"
                    sx={{ mt: 2 }}
                  >
                    {hasSubmitted ? 'Submitted!' : 'Submit Answer'}
                  </Button>
                </Box>

                {hasSubmitted && (
                  <Alert severity="success">
                    Answer submitted! Waiting for other players...
                  </Alert>
                )}
              </Stack>
            </Paper>
          )}

          {phase === 'results' && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Round Results
              </Typography>
              
              {trackInfo && (
                <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
                  <CardContent>
                    <Stack spacing={1}>
                      <Typography variant="h6" sx={{ color: 'text.primary' }}>
                        🎵 {trackInfo.song}
                      </Typography>
                      <Typography variant="body1" sx={{ color: 'text.primary' }}>
                        👤 <strong>Artist:</strong> {trackInfo.artist}
                      </Typography>
                      <Typography variant="body1" sx={{ color: 'text.primary' }}>
                        💿 <strong>Album:</strong> {trackInfo.album}
                      </Typography>
                      <Typography variant="body1" sx={{ color: 'text.primary' }}>
                        📅 <strong>Year:</strong> {trackInfo.year}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              )}

              {/* Show submissions */}
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Player Answers:
              </Typography>
              <Stack spacing={1}>
                {submissions.map((submission, index) => (
                  <Paper key={index} sx={{ p: 2, bgcolor: submission.isCorrect ? 'success.light' : 'error.light' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="body1" sx={{ color: 'text.primary' }}>
                          <strong>{submission.playerName}:</strong> {submission.content.answer}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {submission.isCorrect ? (
                          <Chip label="✓ Correct" color="success" size="small" />
                        ) : (
                          <Chip label="✗ Wrong" color="error" size="small" />
                        )}
                        {submission.score > 0 && (
                          <Chip label={`+${submission.score} pts`} color="primary" size="small" />
                        )}
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
              </Stack>

              {/* Ready for Next Round Button */}
              <Button
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                sx={{ mt: 3 }}
                onClick={() => {
                  onSubmitAnswer && onSubmitAnswer('ready');
                }}
                disabled={gameState?.playersReady?.includes(currentPlayer?.id)}
              >
                {gameState?.playersReady?.includes(currentPlayer?.id) ? '✓ Ready - Waiting for Others...' : 'Ready for Next Round'}
              </Button>
              
              {gameState?.playersReady?.length > 0 && (
                <Typography variant="body2" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
                  {gameState.playersReady.length} of {gameState.players?.length} players ready
                </Typography>
              )}
            </Paper>
          )}

          {phase === 'waiting' && (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <MusicIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Get ready for the music quiz!
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Test your knowledge of songs, artists, albums, and music history.
              </Typography>
            </Paper>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} lg={4}>
          {/* Scores */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Leaderboard
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

          {/* Game Info */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Game Info
            </Typography>
            <Stack spacing={1}>
              <Typography variant="body2">
                <strong>Round:</strong> {currentRound} / {totalRounds}
              </Typography>
              <Typography variant="body2">
                <strong>Players:</strong> {gameState?.players?.length || 0}
              </Typography>
              <Typography variant="body2">
                <strong>Time per Round:</strong> {gameState?.roundTime || 20}s
              </Typography>
              {prompt?.questionType && (
                <Typography variant="body2">
                  <strong>Question Type:</strong> {prompt.questionType.charAt(0).toUpperCase() + prompt.questionType.slice(1)}
                </Typography>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
