/**
 * Base Game Class - Interface for all game types
 * Provides common functionality and enforces consistent API
 */
class BaseGame {
  constructor(roomId, players, config = {}) {
    this.roomId = roomId;
    this.players = players;
    this.config = {
      maxRounds: 3,
      timePerRound: 60,
      ...config
    };
    
    this.state = {
      phase: 'waiting', // waiting, playing, voting, results, finished
      round: 0,
      maxRounds: this.config.maxRounds,
      timeLeft: 0,
      players: this.initializePlayers(),
      submissions: [],
      currentPrompt: null,
      winner: null,
      gameType: this.getGameType()
    };
    
    this.timer = null;
    this.phaseStartTime = null;
  }

  // Abstract methods - must be implemented by subclasses
  getGameType() {
    throw new Error('getGameType() must be implemented by subclass');
  }

  generatePrompt() {
    throw new Error('generatePrompt() must be implemented by subclass');
  }

  validateSubmission(submission) {
    throw new Error('validateSubmission() must be implemented by subclass');
  }

  calculateScore(submission, votes) {
    throw new Error('calculateScore() must be implemented by subclass');
  }

  // Common game flow methods
  initializePlayers() {
    return this.players.map(player => ({
      ...player,
      score: 0,
      ready: false,
      hasSubmitted: false,
      hasVoted: false
    }));
  }

  start() {
    console.log(`🎮 Starting ${this.getGameType()} for room ${this.roomId}`);
    this.state.phase = 'playing';
    this.nextRound();
    return {
      success: true,
      gameState: this.getState(),
      broadcast: true
    };
  }

  nextRound() {
    this.state.round++;
    this.state.phase = 'playing';
    this.state.submissions = [];
    this.state.currentPrompt = this.generatePrompt();
    this.state.timeLeft = this.config.timePerRound;
    
    // Reset player states
    this.state.players.forEach(player => {
      player.hasSubmitted = false;
      player.hasVoted = false;
    });

    this.startTimer();
    console.log(`📝 Round ${this.state.round}: ${this.state.currentPrompt}`);
  }

  startTimer() {
    if (this.timer) {
      clearInterval(this.timer);
    }

    this.phaseStartTime = Date.now();
    this.timer = setInterval(() => {
      this.state.timeLeft--;
      
      // Broadcast timer updates to frontend
      if (this.broadcastUpdate) {
        this.broadcastUpdate();
      }
      
      if (this.state.timeLeft <= 0) {
        this.handleTimeUp();
      }
    }, 1000);
  }

  handleTimeUp() {
    clearInterval(this.timer);
    
    if (this.state.phase === 'playing') {
      this.startVotingPhase();
    } else if (this.state.phase === 'voting') {
      this.endRound();
    }
  }

  startVotingPhase() {
    if (this.state.submissions.length === 0) {
      // No submissions, skip to next round or end game
      if (this.state.round >= this.state.maxRounds) {
        this.endGame();
      } else {
        this.nextRound();
      }
      return;
    }

    this.state.phase = 'voting';
    this.state.timeLeft = 30; // 30 seconds for voting
    this.startTimer();
    console.log(`🗳️ Voting phase started for round ${this.state.round}`);
  }

  handleAction(playerId, action, actionData) {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    switch (action) {
      case 'submit':
        return this.handleSubmission(playerId, actionData);
      case 'vote':
        return this.handleVote(playerId, actionData);
      case 'next-round':
        return this.handleNextRound(playerId);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
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
      content: submissionData.content,
      timestamp: Date.now(),
      votes: 0,
      voters: []
    };

    this.state.submissions.push(submission);
    player.hasSubmitted = true;

    console.log(`📝 ${player.name} submitted: ${submissionData.content}`);

    // Check if all players have submitted
    const activePlayers = this.state.players.filter(p => p.connected && !p.isBot);
    const allSubmitted = activePlayers.every(p => p.hasSubmitted);
    
    if (allSubmitted) {
      clearInterval(this.timer);
      this.startVotingPhase();
    }

    return {
      success: true,
      gameState: this.getState(),
      broadcast: true
    };
  }

  handleVote(playerId, voteData) {
    const player = this.state.players.find(p => p.id === playerId);
    
    if (this.state.phase !== 'voting') {
      throw new Error('Not in voting phase');
    }
    
    if (player.hasVoted) {
      throw new Error('Player has already voted');
    }

    const submission = this.state.submissions.find(s => s.id === voteData.submissionId);
    if (!submission) {
      throw new Error('Submission not found');
    }

    if (submission.playerId === playerId) {
      throw new Error('Cannot vote for your own submission');
    }

    submission.votes++;
    submission.voters.push(playerId);
    player.hasVoted = true;

    console.log(`🗳️ ${player.name} voted for ${submission.playerName}'s submission`);

    // Check if all players have voted
    const activePlayers = this.state.players.filter(p => p.connected && !p.isBot);
    const allVoted = activePlayers.every(p => p.hasVoted || this.state.submissions.some(s => s.playerId === p.id));
    
    if (allVoted) {
      clearInterval(this.timer);
      this.endRound();
    }

    return {
      success: true,
      gameState: this.getState(),
      broadcast: true
    };
  }

  handleNextRound(playerId) {
    // Only host can advance rounds
    const room = require('../managers/RoomManager').getRoom?.(this.roomId);
    if (!room || room.host !== playerId) {
      throw new Error('Only host can advance rounds');
    }

    if (this.state.round >= this.state.maxRounds) {
      this.endGame();
    } else {
      this.nextRound();
    }

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
        const score = this.calculateScore(submission, submission.votes);
        player.score += score;
      }
    });

    console.log(`📊 Round ${this.state.round} ended`);

    // Check if game should end
    setTimeout(() => {
      if (this.state.round >= this.state.maxRounds) {
        this.endGame();
      }
    }, 5000); // 5 second delay to show results
  }

  endGame() {
    this.state.phase = 'finished';
    
    // Find winner
    const sortedPlayers = [...this.state.players].sort((a, b) => b.score - a.score);
    this.state.winner = sortedPlayers[0];
    
    if (this.timer) {
      clearInterval(this.timer);
    }

    console.log(`🏆 ${this.getGameType()} ended! Winner: ${this.state.winner?.name}`);

    return {
      success: true,
      gameState: this.getState(),
      broadcast: true,
      gameEnded: true
    };
  }

  getState() {
    return {
      ...this.state,
      timeLeft: Math.max(0, this.state.timeLeft)
    };
  }

  cleanup() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    console.log(`🧹 Cleaned up ${this.getGameType()} for room ${this.roomId}`);
  }
}

module.exports = BaseGame;
