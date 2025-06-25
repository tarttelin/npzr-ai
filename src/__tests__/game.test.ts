import { createGameState, dealInitialHands, getCurrentPlayer, getOpponentPlayer, switchTurn, createStack, checkWinCondition } from '../game';
import { Character, GameState, Player } from '../types';

describe('Game Management', () => {
  describe('createGameState', () => {
    it('should create a valid initial game state', () => {
      const gameState = createGameState();
      
      expect(gameState.players).toHaveLength(2);
      expect(gameState.currentPlayer).toBe('player1');
      expect(gameState.stacks).toHaveLength(0);
      expect(gameState.pendingMoves).toBe(0);
      expect(gameState.gamePhase).toBe('playing');
      expect(gameState.winner).toBeUndefined();
    });

    it('should deal 5 cards to each player', () => {
      const gameState = createGameState();
      
      expect(gameState.players[0].hand).toHaveLength(5);
      expect(gameState.players[1].hand).toHaveLength(5);
    });

    it('should have a deck with remaining cards after dealing', () => {
      const gameState = createGameState();
      
      // 44 total cards - 10 dealt = 34 remaining
      expect(gameState.deck).toHaveLength(34);
    });

    it('should create players with empty scored characters', () => {
      const gameState = createGameState();
      
      expect(gameState.players[0].scoredCharacters.size).toBe(0);
      expect(gameState.players[1].scoredCharacters.size).toBe(0);
    });
  });

  describe('getCurrentPlayer and getOpponentPlayer', () => {
    let gameState: GameState;

    beforeEach(() => {
      gameState = createGameState();
    });

    it('should return correct current player', () => {
      const currentPlayer = getCurrentPlayer(gameState);
      expect(currentPlayer.id).toBe('player1');
    });

    it('should return correct opponent player', () => {
      const opponentPlayer = getOpponentPlayer(gameState);
      expect(opponentPlayer.id).toBe('player2');
    });

    it('should update correctly after switching turns', () => {
      switchTurn(gameState);
      
      const currentPlayer = getCurrentPlayer(gameState);
      const opponentPlayer = getOpponentPlayer(gameState);
      
      expect(currentPlayer.id).toBe('player2');
      expect(opponentPlayer.id).toBe('player1');
    });
  });

  describe('switchTurn', () => {
    it('should alternate between players', () => {
      const gameState = createGameState();
      
      expect(gameState.currentPlayer).toBe('player1');
      
      switchTurn(gameState);
      expect(gameState.currentPlayer).toBe('player2');
      
      switchTurn(gameState);
      expect(gameState.currentPlayer).toBe('player1');
    });
  });

  describe('createStack', () => {
    let gameState: GameState;

    beforeEach(() => {
      gameState = createGameState();
    });

    it('should create a stack with correct owner', () => {
      const stack = createStack(gameState, 'player1');
      
      expect(stack.owner).toBe('player1');
      expect(stack.id).toBeTruthy();
    });

    it('should add stack to game state', () => {
      const initialStackCount = gameState.stacks.length;
      createStack(gameState, 'player1');
      
      expect(gameState.stacks).toHaveLength(initialStackCount + 1);
    });

    it('should create stack with empty piles for all body parts', () => {
      const stack = createStack(gameState, 'player1');
      
      expect(stack.piles.head.cards).toHaveLength(0);
      expect(stack.piles.torso.cards).toHaveLength(0);
      expect(stack.piles.legs.cards).toHaveLength(0);
    });

    it('should assign unique IDs to multiple stacks', () => {
      const stack1 = createStack(gameState, 'player1');
      const stack2 = createStack(gameState, 'player2');
      
      expect(stack1.id).not.toBe(stack2.id);
    });
  });

  describe('checkWinCondition', () => {
    let player: Player;

    beforeEach(() => {
      player = {
        id: 'player1',
        hand: [],
        scoredCharacters: new Set()
      };
    });

    it('should return false for player with no scored characters', () => {
      expect(checkWinCondition(player)).toBe(false);
    });

    it('should return false for player with some but not all characters', () => {
      player.scoredCharacters.add(Character.Ninja);
      player.scoredCharacters.add(Character.Pirate);
      
      expect(checkWinCondition(player)).toBe(false);
    });

    it('should return true for player with all four characters', () => {
      player.scoredCharacters.add(Character.Ninja);
      player.scoredCharacters.add(Character.Pirate);
      player.scoredCharacters.add(Character.Zombie);
      player.scoredCharacters.add(Character.Robot);
      
      expect(checkWinCondition(player)).toBe(true);
    });

    it('should return true even if player scored some characters multiple times', () => {
      // Add all required characters
      player.scoredCharacters.add(Character.Ninja);
      player.scoredCharacters.add(Character.Pirate);
      player.scoredCharacters.add(Character.Zombie);
      player.scoredCharacters.add(Character.Robot);
      
      // Sets automatically handle duplicates, but the win condition should still work
      expect(checkWinCondition(player)).toBe(true);
    });
  });

  describe('dealInitialHands', () => {
    it('should deal specified number of cards to each player', () => {
      const gameState = createGameState();
      // Reset hands to test dealing
      gameState.players[0].hand = [];
      gameState.players[1].hand = [];
      
      // Add cards back to deck
      gameState.deck.push(...Array(20).fill(null).map((_, i) => ({
        id: `test_${i}`,
        type: 'regular' as any,
        isFastCard: false
      })));
      
      dealInitialHands(gameState);
      
      expect(gameState.players[0].hand).toHaveLength(5);
      expect(gameState.players[1].hand).toHaveLength(5);
    });
  });
});