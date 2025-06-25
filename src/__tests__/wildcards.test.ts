import {
  nominateWildCard,
  resetWildCard,
  canNominate,
  isWildCard,
  isFastCard,
  getWildCardConstraints,
  getPossibleNominations,
  validateNomination,
  getEffectiveCharacter,
  getEffectiveBodyPart,
  isNominated,
  requiresNomination,
  cloneCardWithNomination,
  getWildCardDescription,
  getCardDisplayName,
  createNominatedWildCard
} from '../wildcards';
import { Card, Character, BodyPart, CardType } from '../types';

describe('Wild Card System', () => {
  describe('nominateWildCard', () => {
    it('should nominate universal wild cards correctly', () => {
      const wildCard: Card = {
        id: 'universal_wild',
        type: CardType.WildUniversal,
        isFastCard: true
      };

      const success = nominateWildCard(wildCard, Character.Ninja, BodyPart.Head);

      expect(success).toBe(true);
      expect(wildCard.nomination).toEqual({
        character: Character.Ninja,
        bodyPart: BodyPart.Head
      });
    });

    it('should nominate character wild cards correctly', () => {
      const wildCard: Card = {
        id: 'ninja_wild',
        type: CardType.WildCharacter,
        character: Character.Ninja,
        isFastCard: true
      };

      const success = nominateWildCard(wildCard, Character.Ninja, BodyPart.Torso);

      expect(success).toBe(true);
      expect(wildCard.nomination).toEqual({
        character: Character.Ninja,
        bodyPart: BodyPart.Torso
      });
    });

    it('should nominate position wild cards correctly', () => {
      const wildCard: Card = {
        id: 'head_wild',
        type: CardType.WildPosition,
        bodyPart: BodyPart.Head,
        isFastCard: true
      };

      const success = nominateWildCard(wildCard, Character.Pirate, BodyPart.Head);

      expect(success).toBe(true);
      expect(wildCard.nomination).toEqual({
        character: Character.Pirate,
        bodyPart: BodyPart.Head
      });
    });

    it('should reject invalid nominations', () => {
      const wildCard: Card = {
        id: 'ninja_wild',
        type: CardType.WildCharacter,
        character: Character.Ninja,
        isFastCard: true
      };

      // Try to nominate as Pirate (should fail)
      const success = nominateWildCard(wildCard, Character.Pirate, BodyPart.Head);

      expect(success).toBe(false);
      expect(wildCard.nomination).toBeUndefined();
    });

    it('should reject nominations for regular cards', () => {
      const regularCard: Card = {
        id: 'regular',
        type: CardType.Regular,
        character: Character.Ninja,
        bodyPart: BodyPart.Head,
        isFastCard: false
      };

      const success = nominateWildCard(regularCard, Character.Ninja, BodyPart.Head);

      expect(success).toBe(false);
    });
  });

  describe('resetWildCard', () => {
    it('should reset wild card nomination', () => {
      const wildCard: Card = {
        id: 'wild',
        type: CardType.WildUniversal,
        isFastCard: true,
        nomination: { character: Character.Ninja, bodyPart: BodyPart.Head }
      };

      const success = resetWildCard(wildCard);

      expect(success).toBe(true);
      expect(wildCard.nomination).toBeUndefined();
    });

    it('should fail for regular cards', () => {
      const regularCard: Card = {
        id: 'regular',
        type: CardType.Regular,
        character: Character.Ninja,
        bodyPart: BodyPart.Head,
        isFastCard: false
      };

      const success = resetWildCard(regularCard);

      expect(success).toBe(false);
    });
  });

  describe('canNominate', () => {
    it('should allow valid character wild nominations', () => {
      const ninjaWild: Card = {
        id: 'ninja_wild',
        type: CardType.WildCharacter,
        character: Character.Ninja,
        isFastCard: true
      };

      expect(canNominate(ninjaWild, Character.Ninja, BodyPart.Head)).toBe(true);
      expect(canNominate(ninjaWild, Character.Ninja, BodyPart.Torso)).toBe(true);
      expect(canNominate(ninjaWild, Character.Ninja, BodyPart.Legs)).toBe(true);
    });

    it('should reject invalid character wild nominations', () => {
      const ninjaWild: Card = {
        id: 'ninja_wild',
        type: CardType.WildCharacter,
        character: Character.Ninja,
        isFastCard: true
      };

      expect(canNominate(ninjaWild, Character.Pirate, BodyPart.Head)).toBe(false);
      expect(canNominate(ninjaWild, Character.Zombie, BodyPart.Torso)).toBe(false);
    });

    it('should allow valid position wild nominations', () => {
      const headWild: Card = {
        id: 'head_wild',
        type: CardType.WildPosition,
        bodyPart: BodyPart.Head,
        isFastCard: true
      };

      expect(canNominate(headWild, Character.Ninja, BodyPart.Head)).toBe(true);
      expect(canNominate(headWild, Character.Pirate, BodyPart.Head)).toBe(true);
      expect(canNominate(headWild, Character.Zombie, BodyPart.Head)).toBe(true);
    });

    it('should reject invalid position wild nominations', () => {
      const headWild: Card = {
        id: 'head_wild',
        type: CardType.WildPosition,
        bodyPart: BodyPart.Head,
        isFastCard: true
      };

      expect(canNominate(headWild, Character.Ninja, BodyPart.Torso)).toBe(false);
      expect(canNominate(headWild, Character.Pirate, BodyPart.Legs)).toBe(false);
    });

    it('should allow any nomination for universal wilds', () => {
      const universalWild: Card = {
        id: 'universal',
        type: CardType.WildUniversal,
        isFastCard: true
      };

      expect(canNominate(universalWild, Character.Ninja, BodyPart.Head)).toBe(true);
      expect(canNominate(universalWild, Character.Pirate, BodyPart.Torso)).toBe(true);
      expect(canNominate(universalWild, Character.Zombie, BodyPart.Legs)).toBe(true);
      expect(canNominate(universalWild, Character.Robot, BodyPart.Head)).toBe(true);
    });

    it('should reject nominations for regular cards', () => {
      const regularCard: Card = {
        id: 'regular',
        type: CardType.Regular,
        character: Character.Ninja,
        bodyPart: BodyPart.Head,
        isFastCard: false
      };

      expect(canNominate(regularCard, Character.Ninja, BodyPart.Head)).toBe(false);
    });
  });

  describe('isWildCard', () => {
    it('should return true for wild cards', () => {
      const wildCards = [
        { id: '1', type: CardType.WildCharacter, character: Character.Ninja, isFastCard: true },
        { id: '2', type: CardType.WildPosition, bodyPart: BodyPart.Head, isFastCard: true },
        { id: '3', type: CardType.WildUniversal, isFastCard: true }
      ];

      wildCards.forEach(card => {
        expect(isWildCard(card)).toBe(true);
      });
    });

    it('should return false for regular cards', () => {
      const regularCard: Card = {
        id: 'regular',
        type: CardType.Regular,
        character: Character.Ninja,
        bodyPart: BodyPart.Head,
        isFastCard: false
      };

      expect(isWildCard(regularCard)).toBe(false);
    });
  });

  describe('isFastCard', () => {
    it('should return true for fast cards', () => {
      const fastCard: Card = {
        id: 'fast',
        type: CardType.WildUniversal,
        isFastCard: true
      };

      expect(isFastCard(fastCard)).toBe(true);
    });

    it('should return false for non-fast cards', () => {
      const regularCard: Card = {
        id: 'regular',
        type: CardType.Regular,
        character: Character.Ninja,
        bodyPart: BodyPart.Head,
        isFastCard: false
      };

      expect(isFastCard(regularCard)).toBe(false);
    });
  });

  describe('getWildCardConstraints', () => {
    it('should return correct constraints for character wilds', () => {
      const ninjaWild: Card = {
        id: 'ninja_wild',
        type: CardType.WildCharacter,
        character: Character.Ninja,
        isFastCard: true
      };

      const constraints = getWildCardConstraints(ninjaWild);

      expect(constraints.characters).toEqual([Character.Ninja]);
      expect(constraints.bodyParts).toEqual([BodyPart.Head, BodyPart.Torso, BodyPart.Legs]);
    });

    it('should return correct constraints for position wilds', () => {
      const headWild: Card = {
        id: 'head_wild',
        type: CardType.WildPosition,
        bodyPart: BodyPart.Head,
        isFastCard: true
      };

      const constraints = getWildCardConstraints(headWild);

      expect(constraints.characters).toEqual([Character.Ninja, Character.Pirate, Character.Zombie, Character.Robot]);
      expect(constraints.bodyParts).toEqual([BodyPart.Head]);
    });

    it('should return all options for universal wilds', () => {
      const universalWild: Card = {
        id: 'universal',
        type: CardType.WildUniversal,
        isFastCard: true
      };

      const constraints = getWildCardConstraints(universalWild);

      expect(constraints.characters).toEqual([Character.Ninja, Character.Pirate, Character.Zombie, Character.Robot]);
      expect(constraints.bodyParts).toEqual([BodyPart.Head, BodyPart.Torso, BodyPart.Legs]);
    });

    it('should return empty arrays for regular cards', () => {
      const regularCard: Card = {
        id: 'regular',
        type: CardType.Regular,
        character: Character.Ninja,
        bodyPart: BodyPart.Head,
        isFastCard: false
      };

      const constraints = getWildCardConstraints(regularCard);

      expect(constraints.characters).toEqual([]);
      expect(constraints.bodyParts).toEqual([]);
    });
  });

  describe('getPossibleNominations', () => {
    it('should generate all valid nominations for character wilds', () => {
      const ninjaWild: Card = {
        id: 'ninja_wild',
        type: CardType.WildCharacter,
        character: Character.Ninja,
        isFastCard: true
      };

      const nominations = getPossibleNominations(ninjaWild);

      expect(nominations).toHaveLength(3); // 1 character × 3 body parts
      expect(nominations.every(n => n.character === Character.Ninja)).toBe(true);
      expect(nominations.some(n => n.bodyPart === BodyPart.Head)).toBe(true);
      expect(nominations.some(n => n.bodyPart === BodyPart.Torso)).toBe(true);
      expect(nominations.some(n => n.bodyPart === BodyPart.Legs)).toBe(true);
    });

    it('should generate all valid nominations for position wilds', () => {
      const headWild: Card = {
        id: 'head_wild',
        type: CardType.WildPosition,
        bodyPart: BodyPart.Head,
        isFastCard: true
      };

      const nominations = getPossibleNominations(headWild);

      expect(nominations).toHaveLength(4); // 4 characters × 1 body part
      expect(nominations.every(n => n.bodyPart === BodyPart.Head)).toBe(true);
      expect(nominations.some(n => n.character === Character.Ninja)).toBe(true);
      expect(nominations.some(n => n.character === Character.Pirate)).toBe(true);
      expect(nominations.some(n => n.character === Character.Zombie)).toBe(true);
      expect(nominations.some(n => n.character === Character.Robot)).toBe(true);
    });

    it('should generate all valid nominations for universal wilds', () => {
      const universalWild: Card = {
        id: 'universal',
        type: CardType.WildUniversal,
        isFastCard: true
      };

      const nominations = getPossibleNominations(universalWild);

      expect(nominations).toHaveLength(12); // 4 characters × 3 body parts
    });

    it('should return empty array for regular cards', () => {
      const regularCard: Card = {
        id: 'regular',
        type: CardType.Regular,
        character: Character.Ninja,
        bodyPart: BodyPart.Head,
        isFastCard: false
      };

      const nominations = getPossibleNominations(regularCard);

      expect(nominations).toHaveLength(0);
    });
  });

  describe('validateNomination', () => {
    it('should validate correct nominations', () => {
      const ninjaWild: Card = {
        id: 'ninja_wild',
        type: CardType.WildCharacter,
        character: Character.Ninja,
        isFastCard: true
      };

      const validNomination = { character: Character.Ninja, bodyPart: BodyPart.Head };
      const invalidNomination = { character: Character.Pirate, bodyPart: BodyPart.Head };

      expect(validateNomination(ninjaWild, validNomination)).toBe(true);
      expect(validateNomination(ninjaWild, invalidNomination)).toBe(false);
    });
  });

  describe('getEffectiveCharacter', () => {
    it('should return nomination character for nominated cards', () => {
      const wildCard: Card = {
        id: 'wild',
        type: CardType.WildUniversal,
        isFastCard: true,
        nomination: { character: Character.Ninja, bodyPart: BodyPart.Head }
      };

      expect(getEffectiveCharacter(wildCard)).toBe(Character.Ninja);
    });

    it('should return card character for non-nominated cards', () => {
      const regularCard: Card = {
        id: 'regular',
        type: CardType.Regular,
        character: Character.Pirate,
        bodyPart: BodyPart.Head,
        isFastCard: false
      };

      expect(getEffectiveCharacter(regularCard)).toBe(Character.Pirate);
    });

    it('should return undefined for unnominated wild cards', () => {
      const wildCard: Card = {
        id: 'wild',
        type: CardType.WildUniversal,
        isFastCard: true
      };

      expect(getEffectiveCharacter(wildCard)).toBeUndefined();
    });
  });

  describe('getEffectiveBodyPart', () => {
    it('should return nomination body part for nominated cards', () => {
      const wildCard: Card = {
        id: 'wild',
        type: CardType.WildUniversal,
        isFastCard: true,
        nomination: { character: Character.Ninja, bodyPart: BodyPart.Torso }
      };

      expect(getEffectiveBodyPart(wildCard)).toBe(BodyPart.Torso);
    });

    it('should return card body part for non-nominated cards', () => {
      const regularCard: Card = {
        id: 'regular',
        type: CardType.Regular,
        character: Character.Pirate,
        bodyPart: BodyPart.Legs,
        isFastCard: false
      };

      expect(getEffectiveBodyPart(regularCard)).toBe(BodyPart.Legs);
    });

    it('should return undefined for unnominated wild cards', () => {
      const wildCard: Card = {
        id: 'wild',
        type: CardType.WildUniversal,
        isFastCard: true
      };

      expect(getEffectiveBodyPart(wildCard)).toBeUndefined();
    });
  });

  describe('isNominated', () => {
    it('should return true for nominated wild cards', () => {
      const nominatedWild: Card = {
        id: 'wild',
        type: CardType.WildUniversal,
        isFastCard: true,
        nomination: { character: Character.Ninja, bodyPart: BodyPart.Head }
      };

      expect(isNominated(nominatedWild)).toBe(true);
    });

    it('should return false for unnominated wild cards', () => {
      const wildCard: Card = {
        id: 'wild',
        type: CardType.WildUniversal,
        isFastCard: true
      };

      expect(isNominated(wildCard)).toBe(false);
    });

    it('should return false for regular cards', () => {
      const regularCard: Card = {
        id: 'regular',
        type: CardType.Regular,
        character: Character.Ninja,
        bodyPart: BodyPart.Head,
        isFastCard: false
      };

      expect(isNominated(regularCard)).toBe(false);
    });
  });

  describe('requiresNomination', () => {
    it('should return true for unnominated wild cards', () => {
      const wildCard: Card = {
        id: 'wild',
        type: CardType.WildUniversal,
        isFastCard: true
      };

      expect(requiresNomination(wildCard)).toBe(true);
    });

    it('should return false for nominated wild cards', () => {
      const nominatedWild: Card = {
        id: 'wild',
        type: CardType.WildUniversal,
        isFastCard: true,
        nomination: { character: Character.Ninja, bodyPart: BodyPart.Head }
      };

      expect(requiresNomination(nominatedWild)).toBe(false);
    });

    it('should return false for regular cards', () => {
      const regularCard: Card = {
        id: 'regular',
        type: CardType.Regular,
        character: Character.Ninja,
        bodyPart: BodyPart.Head,
        isFastCard: false
      };

      expect(requiresNomination(regularCard)).toBe(false);
    });
  });

  describe('cloneCardWithNomination', () => {
    it('should clone card with new nomination', () => {
      const originalCard: Card = {
        id: 'wild',
        type: CardType.WildUniversal,
        isFastCard: true
      };

      const nomination = { character: Character.Ninja, bodyPart: BodyPart.Head };
      const clonedCard = cloneCardWithNomination(originalCard, nomination);

      expect(clonedCard).not.toBe(originalCard);
      expect(clonedCard.id).toBe(originalCard.id);
      expect(clonedCard.nomination).toEqual(nomination);
      expect(originalCard.nomination).toBeUndefined();
    });
  });

  describe('getWildCardDescription', () => {
    it('should describe character wild cards', () => {
      const ninjaWild: Card = {
        id: 'ninja_wild',
        type: CardType.WildCharacter,
        character: Character.Ninja,
        isFastCard: true
      };

      expect(getWildCardDescription(ninjaWild)).toBe('Wild ninja (any body part)');
    });

    it('should describe position wild cards', () => {
      const headWild: Card = {
        id: 'head_wild',
        type: CardType.WildPosition,
        bodyPart: BodyPart.Head,
        isFastCard: true
      };

      expect(getWildCardDescription(headWild)).toBe('Wild head (any character)');
    });

    it('should describe universal wild cards', () => {
      const universalWild: Card = {
        id: 'universal',
        type: CardType.WildUniversal,
        isFastCard: true
      };

      expect(getWildCardDescription(universalWild)).toBe('Wild Universal (any character, any body part)');
    });

    it('should describe regular cards', () => {
      const regularCard: Card = {
        id: 'regular',
        type: CardType.Regular,
        character: Character.Ninja,
        bodyPart: BodyPart.Head,
        isFastCard: false
      };

      expect(getWildCardDescription(regularCard)).toBe('ninja head');
    });
  });

  describe('getCardDisplayName', () => {
    it('should show nomination for nominated cards', () => {
      const nominatedWild: Card = {
        id: 'wild',
        type: CardType.WildUniversal,
        isFastCard: true,
        nomination: { character: Character.Ninja, bodyPart: BodyPart.Head }
      };

      const displayName = getCardDisplayName(nominatedWild);
      expect(displayName).toContain('ninja head');
      expect(displayName).toContain('Wild Universal');
    });

    it('should show base description for unnominated cards', () => {
      const wildCard: Card = {
        id: 'wild',
        type: CardType.WildUniversal,
        isFastCard: true
      };

      expect(getCardDisplayName(wildCard)).toBe('Wild Universal (any character, any body part)');
    });
  });

  describe('createNominatedWildCard', () => {
    it('should create valid nominated wild cards', () => {
      const nomination = { character: Character.Ninja, bodyPart: BodyPart.Head };
      
      const card = createNominatedWildCard(
        CardType.WildUniversal, 
        Character.Ninja, 
        BodyPart.Head, 
        nomination,
        'test_id'
      );

      expect(card).toBeTruthy();
      expect(card!.id).toBe('test_id');
      expect(card!.type).toBe(CardType.WildUniversal);
      expect(card!.nomination).toEqual(nomination);
    });

    it('should return null for invalid nominations', () => {
      const invalidNomination = { character: Character.Pirate, bodyPart: BodyPart.Head };
      
      const card = createNominatedWildCard(
        CardType.WildCharacter,
        Character.Ninja, // Card is Ninja wild
        BodyPart.Head,
        invalidNomination, // But nominated as Pirate
        'test_id'
      );

      expect(card).toBeNull();
    });

    it('should generate ID when not provided', () => {
      const nomination = { character: Character.Ninja, bodyPart: BodyPart.Head };
      
      const card = createNominatedWildCard(
        CardType.WildUniversal,
        Character.Ninja,
        BodyPart.Head,
        nomination
      );

      expect(card).toBeTruthy();
      expect(card!.id).toBeTruthy();
      expect(card!.id).toContain('wild_');
    });
  });
});