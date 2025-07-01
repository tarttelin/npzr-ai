import { Card, Character, BodyPart } from './Card.js';

export interface TopCards {
  head?: Card;
  torso?: Card;
  legs?: Card;
}

export class Stack {
  private heads: Card[] = [];
  private torsos: Card[] = [];
  private legs: Card[] = [];

  constructor(
    private readonly stackId: string,
    private readonly ownerId: string
  ) {}

  getId(): string {
    return this.stackId;
  }

  getOwnerId(): string {
    return this.ownerId;
  }

  getHeads(): Card[] {
    return [...this.heads];
  }

  getTorsos(): Card[] {
    return [...this.torsos];
  }

  getLegs(): Card[] {
    return [...this.legs];
  }

  isComplete(): boolean {
    const topCards = this.getTopCards();
    if (!topCards.head || !topCards.torso || !topCards.legs) {
      return false;
    }

    const headChar = topCards.head.getEffectiveCharacter();
    const torsoChar = topCards.torso.getEffectiveCharacter();
    const legsChar = topCards.legs.getEffectiveCharacter();

    return headChar === torsoChar && torsoChar === legsChar && headChar !== Character.Wild;
  }

  getTopCards(): TopCards {
    return {
      head: this.heads.length > 0 ? this.heads[this.heads.length - 1] : undefined,
      torso: this.torsos.length > 0 ? this.torsos[this.torsos.length - 1] : undefined,
      legs: this.legs.length > 0 ? this.legs[this.legs.length - 1] : undefined
    };
  }

  getCompletedCharacter(): Character | null {
    if (!this.isComplete()) {
      return null;
    }
    const topCards = this.getTopCards();
    return topCards.head!.getEffectiveCharacter();
  }

  addCard(card: Card, pile: BodyPart): void {
    if (!this.canAcceptCard(card, pile)) {
      throw new Error(`Cannot add ${card.toString()} to ${pile} pile of stack ${this.stackId}`);
    }

    switch (pile) {
      case BodyPart.Head:
        this.heads.push(card);
        break;
      case BodyPart.Torso:
        this.torsos.push(card);
        break;
      case BodyPart.Legs:
        this.legs.push(card);
        break;
      default:
        throw new Error(`Invalid pile: ${pile}`);
    }
  }

  removeCard(pile: BodyPart): Card | null {
    switch (pile) {
      case BodyPart.Head:
        return this.heads.pop() || null;
      case BodyPart.Torso:
        return this.torsos.pop() || null;
      case BodyPart.Legs:
        return this.legs.pop() || null;
      default:
        throw new Error(`Invalid pile: ${pile}`);
    }
  }

  canAcceptCard(card: Card, pile: BodyPart): boolean {
    if (pile === BodyPart.Wild) {
      return false; // Cannot place cards on wild piles
    }

    return (card.bodyPart === BodyPart.Wild || card.bodyPart === pile)
  }

  hasCards(): boolean {
    return this.heads.length > 0 || this.torsos.length > 0 || this.legs.length > 0;
  }

  isEmpty(): boolean {
    return !this.hasCards();
  }

  getCardCount(): number {
    return this.heads.length + this.torsos.length + this.legs.length;
  }

  hasCardInPile(cardId: string, pile: BodyPart): boolean {
    const cards = this.getCardsFromPile(pile);
    return cards.some(card => card.id === cardId);
  }

  hasCard(cardId: string): boolean {
    return this.hasCardInPile(cardId, BodyPart.Head) ||
           this.hasCardInPile(cardId, BodyPart.Torso) ||
           this.hasCardInPile(cardId, BodyPart.Legs);
  }

  getCardsFromPile(pile: BodyPart): Card[] {
    switch (pile) {
      case BodyPart.Head:
        return this.heads;
      case BodyPart.Torso:
        return this.torsos;
      case BodyPart.Legs:
        return this.legs;
      default:
        return [];
    }
  }

  toString(): string {
    const topCards = this.getTopCards();
    const parts = [
      topCards.head ? `Head: ${topCards.head.toString()}` : 'Head: empty',
      topCards.torso ? `Torso: ${topCards.torso.toString()}` : 'Torso: empty',
      topCards.legs ? `Legs: ${topCards.legs.toString()}` : 'Legs: empty'
    ];
    return `Stack ${this.stackId} (${this.ownerId}): ${parts.join(', ')} ${this.isComplete() ? '[COMPLETE]' : ''}`;
  }
}