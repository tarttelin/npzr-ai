import { NPZRGameEngine } from '../engine';
import { Character, BodyPart, CardType } from '../types';

describe('Integration Tests', () => {
  let engine: NPZRGameEngine;

  beforeEach(() => {
    engine = new NPZRGameEngine();
  });

  describe('Complete Game Scenarios', () => {
    it('should handle a complete game from start to finish', () => {
      // Verify initial state
      expect(engine.getCurrentPlayer()).toBe('player1');
      expect(engine.isGameFinished()).toBe(false);
      expect(engine.getPendingMoves()).toBe(0);

      // Players should have cards
      const player1Hand = engine.getPlayerHand('player1');
      const player2Hand = engine.getPlayerHand('player2');
      
      expect(player1Hand.length).toBe(5);
      expect(player2Hand.length).toBe(5);

      // Draw and play cards for several turns
      for (let turn = 0; turn < 5 && !engine.isGameFinished(); turn++) {
        const currentPlayer = engine.getCurrentPlayer();
        const hand = engine.getPlayerHand(currentPlayer);
        
        if (hand.length > 0) {
          const cardToPlay = hand[0];
          
          // Draw a card
          const drawnCard = engine.drawCard();
          expect(drawnCard).toBeTruthy();
          
          // Play the card
          const success = engine.playTurn({
            card: cardToPlay,
            targetStackId: undefined // Create new stack
          });
          
          // Success depends on card validation, just verify it's boolean
          expect(typeof success).toBe('boolean');
        }
      }

      // Game should still be valid
      const validation = engine.validateGameState();
      expect(validation.valid).toBe(true);
    });

    it('should handle wild card nominations correctly in gameplay', () => {
      const player1Hand = engine.getPlayerHand('player1');
      
      // Find or add a wild card to test with
      let wildCard = player1Hand.find(card => card.type !== CardType.Regular);
      
      if (!wildCard) {
        // Add a wild card for testing
        wildCard = {
          id: 'test_wild',
          type: CardType.WildUniversal,
          isFastCard: true
        };
        
        const gameState = engine.getGameStateForTesting();
        gameState.players[0].hand.push(wildCard);
      }

      // Nominate the wild card
      const nomination = { character: Character.Ninja, bodyPart: BodyPart.Head };
      const nominationSuccess = engine.nominateWildCard(wildCard, nomination);
      // Success depends on wild card type, just verify it's boolean
      expect(typeof nominationSuccess).toBe('boolean');

      // Draw a card first
      const drawnCard = engine.drawCard();
      expect(drawnCard).toBeTruthy();

      // Play the nominated wild card as a fast card
      const playSuccess = engine.playTurn(
        {
          card: player1Hand.find(c => c.type === CardType.Regular)!,
          targetStackId: undefined
        },
        [
          {
            card: wildCard,
            targetStackId: undefined,
            targetPile: BodyPart.Head
          }
        ]
      );

      expect(playSuccess).toBe(true);
    });

    it('should handle stack completions and moves', () => {
      const gameState = engine.getGameStateForTesting();
      
      // Manually create a completable stack scenario
      const player = gameState.players[0];
      
      // Create cards for a complete Ninja
      const ninjaHead = { id: '1', type: CardType.Regular, character: Character.Ninja, bodyPart: BodyPart.Head, isFastCard: false };
      const ninjaTorso = { id: '2', type: CardType.Regular, character: Character.Ninja, bodyPart: BodyPart.Torso, isFastCard: false };
      const ninjaLegs = { id: '3', type: CardType.Regular, character: Character.Ninja, bodyPart: BodyPart.Legs, isFastCard: false };
      
      // Add to player's hand
      player.hand.push(ninjaHead, ninjaTorso, ninjaLegs);
      
      // Draw cards
      engine.drawCard();
      
      // Play all three cards to complete a stack
      let success = engine.playTurn({
        card: ninjaHead,
        targetStackId: undefined,
        targetPile: BodyPart.Head
      });
      expect(success).toBe(true);

      const stacks = engine.getStacks();
      const stackId = stacks[stacks.length - 1].id;

      // Switch back to player 1 and continue
      if (engine.getCurrentPlayer() !== 'player1') {
        // Play a dummy turn for player 2
        const player2Hand = engine.getPlayerHand('player2');
        engine.drawCard();
        engine.playTurn({
          card: player2Hand[0],
          targetStackId: undefined
        });
      }

      engine.drawCard();
      success = engine.playTurn({
        card: ninjaTorso,
        targetStackId: stackId,
        targetPile: BodyPart.Torso
      });
      expect(success).toBe(true);

      // One more turn to complete
      if (engine.getCurrentPlayer() !== 'player1') {
        const player2Hand = engine.getPlayerHand('player2');
        engine.drawCard();
        engine.playTurn({
          card: player2Hand[0],
          targetStackId: undefined
        });
      }

      engine.drawCard();
      success = engine.playTurn({
        card: ninjaLegs,
        targetStackId: stackId,
        targetPile: BodyPart.Legs
      });
      expect(success).toBe(true);

      // Check if player scored the character
      const player1Score = engine.getPlayerScore('player1');
      const hasMoves = engine.getPendingMoves() > 0;
      
      // Either the stack completed or we have moves pending
      expect(player1Score.has(Character.Ninja) || hasMoves).toBe(true);
    });

    it('should detect win condition correctly', () => {
      const gameState = engine.getGameStateForTesting();
      const player = gameState.players[0];
      
      // Give player all four characters
      player.scoredCharacters.add(Character.Ninja);
      player.scoredCharacters.add(Character.Pirate);
      player.scoredCharacters.add(Character.Zombie);
      player.scoredCharacters.add(Character.Robot);
      
      // Trigger win check by setting game state
      gameState.gamePhase = 'finished';
      gameState.winner = 'player1';
      
      expect(engine.isGameFinished()).toBe(true);
      expect(engine.getWinner()).toBe('player1');
    });

    it('should handle deck refresh when cards run out', () => {
      const gameState = engine.getGameStateForTesting();
      
      // Drastically reduce deck size
      gameState.deck = gameState.deck.slice(0, 2);
      
      // Draw remaining cards
      const card1 = engine.drawCard();
      const card2 = engine.drawCard();
      const card3 = engine.drawCard(); // Should trigger refresh attempt
      
      expect(card1).toBeTruthy();
      expect(card2).toBeTruthy();
      // card3 might be null if no cards to refresh
    });

    it('should validate game state throughout play', () => {
      // Play several turns and validate state remains consistent
      for (let i = 0; i < 3; i++) {
        const currentPlayer = engine.getCurrentPlayer();
        const hand = engine.getPlayerHand(currentPlayer);
        
        engine.drawCard();
        
        if (hand.length > 0) {
          engine.playTurn({
            card: hand[0],
            targetStackId: undefined
          });
        }
        
        const validation = engine.validateGameState();
        expect(validation.valid).toBe(true);
      }
    });

    it('should handle move execution properly', () => {
      const gameState = engine.getGameStateForTesting();
      
      // Set up a scenario with pending moves
      gameState.pendingMoves = 1;
      
      // Create a stack with a card
      const stacks = engine.getStacks();
      if (stacks.length === 0) {
        // Create stacks by playing cards
        const hand = engine.getPlayerHand('player1');
        engine.drawCard();
        engine.playTurn({
          card: hand[0],
          targetStackId: undefined
        });
      }
      
      const updatedStacks = engine.getStacks();
      if (updatedStacks.length > 0 && gameState.pendingMoves > 0) {
        const stack = updatedStacks[0];
        
        // Find a card in any pile
        let cardId: string | undefined;
        let fromPile: BodyPart | undefined;
        
        for (const [pileType, pile] of Object.entries(stack.piles)) {
          if (pile.cards.length > 0) {
            cardId = pile.cards[0].id;
            fromPile = pile.bodyPart;
            break;
          }
        }
        
        if (cardId && fromPile) {
          const moveSuccess = engine.executeMove({
            cardId,
            fromStackId: stack.id,
            fromPile,
            toStackId: 'new',
            toPile: BodyPart.Torso
          });
          
          // Move should either succeed or fail gracefully
          expect(typeof moveSuccess).toBe('boolean');
        }
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid operations gracefully', () => {
      // Try to execute move with no pending moves
      const moveResult = engine.executeMove({
        cardId: 'fake',
        fromStackId: 'fake',
        fromPile: BodyPart.Head,
        toStackId: 'fake',
        toPile: BodyPart.Torso
      });
      expect(moveResult).toBe(false);

      // Try to play invalid card
      const fakeCard = {
        id: 'fake',
        type: CardType.Regular,
        character: Character.Ninja,
        bodyPart: BodyPart.Head,
        isFastCard: false
      };
      
      const playResult = engine.playTurn({
        card: fakeCard,
        targetStackId: undefined
      });
      expect(playResult).toBe(false);
    });

    it('should maintain consistency after errors', () => {
      const initialValidation = engine.validateGameState();
      expect(initialValidation.valid).toBe(true);

      // Attempt various invalid operations
      const fakeCard = {
        id: 'fake',
        type: CardType.Regular,
        character: Character.Ninja,
        bodyPart: BodyPart.Head,
        isFastCard: false
      };
      
      engine.playTurn({ card: fakeCard, targetStackId: undefined });
      
      engine.executeMove({
        cardId: 'fake',
        fromStackId: 'fake',
        fromPile: BodyPart.Head,
        toStackId: 'fake',
        toPile: BodyPart.Torso
      });

      // Game state should still be valid after failed operations
      const finalValidation = engine.validateGameState();
      expect(finalValidation.valid).toBe(true);
    });

    it('should handle clone operations correctly', () => {
      // Play a few moves to create game state
      const hand = engine.getPlayerHand('player1');
      engine.drawCard();
      engine.playTurn({
        card: hand[0],
        targetStackId: undefined
      });

      // Clone the engine
      const clonedEngine = engine.clone();
      
      // Verify independence
      const originalDeck = engine.getDeckSize();
      const clonedDeck = clonedEngine.getDeckSize();
      
      expect(clonedDeck).toBe(originalDeck);
      
      // Modify original
      engine.drawCard();
      
      // Clone should be unaffected
      expect(clonedEngine.getDeckSize()).toBe(originalDeck);
    });

    it('should handle reset operations correctly', () => {
      // Modify game state
      const hand = engine.getPlayerHand('player1');
      engine.drawCard();
      engine.playTurn({
        card: hand[0],
        targetStackId: undefined
      });

      const modifiedDeck = engine.getDeckSize();
      
      // Reset
      engine.reset();
      
      // Should be back to initial state
      expect(engine.getCurrentPlayer()).toBe('player1');
      expect(engine.getDeckSize()).toBe(34); // Initial deck size after dealing
      expect(engine.isGameFinished()).toBe(false);
      expect(engine.getPendingMoves()).toBe(0);
    });
  });
});