import { getCharacterLetter, formatCompletedCharacters, getCharacterColor } from './characterUtils';
import { CharacterType } from '../types/GameUI.types';

describe('characterUtils', () => {
  describe('getCharacterLetter', () => {
    it('returns correct letters for all character types', () => {
      expect(getCharacterLetter('ninja')).toBe('N');
      expect(getCharacterLetter('pirate')).toBe('P');
      expect(getCharacterLetter('zombie')).toBe('Z');
      expect(getCharacterLetter('robot')).toBe('R');
    });
  });

  describe('formatCompletedCharacters', () => {
    it('returns empty string for empty array', () => {
      expect(formatCompletedCharacters([])).toBe('');
    });

    it('formats single character correctly', () => {
      expect(formatCompletedCharacters(['ninja'])).toBe('N');
    });

    it('formats multiple characters correctly', () => {
      expect(formatCompletedCharacters(['robot', 'pirate', 'ninja', 'pirate'])).toBe('RPNP');
    });

    it('handles all character types', () => {
      const allCharacters: CharacterType[] = ['ninja', 'pirate', 'zombie', 'robot'];
      expect(formatCompletedCharacters(allCharacters)).toBe('NPZR');
    });

    it('preserves order of completion', () => {
      expect(formatCompletedCharacters(['zombie', 'ninja', 'robot'])).toBe('ZNR');
    });
  });

  describe('getCharacterColor', () => {
    it('returns correct colors for all character types', () => {
      expect(getCharacterColor('ninja')).toBe('#2C2C2C');
      expect(getCharacterColor('pirate')).toBe('#DC143C');
      expect(getCharacterColor('zombie')).toBe('#32CD32');
      expect(getCharacterColor('robot')).toBe('#FFD700');
    });

    it('returns default color for invalid character', () => {
      expect(getCharacterColor('invalid' as CharacterType)).toBe('#666666');
    });
  });
});