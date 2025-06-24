import { NPZRGameEngine } from '../engine';
import { Character, BodyPart, CardType } from '../types';

describe('NPZRGameEngine', () => {
  let engine: NPZRGameEngine;

  beforeEach(() => {
    engine = new NPZRGameEngine();
  });

  describe('Initialization', () => {
    it('should create a new game with valid initial state', () => {
      const gameState = engine.getGameState();
      
      expect(gameState.currentPlayer).toBe('player1');
      expect(gameState.gamePhase).toBe('playing');
      expect(gameState.pendingMoves).toBe(0);
      expect(gameState.winner).toBeUndefined();
      expect(engine.isGameFinished()).toBe(false);
    });

    it('should deal cards to both players', () => {
      const player1Hand = engine.getPlayerHand('player1');
      const player2Hand = engine.getPlayerHand('player2');
      
      expect(player1Hand).toHaveLength(5);
      expect(player2Hand).toHaveLength(5);
    });

    it('should have correct deck size after dealing', () => {
      expect(engine.getDeckSize()).toBe(34); // 44 - 10 dealt
    });
  });

  describe('Game State Validation', () => {
    it('should validate a fresh game state', () => {
      const validation = engine.validateGameState();
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('Player Management', () => {
    it('should return correct current player', () => {
      expect(engine.getCurrentPlayer()).toBe('player1');
    });

    it('should return player hands', () => {
      const hand1 = engine.getPlayerHand('player1');
      const hand2 = engine.getPlayerHand('player2');
      
      expect(Array.isArray(hand1)).toBe(true);
      expect(Array.isArray(hand2)).toBe(true);
      expect(hand1.length).toBe(5);
      expect(hand2.length).toBe(5);
    });

    it('should return empty sets for initial player scores', () => {
      const score1 = engine.getPlayerScore('player1');
      const score2 = engine.getPlayerScore('player2');
      
      expect(score1.size).toBe(0);
      expect(score2.size).toBe(0);
    });

    it('should return empty array for invalid player', () => {
      const invalidHand = engine.getPlayerHand('invalid' as any);
      expect(invalidHand).toHaveLength(0);
    });
  });

  describe('Card Drawing', () => {
    it('should draw a card from the deck', () => {
      const initialDeckSize = engine.getDeckSize();
      const initialHandSize = engine.getPlayerHand('player1').length;
      
      const drawnCard = engine.drawCard();
      
      expect(drawnCard).toBeTruthy();
      expect(engine.getDeckSize()).toBe(initialDeckSize - 1);
      expect(engine.getPlayerHand('player1')).toHaveLength(initialHandSize + 1);
    });

    it('should return null when game is finished', () => {
      // Manually set game as finished for testing
      const gameState = engine.getGameStateForTesting();
      gameState.gamePhase = 'finished';
      gameState.winner = 'player1';
      
      const drawnCard = engine.drawCard();
      expect(drawnCard).toBeNull();
    });
  });

  describe('Wild Card Management', () => {
    it('should nominate wild cards correctly', () => {
      // Create a wild card for testing
      const wildCard: any = {
        id: 'test_wild',
        type: CardType.WildUniversal,
        isFastCard: true
      };
      
      const success = engine.nominateWildCard(wildCard, {
        character: Character.Ninja,
        bodyPart: BodyPart.Head
      });
      
      expect(success).toBe(true);
      expect(wildCard.nomination).toEqual({
        character: Character.Ninja,
        bodyPart: BodyPart.Head
      });
    });

    it('should reject nomination of regular cards', () => {
      const regularCard = {
        id: 'test_regular',
        type: CardType.Regular,
        character: Character.Ninja,
        bodyPart: BodyPart.Head,
        isFastCard: false
      };
      
      const success = engine.nominateWildCard(regularCard, {
        character: Character.Pirate,
        bodyPart: BodyPart.Torso
      });
      
      expect(success).toBe(false);
    });
  });

  describe('Game Stacks', () => {
    it('should start with no stacks', () => {
      const stacks = engine.getStacks();
      expect(stacks).toHaveLength(0);
    });
  });

  describe('Utility Methods', () => {
    it('should reset game to initial state', () => {
      // Make some changes to the game
      engine.drawCard();
      
      engine.reset();
      
      expect(engine.getCurrentPlayer()).toBe('player1');
      expect(engine.getDeckSize()).toBe(34); // Back to initial state
      expect(engine.isGameFinished()).toBe(false);
    });

    it('should clone game engine with independent state', () => {
      const originalDeckSize = engine.getDeckSize();
      
      const clonedEngine = engine.clone();
      
      // Modify original
      engine.drawCard();
      
      // Clone should be unaffected
      expect(clonedEngine.getDeckSize()).toBe(originalDeckSize);
      expect(engine.getDeckSize()).toBe(originalDeckSize - 1);
    });

    it('should properly clone player scored characters sets', () => {
      const gameState = engine.getGameStateForTesting();
      gameState.players[0].scoredCharacters.add(Character.Ninja);
      
      const clonedEngine = engine.clone();
      const clonedGameState = clonedEngine.getGameStateForTesting();
      
      // Modify original
      gameState.players[0].scoredCharacters.add(Character.Pirate);
      
      // Clone should be unaffected
      expect(clonedGameState.players[0].scoredCharacters.size).toBe(1);
      expect(clonedGameState.players[0].scoredCharacters.has(Character.Ninja)).toBe(true);
      expect(clonedGameState.players[0].scoredCharacters.has(Character.Pirate)).toBe(false);
    });
  });

  describe('Game Completion', () => {
    it('should detect when game is not finished initially', () => {
      expect(engine.isGameFinished()).toBe(false);
      expect(engine.getWinner()).toBeUndefined();
    });

    it('should prevent actions when game is finished', () => {
      // Manually set game as finished
      const gameState = engine.getGameStateForTesting();
      gameState.gamePhase = 'finished';
      gameState.winner = 'player1';
      
      expect(engine.isGameFinished()).toBe(true);
      expect(engine.getWinner()).toBe('player1');
      
      // Should not be able to draw cards
      const drawnCard = engine.drawCard();
      expect(drawnCard).toBeNull();
    });
  });

  describe('Pending Moves', () => {
    it('should start with no pending moves', () => {
      expect(engine.getPendingMoves()).toBe(0);
    });

    it('should prevent moves when no pending moves available', () => {
      const moveAction = {
        cardId: 'test',
        fromStackId: 'stack1',
        fromPile: BodyPart.Head,
        toStackId: 'stack2',
        toPile: BodyPart.Torso
      };
      
      const success = engine.executeMove(moveAction);
      expect(success).toBe(false);
    });
  });
});