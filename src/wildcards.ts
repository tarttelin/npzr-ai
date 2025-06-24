import { Card, Character, BodyPart, CardType, CardNomination } from './types.js';

export function nominateWildCard(card: Card, character: Character, bodyPart: BodyPart): boolean {
  if (!isWildCard(card)) {
    return false;
  }

  // Validate nomination based on wild card type
  if (!canNominate(card, character, bodyPart)) {
    return false;
  }

  card.nomination = { character, bodyPart };
  return true;
}

export function resetWildCard(card: Card): boolean {
  if (!isWildCard(card)) {
    return false;
  }

  delete card.nomination;
  return true;
}

export function canNominate(card: Card, character: Character, bodyPart: BodyPart): boolean {
  switch (card.type) {
    case CardType.WildCharacter:
      // Must match the card's character, can be any body part
      return card.character === character;
    
    case CardType.WildPosition:
      // Must match the card's body part, can be any character
      return card.bodyPart === bodyPart;
    
    case CardType.WildUniversal:
      // Can be any character and any body part
      return true;
    
    case CardType.Regular:
      // Regular cards cannot be nominated
      return false;
    
    default:
      return false;
  }
}

export function isWildCard(card: Card): boolean {
  return card.type !== CardType.Regular;
}

export function isFastCard(card: Card): boolean {
  return card.isFastCard;
}

export function getWildCardConstraints(card: Card): { 
  characters: Character[]; 
  bodyParts: BodyPart[]; 
} {
  switch (card.type) {
    case CardType.WildCharacter:
      return {
        characters: card.character ? [card.character] : [],
        bodyParts: Object.values(BodyPart)
      };
    
    case CardType.WildPosition:
      return {
        characters: Object.values(Character),
        bodyParts: card.bodyPart ? [card.bodyPart] : []
      };
    
    case CardType.WildUniversal:
      return {
        characters: Object.values(Character),
        bodyParts: Object.values(BodyPart)
      };
    
    case CardType.Regular:
    default:
      return {
        characters: [],
        bodyParts: []
      };
  }
}

export function getPossibleNominations(card: Card): CardNomination[] {
  const constraints = getWildCardConstraints(card);
  const nominations: CardNomination[] = [];

  for (const character of constraints.characters) {
    for (const bodyPart of constraints.bodyParts) {
      nominations.push({ character, bodyPart });
    }
  }

  return nominations;
}

export function validateNomination(card: Card, nomination: CardNomination): boolean {
  return canNominate(card, nomination.character, nomination.bodyPart);
}

export function getEffectiveCharacter(card: Card): Character | undefined {
  if (card.nomination) {
    return card.nomination.character;
  }
  return card.character;
}

export function getEffectiveBodyPart(card: Card): BodyPart | undefined {
  if (card.nomination) {
    return card.nomination.bodyPart;
  }
  return card.bodyPart;
}

export function isNominated(card: Card): boolean {
  return isWildCard(card) && card.nomination !== undefined;
}

export function requiresNomination(card: Card): boolean {
  return isWildCard(card) && card.nomination === undefined;
}

export function cloneCardWithNomination(card: Card, nomination: CardNomination): Card {
  const clonedCard: Card = {
    ...card,
    nomination: { ...nomination }
  };
  return clonedCard;
}

export function getWildCardDescription(card: Card): string {
  switch (card.type) {
    case CardType.WildCharacter:
      return `Wild ${card.character} (any body part)`;
    
    case CardType.WildPosition:
      return `Wild ${card.bodyPart} (any character)`;
    
    case CardType.WildUniversal:
      return 'Wild Universal (any character, any body part)';
    
    case CardType.Regular:
      return `${card.character} ${card.bodyPart}`;
    
    default:
      return 'Unknown card type';
  }
}

export function getCardDisplayName(card: Card): string {
  if (card.nomination) {
    return `${card.nomination.character} ${card.nomination.bodyPart} (${getWildCardDescription(card)})`;
  }
  
  return getWildCardDescription(card);
}

// Helper function for testing and validation
export function createNominatedWildCard(
  type: CardType.WildCharacter | CardType.WildPosition | CardType.WildUniversal,
  character: Character,
  bodyPart: BodyPart,
  nomination: CardNomination,
  id?: string
): Card | null {
  const card: Card = {
    id: id || `wild_${Date.now()}`,
    type,
    isFastCard: true
  };

  if (type === CardType.WildCharacter) {
    card.character = character;
  } else if (type === CardType.WildPosition) {
    card.bodyPart = bodyPart;
  }

  if (nominateWildCard(card, nomination.character, nomination.bodyPart)) {
    return card;
  }

  return null;
}