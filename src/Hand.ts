import { Card } from './Card.js';

export class Hand {
  private cards: Card[] = [];

  getCards(): Card[] {
    return [...this.cards];
  }

  size(): number {
    return this.cards.length;
  }

  hasCard(card: Card): boolean {
    return this.cards.some(c => c.isSameCard(card));
  }

  hasCardById(cardId: string): boolean {
    return this.cards.some(c => c.id === cardId);
  }

  getCardById(cardId: string): Card | null {
    return this.cards.find(c => c.id === cardId) || null;
  }

  canPlay(card: Card): boolean {
    return this.hasCard(card);
  }

  remove(card: Card): Card {
    const index = this.cards.findIndex(c => c.isSameCard(card));
    if (index === -1) {
      throw new Error(`Card ${card.id} not found in hand`);
    }
    return this.cards.splice(index, 1)[0];
  }

  removeById(cardId: string): Card {
    const index = this.cards.findIndex(c => c.id === cardId);
    if (index === -1) {
      throw new Error(`Card ${cardId} not found in hand`);
    }
    return this.cards.splice(index, 1)[0];
  }

  add(card: Card): void {
    this.cards.push(card);
  }

  isEmpty(): boolean {
    return this.cards.length === 0;
  }

  clear(): void {
    this.cards = [];
  }

  toString(): string {
    return this.cards.map(card => card.toString()).join(', ');
  }
}