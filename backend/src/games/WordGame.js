const { v4: uuidv4 } = require('uuid');

class WordGame {
  constructor(roomId, players) {
    this.roomId = roomId;
    this.players = players.map(p => ({
      ...p,
      score: 0,
      submissions: [],
      votes: []
    }));
    
    this.state = {
      phase: 'waiting', // waiting, submitting, voting, results, finished
      round: 0,
      maxRounds: 3,
      currentPrompt: null,
      submissions: [],
      votes: [],
      results: [],
      timeLeft: 0,
      winner: null
    };
    
    this.prompts = [
      "The worst possible superhero name",
      "What aliens would think about humans after watching reality TV",
      "A terrible name for a restaurant",
      "The most useless invention ever",
      "What your pet really thinks about you",
      "A bad excuse for being late to work",
      "The worst possible dating profile bio",
      "What happens in the afterlife waiting room"
    ];
    
    this.timers = new Map();
    this.onStateUpdate = null; // Callback for broadcasting state updates
  }

  getState() {
    return {
      ...this.state,
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        score: p.score,
        hasSubmitted: this.hasPlayerSubmitted(p.id),
        hasVoted: this.hasPlayerVoted(p.id)
      }))
    };
  }

  handleAction(playerId, action, data) {
    switch (action) {
      case 'submit-answer':
        return this.handleSubmission(playerId, data.answer);
      case 'vote':
        return this.handleVote(playerId, data.submissionId);
      case 'next-round':
        return this.nextRound();
      case 'restart-game':
        return this.restart();
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  start() {
    this.state.phase = 'submitting';
    this.state.round = 1;
    this.state.currentPrompt = this.getRandomPrompt();
    this.state.timeLeft = 60; // 60 seconds to submit
    
    this.startTimer('submission', 60, () => {
      this.endSubmissionPhase();
    });
    
    return {
      broadcast: true,
      gameState: this.getState(),
      gameEnded: false
    };
  }

  handleSubmission(playerId, answer) {
    console.log(`🎯 handleSubmission called: playerId=${playerId}, answer="${answer}"`);
    
    if (this.state.phase !== 'submitting') {
      throw new Error('Not in submission phase');
    }
    
    if (this.hasPlayerSubmitted(playerId)) {
      throw new Error('Already submitted');
    }
    
    if (!answer || answer.trim().length === 0) {
      throw new Error('Answer cannot be empty');
    }
    
    const submission = {
      id: uuidv4(),
      playerId,
      answer: answer.trim(),
      votes: 0,
      voters: []
    };
    
    this.state.submissions.push(submission);
    console.log(`📝 Submission added. Total submissions: ${this.state.submissions.length}`);
    
    // Check if all players have submitted
    const connectedPlayers = this.players.filter(p => p.connected !== false);
    console.log(`👥 Connected players: ${connectedPlayers.length}, Submissions: ${this.state.submissions.length}`);
    
    if (this.state.submissions.length >= connectedPlayers.length) {
      console.log(`✅ All players submitted! Ending submission phase...`);
      const result = this.endSubmissionPhase();
      console.log(`🔄 endSubmissionPhase result:`, result);
      return result;
    }
    
    return {
      broadcast: true,
      gameState: this.getState(),
      gameEnded: false
    };
  }

  handleVote(playerId, submissionId) {
    if (this.state.phase !== 'voting') {
      throw new Error('Not in voting phase');
    }
    
    if (this.hasPlayerVoted(playerId)) {
      throw new Error('Already voted');
    }
    
    const submission = this.state.submissions.find(s => s.id === submissionId);
    if (!submission) {
      throw new Error('Submission not found');
    }
    
    if (submission.playerId === playerId) {
      throw new Error('Cannot vote for your own submission');
    }
    
    // Add vote
    submission.votes++;
    submission.voters.push(playerId);
    
    // Check if all players have voted
    const eligibleVoters = this.players.filter(p => 
      p.connected !== false && 
      !this.state.submissions.some(s => s.playerId === p.id)
    );
    
    const totalVotes = this.state.submissions.reduce((sum, s) => sum + s.votes, 0);
    if (totalVotes >= eligibleVoters.length) {
      this.endVotingPhase();
    }
    
    return {
      broadcast: true,
      gameState: this.getState(),
      gameEnded: false
    };
  }

  endSubmissionPhase() {
    console.log(`🏁 endSubmissionPhase called`);
    this.clearTimer('submission');
    
    if (this.state.submissions.length === 0) {
      console.log(`⚠️ No submissions, skipping to next round`);
      // No submissions, skip to next round
      return this.nextRound();
    }
    
    console.log(`🗳️ Transitioning to voting phase with ${this.state.submissions.length} submissions`);
    this.state.phase = 'voting';
    this.state.timeLeft = 45; // 45 seconds to vote
    
    // Shuffle submissions for voting
    this.state.submissions = this.shuffleArray(this.state.submissions);
    
    this.startTimer('voting', 45, () => {
      this.endVotingPhase();
    });
    
    // Broadcast the phase change immediately
    if (this.onStateUpdate) {
      console.log(`📡 Broadcasting voting phase change`);
      this.onStateUpdate({
        broadcast: true,
        gameState: this.getState(),
        gameEnded: false
      });
    } else {
      console.log(`⚠️ No onStateUpdate callback available in endSubmissionPhase`);
    }
    
    return {
      broadcast: true,
      gameState: this.getState(),
      gameEnded: false
    };
  }

  endVotingPhase() {
    this.clearTimer('voting');
    
    // Calculate scores
    this.state.submissions.forEach(submission => {
      const player = this.players.find(p => p.id === submission.playerId);
      if (player) {
        player.score += submission.votes;
      }
    });
    
    // Prepare results
    this.state.results = this.state.submissions
      .sort((a, b) => b.votes - a.votes)
      .map(s => ({
        ...s,
        playerName: this.players.find(p => p.id === s.playerId)?.name || 'Unknown'
      }));
    
    this.state.phase = 'results';
    this.state.timeLeft = 15; // 15 seconds to view results
    
    this.startTimer('results', 15, () => {
      this.nextRound();
    });
    
    // Broadcast the phase change immediately
    if (this.onStateUpdate) {
      this.onStateUpdate({
        broadcast: true,
        gameState: this.getState(),
        gameEnded: false
      });
    }
    
    return {
      broadcast: true,
      gameState: this.getState(),
      gameEnded: false
    };
  }

  nextRound() {
    this.clearAllTimers();
    
    if (this.state.round >= this.state.maxRounds) {
      return this.endGame();
    }
    
    // Reset for next round
    this.state.round++;
    this.state.phase = 'submitting';
    this.state.currentPrompt = this.getRandomPrompt();
    this.state.submissions = [];
    this.state.votes = [];
    this.state.results = [];
    this.state.timeLeft = 60;
    
    this.startTimer('submission', 60, () => {
      this.endSubmissionPhase();
    });
    
    // Broadcast the new round immediately
    if (this.onStateUpdate) {
      this.onStateUpdate({
        broadcast: true,
        gameState: this.getState(),
        gameEnded: false
      });
    }
    
    return {
      broadcast: true,
      gameState: this.getState(),
      gameEnded: false
    };
  }

  endGame() {
    this.clearAllTimers();
    
    // Determine winner
    const sortedPlayers = [...this.players].sort((a, b) => b.score - a.score);
    this.state.winner = sortedPlayers[0];
    this.state.phase = 'finished';
    
    return {
      broadcast: true,
      gameState: this.getState(),
      gameEnded: true
    };
  }

  restart() {
    console.log(`🔄 Restarting game for room ${this.roomId}`);
    this.clearAllTimers();
    
    // Reset all player scores
    this.players.forEach(p => {
      p.score = 0;
      p.submissions = [];
      p.votes = [];
    });
    
    // Reset game state to waiting (not submitting)
    this.state = {
      phase: 'waiting',
      round: 0,
      maxRounds: 3,
      currentPrompt: null,
      submissions: [],
      votes: [],
      results: [],
      timeLeft: 0,
      winner: null
    };
    
    // Broadcast the restart immediately
    if (this.onStateUpdate) {
      this.onStateUpdate({
        broadcast: true,
        gameState: this.getState(),
        gameEnded: false
      });
    }
    
    return {
      broadcast: true,
      gameState: this.getState(),
      gameEnded: false
    };
  }

  hasPlayerSubmitted(playerId) {
    return this.state.submissions.some(s => s.playerId === playerId);
  }

  hasPlayerVoted(playerId) {
    return this.state.submissions.some(s => s.voters.includes(playerId));
  }

  getRandomPrompt() {
    const availablePrompts = this.prompts.filter(p => p !== this.state.currentPrompt);
    return availablePrompts[Math.floor(Math.random() * availablePrompts.length)];
  }

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  startTimer(name, seconds, callback) {
    this.clearTimer(name);
    console.log(`⏰ Starting timer "${name}" for ${seconds} seconds`);
    
    const timer = setInterval(() => {
      this.state.timeLeft--;
      console.log(`⏱️ Timer "${name}" tick: ${this.state.timeLeft}s remaining`);
      
      // Broadcast timer updates every second
      if (this.onStateUpdate) {
        this.onStateUpdate({
          broadcast: true,
          gameState: this.getState(),
          gameEnded: false
        });
      } else {
        console.log(`⚠️ No onStateUpdate callback set for timer "${name}"`);
      }
      
      if (this.state.timeLeft <= 0) {
        console.log(`⏰ Timer "${name}" expired, calling callback`);
        this.clearTimer(name);
        callback();
      }
    }, 1000);
    
    this.timers.set(name, timer);
    console.log(`✅ Timer "${name}" started successfully`);
  }

  clearTimer(name) {
    const timer = this.timers.get(name);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(name);
    }
  }

  clearAllTimers() {
    this.timers.forEach(timer => clearInterval(timer));
    this.timers.clear();
  }

  end() {
    this.clearAllTimers();
  }
}

module.exports = WordGame;
