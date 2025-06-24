import { Card, Character, BodyPart, CardType } from './types.js';

export function createDeck(): Card[] {
  const cards: Card[] = [];
  let cardId = 1;

  // Create regular cards: 4 characters × 3 body parts × 3 copies = 36 cards
  for (const character of Object.values(Character)) {
    for (const bodyPart of Object.values(BodyPart)) {
      for (let copy = 0; copy < 3; copy++) {
        cards.push({
          id: `${cardId++}`,
          type: CardType.Regular,
          character,
          bodyPart,
          isFastCard: false
        });
      }
    }
  }

  // Create wild cards: 8 total
  // 4 character-specific wilds (one for each character)
  for (const character of Object.values(Character)) {
    cards.push({
      id: `${cardId++}`,
      type: CardType.WildCharacter,
      character,
      isFastCard: true
    });
  }

  // 3 position-specific wilds (one for each body part)
  for (const bodyPart of Object.values(BodyPart)) {
    cards.push({
      id: `${cardId++}`,
      type: CardType.WildPosition,
      bodyPart,
      isFastCard: true
    });
  }

  // 1 universal wild card
  cards.push({
    id: `${cardId++}`,
    type: CardType.WildUniversal,
    isFastCard: true
  });

  return cards;
}

export function shuffleDeck(deck: Card[]): void {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

export function isWildCard(card: Card): boolean {
  return card.type !== CardType.Regular;
}

export function canCardFitPile(card: Card, targetCharacter?: Character, targetBodyPart?: BodyPart): boolean {
  if (card.type === CardType.Regular) {
    return card.character === targetCharacter && card.bodyPart === targetBodyPart;
  }

  if (card.type === CardType.WildCharacter) {
    return card.character === targetCharacter;
  }

  if (card.type === CardType.WildPosition) {
    return card.bodyPart === targetBodyPart;
  }

  if (card.type === CardType.WildUniversal) {
    return true;
  }

  return false;
}

export function getCardEffectiveProperties(card: Card): { character?: Character; bodyPart?: BodyPart } {
  if (card.nomination) {
    return {
      character: card.nomination.character,
      bodyPart: card.nomination.bodyPart
    };
  }

  return {
    character: card.character,
    bodyPart: card.bodyPart
  };
}