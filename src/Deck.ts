import { Card, Character, BodyPart } from './Card.js';

export class Deck {
  private cards: Card[] = [];

  constructor() {
    this.initializeDeck();
    this.shuffle();
  }

  private initializeDeck(): void {
    this.cards = [];
    let cardId = 1;

    // Create regular cards: 4 characters × 3 body parts × 3 copies = 36 cards
    const regularCharacters = [Character.Ninja, Character.Pirate, Character.Zombie, Character.Robot];
    const regularBodyParts = [BodyPart.Head, BodyPart.Torso, BodyPart.Legs];

    for (const character of regularCharacters) {
      for (const bodyPart of regularBodyParts) {
        for (let copy = 0; copy < 3; copy++) {
          this.cards.push(new Card(`${cardId++}`, character, bodyPart));
        }
      }
    }

    // Create wild cards: 8 total
    // 4 character-specific wilds (wild character + specific body part)
    for (const character of regularCharacters) {
      this.cards.push(new Card(`${cardId++}`, character, BodyPart.Wild));
    }

    // 3 position-specific wilds (specific character + wild body part)
    for (const bodyPart of regularBodyParts) {
      this.cards.push(new Card(`${cardId++}`, Character.Wild, bodyPart));
    }

    // 1 universal wild card (wild character + wild body part)
    this.cards.push(new Card(`${cardId++}`, Character.Wild, BodyPart.Wild));
  }

  drawCard(): Card | null {
    if (this.isEmpty()) {
      return null;
    }
    return this.cards.pop()!;
  }

  size(): number {
    return this.cards.length;
  }

  isEmpty(): boolean {
    return this.cards.length === 0;
  }

  shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  reshuffle(cards: Card[]): void {
    // Clear nominations from reshuffled cards
    const cleanCards = cards.map(card => {
      const newCard = card.clone();
      newCard.clearNomination();
      return newCard;
    });
    
    this.cards = [...this.cards, ...cleanCards];
    this.shuffle();
  }

  peek(): Card | null {
    if (this.isEmpty()) {
      return null;
    }
    return this.cards[this.cards.length - 1];
  }
}