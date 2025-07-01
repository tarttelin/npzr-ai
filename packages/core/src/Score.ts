import { Character } from './Card.js';

export class Score {
  private completedCharacters = new Set<Character>();

  getCompletedCharacters(): Set<Character> {
    return new Set(this.completedCharacters);
  }

  hasCharacter(character: Character): boolean {
    return this.completedCharacters.has(character);
  }

  addCharacter(character: Character): void {
    if (character === Character.Wild) {
      throw new Error('Cannot score Wild character');
    }
    this.completedCharacters.add(character);
  }

  isWinning(): boolean {
    const requiredCharacters = [Character.Ninja, Character.Pirate, Character.Zombie, Character.Robot];
    return requiredCharacters.every(char => this.completedCharacters.has(char));
  }

  size(): number {
    return this.completedCharacters.size;
  }

  getMissingCharacters(): Character[] {
    const requiredCharacters = [Character.Ninja, Character.Pirate, Character.Zombie, Character.Robot];
    return requiredCharacters.filter(char => !this.completedCharacters.has(char));
  }

  clear(): void {
    this.completedCharacters.clear();
  }

  toString(): string {
    const characters = Array.from(this.completedCharacters);
    return characters.length > 0 ? characters.join(', ') : 'No characters scored';
  }
}