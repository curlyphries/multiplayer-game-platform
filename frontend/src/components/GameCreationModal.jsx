import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Typography,
  Chip,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Slider,
  Grid,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  Psychology as WordIcon,
  Quiz as TriviaIcon,
  Draw as DrawIcon,
  MusicNote as MusicIcon
} from '@mui/icons-material';

const GAME_TYPES = [
  {
    id: 'word-game',
    name: 'Word Game',
    description: 'Creative word prompts and voting',
    icon: WordIcon,
    color: '#4CAF50',
    defaultConfig: {
      maxRounds: 3,
      timePerRound: 60,
      votingTime: 30
    }
  },
  {
    id: 'trivia-game',
    name: 'Trivia Challenge',
    description: 'Test your knowledge across categories',
    icon: TriviaIcon,
    color: '#2196F3',
    defaultConfig: {
      maxRounds: 5,
      timePerRound: 30,
      categories: ['general', 'science', 'history', 'entertainment', 'sports']
    }
  },
  {
    id: 'drawing-game',
    name: 'Drawing Game',
    description: 'Draw prompts and guess what others drew',
    icon: DrawIcon,
    color: '#FF9800',
    defaultConfig: {
      maxRounds: 4,
      timePerRound: 90,
      votingTime: 30
    }
  },
  {
    id: 'music-game',
    name: 'Music Quiz',
    description: 'Name that tune and artist challenges',
    icon: MusicIcon,
    color: '#9C27B0',
    defaultConfig: {
      maxRounds: 6,
      timePerRound: 20,
      categories: ['pop', 'rock', 'classic', 'soundtrack', 'mixed']
    }
  }
];

const TRIVIA_CATEGORIES = [
  { id: 'general', name: 'General Knowledge' },
  { id: 'science', name: 'Science & Nature' },
  { id: 'history', name: 'History' },
  { id: 'entertainment', name: 'Entertainment' },
  { id: 'sports', name: 'Sports' }
];

const MUSIC_CATEGORIES = [
  { id: 'pop', name: 'Pop Music' },
  { id: 'rock', name: 'Rock Music' },
  { id: 'classic', name: 'Classic Hits' },
  { id: 'soundtrack', name: 'Movie Soundtracks' },
  { id: 'mixed', name: 'Mixed Genres' }
];

export default function GameCreationModal({ open, onClose, onCreateGame }) {
  const [selectedGame, setSelectedGame] = useState('');
  const [config, setConfig] = useState({});

  const handleGameSelect = (gameId) => {
    const gameType = GAME_TYPES.find(g => g.id === gameId);
    setSelectedGame(gameId);
    setConfig(gameType ? { ...gameType.defaultConfig } : {});
  };

  const handleConfigChange = (key, value) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleCategoryToggle = (category) => {
    const currentCategories = config.categories || [];
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter(c => c !== category)
      : [...currentCategories, category];
    
    handleConfigChange('categories', newCategories);
  };

  const handleCreate = () => {
    if (!selectedGame) return;
    
    onCreateGame(selectedGame, config);
    onClose();
    setSelectedGame('');
    setConfig({});
  };

  const handleClose = () => {
    onClose();
    setSelectedGame('');
    setConfig({});
  };

  const selectedGameType = GAME_TYPES.find(g => g.id === selectedGame);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h5" component="div">
          Create Custom Game
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Choose a game type and customize the settings
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Select Game Type
          </Typography>
          <Grid container spacing={2}>
            {GAME_TYPES.map((game) => {
              const IconComponent = game.icon;
              const isSelected = selectedGame === game.id;
              
              return (
                <Grid item xs={12} sm={6} key={game.id}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      border: isSelected ? `2px solid ${game.color}` : '1px solid rgba(255,255,255,0.12)',
                      backgroundColor: isSelected ? `${game.color}15` : 'background.paper',
                      '&:hover': {
                        backgroundColor: `${game.color}10`
                      }
                    }}
                    onClick={() => handleGameSelect(game.id)}
                  >
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={1}>
                        <IconComponent 
                          sx={{ 
                            fontSize: 32, 
                            color: game.color,
                            mr: 1 
                          }} 
                        />
                        <Typography variant="h6">
                          {game.name}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {game.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>

        {selectedGameType && (
          <>
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" gutterBottom>
              Game Settings
            </Typography>
            
            <Grid container spacing={3}>
              {/* Basic Settings */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Number of Rounds"
                  type="number"
                  value={config.maxRounds || ''}
                  onChange={(e) => handleConfigChange('maxRounds', parseInt(e.target.value))}
                  inputProps={{ min: 1, max: 10 }}
                  helperText="1-10 rounds"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Time per Round (seconds)"
                  type="number"
                  value={config.timePerRound || ''}
                  onChange={(e) => handleConfigChange('timePerRound', parseInt(e.target.value))}
                  inputProps={{ min: 10, max: 300 }}
                  helperText="10-300 seconds"
                />
              </Grid>

              {/* Voting Time for games that support it */}
              {(selectedGame === 'word-game' || selectedGame === 'drawing-game') && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Voting Time (seconds)"
                    type="number"
                    value={config.votingTime || ''}
                    onChange={(e) => handleConfigChange('votingTime', parseInt(e.target.value))}
                    inputProps={{ min: 10, max: 120 }}
                    helperText="10-120 seconds"
                  />
                </Grid>
              )}

              {/* Drawing Game Specific */}
              {selectedGame === 'drawing-game' && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Max Guesses per Player"
                    type="number"
                    value={config.maxGuesses || 3}
                    onChange={(e) => handleConfigChange('maxGuesses', parseInt(e.target.value))}
                    inputProps={{ min: 1, max: 5 }}
                    helperText="1-5 guesses"
                  />
                </Grid>
              )}

              {/* Category Selection for Trivia */}
              {selectedGame === 'trivia-game' && (
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Trivia Categories
                  </Typography>
                  <FormGroup row>
                    {TRIVIA_CATEGORIES.map((category) => (
                      <FormControlLabel
                        key={category.id}
                        control={
                          <Checkbox
                            checked={config.categories?.includes(category.id) || false}
                            onChange={() => handleCategoryToggle(category.id)}
                          />
                        }
                        label={category.name}
                      />
                    ))}
                  </FormGroup>
                </Grid>
              )}

              {/* Category Selection for Music */}
              {selectedGame === 'music-game' && (
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Music Categories
                  </Typography>
                  <FormGroup row>
                    {MUSIC_CATEGORIES.map((category) => (
                      <FormControlLabel
                        key={category.id}
                        control={
                          <Checkbox
                            checked={config.categories?.includes(category.id) || false}
                            onChange={() => handleCategoryToggle(category.id)}
                          />
                        }
                        label={category.name}
                      />
                    ))}
                  </FormGroup>
                </Grid>
              )}
            </Grid>

            {/* Preview */}
            <Box sx={{ mt: 3, p: 2, backgroundColor: 'background.default', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Game Preview
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                <Chip label={`${config.maxRounds || 0} rounds`} size="small" />
                <Chip label={`${config.timePerRound || 0}s per round`} size="small" />
                {config.votingTime && (
                  <Chip label={`${config.votingTime}s voting`} size="small" />
                )}
                {config.categories && config.categories.length > 0 && (
                  <Chip label={`${config.categories.length} categories`} size="small" />
                )}
              </Box>
            </Box>
          </>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        <Button 
          onClick={handleCreate} 
          variant="contained"
          disabled={!selectedGame}
          sx={{
            backgroundColor: selectedGameType?.color,
            '&:hover': {
              backgroundColor: selectedGameType?.color + 'dd'
            }
          }}
        >
          Create Game
        </Button>
      </DialogActions>
    </Dialog>
  );
}
