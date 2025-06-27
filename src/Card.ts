export enum Character {
  Ninja = 'ninja',
  Pirate = 'pirate',
  Zombie = 'zombie',
  Robot = 'robot',
  Wild = 'wild'
}

export enum BodyPart {
  Head = 'head',
  Torso = 'torso',
  Legs = 'legs',
  Wild = 'wild'
}

export interface CardNomination {
  character: Character;
  bodyPart: BodyPart;
}

export class Card {
  private nomination?: CardNomination;

  constructor(
    public readonly id: string,
    public readonly character: Character,
    public readonly bodyPart: BodyPart
  ) {}

  isWild(): boolean {
    return this.character === Character.Wild || this.bodyPart === BodyPart.Wild;
  }

  canFitPile(targetCharacter?: Character, targetBodyPart?: BodyPart): boolean {
    // Regular cards must match exactly
    if (this.character !== Character.Wild && this.bodyPart !== BodyPart.Wild) {
      return this.character === targetCharacter && this.bodyPart === targetBodyPart;
    }

    // Character-specific wild (specific character + wild body part)
    if (this.character !== Character.Wild && this.bodyPart === BodyPart.Wild) {
      return this.character === targetCharacter;
    }

    // Position-specific wild (wild character + specific body part)
    if (this.character === Character.Wild && this.bodyPart !== BodyPart.Wild) {
      return this.bodyPart === targetBodyPart;
    }

    // Universal wild (wild character + wild body part)
    if (this.character === Character.Wild && this.bodyPart === BodyPart.Wild) {
      return true;
    }

    return false;
  }

  getEffectiveCharacter(): Character {
    return this.nomination?.character || this.character;
  }

  getEffectiveBodyPart(): BodyPart {
    return this.nomination?.bodyPart || this.bodyPart;
  }

  nominate(character: Character, bodyPart: BodyPart): void {
    if (!this.isWild()) {
      throw new Error('Cannot nominate non-wild card');
    }
    this.nomination = { character, bodyPart };
  }

  clearNomination(): void {
    this.nomination = undefined;
  }

  hasNomination(): boolean {
    return this.nomination !== undefined;
  }

  getNomination(): CardNomination | undefined {
    return this.nomination;
  }

  canContinueTurn(): boolean {
    return this.isWild();
  }

  isSameCard(other: Card): boolean {
    return this.id === other.id;
  }

  toString(): string {
    const base = `${this.character} ${this.bodyPart}`;
    if (this.nomination) {
      return `${base} (nominated as ${this.nomination.character} ${this.nomination.bodyPart})`;
    }
    return base;
  }

  clone(): Card {
    const newCard = new Card(this.id, this.character, this.bodyPart);
    if (this.nomination) {
      newCard.nomination = { ...this.nomination };
    }
    return newCard;
  }
}