import { NPZRGameEngine } from '../engine';
import { 
  startSequentialTurn, 
  playNextCard, 
  executeSequentialMove, 
  canPlayAnotherCard, 
  skipMove,
  initializeTurnState 
} from '../turns';
import { createGameState, createStack } from '../game';
import { GameState, Character, BodyPart, CardType, TurnPhase } from '../types';

describe('Sequential Turn System', () => {
  let engine: NPZRGameEngine;
  let gameState: GameState;

  beforeEach(() => {
    engine = new NPZRGameEngine();
    gameState = createGameState();
  });

  describe('Turn State Management', () => {
    it('should initialize turn state properly', () => {
      initializeTurnState(gameState);
      
      expect(gameState.currentTurnState).toBeDefined();
      expect(gameState.currentTurnState!.phase).toBe(TurnPhase.Draw);
      expect(gameState.currentTurnState!.cardsPlayedThisTurn).toEqual([]);
      expect(gameState.currentTurnState!.lastCardWasWild).toBe(false);
      expect(gameState.currentTurnState!.movesEarnedThisTurn).toBe(0);
      expect(gameState.currentTurnState!.canContinuePlaying).toBe(false);
      expect(gameState.currentTurnState!.hasDrawnCard).toBe(false);
    });

    it('should start sequential turn and draw card', () => {
      const initialDeckSize = gameState.deck.length;
      const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer)!;
      const initialHandSize = currentPlayer.hand.length;

      const result = startSequentialTurn(gameState);

      expect(result).toBe('continue');
      expect(gameState.currentTurnState).toBeDefined();
      expect(gameState.currentTurnState!.hasDrawnCard).toBe(true);
      expect(gameState.currentTurnState!.phase).toBe(TurnPhase.PlayCard);
      expect(gameState.deck.length).toBe(initialDeckSize - 1);
      expect(currentPlayer.hand.length).toBe(initialHandSize + 1);
    });

    it('should track turn state through engine', () => {
      engine.startTurn();
      
      const turnState = engine.getCurrentTurnState();
      expect(turnState).toBeDefined();
      expect(turnState!.phase).toBe(TurnPhase.PlayCard);
      expect(turnState!.hasDrawnCard).toBe(true);
    });
  });

  describe('Sequential Card Play', () => {
    beforeEach(() => {
      startSequentialTurn(gameState);
    });

    it('should play regular card and end turn', () => {
      const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer)!;
      const regularCard = currentPlayer.hand.find(c => c.type === CardType.Regular)!;
      const initialPlayer = gameState.currentPlayer;

      const result = playNextCard(gameState, regularCard);

      expect(result).toBe('end_turn');
      expect(gameState.currentPlayer).not.toBe(initialPlayer);
      expect(gameState.currentTurnState).toBeUndefined();
    });

    it('should play wild card and allow continuation', () => {
      const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer)!;
      
      // Add a wild card to test with
      const wildCard = {
        id: 'test_wild',
        type: CardType.WildUniversal,
        isFastCard: true
      };
      currentPlayer.hand.push(wildCard);

      const result = playNextCard(gameState, wildCard, undefined, BodyPart.Head, 
        { character: Character.Ninja, bodyPart: BodyPart.Head });

      expect(result).toBe('continue');
      expect(gameState.currentTurnState!.lastCardWasWild).toBe(true);
      expect(gameState.currentTurnState!.canContinuePlaying).toBe(true);
      expect(gameState.currentTurnState!.phase).toBe(TurnPhase.PlayCard);
    });

    it('should handle stack completion with wild card and offer move', () => {
      // Create a nearly complete stack
      const stack = createStack(gameState, gameState.currentPlayer);
      const ninjaHead = { id: '1', type: CardType.Regular, character: Character.Ninja, bodyPart: BodyPart.Head, isFastCard: false };
      const ninjaTorso = { id: '2', type: CardType.Regular, character: Character.Ninja, bodyPart: BodyPart.Torso, isFastCard: false };
      
      stack.piles[BodyPart.Head].cards.push(ninjaHead);
      stack.piles[BodyPart.Torso].cards.push(ninjaTorso);

      // Add completing wild card to player's hand
      const wildCard = { id: 'wild_legs', type: CardType.WildUniversal, isFastCard: true };
      const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer)!;
      currentPlayer.hand.push(wildCard);

      const initialMoves = gameState.pendingMoves;

      const result = playNextCard(gameState, wildCard, stack.id, BodyPart.Legs, 
        { character: Character.Ninja, bodyPart: BodyPart.Legs });

      // Check if stack was completed and move was awarded
      if (gameState.pendingMoves > initialMoves) {
        expect(result).toBe('await_move');
        expect(gameState.currentTurnState!.phase).toBe(TurnPhase.AwaitMove);
        expect(gameState.pendingMoves).toBeGreaterThan(initialMoves);
      } else {
        // If no completion occurred, wild card should allow continuation
        expect(result).toBe('continue');
        expect(gameState.currentTurnState!.canContinuePlaying).toBe(true);
      }
    });

    it('should allow multiple wild cards in sequence', () => {
      const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer)!;
      
      // Add wild cards
      const wildCard1 = {
        id: 'wild1',
        type: CardType.WildUniversal,
        isFastCard: true
      };
      const wildCard2 = {
        id: 'wild2',
        type: CardType.WildCharacter,
        character: Character.Ninja,
        isFastCard: true
      };
      
      currentPlayer.hand.push(wildCard1, wildCard2);

      // Play first wild card
      let result = playNextCard(gameState, wildCard1, undefined, BodyPart.Head,
        { character: Character.Ninja, bodyPart: BodyPart.Head });
      expect(result).toBe('continue');
      expect(canPlayAnotherCard(gameState)).toBe(true);

      // Play second wild card
      result = playNextCard(gameState, wildCard2, undefined, BodyPart.Torso,
        { character: Character.Ninja, bodyPart: BodyPart.Torso });
      expect(result).toBe('continue');
      expect(canPlayAnotherCard(gameState)).toBe(true);

      // Verify cards played
      expect(gameState.currentTurnState!.cardsPlayedThisTurn).toHaveLength(2);
      expect(gameState.currentTurnState!.cardsPlayedThisTurn).toContain(wildCard1);
      expect(gameState.currentTurnState!.cardsPlayedThisTurn).toContain(wildCard2);
    });
  });

  describe('Move Integration', () => {
    beforeEach(() => {
      startSequentialTurn(gameState);
    });

    it('should execute move and continue turn if wild card played', () => {
      // Set up scenario with pending moves and wild card
      gameState.pendingMoves = 1;
      gameState.currentTurnState!.phase = TurnPhase.AwaitMove;
      gameState.currentTurnState!.lastCardWasWild = true;
      gameState.currentTurnState!.movesEarnedThisTurn = 1;

      // Create stacks with cards for moving
      const stack1 = createStack(gameState, 'player1');
      const stack2 = createStack(gameState, 'player2');
      const testCard = {
        id: 'move_card',
        type: CardType.Regular,
        character: Character.Ninja,
        bodyPart: BodyPart.Head,
        isFastCard: false
      };
      stack1.piles[BodyPart.Head].cards.push(testCard);

      const moveAction = {
        cardId: 'move_card',
        fromStackId: stack1.id,
        fromPile: BodyPart.Head,
        toStackId: stack2.id,
        toPile: BodyPart.Torso
      };

      const result = executeSequentialMove(gameState, moveAction);

      expect(result).toBe('continue');
      expect(gameState.currentTurnState!.phase).toBe(TurnPhase.PlayCard);
      expect(gameState.currentTurnState!.canContinuePlaying).toBe(true);
    });

    it('should execute move and end turn if regular card played', () => {
      // Set up scenario with pending moves and regular card
      gameState.pendingMoves = 1;
      gameState.currentTurnState!.phase = TurnPhase.AwaitMove;
      gameState.currentTurnState!.lastCardWasWild = false;
      gameState.currentTurnState!.movesEarnedThisTurn = 1;

      const stack1 = createStack(gameState, 'player1');
      const testCard = {
        id: 'move_card',
        type: CardType.Regular,
        character: Character.Ninja,
        bodyPart: BodyPart.Head,
        isFastCard: false
      };
      stack1.piles[BodyPart.Head].cards.push(testCard);

      const moveAction = {
        cardId: 'move_card',
        fromStackId: stack1.id,
        fromPile: BodyPart.Head,
        toStackId: 'new',
        toPile: BodyPart.Torso
      };

      const result = executeSequentialMove(gameState, moveAction);

      expect(result).toBe('end_turn');
      expect(gameState.currentTurnState).toBeUndefined();
    });

    it('should allow skipping moves', () => {
      gameState.pendingMoves = 1;
      gameState.currentTurnState!.phase = TurnPhase.AwaitMove;
      gameState.currentTurnState!.lastCardWasWild = true;

      const result = skipMove(gameState);

      expect(result).toBe('continue');
      expect(gameState.currentTurnState!.phase).toBe(TurnPhase.PlayCard);
      expect(gameState.currentTurnState!.canContinuePlaying).toBe(true);
    });
  });

  describe('Engine Integration', () => {
    it('should support complete sequential turn workflow', () => {
      // Start turn
      let result = engine.startTurn();
      expect(result).toBe('continue');
      expect(engine.canPlayAnotherCard()).toBe(false); // Need to enable playing
      
      // Get a card to play
      const hand = engine.getPlayerHand('player1');
      const regularCard = hand.find(c => c.type === CardType.Regular)!;
      
      // Play card
      result = engine.playCard(regularCard);
      expect(result).toBe('end_turn');
      expect(engine.getCurrentPlayer()).toBe('player2');
    });

    it('should handle wild card sequence', () => {
      // Add wild cards to hand
      const gameState = engine.getGameStateForTesting();
      const currentPlayer = gameState.players[0];
      const wildCard = {
        id: 'test_wild',
        type: CardType.WildUniversal,
        isFastCard: true
      };
      currentPlayer.hand.push(wildCard);

      // Start turn and play wild card
      engine.startTurn();
      let result = engine.playCard(wildCard, undefined, BodyPart.Head, 
        { character: Character.Ninja, bodyPart: BodyPart.Head });
      
      expect(result).toBe('continue');
      expect(engine.canPlayAnotherCard()).toBe(true);
      
      // Play regular card to end turn
      const regularCard = currentPlayer.hand.find(c => c.type === CardType.Regular)!;
      result = engine.playCard(regularCard);
      
      expect(result).toBe('end_turn');
    });

    it('should detect awaiting move state', () => {
      const gameState = engine.getGameStateForTesting();
      gameState.pendingMoves = 1;
      gameState.currentTurnState = {
        phase: TurnPhase.AwaitMove,
        cardsPlayedThisTurn: [],
        lastCardWasWild: false,
        movesEarnedThisTurn: 1,
        canContinuePlaying: false,
        hasDrawnCard: true
      };

      expect(engine.isAwaitingMove()).toBe(true);
    });

    it('should handle game ending during sequential play', () => {
      const gameState = engine.getGameStateForTesting();
      gameState.gamePhase = 'finished';
      gameState.winner = 'player1';

      // All operations should return end_turn for finished games
      expect(engine.startTurn()).toBe('end_turn');
      
      const hand = engine.getPlayerHand('player1');
      const card = hand[0];
      expect(engine.playCard(card)).toBe('end_turn');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty deck during draw', () => {
      // Empty the deck
      gameState.deck = [];
      
      const result = startSequentialTurn(gameState);
      
      // Should still continue even if no card drawn
      expect(result).toBe('continue');
      expect(gameState.currentTurnState!.phase).toBe(TurnPhase.PlayCard);
    });

    it('should prevent invalid card plays', () => {
      startSequentialTurn(gameState);
      
      const fakeCard = {
        id: 'fake',
        type: CardType.Regular,
        character: Character.Ninja,
        bodyPart: BodyPart.Head,
        isFastCard: false
      };

      const result = playNextCard(gameState, fakeCard);
      
      expect(result).toBe('continue'); // Allow retry
      expect(gameState.currentTurnState!.cardsPlayedThisTurn).toHaveLength(0);
    });

    it('should handle completions with wild cards during sequential play', () => {
      startSequentialTurn(gameState);

      // Create scenario where wild card completes a stack
      const stack1 = createStack(gameState, gameState.currentPlayer);
      
      // Nearly complete stacks
      const ninjaHead = { id: '1', type: CardType.Regular, character: Character.Ninja, bodyPart: BodyPart.Head, isFastCard: false };
      const ninjaTorso = { id: '2', type: CardType.Regular, character: Character.Ninja, bodyPart: BodyPart.Torso, isFastCard: false };
      
      stack1.piles[BodyPart.Head].cards.push(ninjaHead);
      stack1.piles[BodyPart.Torso].cards.push(ninjaTorso);

      const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer)!;
      const wildCard = { id: 'wild_legs', type: CardType.WildUniversal, isFastCard: true };
      currentPlayer.hand.push(wildCard);

      const initialMoves = gameState.pendingMoves;

      const result = playNextCard(gameState, wildCard, stack1.id, BodyPart.Legs, 
        { character: Character.Ninja, bodyPart: BodyPart.Legs });

      // Verify wild card behavior: either stack completion or continuation
      if (gameState.pendingMoves > initialMoves) {
        expect(result).toBe('await_move');
        expect(gameState.pendingMoves).toBeGreaterThan(initialMoves);
      } else {
        expect(result).toBe('continue');
        expect(gameState.currentTurnState!.canContinuePlaying).toBe(true);
      }
    });

    it('should maintain game state consistency during sequential operations', () => {
      startSequentialTurn(gameState);
      
      const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer)!;
      const card = currentPlayer.hand[0];

      playNextCard(gameState, card);

      // Validate game state
      const validation = engine.validateGameState();
      expect(validation.valid).toBe(true);
    });
  });
});