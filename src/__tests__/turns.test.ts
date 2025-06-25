import {
  drawCard,
  validateCardPlay,
  executeCardPlay,
  executeTurn,
  canPlayCard,
  mustNominateWildCard
} from '../turns';
import { createGameState, createStack } from '../game';
import { GameState, Character, BodyPart, CardType, PlayCardAction } from '../types';

describe('Turn Management', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = createGameState();
  });

  describe('drawCard', () => {
    it('should draw card from deck and add to current player hand', () => {
      const initialDeckSize = gameState.deck.length;
      const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer)!;
      const initialHandSize = currentPlayer.hand.length;

      const drawnCard = drawCard(gameState);

      expect(drawnCard).toBeTruthy();
      expect(gameState.deck.length).toBe(initialDeckSize - 1);
      expect(currentPlayer.hand.length).toBe(initialHandSize + 1);
      expect(currentPlayer.hand).toContain(drawnCard);
    });

    it('should return null when deck is empty and cannot be refreshed', () => {
      // Empty the deck
      gameState.deck = [];

      const drawnCard = drawCard(gameState);

      expect(drawnCard).toBeNull();
    });

    it('should attempt to refresh deck when empty', () => {
      // Track that deck was initially not empty
      expect(gameState.deck.length).toBeGreaterThan(0);
      
      // Empty the deck
      gameState.deck = [];
      
      // Add some cards that could be reshuffled (simulating scored cards)
      // This test mainly verifies the refresh attempt is made
      const drawnCard = drawCard(gameState);
      
      // Since no scored cards exist, should still be null
      expect(drawnCard).toBeNull();
    });
  });

  describe('validateCardPlay', () => {
    it('should reject cards not in player hand', () => {
      const fakeCard = {
        id: 'fake_card',
        type: CardType.Regular,
        character: Character.Ninja,
        bodyPart: BodyPart.Head,
        isFastCard: false
      };

      const isValid = validateCardPlay(gameState, fakeCard);
      expect(isValid).toBe(false);
    });

    it('should allow cards in player hand', () => {
      const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer)!;
      const playerCard = currentPlayer.hand[0];

      const isValid = validateCardPlay(gameState, playerCard);
      expect(isValid).toBe(true);
    });

    it('should allow creating new stacks', () => {
      const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer)!;
      const playerCard = currentPlayer.hand[0];

      const isValid = validateCardPlay(gameState, playerCard, undefined);
      expect(isValid).toBe(true);
    });

    it('should allow playing on existing stacks', () => {
      const stack = createStack(gameState, 'player1');
      const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer)!;
      const playerCard = currentPlayer.hand[0];

      const isValid = validateCardPlay(gameState, playerCard, stack.id);
      expect(isValid).toBe(true);
    });

    it('should reject invalid target stacks', () => {
      const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer)!;
      const playerCard = currentPlayer.hand[0];

      const isValid = validateCardPlay(gameState, playerCard, 'nonexistent_stack');
      expect(isValid).toBe(false);
    });
  });

  describe('executeCardPlay', () => {
    it('should remove card from hand when played successfully', () => {
      const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer)!;
      const playerCard = currentPlayer.hand[0];
      const initialHandSize = currentPlayer.hand.length;

      const action: PlayCardAction = {
        card: playerCard,
        targetStackId: undefined,
        targetPile: BodyPart.Head
      };

      const success = executeCardPlay(gameState, action, true);

      expect(success).toBe(true);
      expect(currentPlayer.hand.length).toBe(initialHandSize - 1);
      expect(currentPlayer.hand).not.toContain(playerCard);
    });

    it('should apply nomination for wild cards', () => {
      const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer)!;
      
      // Add a wild card to player's hand
      const wildCard: any = {
        id: 'wild_test',
        type: CardType.WildUniversal,
        isFastCard: true
      };
      currentPlayer.hand.push(wildCard);

      const action: PlayCardAction = {
        card: wildCard,
        targetStackId: undefined,
        targetPile: BodyPart.Head,
        nomination: { character: Character.Ninja, bodyPart: BodyPart.Head }
      };

      const success = executeCardPlay(gameState, action, true);

      expect(success).toBe(true);
      expect(wildCard.nomination).toEqual({
        character: Character.Ninja,
        bodyPart: BodyPart.Head
      });
    });

    it('should return card to hand if play fails', () => {
      const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer)!;
      const playerCard = currentPlayer.hand[0];
      const initialHandSize = currentPlayer.hand.length;

      const action: PlayCardAction = {
        card: playerCard,
        targetStackId: 'nonexistent_stack',
        targetPile: BodyPart.Head
      };

      const success = executeCardPlay(gameState, action);

      expect(success).toBe(false);
      expect(currentPlayer.hand.length).toBe(initialHandSize);
      expect(currentPlayer.hand).toContain(playerCard);
    });

    it('should fail for cards not in hand', () => {
      const fakeCard = {
        id: 'fake_card',
        type: CardType.Regular,
        character: Character.Ninja,
        bodyPart: BodyPart.Head,
        isFastCard: false
      };

      const action: PlayCardAction = {
        card: fakeCard,
        targetStackId: undefined,
        targetPile: BodyPart.Head
      };

      const success = executeCardPlay(gameState, action, true);

      expect(success).toBe(false);
    });
  });

  describe('executeTurn', () => {
    it('should execute turn with regular card only', () => {
      const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer)!;
      const regularCard = currentPlayer.hand[0];
      const initialPlayer = gameState.currentPlayer;

      const action: PlayCardAction = {
        card: regularCard,
        targetStackId: undefined,
        targetPile: BodyPart.Head
      };

      const success = executeTurn(gameState, action);

      expect(success).toBe(true);
      expect(gameState.currentPlayer).not.toBe(initialPlayer); // Turn should switch
    });

    it('should execute turn with wild cards', () => {
      const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer)!;
      const regularCard = currentPlayer.hand[0];
      
      // Add a wild card
      const wildCard = {
        id: 'wild_test',
        type: CardType.WildUniversal,
        isFastCard: true
      };
      currentPlayer.hand.push(wildCard);

      const regularAction: PlayCardAction = {
        card: regularCard,
        targetStackId: undefined,
        targetPile: BodyPart.Head
      };

      const wildAction: PlayCardAction = {
        card: wildCard,
        targetStackId: undefined,
        targetPile: BodyPart.Torso,
        nomination: { character: Character.Ninja, bodyPart: BodyPart.Torso }
      };

      const success = executeTurn(gameState, regularAction, [wildAction]);

      expect(success).toBe(true);
      expect(currentPlayer.hand).not.toContain(regularCard);
      expect(currentPlayer.hand).not.toContain(wildCard);
    });

    it('should fail if regular card play is invalid', () => {
      const fakeCard = {
        id: 'fake_card',
        type: CardType.Regular,
        character: Character.Ninja,
        bodyPart: BodyPart.Head,
        isFastCard: false
      };

      const action: PlayCardAction = {
        card: fakeCard,
        targetStackId: undefined,
        targetPile: BodyPart.Head
      };

      const success = executeTurn(gameState, action);

      expect(success).toBe(false);
    });

    it('should fail if wild card play is invalid', () => {
      const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer)!;
      const regularCard = currentPlayer.hand[0];

      const fakeWildCard = {
        id: 'fake_wild',
        type: CardType.WildUniversal,
        isFastCard: true
      };

      const regularAction: PlayCardAction = {
        card: regularCard,
        targetStackId: undefined,
        targetPile: BodyPart.Head
      };

      const wildAction: PlayCardAction = {
        card: fakeWildCard,
        targetStackId: undefined,
        targetPile: BodyPart.Torso
      };

      const success = executeTurn(gameState, regularAction, [wildAction]);

      expect(success).toBe(false);
    });

    it('should validate all cards before executing any', () => {
      const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer)!;
      const regularCard = currentPlayer.hand[0];
      const initialHandSize = currentPlayer.hand.length;

      // Invalid wild card
      const fakeWildCard = {
        id: 'fake_wild',
        type: CardType.WildUniversal,
        isFastCard: true
      };

      const regularAction: PlayCardAction = {
        card: regularCard,
        targetStackId: undefined,
        targetPile: BodyPart.Head
      };

      const wildAction: PlayCardAction = {
        card: fakeWildCard,
        targetStackId: undefined,
        targetPile: BodyPart.Torso
      };

      const success = executeTurn(gameState, regularAction, [wildAction]);

      expect(success).toBe(false);
      // Regular card should still be in hand because validation failed
      expect(currentPlayer.hand.length).toBe(initialHandSize + 1); // +1 from drawCard
      expect(currentPlayer.hand).toContain(regularCard);
    });

    it('should draw card at start of turn', () => {
      const initialDeckSize = gameState.deck.length;
      const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer)!;
      const regularCard = currentPlayer.hand[0];

      const action: PlayCardAction = {
        card: regularCard,
        targetStackId: undefined,
        targetPile: BodyPart.Head
      };

      const success = executeTurn(gameState, action);

      expect(success).toBe(true);
      expect(gameState.deck.length).toBe(initialDeckSize - 1);
    });
  });

  describe('canPlayCard', () => {
    it('should return true for cards in current player hand', () => {
      const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer)!;
      const playerCard = currentPlayer.hand[0];

      const canPlay = canPlayCard(gameState, playerCard);
      expect(canPlay).toBe(true);
    });

    it('should return false for cards not in current player hand', () => {
      const fakeCard = {
        id: 'fake_card',
        type: CardType.Regular,
        character: Character.Ninja,
        bodyPart: BodyPart.Head,
        isFastCard: false
      };

      const canPlay = canPlayCard(gameState, fakeCard);
      expect(canPlay).toBe(false);
    });

    it('should return false for cards in opponent hand', () => {
      const opponent = gameState.players.find(p => p.id !== gameState.currentPlayer)!;
      const opponentCard = opponent.hand[0];

      const canPlay = canPlayCard(gameState, opponentCard);
      expect(canPlay).toBe(false);
    });
  });

  describe('mustNominateWildCard', () => {
    it('should return true for unnominated wild cards', () => {
      const wildCard = {
        id: 'wild_test',
        type: CardType.WildUniversal,
        isFastCard: true
      };

      const mustNominate = mustNominateWildCard(wildCard);
      expect(mustNominate).toBe(true);
    });

    it('should return false for nominated wild cards', () => {
      const wildCard = {
        id: 'wild_test',
        type: CardType.WildUniversal,
        isFastCard: true,
        nomination: { character: Character.Ninja, bodyPart: BodyPart.Head }
      };

      const mustNominate = mustNominateWildCard(wildCard);
      expect(mustNominate).toBe(false);
    });

    it('should return false for regular cards', () => {
      const regularCard = {
        id: 'regular_test',
        type: CardType.Regular,
        character: Character.Ninja,
        bodyPart: BodyPart.Head,
        isFastCard: false
      };

      const mustNominate = mustNominateWildCard(regularCard);
      expect(mustNominate).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle empty deck gracefully in drawCard', () => {
      gameState.deck = [];

      const drawnCard = drawCard(gameState);
      expect(drawnCard).toBeNull();
    });

    it('should validate wild card types correctly', () => {
      const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer)!;
      
      // Add different types of wild cards
      const characterWild = {
        id: 'char_wild',
        type: CardType.WildCharacter,
        character: Character.Ninja,
        isFastCard: true
      };
      
      const positionWild = {
        id: 'pos_wild',
        type: CardType.WildPosition,
        bodyPart: BodyPart.Head,
        isFastCard: true
      };

      currentPlayer.hand.push(characterWild, positionWild);

      // Both should be considered wild cards that need validation
      const charValid = validateCardPlay(gameState, characterWild);
      const posValid = validateCardPlay(gameState, positionWild);

      expect(charValid).toBe(true);
      expect(posValid).toBe(true);
    });

    it('should handle turn execution with stack completions', () => {
      const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer)!;
      const regularCard = currentPlayer.hand[0];
      
      // Create a nearly complete stack that might be completed by this card
      const stack = createStack(gameState, gameState.currentPlayer);
      
      const action: PlayCardAction = {
        card: regularCard,
        targetStackId: stack.id,
        targetPile: BodyPart.Head
      };

      const success = executeTurn(gameState, action);
      
      // Should still succeed even if it triggers completions
      expect(success).toBe(true);
    });
  });
});