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

/**
 * Get the font class for a character type
 */
export function getCharacterFontClass(character: CharacterType): string {
  switch (character) {
    case 'ninja':
      return 'font-ninja';
    case 'pirate':
      return 'font-pirate';
    case 'zombie':
      return 'font-zombie';
    case 'robot':
      return 'font-robot';
    default:
      return '';
  }
}

/**
 * Get the theme class for a character type
 */
export function getCharacterThemeClass(character: CharacterType): string {
  switch (character) {
    case 'ninja':
      return 'ninja-theme';
    case 'pirate':
      return 'pirate-theme';
    case 'zombie':
      return 'zombie-theme';
    case 'robot':
      return 'robot-theme';
    default:
      return '';
  }
}

/**
 * Get the text effect class for a character type
 */
export function getCharacterTextEffectClass(character: CharacterType): string {
  switch (character) {
    case 'ninja':
      return 'ninja-text-effect';
    case 'pirate':
      return 'pirate-text-effect';
    case 'zombie':
      return 'zombie-text-effect';
    case 'robot':
      return 'robot-text-effect';
    default:
      return '';
  }
}

/**
 * Get all character styling classes combined
 */
export function getCharacterClasses(character: CharacterType, includeEffects = true): string {
  const classes = [
    getCharacterFontClass(character),
    getCharacterThemeClass(character),
  ];
  
  if (includeEffects) {
    classes.push(getCharacterTextEffectClass(character));
  }
  
  return classes.filter(Boolean).join(' ');
}