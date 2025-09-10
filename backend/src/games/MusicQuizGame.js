const BaseGame = require('./BaseGame');

/**
 * Music Quiz Game
 * Players identify songs, artists, and music-related trivia
 */
class MusicQuizGame extends BaseGame {
  constructor(roomId, players, config = {}) {
    const defaultConfig = {
      maxRounds: 6,
      timePerRound: 20,
      pointsPerCorrect: 100,
      bonusForSpeed: true,
      categories: ['pop', 'rock', 'classic', 'soundtrack', 'mixed']
    };
    
    super(roomId, players, { ...defaultConfig, ...config });
    
    this.musicBank = this.initializeMusicBank();
    this.usedTracks = new Set();
  }

  getGameType() {
    return 'music-game';
  }

  initializeMusicBank() {
    return {
      pop: [
        {
          artist: "Britney Spears",
          song: "...Baby One More Time",
          year: 1998,
          album: "...Baby One More Time",
          difficulty: "easy",
          hints: ["90s pop icon", "Debut single", "School uniform music video"]
        },
        {
          artist: "Backstreet Boys",
          song: "I Want It That Way",
          year: 1999,
          album: "Millennium",
          difficulty: "easy",
          hints: ["Boy band classic", "Tell me why", "Late 90s hit"]
        },
        {
          artist: "Eminem",
          song: "Lose Yourself",
          year: 2002,
          album: "8 Mile Soundtrack",
          difficulty: "medium",
          hints: ["Movie soundtrack", "One shot", "Academy Award winner"]
        },
        {
          artist: "OutKast",
          song: "Hey Ya!",
          year: 2003,
          album: "Speakerboxxx/The Love Below",
          difficulty: "easy",
          hints: ["Shake it like a Polaroid", "Andre 3000", "Early 2000s dance hit"]
        },
        {
          artist: "Gnarls Barkley",
          song: "Crazy",
          year: 2006,
          album: "St. Elsewhere",
          difficulty: "medium",
          hints: ["CeeLo Green", "Does that make me crazy", "Soul/funk revival"]
        },
        {
          artist: "Lady Gaga",
          song: "Bad Romance",
          year: 2009,
          album: "The Fame Monster",
          difficulty: "easy",
          hints: ["Ra ra ah-ah-ah", "Pop art fashion", "Late 2000s dance-pop"]
        },
        {
          artist: "Adele",
          song: "Rolling in the Deep",
          year: 2010,
          album: "21",
          difficulty: "easy",
          hints: ["Soulful ballad", "British singer", "Grammy sweep"]
        },
        {
          artist: "Gotye",
          song: "Somebody That I Used to Know",
          year: 2011,
          album: "Making Mirrors",
          difficulty: "medium",
          hints: ["Featuring Kimbra", "Australian artist", "Indie pop hit"]
        },
        {
          artist: "Pharrell Williams",
          song: "Happy",
          year: 2013,
          album: "Despicable Me 2 Soundtrack",
          difficulty: "easy",
          hints: ["Clap along", "Movie soundtrack", "Feel-good anthem"]
        },
        {
          artist: "Taylor Swift",
          song: "Shake It Off",
          year: 2014,
          album: "1989",
          difficulty: "easy",
          hints: ["Pop transition", "Haters gonna hate", "Country to pop"]
        },
        {
          artist: "Ed Sheeran",
          song: "Shape of You",
          year: 2017,
          album: "÷ (Divide)",
          difficulty: "easy",
          hints: ["British singer-songwriter", "Dancehall influence", "Body-positive"]
        },
        {
          artist: "Billie Eilish",
          song: "Bad Guy",
          year: 2019,
          album: "When We All Fall Asleep, Where Do We Go?",
          difficulty: "medium",
          hints: ["Whispered vocals", "Dark pop", "Grammy winner"]
        }
      ],
      rock: [
        {
          artist: "Queen",
          song: "Bohemian Rhapsody",
          year: 1975,
          album: "A Night at the Opera",
          difficulty: "easy",
          hints: ["6-minute epic", "Opera section", "Freddie Mercury"]
        },
        {
          artist: "Led Zeppelin",
          song: "Stairway to Heaven",
          year: 1971,
          album: "Led Zeppelin IV",
          difficulty: "medium",
          hints: ["8-minute journey", "Acoustic to electric", "Rock classic"]
        },
        {
          artist: "Nirvana",
          song: "Smells Like Teen Spirit",
          year: 1991,
          album: "Nevermind",
          difficulty: "medium",
          hints: ["Grunge anthem", "Kurt Cobain", "90s alternative"]
        }
      ],
      classic: [
        {
          artist: "The Beatles",
          song: "Hey Jude",
          year: 1968,
          album: "Single",
          difficulty: "easy",
          hints: ["Na na na ending", "Paul McCartney", "7-minute ballad"]
        },
        {
          artist: "Elvis Presley",
          song: "Can't Help Falling in Love",
          year: 1961,
          album: "Blue Hawaii",
          difficulty: "easy",
          hints: ["Wedding favorite", "The King", "Hawaiian movie"]
        },
        {
          artist: "Bob Dylan",
          song: "Like a Rolling Stone",
          year: 1965,
          album: "Highway 61 Revisited",
          difficulty: "hard",
          hints: ["Folk rock pioneer", "6-minute epic", "How does it feel?"]
        }
      ],
      soundtrack: [
        {
          artist: "Whitney Houston",
          song: "I Will Always Love You",
          year: 1992,
          album: "The Bodyguard Soundtrack",
          difficulty: "easy",
          hints: ["Movie ballad", "Dolly Parton cover", "Powerful vocals"]
        },
        {
          artist: "Celine Dion",
          song: "My Heart Will Go On",
          year: 1997,
          album: "Titanic Soundtrack",
          difficulty: "easy",
          hints: ["Ship movie", "Love theme", "Flute opening"]
        },
        {
          artist: "Eminem",
          song: "Lose Yourself",
          year: 2002,
          album: "8 Mile Soundtrack",
          difficulty: "medium",
          hints: ["Rap movie", "One shot", "Mom's spaghetti"]
        }
      ]
    };
  }

  generatePrompt() {
    const availableCategories = this.config.categories.filter(cat => cat !== 'mixed');
    const category = this.config.categories.includes('mixed') && Math.random() < 0.3 
      ? availableCategories[Math.floor(Math.random() * availableCategories.length)]
      : availableCategories[Math.floor(Math.random() * availableCategories.length)];
    
    const tracks = this.musicBank[category] || this.musicBank.pop;
    const availableTracks = tracks.filter(t => !this.usedTracks.has(`${t.artist}-${t.song}`));
    
    if (availableTracks.length === 0) {
      this.usedTracks.clear();
    }
    
    const track = availableTracks[Math.floor(Math.random() * availableTracks.length)];
    this.usedTracks.add(`${track.artist}-${track.song}`);
    
    // Randomly choose question type
    const questionTypes = ['artist', 'song', 'year', 'album'];
    const questionType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
    
    this.state.currentTrack = {
      ...track,
      category: category.charAt(0).toUpperCase() + category.slice(1),
      questionType,
      trackId: Date.now().toString()
    };
    
    return this.generateQuestion(track, questionType, category);
  }

  generateQuestion(track, questionType, category) {
    const basePrompt = {
      category,
      difficulty: track.difficulty,
      hints: track.hints || []
    };

    // Generate multiple choice options
    const generateOptions = (correctAnswer, type) => {
      const allTracks = Object.values(this.musicBank).flat();
      let wrongOptions = [];
      
      switch (type) {
        case 'artist':
          wrongOptions = [...new Set(allTracks.map(t => t.artist))].filter(a => a !== correctAnswer);
          break;
        case 'song':
          wrongOptions = [...new Set(allTracks.map(t => t.song))].filter(s => s !== correctAnswer);
          break;
        case 'year':
          const years = [...new Set(allTracks.map(t => t.year.toString()))].filter(y => y !== correctAnswer);
          wrongOptions = years;
          break;
        case 'album':
          wrongOptions = [...new Set(allTracks.map(t => t.album))].filter(a => a !== correctAnswer);
          break;
      }
      
      // Shuffle and take 3 wrong options
      const shuffled = wrongOptions.sort(() => Math.random() - 0.5).slice(0, 3);
      const options = [correctAnswer, ...shuffled].sort(() => Math.random() - 0.5);
      
      return options;
    };

    switch (questionType) {
      case 'artist':
        return {
          ...basePrompt,
          question: `Who performed "${track.song}"?`,
          correctAnswer: track.artist,
          questionType: 'artist',
          options: generateOptions(track.artist, 'artist')
        };
      
      case 'song':
        return {
          ...basePrompt,
          question: `What song is this by ${track.artist}?`,
          correctAnswer: track.song,
          questionType: 'song',
          options: generateOptions(track.song, 'song')
        };
      
      case 'year':
        return {
          ...basePrompt,
          question: `When was "${track.song}" by ${track.artist} released?`,
          correctAnswer: track.year.toString(),
          questionType: 'year',
          options: generateOptions(track.year.toString(), 'year')
        };
      
      case 'album':
        return {
          ...basePrompt,
          question: `Which album features "${track.song}" by ${track.artist}?`,
          correctAnswer: track.album,
          questionType: 'album',
          options: generateOptions(track.album, 'album')
        };
      
      default:
        return this.generateQuestion(track, 'artist', category);
    }
  }

  validateSubmission(submission) {
    if (!submission || !submission.answer || typeof submission.answer !== 'string') {
      return false;
    }
    
    return submission.answer.trim().length > 0;
  }

  calculateScore(submission, votes) {
    if (!this.state.currentTrack || !submission.isCorrect) return 0;
    
    let score = this.config.pointsPerCorrect;
    
    // Difficulty bonus
    const difficultyMultiplier = {
      'easy': 1.0,
      'medium': 1.2,
      'hard': 1.5
    };
    score *= difficultyMultiplier[this.state.currentTrack.difficulty] || 1.0;
    
    // Speed bonus
    if (this.config.bonusForSpeed) {
      const timeElapsed = this.config.timePerRound - this.state.timeLeft;
      const speedBonus = Math.max(0, 50 - (timeElapsed * 3));
      score += Math.floor(speedBonus);
    }
    
    return Math.floor(score);
  }

  isAnswerCorrect(playerAnswer, correctAnswer, questionType) {
    // For multiple choice, exact match is required
    return playerAnswer === correctAnswer;
  }

  cleanAnswer(answer) {
    return answer
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\b(the|a|an|and|or|but|in|on|at|to|for|of|with|by)\b/g, '') // Remove common words
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
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

  handleSubmission(playerId, submissionData) {
    const player = this.state.players.find(p => p.id === playerId);
    
    if (this.state.phase !== 'playing') {
      throw new Error('Not in submission phase');
    }
    
    if (player.hasSubmitted) {
      throw new Error('Player has already submitted');
    }

    if (!this.validateSubmission(submissionData)) {
      throw new Error('Invalid submission');
    }

    const isCorrect = this.isAnswerCorrect(
      submissionData.answer,
      this.state.currentPrompt.correctAnswer,
      this.state.currentPrompt.questionType
    );

    const submission = {
      id: Date.now().toString(),
      playerId,
      playerName: player.name,
      content: submissionData,
      timestamp: Date.now(),
      timeElapsed: this.config.timePerRound - this.state.timeLeft,
      isCorrect
    };

    this.state.submissions.push(submission);
    player.hasSubmitted = true;

    console.log(`🎵 ${player.name} answered: ${submissionData.answer} (${isCorrect ? 'Correct!' : 'Wrong'})`);

    // Check if all players have submitted
    const activePlayers = this.state.players.filter(p => p.connected && !p.isBot);
    const allSubmitted = activePlayers.every(p => p.hasSubmitted);
    
    if (allSubmitted) {
      clearInterval(this.timer);
      this.showResults();
    }

    return {
      success: true,
      gameState: this.getState(),
      broadcast: true
    };
  }

  showResults() {
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

    console.log(`🎵 Music round ${this.state.round} results shown`);

    // Initialize ready tracking for this round
    this.state.playersReady = [];

    // Show results for 30 seconds, then continue
    this.state.timeLeft = 30;
    this.resultsTimer = setInterval(() => {
      this.state.timeLeft--;
      
      // Broadcast timer updates during results phase
      if (this.broadcastUpdate) {
        this.broadcastUpdate();
      }
      
      if (this.state.timeLeft <= 0) {
        clearInterval(this.resultsTimer);
        if (this.state.round >= this.state.maxRounds) {
          this.endGame();
        } else {
          this.nextRound();
        }
      }
    }, 1000);
  }

  // Override handleTimeUp for music-specific behavior
  handleTimeUp() {
    clearInterval(this.timer);
    this.showResults();
  }

  // Override nextRound to reset ready state
  nextRound() {
    // Clear any existing timers
    if (this.resultsTimer) {
      clearInterval(this.resultsTimer);
    }
    
    // Reset ready state
    this.state.playersReady = [];
    
    // Call parent nextRound
    super.nextRound();
  }

  // Music quiz doesn't use voting phase
  startVotingPhase() {
    this.showResults();
  }

  handleVote(playerId, voteData) {
    throw new Error('Voting not supported in music quiz game');
  }

  // Handle game actions
  handleAction(playerId, action, actionData) {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    switch (action) {
      case 'submit-answer':
        if (actionData.answer === 'ready') {
          return this.handlePlayerReady(playerId);
        }
        return this.handleSubmission(playerId, { answer: actionData.answer });
      default:
        return super.handleAction(playerId, action, actionData);
    }
  }

  handlePlayerReady(playerId) {
    if (this.state.phase !== 'results') {
      throw new Error('Can only mark ready during results phase');
    }

    if (!this.state.playersReady.includes(playerId)) {
      this.state.playersReady.push(playerId);
      console.log(`🎵 Player ${playerId} ready for next round (${this.state.playersReady.length}/${this.state.players.length})`);
      
      // If all players are ready, advance immediately
      if (this.state.playersReady.length >= this.state.players.length) {
        console.log(`🎵 All players ready, advancing to next round`);
        clearInterval(this.resultsTimer);
        if (this.state.round >= this.state.maxRounds) {
          this.endGame();
        } else {
          this.nextRound();
        }
      }
    }

    return { 
      success: true,
      gameState: this.getState(),
      broadcast: true
    };
  }

  getState() {
    const baseState = super.getState();
    
    // Don't reveal correct answer until results phase
    if (this.state.phase === 'results' || this.state.phase === 'finished') {
      baseState.correctAnswer = this.state.currentPrompt?.correctAnswer;
      baseState.questionType = this.state.currentPrompt?.questionType;
      baseState.trackInfo = this.state.currentTrack;
    }
    
    return baseState;
  }
}

module.exports = MusicQuizGame;
