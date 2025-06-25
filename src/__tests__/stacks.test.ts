import {
  addCardToStack,
  playCard,
  checkStackCompletion,
  completeStack,
  getStacksForPlayer,
  getAllCompletableStacks,
  getTopCardFromPile,
  removeCardFromPile,
  canPlaceCardOnPile,
  getStackSummary
} from '../stacks';
import { createGameState, createStack } from '../game';
import { GameState, Character, BodyPart, CardType, Stack } from '../types';

describe('Stack Management', () => {
  let gameState: GameState;
  let stack: Stack;

  beforeEach(() => {
    gameState = createGameState();
    stack = createStack(gameState, 'player1');
  });

  describe('addCardToStack', () => {
    it('should add card to specified pile', () => {
      const testCard = {
        id: 'test_card',
        type: CardType.Regular,
        character: Character.Ninja,
        bodyPart: BodyPart.Head,
        isFastCard: false
      };

      const success = addCardToStack(stack, testCard, BodyPart.Head);

      expect(success).toBe(true);
      expect(stack.piles[BodyPart.Head].cards).toHaveLength(1);
      expect(stack.piles[BodyPart.Head].cards[0]).toEqual(testCard);
    });

    it('should fail for invalid pile', () => {
      const testCard = {
        id: 'test_card',
        type: CardType.Regular,
        character: Character.Ninja,
        bodyPart: BodyPart.Head,
        isFastCard: false
      };

      // Simulate invalid pile by temporarily removing it
      const originalPile = stack.piles[BodyPart.Head];
      delete (stack.piles as any)[BodyPart.Head];

      const success = addCardToStack(stack, testCard, BodyPart.Head);

      expect(success).toBe(false);

      // Restore pile
      stack.piles[BodyPart.Head] = originalPile;
    });
  });

  describe('playCard', () => {
    it('should create new stack when no target specified', () => {
      const testCard = {
        id: 'test_card',
        type: CardType.Regular,
        character: Character.Ninja,
        bodyPart: BodyPart.Head,
        isFastCard: false
      };

      const initialStackCount = gameState.stacks.length;
      const success = playCard(gameState, testCard, undefined, undefined, true);

      expect(success).toBe(true);
      expect(gameState.stacks).toHaveLength(initialStackCount + 1);
    });

    it('should add card to existing stack', () => {
      const testCard = {
        id: 'test_card',
        type: CardType.Regular,
        character: Character.Ninja,
        bodyPart: BodyPart.Head,
        isFastCard: false
      };

      const success = playCard(gameState, testCard, stack.id, BodyPart.Head);

      expect(success).toBe(true);
      expect(stack.piles[BodyPart.Head].cards).toHaveLength(1);
      expect(stack.piles[BodyPart.Head].cards[0]).toEqual(testCard);
    });

    it('should auto-determine pile for regular cards', () => {
      const testCard = {
        id: 'test_card',
        type: CardType.Regular,
        character: Character.Ninja,
        bodyPart: BodyPart.Torso,
        isFastCard: false
      };

      const success = playCard(gameState, testCard, stack.id);

      expect(success).toBe(true);
      expect(stack.piles[BodyPart.Torso].cards).toHaveLength(1);
    });

    it('should fail for unnominated wild cards without pile specification', () => {
      const wildCard = {
        id: 'wild_card',
        type: CardType.WildUniversal,
        isFastCard: true
      };

      const success = playCard(gameState, wildCard, stack.id);

      expect(success).toBe(false);
    });

    it('should work with nominated wild cards', () => {
      const wildCard = {
        id: 'wild_card',
        type: CardType.WildUniversal,
        isFastCard: true,
        nomination: { character: Character.Ninja, bodyPart: BodyPart.Head }
      };

      const success = playCard(gameState, wildCard, stack.id);

      expect(success).toBe(true);
      expect(stack.piles[BodyPart.Head].cards).toHaveLength(1);
    });

    it('should fail for invalid target stack', () => {
      const testCard = {
        id: 'test_card',
        type: CardType.Regular,
        character: Character.Ninja,
        bodyPart: BodyPart.Head,
        isFastCard: false
      };

      const success = playCard(gameState, testCard, 'nonexistent_stack', BodyPart.Head);

      expect(success).toBe(false);
    });
  });

  describe('checkStackCompletion', () => {
    it('should return null for incomplete stacks', () => {
      const ninjaHead = {
        id: 'ninja_head',
        type: CardType.Regular,
        character: Character.Ninja,
        bodyPart: BodyPart.Head,
        isFastCard: false
      };

      stack.piles[BodyPart.Head].cards.push(ninjaHead);

      const result = checkStackCompletion(stack);
      expect(result).toBeNull();
    });

    it('should return character for completed stacks', () => {
      const ninjaHead = { id: '1', type: CardType.Regular, character: Character.Ninja, bodyPart: BodyPart.Head, isFastCard: false };
      const ninjaTorso = { id: '2', type: CardType.Regular, character: Character.Ninja, bodyPart: BodyPart.Torso, isFastCard: false };
      const ninjaLegs = { id: '3', type: CardType.Regular, character: Character.Ninja, bodyPart: BodyPart.Legs, isFastCard: false };

      stack.piles[BodyPart.Head].cards.push(ninjaHead);
      stack.piles[BodyPart.Torso].cards.push(ninjaTorso);
      stack.piles[BodyPart.Legs].cards.push(ninjaLegs);

      const result = checkStackCompletion(stack);
      expect(result).toBe(Character.Ninja);
    });

    it('should handle wild card nominations correctly', () => {
      const ninjaHead = { id: '1', type: CardType.Regular, character: Character.Ninja, bodyPart: BodyPart.Head, isFastCard: false };
      const wildTorso = { 
        id: '2', 
        type: CardType.WildUniversal, 
        isFastCard: true,
        nomination: { character: Character.Ninja, bodyPart: BodyPart.Torso }
      };
      const ninjaLegs = { id: '3', type: CardType.Regular, character: Character.Ninja, bodyPart: BodyPart.Legs, isFastCard: false };

      stack.piles[BodyPart.Head].cards.push(ninjaHead);
      stack.piles[BodyPart.Torso].cards.push(wildTorso);
      stack.piles[BodyPart.Legs].cards.push(ninjaLegs);

      const result = checkStackCompletion(stack);
      expect(result).toBe(Character.Ninja);
    });

    it('should require all three body parts', () => {
      const ninjaHead = { id: '1', type: CardType.Regular, character: Character.Ninja, bodyPart: BodyPart.Head, isFastCard: false };
      const ninjaTorso = { id: '2', type: CardType.Regular, character: Character.Ninja, bodyPart: BodyPart.Torso, isFastCard: false };

      stack.piles[BodyPart.Head].cards.push(ninjaHead);
      stack.piles[BodyPart.Torso].cards.push(ninjaTorso);
      // Missing legs

      const result = checkStackCompletion(stack);
      expect(result).toBeNull();
    });

    it('should handle mismatched characters', () => {
      const ninjaHead = { id: '1', type: CardType.Regular, character: Character.Ninja, bodyPart: BodyPart.Head, isFastCard: false };
      const pirateTorso = { id: '2', type: CardType.Regular, character: Character.Pirate, bodyPart: BodyPart.Torso, isFastCard: false };
      const ninjaLegs = { id: '3', type: CardType.Regular, character: Character.Ninja, bodyPart: BodyPart.Legs, isFastCard: false };

      stack.piles[BodyPart.Head].cards.push(ninjaHead);
      stack.piles[BodyPart.Torso].cards.push(pirateTorso);
      stack.piles[BodyPart.Legs].cards.push(ninjaLegs);

      const result = checkStackCompletion(stack);
      expect(result).toBeNull();
    });

    it('should use top card from each pile', () => {
      // Add multiple cards to each pile, only top ones should matter
      const ninjaHead1 = { id: '1a', type: CardType.Regular, character: Character.Pirate, bodyPart: BodyPart.Head, isFastCard: false };
      const ninjaHead2 = { id: '1b', type: CardType.Regular, character: Character.Ninja, bodyPart: BodyPart.Head, isFastCard: false };
      
      const ninjaTorso = { id: '2', type: CardType.Regular, character: Character.Ninja, bodyPart: BodyPart.Torso, isFastCard: false };
      const ninjaLegs = { id: '3', type: CardType.Regular, character: Character.Ninja, bodyPart: BodyPart.Legs, isFastCard: false };

      stack.piles[BodyPart.Head].cards.push(ninjaHead1, ninjaHead2); // Top is ninjaHead2
      stack.piles[BodyPart.Torso].cards.push(ninjaTorso);
      stack.piles[BodyPart.Legs].cards.push(ninjaLegs);

      const result = checkStackCompletion(stack);
      expect(result).toBe(Character.Ninja);
    });
  });

  describe('completeStack', () => {
    it('should award points to stack owner', () => {
      const ninjaHead = { id: '1', type: CardType.Regular, character: Character.Ninja, bodyPart: BodyPart.Head, isFastCard: false };
      const ninjaTorso = { id: '2', type: CardType.Regular, character: Character.Ninja, bodyPart: BodyPart.Torso, isFastCard: false };
      const ninjaLegs = { id: '3', type: CardType.Regular, character: Character.Ninja, bodyPart: BodyPart.Legs, isFastCard: false };

      stack.piles[BodyPart.Head].cards.push(ninjaHead);
      stack.piles[BodyPart.Torso].cards.push(ninjaTorso);
      stack.piles[BodyPart.Legs].cards.push(ninjaLegs);

      const player = gameState.players.find(p => p.id === 'player1')!;
      const initialScore = player.scoredCharacters.size;

      const result = completeStack(gameState, stack.id);

      expect(result).toBe(Character.Ninja);
      expect(player.scoredCharacters.size).toBe(initialScore + 1);
      expect(player.scoredCharacters.has(Character.Ninja)).toBe(true);
    });

    it('should remove completed stack from game', () => {
      const ninjaHead = { id: '1', type: CardType.Regular, character: Character.Ninja, bodyPart: BodyPart.Head, isFastCard: false };
      const ninjaTorso = { id: '2', type: CardType.Regular, character: Character.Ninja, bodyPart: BodyPart.Torso, isFastCard: false };
      const ninjaLegs = { id: '3', type: CardType.Regular, character: Character.Ninja, bodyPart: BodyPart.Legs, isFastCard: false };

      stack.piles[BodyPart.Head].cards.push(ninjaHead);
      stack.piles[BodyPart.Torso].cards.push(ninjaTorso);
      stack.piles[BodyPart.Legs].cards.push(ninjaLegs);

      const initialStackCount = gameState.stacks.length;

      completeStack(gameState, stack.id);

      expect(gameState.stacks).toHaveLength(initialStackCount - 1);
      expect(gameState.stacks.find(s => s.id === stack.id)).toBeUndefined();
    });

    it('should increment pending moves', () => {
      const ninjaHead = { id: '1', type: CardType.Regular, character: Character.Ninja, bodyPart: BodyPart.Head, isFastCard: false };
      const ninjaTorso = { id: '2', type: CardType.Regular, character: Character.Ninja, bodyPart: BodyPart.Torso, isFastCard: false };
      const ninjaLegs = { id: '3', type: CardType.Regular, character: Character.Ninja, bodyPart: BodyPart.Legs, isFastCard: false };

      stack.piles[BodyPart.Head].cards.push(ninjaHead);
      stack.piles[BodyPart.Torso].cards.push(ninjaTorso);
      stack.piles[BodyPart.Legs].cards.push(ninjaLegs);

      const initialMoves = gameState.pendingMoves;

      completeStack(gameState, stack.id);

      expect(gameState.pendingMoves).toBe(initialMoves + 1);
    });

    it('should return null for invalid stack', () => {
      const result = completeStack(gameState, 'nonexistent_stack');
      expect(result).toBeNull();
    });

    it('should return null for incomplete stack', () => {
      const ninjaHead = { id: '1', type: CardType.Regular, character: Character.Ninja, bodyPart: BodyPart.Head, isFastCard: false };
      stack.piles[BodyPart.Head].cards.push(ninjaHead);

      const result = completeStack(gameState, stack.id);
      expect(result).toBeNull();
    });
  });

  describe('getStacksForPlayer', () => {
    it('should return stacks owned by player', () => {
      const player1Stack = createStack(gameState, 'player1');
      const player2Stack = createStack(gameState, 'player2');

      const player1Stacks = getStacksForPlayer(gameState, 'player1');
      const player2Stacks = getStacksForPlayer(gameState, 'player2');

      expect(player1Stacks.some(s => s.id === player1Stack.id)).toBe(true);
      expect(player1Stacks.some(s => s.id === player2Stack.id)).toBe(false);
      
      expect(player2Stacks.some(s => s.id === player2Stack.id)).toBe(true);
      expect(player2Stacks.some(s => s.id === player1Stack.id)).toBe(false);
    });
  });

  describe('getAllCompletableStacks', () => {
    it('should return only completable stacks', () => {
      const completeStack = createStack(gameState, 'player1');
      const incompleteStack = createStack(gameState, 'player2');

      // Make one stack complete
      const ninjaHead = { id: '1', type: CardType.Regular, character: Character.Ninja, bodyPart: BodyPart.Head, isFastCard: false };
      const ninjaTorso = { id: '2', type: CardType.Regular, character: Character.Ninja, bodyPart: BodyPart.Torso, isFastCard: false };
      const ninjaLegs = { id: '3', type: CardType.Regular, character: Character.Ninja, bodyPart: BodyPart.Legs, isFastCard: false };

      completeStack.piles[BodyPart.Head].cards.push(ninjaHead);
      completeStack.piles[BodyPart.Torso].cards.push(ninjaTorso);
      completeStack.piles[BodyPart.Legs].cards.push(ninjaLegs);

      // Leave other stack incomplete
      const pirateHead = { id: '4', type: CardType.Regular, character: Character.Pirate, bodyPart: BodyPart.Head, isFastCard: false };
      incompleteStack.piles[BodyPart.Head].cards.push(pirateHead);

      const completableStacks = getAllCompletableStacks(gameState);

      expect(completableStacks).toHaveLength(1);
      expect(completableStacks[0].id).toBe(completeStack.id);
    });
  });

  describe('getTopCardFromPile', () => {
    it('should return top card from pile', () => {
      const card1 = { id: '1', type: CardType.Regular, character: Character.Ninja, bodyPart: BodyPart.Head, isFastCard: false };
      const card2 = { id: '2', type: CardType.Regular, character: Character.Pirate, bodyPart: BodyPart.Head, isFastCard: false };

      stack.piles[BodyPart.Head].cards.push(card1, card2);

      const topCard = getTopCardFromPile(stack, BodyPart.Head);

      expect(topCard).toEqual(card2);
    });

    it('should return null for empty pile', () => {
      const topCard = getTopCardFromPile(stack, BodyPart.Head);
      expect(topCard).toBeNull();
    });
  });

  describe('removeCardFromPile', () => {
    it('should remove and return specified card', () => {
      const card1 = { id: '1', type: CardType.Regular, character: Character.Ninja, bodyPart: BodyPart.Head, isFastCard: false };
      const card2 = { id: '2', type: CardType.Regular, character: Character.Pirate, bodyPart: BodyPart.Head, isFastCard: false };

      stack.piles[BodyPart.Head].cards.push(card1, card2);

      const removedCard = removeCardFromPile(stack, BodyPart.Head, '1');

      expect(removedCard).toEqual(card1);
      expect(stack.piles[BodyPart.Head].cards).toHaveLength(1);
      expect(stack.piles[BodyPart.Head].cards[0]).toEqual(card2);
    });

    it('should return null for non-existent card', () => {
      const card1 = { id: '1', type: CardType.Regular, character: Character.Ninja, bodyPart: BodyPart.Head, isFastCard: false };
      stack.piles[BodyPart.Head].cards.push(card1);

      const removedCard = removeCardFromPile(stack, BodyPart.Head, 'nonexistent');

      expect(removedCard).toBeNull();
      expect(stack.piles[BodyPart.Head].cards).toHaveLength(1);
    });
  });

  describe('canPlaceCardOnPile', () => {
    it('should always return true (defensive play allowed)', () => {
      const testCard = { id: 'test', type: CardType.Regular, character: Character.Ninja, bodyPart: BodyPart.Head, isFastCard: false };
      
      const result = canPlaceCardOnPile(stack, testCard, BodyPart.Torso);
      expect(result).toBe(true);
    });
  });

  describe('getStackSummary', () => {
    it('should return correct stack summary', () => {
      const card1 = { id: '1', type: CardType.Regular, character: Character.Ninja, bodyPart: BodyPart.Head, isFastCard: false };
      const card2 = { id: '2', type: CardType.Regular, character: Character.Ninja, bodyPart: BodyPart.Torso, isFastCard: false };

      stack.piles[BodyPart.Head].cards.push(card1);
      stack.piles[BodyPart.Torso].cards.push(card2);

      const summary = getStackSummary(stack);

      expect(summary.id).toBe(stack.id);
      expect(summary.owner).toBe('player1');
      expect(summary.headCount).toBe(1);
      expect(summary.torsoCount).toBe(1);
      expect(summary.legsCount).toBe(0);
      expect(summary.isCompletable).toBe(false);
    });

    it('should detect completable stacks', () => {
      const ninjaHead = { id: '1', type: CardType.Regular, character: Character.Ninja, bodyPart: BodyPart.Head, isFastCard: false };
      const ninjaTorso = { id: '2', type: CardType.Regular, character: Character.Ninja, bodyPart: BodyPart.Torso, isFastCard: false };
      const ninjaLegs = { id: '3', type: CardType.Regular, character: Character.Ninja, bodyPart: BodyPart.Legs, isFastCard: false };

      stack.piles[BodyPart.Head].cards.push(ninjaHead);
      stack.piles[BodyPart.Torso].cards.push(ninjaTorso);
      stack.piles[BodyPart.Legs].cards.push(ninjaLegs);

      const summary = getStackSummary(stack);

      expect(summary.isCompletable).toBe(true);
    });
  });
});