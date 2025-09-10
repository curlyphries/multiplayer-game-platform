const BaseGame = require('./BaseGame');

/**
 * Drawing Game
 * Players draw prompts and others guess what was drawn
 */
class DrawingGame extends BaseGame {
  constructor(roomId, players, config = {}) {
    const defaultConfig = {
      maxRounds: 4,
      timePerRound: 90,
      votingTime: 30,
      pointsForCorrectGuess: 100,
      pointsForArtist: 50,
      maxGuesses: 3
    };
    
    super(roomId, players, { ...defaultConfig, ...config });
    
    this.drawingPrompts = this.initializePrompts();
    this.usedPrompts = new Set();
    this.currentArtist = null;
    this.currentDrawing = null;
  }

  getGameType() {
    return 'drawing-game';
  }

  start() {
    console.log(`🎮 Starting ${this.getGameType()} for room ${this.roomId}`);
    this.state.phase = 'drawing';
    this.nextRound();
    return {
      success: true,
      gameState: this.getState(),
      broadcast: true
    };
  }

  nextRound() {
    this.state.round++;
    this.state.phase = 'drawing';
    this.state.submissions = [];
    this.state.currentPrompt = this.generatePrompt();
    this.state.timeLeft = this.config.timePerRound;
    
    // Reset player states
    this.state.players.forEach(player => {
      player.hasSubmitted = false;
      player.hasVoted = false;
      player.hasGuessedCorrectly = false;
    });

    this.startTimer();
    console.log(`🎨 Drawing Round ${this.state.round}: ${this.state.currentPrompt.text} (Artist: ${this.currentArtist.name})`);
  }

  initializePrompts() {
    return [
      // Easy prompts
      { text: "Cat", difficulty: "easy", category: "animals" },
      { text: "House", difficulty: "easy", category: "objects" },
      { text: "Tree", difficulty: "easy", category: "nature" },
      { text: "Car", difficulty: "easy", category: "vehicles" },
      { text: "Sun", difficulty: "easy", category: "nature" },
      { text: "Fish", difficulty: "easy", category: "animals" },
      { text: "Book", difficulty: "easy", category: "objects" },
      { text: "Flower", difficulty: "easy", category: "nature" },
      
      // Medium prompts
      { text: "Bicycle", difficulty: "medium", category: "vehicles" },
      { text: "Elephant", difficulty: "medium", category: "animals" },
      { text: "Pizza", difficulty: "medium", category: "food" },
      { text: "Guitar", difficulty: "medium", category: "objects" },
      { text: "Butterfly", difficulty: "medium", category: "animals" },
      { text: "Castle", difficulty: "medium", category: "buildings" },
      { text: "Rocket", difficulty: "medium", category: "vehicles" },
      { text: "Umbrella", difficulty: "medium", category: "objects" },
      
      // Hard prompts
      { text: "Microscope", difficulty: "hard", category: "objects" },
      { text: "Octopus", difficulty: "hard", category: "animals" },
      { text: "Windmill", difficulty: "hard", category: "buildings" },
      { text: "Saxophone", difficulty: "hard", category: "objects" },
      { text: "Lighthouse", difficulty: "hard", category: "buildings" },
      { text: "Chameleon", difficulty: "hard", category: "animals" },
      
      // Abstract/Action prompts
      { text: "Running", difficulty: "medium", category: "actions" },
      { text: "Sleeping", difficulty: "easy", category: "actions" },
      { text: "Dancing", difficulty: "medium", category: "actions" },
      { text: "Thinking", difficulty: "hard", category: "actions" },
      { text: "Happiness", difficulty: "hard", category: "emotions" },
      { text: "Surprise", difficulty: "medium", category: "emotions" }
    ];
  }

  generatePrompt() {
    // Select artist for this round (rotate through players)
    const activePlayers = this.state.players.filter(p => p.connected && !p.isBot);
    const artistIndex = (this.state.round - 1) % activePlayers.length;
    this.currentArtist = activePlayers[artistIndex];
    
    // Get available prompts
    const availablePrompts = this.drawingPrompts.filter(p => !this.usedPrompts.has(p.text));
    
    if (availablePrompts.length === 0) {
      this.usedPrompts.clear(); // Reset if all used
    }
    
    const prompt = availablePrompts[Math.floor(Math.random() * availablePrompts.length)];
    this.usedPrompts.add(prompt.text);
    
    this.state.currentPrompt = {
      ...prompt,
      artistId: this.currentArtist.id,
      artistName: this.currentArtist.name,
      promptId: Date.now().toString()
    };
    
    return {
      type: 'drawing',
      text: prompt.text,
      difficulty: prompt.difficulty,
      category: prompt.category,
      artistId: this.currentArtist.id,
      artistName: this.currentArtist.name,
      promptId: this.state.currentPrompt.promptId
    };
  }

  validateSubmission(submission) {
    if (!submission || !submission.type) {
      return false;
    }
    
    if (submission.type === 'drawing') {
      return submission.drawingData && typeof submission.drawingData === 'string';
    }
    
    if (submission.type === 'guess') {
      return submission.guess && typeof submission.guess === 'string' && submission.guess.trim().length > 0;
    }
    
    return false;
  }

  calculateScore(submission, votes) {
    if (submission.type === 'drawing') {
      // Artist gets points based on how many correct guesses
      const correctGuesses = this.state.submissions.filter(s => 
        s.type === 'guess' && s.isCorrect
      ).length;
      return correctGuesses * this.config.pointsForArtist;
    }
    
    if (submission.type === 'guess' && submission.isCorrect) {
      // Guessers get points for correct guesses
      // Earlier guesses get more points
      const guessOrder = submission.guessOrder || 1;
      const basePoints = this.config.pointsForCorrectGuess;
      const speedBonus = Math.max(0, basePoints - ((guessOrder - 1) * 20));
      return speedBonus;
    }
    
    return 0;
  }

  handleSubmission(playerId, submissionData) {
    const player = this.state.players.find(p => p.id === playerId);
    
    if (this.state.phase !== 'drawing' && this.state.phase !== 'guessing') {
      throw new Error('Not in submission phase');
    }

    if (!this.validateSubmission(submissionData)) {
      throw new Error('Invalid submission');
    }

    if (submissionData.type === 'drawing') {
      // Only the artist can submit drawings
      if (playerId !== this.currentArtist.id) {
        throw new Error('Only the artist can submit drawings');
      }
      
      if (player.hasSubmitted) {
        throw new Error('Drawing already submitted');
      }
      
      this.currentDrawing = {
        id: Date.now().toString(),
        playerId,
        playerName: player.name,
        content: submissionData,
        timestamp: Date.now(),
        type: 'drawing'
      };
      
      this.state.submissions.push(this.currentDrawing);
      player.hasSubmitted = true;
      
      // Transition to guessing phase when artist submits drawing
      this.state.phase = 'guessing';
      this.state.timeLeft = this.config.timePerRound; // Reset timer for guessing
      
      console.log(`🎨 ${player.name} submitted drawing, transitioning to guessing phase`);
      
    } else if (submissionData.type === 'guess') {
      // Only non-artists can guess
      if (playerId === this.currentArtist.id) {
        throw new Error('Artist cannot guess their own drawing');
      }
      
      // Check if player has already made maximum guesses
      const playerGuesses = this.state.submissions.filter(s => 
        s.playerId === playerId && s.type === 'guess'
      );
      
      if (playerGuesses.length >= this.config.maxGuesses) {
        throw new Error('Maximum guesses reached');
      }
      
      // Guesses start as pending artist approval
      const guessOrder = this.state.submissions.filter(s => s.type === 'guess').length + 1;
      
      const submission = {
        id: Date.now().toString(),
        playerId,
        playerName: player.name,
        content: submissionData,
        timestamp: Date.now(),
        type: 'guess',
        isCorrect: false, // Will be set by artist approval
        isPending: true,  // Awaiting artist approval
        guessOrder
      };
      
      this.state.submissions.push(submission);
      
      console.log(`🤔 ${player.name} guessed: ${submissionData.guess} (awaiting artist approval)`);
    }

    // Check if round should end
    this.checkRoundEnd();

    return {
      success: true,
      gameState: this.getState(),
      broadcast: true
    };
  }

  isGuessCorrect(guess) {
    if (!this.state.currentPrompt) return false;
    
    const correctAnswer = this.state.currentPrompt.text.toLowerCase();
    const playerGuess = guess.toLowerCase().trim();
    
    // Exact match
    if (playerGuess === correctAnswer) return true;
    
    // Close match (allow for minor spelling errors)
    if (this.calculateSimilarity(playerGuess, correctAnswer) > 0.8) return true;
    
    // Check for partial matches on longer words
    if (correctAnswer.length > 4 && playerGuess.includes(correctAnswer)) return true;
    if (correctAnswer.length > 4 && correctAnswer.includes(playerGuess)) return true;
    
    return false;
  }

  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  checkRoundEnd() {
    const activePlayers = this.state.players.filter(p => p.connected && !p.isBot);
    const guessingPlayers = activePlayers.filter(p => p.id !== this.currentArtist.id);
    
    // End if at least one player has guessed correctly
    const someoneGuessedCorrectly = guessingPlayers.some(p => p.hasGuessedCorrectly);
    
    if (someoneGuessedCorrectly && guessingPlayers.length > 0) {
      clearInterval(this.timer);
      this.endRound();
    }
  }

  handleGuessApproval(artistId, actionData) {
    // Only the current artist can approve guesses
    if (artistId !== this.currentArtist.id) {
      throw new Error('Only the artist can approve guesses');
    }

    const { guessId, approved } = actionData;
    const submission = this.state.submissions.find(s => s.id === guessId);
    
    if (!submission || submission.type !== 'guess') {
      throw new Error('Guess not found');
    }

    if (!submission.isPending) {
      throw new Error('Guess already processed');
    }

    // Update submission status
    submission.isPending = false;
    submission.isCorrect = approved;
    
    const player = this.state.players.find(p => p.id === submission.playerId);
    if (player && approved) {
      player.hasGuessedCorrectly = true;
    }

    console.log(`🎨 Artist ${approved ? 'approved' : 'rejected'} guess: ${submission.content.guess}`);

    // Check if round should end after approval
    this.checkRoundEnd();

    return {
      success: true,
      gameState: this.getState(),
      broadcast: true
    };
  }

  endRound() {
    this.state.phase = 'results';
    
    // Calculate scores
    this.state.submissions.forEach(submission => {
      const player = this.state.players.find(p => p.id === submission.playerId);
      if (player) {
        const score = this.calculateScore(submission, 0);
        player.score += score;
        submission.score = score;
      }
    });

    // Reset player states
    this.state.players.forEach(player => {
      player.hasGuessedCorrectly = false;
    });

    console.log(`🎨 Drawing round ${this.state.round} ended`);

    // Show results for 8 seconds, then continue
    setTimeout(() => {
      if (this.state.round >= this.state.maxRounds) {
        this.endGame();
      } else {
        this.nextRound();
      }
    }, 8000);
  }

  // Override handleTimeUp for drawing-specific behavior
  handleTimeUp() {
    clearInterval(this.timer);
    this.endRound();
  }

  // Override handleAction to support drawing-specific actions
  handleAction(playerId, action, actionData) {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    switch (action) {
      case 'submit-drawing':
        return this.handleSubmission(playerId, { type: 'drawing', drawingData: actionData.drawing });
      case 'submit-guess':
        return this.handleSubmission(playerId, { type: 'guess', guess: actionData.guess });
      case 'approve-guess':
        return this.handleGuessApproval(playerId, actionData);
      case 'next-round':
        return this.handleNextRound(playerId);
      default:
        // Fall back to base class for other actions
        return super.handleAction(playerId, action, actionData);
    }
  }

  // Drawing game doesn't use traditional voting
  startVotingPhase() {
    this.endRound();
  }

  handleVote(playerId, voteData) {
    throw new Error('Traditional voting not supported in drawing game');
  }

  getState() {
    const baseState = super.getState();
    
    // Add drawing-specific state
    baseState.currentArtist = this.currentArtist;
    baseState.currentDrawing = this.currentDrawing?.content?.drawingData || null;
    baseState.currentPrompt = this.state.currentPrompt?.text;
    baseState.totalRounds = this.state.maxRounds;
    baseState.currentRound = this.state.round;
    
    // Only reveal answer in results phase
    if (this.state.phase === 'results' || this.state.phase === 'finished') {
      baseState.correctAnswer = this.state.currentPrompt?.text;
    }
    
    // Filter submissions for display
    baseState.drawings = this.state.submissions.filter(s => s.type === 'drawing');
    baseState.guesses = this.state.submissions.filter(s => s.type === 'guess').map(g => ({
      playerId: g.playerId,
      playerName: g.playerName,
      guess: g.content.guess,
      correct: g.isCorrect || false,
      timestamp: g.timestamp
    }));
    
    // Add scores object for easy access
    baseState.scores = {};
    this.state.players.forEach(player => {
      baseState.scores[player.id] = player.score || 0;
    });
    
    return baseState;
  }
}

module.exports = DrawingGame;
