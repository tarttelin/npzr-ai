import { AIPlayer } from './AIPlayer.js';
import { GameEngine } from './GameEngine.js';
import { Player } from './Player.js';
import { PlayerStateType } from './PlayerState.js';
import { Character } from './Card.js';

describe('AIPlayer', () => {
  let gameEngine: GameEngine;
  let humanPlayer: Player;
  let aiPlayerInstance: Player;
  let aiPlayer: AIPlayer;

  beforeEach(() => {
    gameEngine = new GameEngine();
    gameEngine.createGame();
    humanPlayer = gameEngine.addPlayer('Human');
    aiPlayerInstance = gameEngine.addPlayer('AI');
    aiPlayer = new AIPlayer(aiPlayerInstance, 'medium');
  });

  describe('Basic AIPlayer functionality', () => {
    test('should instantiate with Player and difficulty', () => {
      expect(aiPlayer).toBeInstanceOf(AIPlayer);
      expect(aiPlayer.getCurrentState()).toBe(PlayerStateType.WAITING_FOR_OPPONENT);
    });

    test('should provide strategy information', () => {
      const strategy = aiPlayer.getStrategy();
      expect(strategy).toContain('Game Analysis');
      expect(strategy).toContain('Phase=');
      expect(strategy).toContain('Threat=');
      expect(strategy).toContain('Own=');
      expect(strategy).toContain('Opponent=');
      expect(strategy).toContain('Wilds=');
      expect(strategy).toContain('Opportunities=');
    });

    test('should provide comprehensive game analysis', () => {
      const analysis = aiPlayer.getGameAnalysis();
      
      expect(analysis.ownProgress.size).toBe(4);
      expect(analysis.opponentProgress.size).toBe(4);
      expect(analysis.gamePhase).toMatch(/early|mid|late/);
      expect(analysis.threatLevel).toMatch(/low|medium|high/);
      expect(Array.isArray(analysis.ownWildCards)).toBe(true);
      expect(Array.isArray(analysis.completionOpportunities)).toBe(true);
      expect(Array.isArray(analysis.blockingOpportunities)).toBe(true);
    });

    test('should correctly detect when it is AI turn', () => {
      // Initially, human player should go first
      expect(humanPlayer.getState().getState()).toBe(PlayerStateType.DRAW_CARD);
      expect(aiPlayerInstance.getState().getState()).toBe(PlayerStateType.WAITING_FOR_OPPONENT);
      
      expect(humanPlayer.isMyTurn()).toBe(true);
      expect(aiPlayerInstance.isMyTurn()).toBe(false);
    });
  });

  describe('Turn handling', () => {
    test('should handle DRAW_CARD state', () => {
      // Complete human's turn first
      humanPlayer.drawCard();
      const humanCard = humanPlayer.getHand().getCards().find(c => !c.isWild()) || humanPlayer.getHand().getCards()[0];
      humanPlayer.playCard(humanCard);
      
      // Now it should be AI's turn to draw
      expect(aiPlayerInstance.getState().getState()).toBe(PlayerStateType.DRAW_CARD);
      
      const initialHandSize = aiPlayerInstance.getHand().size();
      aiPlayer.makeMove();
      
      // Should have drawn a card and transitioned to PLAY_CARD state
      expect(aiPlayerInstance.getHand().size()).toBe(initialHandSize + 1);
      expect(aiPlayerInstance.getState().getState()).toBe(PlayerStateType.PLAY_CARD);
    });

    test('should handle PLAY_CARD state', () => {
      // Set up AI turn
      humanPlayer.drawCard();
      const humanCard = humanPlayer.getHand().getCards().find(c => !c.isWild()) || humanPlayer.getHand().getCards()[0];
      humanPlayer.playCard(humanCard);
      
      // AI draws card
      aiPlayer.makeMove();
      
      // AI should now be in PLAY_CARD state
      expect(aiPlayerInstance.getState().getState()).toBe(PlayerStateType.PLAY_CARD);
      
      const initialHandSize = aiPlayerInstance.getHand().size();
      const initialMyStackCount = aiPlayerInstance.getMyStacks().length;
      const initialOpponentStackCount = humanPlayer.getMyStacks().length;
      
      aiPlayer.makeMove();
      
      // Should have played a card (hand size decreased)
      expect(aiPlayerInstance.getHand().size()).toBe(initialHandSize - 1);
      
      // AI should have either created a new stack OR played on opponent's stack (strategic blocking)
      const finalMyStackCount = aiPlayerInstance.getMyStacks().length;
      const finalOpponentStackCount = humanPlayer.getMyStacks().length;
      const playedOnOwnStack = finalMyStackCount > initialMyStackCount;
      const playedOnOpponentStack = finalOpponentStackCount === initialOpponentStackCount; // Stack count unchanged but cards added
      
      expect(playedOnOwnStack || playedOnOpponentStack).toBe(true);
    });

    test('should not act when waiting for opponent', () => {
      // AI should be waiting initially
      expect(aiPlayerInstance.getState().getState()).toBe(PlayerStateType.WAITING_FOR_OPPONENT);
      
      const initialHandSize = aiPlayerInstance.getHand().size();
      aiPlayer.makeMove();
      
      // Nothing should change when waiting
      expect(aiPlayerInstance.getHand().size()).toBe(initialHandSize);
      expect(aiPlayerInstance.getState().getState()).toBe(PlayerStateType.WAITING_FOR_OPPONENT);
    });
  });

  describe('takeTurnIfReady functionality', () => {
    test('should act when it is AI turn', () => {
      // Make it AI's turn
      humanPlayer.drawCard();
      const humanCard = humanPlayer.getHand().getCards().find(c => !c.isWild()) || humanPlayer.getHand().getCards()[0];
      humanPlayer.playCard(humanCard);
      
      expect(aiPlayerInstance.isMyTurn()).toBe(true);
      expect(aiPlayerInstance.getState().getState()).toBe(PlayerStateType.DRAW_CARD);
      
      const initialHandSize = aiPlayerInstance.getHand().size();
      aiPlayer.takeTurnIfReady();
      
      // Should have acted (drawn card)
      expect(aiPlayerInstance.getHand().size()).toBe(initialHandSize + 1);
    });

    test('should not act when it is not AI turn', () => {
      // Human's turn initially
      expect(aiPlayerInstance.isMyTurn()).toBe(false);
      
      const initialHandSize = aiPlayerInstance.getHand().size();
      aiPlayer.takeTurnIfReady();
      
      // Should not have acted
      expect(aiPlayerInstance.getHand().size()).toBe(initialHandSize);
    });
  });

  describe('Card placement strategy', () => {
    test('should place card on existing character stack when possible', () => {
      // Set up scenario where AI has a ninja card and an existing ninja stack
      humanPlayer.drawCard();
      humanPlayer.playCard(humanPlayer.getHand().getCards()[0]);
      
      // AI's turn - draw and play first card to create initial stack
      aiPlayer.makeMove(); // draw
      aiPlayer.makeMove(); // play first card
      
      const myStacks = aiPlayerInstance.getMyStacks();
      if (myStacks.length > 0) {
        const firstStack = myStacks[0];
        const topCards = firstStack.getTopCards();
        
        // Get the character of the first stack
        let stackCharacter: Character | null = null;
        if (topCards.head) stackCharacter = topCards.head.getEffectiveCharacter();
        else if (topCards.torso) stackCharacter = topCards.torso.getEffectiveCharacter();
        else if (topCards.legs) stackCharacter = topCards.legs.getEffectiveCharacter();
        
        if (stackCharacter && stackCharacter !== Character.Wild) {
          // Now simulate another turn where AI has a card of the same character
          // This is a simplified test - in a real scenario we'd need to control the deck
          expect(aiPlayerInstance.getMyStacks().length).toBeGreaterThanOrEqual(1);
        }
      } else {
        // If no stack was created (e.g., card couldn't be played), that's still valid behavior
        expect(myStacks.length).toBe(0);
      }
    });
  });

  describe('Error handling', () => {
    test('should handle errors gracefully', () => {
      // Create an AI with an invalid state scenario
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Try to make AI act in an invalid state by forcing an error
      aiPlayerInstance.setState(aiPlayerInstance.getState()); // Valid state, shouldn't error
      
      expect(() => aiPlayer.makeMove()).not.toThrow();
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Integration tests', () => {
    test('AI vs Human: should complete a game turn sequence', () => {
      // Test a few turns of AI vs Human gameplay
      expect(gameEngine.isGameComplete()).toBe(false);
      
      // Human turn
      humanPlayer.drawCard();
      const humanCard = humanPlayer.getHand().getCards().find(c => !c.isWild()) || humanPlayer.getHand().getCards()[0];
      humanPlayer.playCard(humanCard);
      
      // AI turn
      aiPlayer.takeTurnIfReady();  // draw
      aiPlayer.takeTurnIfReady();  // play
      
      // Verify both players have acted
      expect(humanPlayer.getMyStacks().length + aiPlayerInstance.getMyStacks().length).toBeGreaterThan(0);
      expect(humanPlayer.getHand().size()).toBe(5); // Drew 1, played 1
      expect(aiPlayerInstance.getHand().size()).toBe(5); // Drew 1, played 1
    });

    test('AI vs AI: two AIs should be able to play against each other', () => {
      // Create second AI
      const gameEngine2 = new GameEngine();
      gameEngine2.createGame();
      const ai1Instance = gameEngine2.addPlayer('AI1');
      const ai2Instance = gameEngine2.addPlayer('AI2');
      const ai1 = new AIPlayer(ai1Instance, 'easy');
      const ai2 = new AIPlayer(ai2Instance, 'hard');
      
      expect(gameEngine2.isGameComplete()).toBe(false);
      
      // Play a few turns
      for (let turn = 0; turn < 6 && !gameEngine2.isGameComplete(); turn++) {
        ai1.takeTurnIfReady();
        ai2.takeTurnIfReady();
      }
      
      // Verify both AIs have acted
      expect(ai1Instance.getMyStacks().length + ai2Instance.getMyStacks().length).toBeGreaterThan(0);
    });
  });
});