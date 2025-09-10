const BaseGame = require('./BaseGame');

/**
 * Trivia Challenge Game
 * Players answer multiple choice questions across various categories
 */
class TriviaGame extends BaseGame {
  constructor(roomId, players, config = {}) {
    const defaultConfig = {
      maxRounds: 5,
      timePerRound: 30,
      categories: ['general', 'science', 'history', 'entertainment', 'sports'],
      pointsPerCorrect: 100,
      bonusForSpeed: true
    };
    
    super(roomId, players, { ...defaultConfig, ...config });
    
    this.questionBank = this.initializeQuestionBank();
    this.usedQuestions = new Set();
  }

  getGameType() {
    return 'trivia-game';
  }

  initializeQuestionBank() {
    return {
      general: [
        {
          question: "What is the capital of France?",
          options: ["London", "Berlin", "Paris", "Madrid"],
          correct: 2,
          difficulty: "easy"
        },
        {
          question: "Which planet is known as the Red Planet?",
          options: ["Venus", "Mars", "Jupiter", "Saturn"],
          correct: 1,
          difficulty: "easy"
        },
        {
          question: "What is the largest ocean on Earth?",
          options: ["Atlantic", "Indian", "Arctic", "Pacific"],
          correct: 3,
          difficulty: "medium"
        },
        {
          question: "In what year did World War II end?",
          options: ["1944", "1945", "1946", "1947"],
          correct: 1,
          difficulty: "medium"
        }
      ],
      science: [
        {
          question: "What is the chemical symbol for gold?",
          options: ["Go", "Gd", "Au", "Ag"],
          correct: 2,
          difficulty: "medium"
        },
        {
          question: "How many bones are in the adult human body?",
          options: ["206", "208", "210", "212"],
          correct: 0,
          difficulty: "hard"
        },
        {
          question: "What gas makes up about 78% of Earth's atmosphere?",
          options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Argon"],
          correct: 1,
          difficulty: "medium"
        }
      ],
      history: [
        {
          question: "Who was the first President of the United States?",
          options: ["Thomas Jefferson", "John Adams", "George Washington", "Benjamin Franklin"],
          correct: 2,
          difficulty: "easy"
        },
        {
          question: "In which year did the Berlin Wall fall?",
          options: ["1987", "1988", "1989", "1990"],
          correct: 2,
          difficulty: "medium"
        }
      ],
      entertainment: [
        {
          question: "Which movie won the Academy Award for Best Picture in 2020?",
          options: ["1917", "Joker", "Parasite", "Once Upon a Time in Hollywood"],
          correct: 2,
          difficulty: "medium"
        },
        {
          question: "Who composed 'The Four Seasons'?",
          options: ["Mozart", "Beethoven", "Vivaldi", "Bach"],
          correct: 2,
          difficulty: "medium"
        }
      ],
      sports: [
        {
          question: "How many players are on a basketball team on the court at one time?",
          options: ["4", "5", "6", "7"],
          correct: 1,
          difficulty: "easy"
        },
        {
          question: "Which country has won the most FIFA World Cups?",
          options: ["Germany", "Argentina", "Brazil", "Italy"],
          correct: 2,
          difficulty: "medium"
        }
      ]
    };
  }

  generatePrompt() {
    const availableCategories = this.config.categories;
    const category = availableCategories[Math.floor(Math.random() * availableCategories.length)];
    const questions = this.questionBank[category] || this.questionBank.general;
    
    // Filter out used questions
    const availableQuestions = questions.filter(q => !this.usedQuestions.has(q.question));
    
    if (availableQuestions.length === 0) {
      // Reset if all questions used
      this.usedQuestions.clear();
    }
    
    const question = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
    this.usedQuestions.add(question.question);
    
    this.state.currentQuestion = {
      ...question,
      category: category.charAt(0).toUpperCase() + category.slice(1),
      questionId: Date.now().toString()
    };
    
    return {
      type: 'trivia',
      question: question.question,
      options: question.options,
      category: this.state.currentQuestion.category,
      difficulty: question.difficulty,
      questionId: this.state.currentQuestion.questionId
    };
  }

  validateSubmission(submission) {
    if (!submission || typeof submission.answer !== 'number') {
      return false;
    }
    
    const { answer } = submission;
    return answer >= 0 && answer <= 3;
  }

  calculateScore(submission, votes) {
    if (!this.state.currentQuestion) return 0;
    
    const isCorrect = submission.content.answer === this.state.currentQuestion.correct;
    if (!isCorrect) return 0;
    
    let score = this.config.pointsPerCorrect;
    
    // Speed bonus - earlier submissions get more points
    if (this.config.bonusForSpeed) {
      const timeElapsed = this.config.timePerRound - this.state.timeLeft;
      const speedBonus = Math.max(0, 50 - (timeElapsed * 2));
      score += Math.floor(speedBonus);
    }
    
    return score;
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

    const submission = {
      id: Date.now().toString(),
      playerId,
      playerName: player.name,
      content: submissionData,
      timestamp: Date.now(),
      timeElapsed: this.config.timePerRound - this.state.timeLeft
    };

    this.state.submissions.push(submission);
    player.hasSubmitted = true;

    console.log(`📝 ${player.name} answered: ${submissionData.answer}`);

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
    
    // Calculate scores and show correct answer
    this.state.submissions.forEach(submission => {
      const player = this.state.players.find(p => p.id === submission.playerId);
      if (player) {
        const score = this.calculateScore(submission, 0);
        player.score += score;
        submission.score = score;
        submission.isCorrect = submission.content.answer === this.state.currentQuestion.correct;
      }
    });

    // Show results for 5 seconds, then continue
    setTimeout(() => {
      if (this.state.round >= this.state.maxRounds) {
        this.endGame();
      } else {
        this.nextRound();
      }
    }, 5000);

    console.log(`📊 Trivia round ${this.state.round} results shown`);
  }

  // Override handleTimeUp for trivia-specific behavior
  handleTimeUp() {
    clearInterval(this.timer);
    
    if (this.state.phase === 'playing') {
      this.showResults();
    }
  }

  // Trivia doesn't use voting phase
  startVotingPhase() {
    this.showResults();
  }

  handleVote(playerId, voteData) {
    throw new Error('Voting not supported in trivia game');
  }

  getState() {
    const baseState = super.getState();
    
    // Don't reveal correct answer until results phase
    if (this.state.phase === 'results' || this.state.phase === 'finished') {
      baseState.correctAnswer = this.state.currentQuestion?.correct;
      baseState.explanation = this.state.currentQuestion?.explanation;
    }
    
    return baseState;
  }
}

module.exports = TriviaGame;
