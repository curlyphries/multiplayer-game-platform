const { v4: uuidv4 } = require('uuid');

class BotManager {
  constructor() {
    this.botNames = [
      'CodeBot', 'GameMaster', 'QuipBot', 'WittyAI', 'JokeBot',
      'CleverBot', 'PunBot', 'SnarkBot', 'ChatterBot', 'BanterBot'
    ];
    
    this.wordGameResponses = {
      "The worst possible superhero name": [
        "Captain Obvious", "The Procrastinator", "Mild Mannered Man", 
        "Doctor Awkward", "Super Sleepy", "The Complainer"
      ],
      "What aliens would think about humans after watching reality TV": [
        "They worship drama", "They're obsessed with dating", "They love public humiliation",
        "They can't cook", "They argue about everything", "They cry a lot"
      ],
      "A terrible name for a restaurant": [
        "Food Poisoning Palace", "The Greasy Spoon", "Burnt Offerings",
        "Questionable Cuisine", "The Soggy Bottom", "Expired Eats"
      ],
      "The most useless invention ever": [
        "Solar-powered flashlight", "Waterproof tea bag", "Inflatable dart board",
        "Screen door on a submarine", "Ejector seat in a helicopter", "Chocolate teapot"
      ],
      "What your pet really thinks about you": [
        "You're my personal servant", "You're terrible at hunting", "You talk too much",
        "You need more naps", "You're obsessed with that glowing rectangle", "You smell weird"
      ],
      "A bad excuse for being late to work": [
        "My alarm clock is shy", "I got lost in my own house", "Traffic was moving too fast",
        "I was abducted by productivity", "My coffee wasn't ready", "I forgot how to drive"
      ],
      "The worst possible dating profile bio": [
        "I collect toenail clippings", "Still live with my 47 cats", "Professional couch warmer",
        "I only speak in movie quotes", "Looking for someone to do my laundry", "I'm basically a human potato"
      ],
      "What happens in the afterlife waiting room": [
        "Eternal elevator music", "Forms to fill out in triplicate", "Magazine from 1987",
        "Uncomfortable plastic chairs", "Number system that never works", "Vending machine that eats quarters"
      ]
    };
  }

  createBot(roomId) {
    const availableNames = this.botNames.filter(name => 
      !this.isBotNameTaken(roomId, name)
    );
    
    if (availableNames.length === 0) {
      throw new Error('No available bot names');
    }

    const botName = availableNames[Math.floor(Math.random() * availableNames.length)];
    
    return {
      id: `bot_${uuidv4()}`,
      name: botName,
      isBot: true,
      connected: true,
      roomId: roomId,
      score: 0,
      ready: true
    };
  }

  isBotNameTaken(roomId, name) {
    // This would check against the room's current players
    // Implementation depends on how room data is accessed
    return false;
  }

  generateBotResponse(prompt, difficulty = 'medium') {
    const responses = this.wordGameResponses[prompt];
    if (!responses) {
      return this.generateGenericResponse(prompt);
    }

    // Add some randomness and variation
    const baseResponse = responses[Math.floor(Math.random() * responses.length)];
    
    if (difficulty === 'easy') {
      return baseResponse;
    } else if (difficulty === 'hard') {
      return this.addCreativeVariation(baseResponse);
    }
    
    // Medium difficulty - sometimes add variation
    return Math.random() > 0.5 ? baseResponse : this.addCreativeVariation(baseResponse);
  }

  addCreativeVariation(response) {
    const variations = [
      `${response} 2.0`,
      `${response} (Premium Edition)`,
      `${response} - The Sequel`,
      `${response} But Worse`,
      `${response}: The Musical`,
      `${response} (Now With 50% More Disappointment)`
    ];
    
    return variations[Math.floor(Math.random() * variations.length)];
  }

  generateGenericResponse(prompt) {
    const genericResponses = [
      "Something completely random",
      "The answer nobody expected",
      "A mysterious response",
      "Bot.exe has stopped working",
      "Error 404: Creativity not found",
      "I'm just here for the points"
    ];
    
    return genericResponses[Math.floor(Math.random() * genericResponses.length)];
  }

  simulateBotVoting(submissions, botId) {
    // Filter out bot's own submission
    const votableSubmissions = submissions.filter(s => s.playerId !== botId);
    
    if (votableSubmissions.length === 0) {
      return null;
    }

    // Add some intelligence - prefer shorter, funnier responses
    const weightedSubmissions = votableSubmissions.map(submission => ({
      ...submission,
      weight: this.calculateVoteWeight(submission.answer)
    }));

    // Sort by weight and add randomness
    weightedSubmissions.sort((a, b) => b.weight - a.weight);
    
    // Pick from top 50% with some randomness
    const topHalf = weightedSubmissions.slice(0, Math.ceil(weightedSubmissions.length / 2));
    return topHalf[Math.floor(Math.random() * topHalf.length)].id;
  }

  calculateVoteWeight(answer) {
    let weight = Math.random() * 10; // Base randomness
    
    // Prefer shorter answers (easier to read)
    if (answer.length < 50) weight += 2;
    if (answer.length < 30) weight += 1;
    
    // Prefer answers with certain keywords
    const funnyWords = ['terrible', 'awful', 'disaster', 'epic', 'ultimate', 'supreme'];
    funnyWords.forEach(word => {
      if (answer.toLowerCase().includes(word)) weight += 1;
    });
    
    return weight;
  }

  getBotActionDelay(action) {
    // Simulate human-like response times
    const delays = {
      'submit': Math.random() * 30000 + 10000, // 10-40 seconds
      'vote': Math.random() * 15000 + 5000,    // 5-20 seconds
    };
    
    return delays[action] || 5000;
  }
}

module.exports = BotManager;
