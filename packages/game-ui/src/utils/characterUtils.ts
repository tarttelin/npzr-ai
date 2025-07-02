import { CharacterType } from '../types/GameUI.types';

/**
 * Convert character type to display letter
 */
export function getCharacterLetter(character: CharacterType): string {
  switch (character) {
    case 'ninja':
      return 'N';
    case 'pirate':
      return 'P';
    case 'zombie':
      return 'Z';
    case 'robot':
      return 'R';
    default:
      return '';
  }
}

/**
 * Convert array of completed characters to display string
 * Example: ['robot', 'pirate', 'ninja', 'pirate'] => "RPNP"
 */
export function formatCompletedCharacters(characters: CharacterType[]): string {
  return characters.map(getCharacterLetter).join('');
}

/**
 * Get character color for styling
 */
export function getCharacterColor(character: CharacterType): string {
  switch (character) {
    case 'ninja':
      return '#2C2C2C'; // Dark gray/black
    case 'pirate':
      return '#DC143C'; // Crimson red
    case 'zombie':
      return '#32CD32'; // Lime green
    case 'robot':
      return '#FFD700'; // Gold
    default:
      return '#666666'; // Default gray
  }
}