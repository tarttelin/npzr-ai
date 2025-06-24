import { createDeck, shuffleDeck, isWildCard, canCardFitPile, getCardEffectiveProperties } from '../deck';
import { Card, Character, BodyPart, CardType } from '../types';

describe('Deck Management', () => {
  describe('createDeck', () => {
    it('should create a deck with exactly 44 cards', () => {
      const deck = createDeck();
      expect(deck).toHaveLength(44);
    });

    it('should create 36 regular cards (4 characters × 3 body parts × 3 copies)', () => {
      const deck = createDeck();
      const regularCards = deck.filter(card => card.type === CardType.Regular);
      expect(regularCards).toHaveLength(36);
    });

    it('should create 8 wild cards', () => {
      const deck = createDeck();
      const wildCards = deck.filter(card => card.type !== CardType.Regular);
      expect(wildCards).toHaveLength(8);
    });

    it('should have 4 character-specific wild cards', () => {
      const deck = createDeck();
      const characterWilds = deck.filter(card => card.type === CardType.WildCharacter);
      expect(characterWilds).toHaveLength(4);
      
      // Each character should have exactly one wild card
      const characters = Object.values(Character);
      for (const character of characters) {
        const characterWild = characterWilds.find(card => card.character === character);
        expect(characterWild).toBeDefined();
        expect(characterWild?.isFastCard).toBe(true);
      }
    });

    it('should have 3 position-specific wild cards', () => {
      const deck = createDeck();
      const positionWilds = deck.filter(card => card.type === CardType.WildPosition);
      expect(positionWilds).toHaveLength(3);
      
      // Each body part should have exactly one wild card
      const bodyParts = Object.values(BodyPart);
      for (const bodyPart of bodyParts) {
        const positionWild = positionWilds.find(card => card.bodyPart === bodyPart);
        expect(positionWild).toBeDefined();
        expect(positionWild?.isFastCard).toBe(true);
      }
    });

    it('should have 1 universal wild card', () => {
      const deck = createDeck();
      const universalWilds = deck.filter(card => card.type === CardType.WildUniversal);
      expect(universalWilds).toHaveLength(1);
      expect(universalWilds[0].isFastCard).toBe(true);
    });

    it('should assign unique IDs to all cards', () => {
      const deck = createDeck();
      const ids = deck.map(card => card.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(deck.length);
    });
  });

  describe('shuffleDeck', () => {
    it('should maintain deck size after shuffling', () => {
      const deck = createDeck();
      const originalLength = deck.length;
      shuffleDeck(deck);
      expect(deck).toHaveLength(originalLength);
    });

    it('should reorder cards (with high probability)', () => {
      const deck1 = createDeck();
      const deck2 = [...deck1];
      shuffleDeck(deck2);
      
      // With 44 cards, the probability of identical order after shuffle is negligible
      const sameOrder = deck1.every((card, index) => card.id === deck2[index].id);
      expect(sameOrder).toBe(false);
    });
  });

  describe('isWildCard', () => {
    it('should return false for regular cards', () => {
      const deck = createDeck();
      const regularCard = deck.find(card => card.type === CardType.Regular)!;
      expect(isWildCard(regularCard)).toBe(false);
    });

    it('should return true for wild cards', () => {
      const deck = createDeck();
      const wildCard = deck.find(card => card.type === CardType.WildCharacter)!;
      expect(isWildCard(wildCard)).toBe(true);
    });
  });

  describe('canCardFitPile', () => {
    let deck: Card[];
    
    beforeEach(() => {
      deck = createDeck();
    });

    it('should allow regular cards that match character and body part', () => {
      const ninjaHead = deck.find(card => 
        card.type === CardType.Regular && 
        card.character === Character.Ninja && 
        card.bodyPart === BodyPart.Head
      )!;
      
      expect(canCardFitPile(ninjaHead, Character.Ninja, BodyPart.Head)).toBe(true);
    });

    it('should reject regular cards that do not match', () => {
      const ninjaHead = deck.find(card => 
        card.type === CardType.Regular && 
        card.character === Character.Ninja && 
        card.bodyPart === BodyPart.Head
      )!;
      
      expect(canCardFitPile(ninjaHead, Character.Pirate, BodyPart.Head)).toBe(false);
      expect(canCardFitPile(ninjaHead, Character.Ninja, BodyPart.Torso)).toBe(false);
    });

    it('should allow character wild cards for matching character', () => {
      const ninjaWild = deck.find(card => 
        card.type === CardType.WildCharacter && 
        card.character === Character.Ninja
      )!;
      
      expect(canCardFitPile(ninjaWild, Character.Ninja, BodyPart.Head)).toBe(true);
      expect(canCardFitPile(ninjaWild, Character.Ninja, BodyPart.Torso)).toBe(true);
      expect(canCardFitPile(ninjaWild, Character.Pirate, BodyPart.Head)).toBe(false);
    });

    it('should allow position wild cards for matching body part', () => {
      const headWild = deck.find(card => 
        card.type === CardType.WildPosition && 
        card.bodyPart === BodyPart.Head
      )!;
      
      expect(canCardFitPile(headWild, Character.Ninja, BodyPart.Head)).toBe(true);
      expect(canCardFitPile(headWild, Character.Pirate, BodyPart.Head)).toBe(true);
      expect(canCardFitPile(headWild, Character.Ninja, BodyPart.Torso)).toBe(false);
    });

    it('should allow universal wild cards for any combination', () => {
      const universalWild = deck.find(card => card.type === CardType.WildUniversal)!;
      
      expect(canCardFitPile(universalWild, Character.Ninja, BodyPart.Head)).toBe(true);
      expect(canCardFitPile(universalWild, Character.Pirate, BodyPart.Torso)).toBe(true);
      expect(canCardFitPile(universalWild, Character.Zombie, BodyPart.Legs)).toBe(true);
    });
  });

  describe('getCardEffectiveProperties', () => {
    it('should return card properties for regular cards', () => {
      const deck = createDeck();
      const ninjaHead = deck.find(card => 
        card.type === CardType.Regular && 
        card.character === Character.Ninja && 
        card.bodyPart === BodyPart.Head
      )!;
      
      const properties = getCardEffectiveProperties(ninjaHead);
      expect(properties.character).toBe(Character.Ninja);
      expect(properties.bodyPart).toBe(BodyPart.Head);
    });

    it('should return nomination properties for nominated wild cards', () => {
      const deck = createDeck();
      const wildCard = deck.find(card => card.type === CardType.WildUniversal)!;
      
      wildCard.nomination = { character: Character.Robot, bodyPart: BodyPart.Legs };
      
      const properties = getCardEffectiveProperties(wildCard);
      expect(properties.character).toBe(Character.Robot);
      expect(properties.bodyPart).toBe(BodyPart.Legs);
    });

    it('should return undefined for unnominated wild cards', () => {
      const deck = createDeck();
      const wildCard = deck.find(card => card.type === CardType.WildUniversal)!;
      
      const properties = getCardEffectiveProperties(wildCard);
      expect(properties.character).toBeUndefined();
      expect(properties.bodyPart).toBeUndefined();
    });
  });
});