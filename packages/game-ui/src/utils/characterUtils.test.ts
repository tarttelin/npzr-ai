import { 
  getCharacterLetter, 
  formatCompletedCharacters, 
  getCharacterColor,
  getCharacterFontClass,
  getCharacterThemeClass,
  getCharacterTextEffectClass,
  getCharacterClasses
} from './characterUtils';
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

  describe('getCharacterFontClass', () => {
    it('returns correct font classes for all character types', () => {
      expect(getCharacterFontClass('ninja')).toBe('font-ninja');
      expect(getCharacterFontClass('pirate')).toBe('font-pirate');
      expect(getCharacterFontClass('zombie')).toBe('font-zombie');
      expect(getCharacterFontClass('robot')).toBe('font-robot');
    });

    it('returns empty string for invalid character', () => {
      expect(getCharacterFontClass('invalid' as CharacterType)).toBe('');
    });
  });

  describe('getCharacterThemeClass', () => {
    it('returns correct theme classes for all character types', () => {
      expect(getCharacterThemeClass('ninja')).toBe('ninja-theme');
      expect(getCharacterThemeClass('pirate')).toBe('pirate-theme');
      expect(getCharacterThemeClass('zombie')).toBe('zombie-theme');
      expect(getCharacterThemeClass('robot')).toBe('robot-theme');
    });

    it('returns empty string for invalid character', () => {
      expect(getCharacterThemeClass('invalid' as CharacterType)).toBe('');
    });
  });

  describe('getCharacterTextEffectClass', () => {
    it('returns correct text effect classes for all character types', () => {
      expect(getCharacterTextEffectClass('ninja')).toBe('ninja-text-effect');
      expect(getCharacterTextEffectClass('pirate')).toBe('pirate-text-effect');
      expect(getCharacterTextEffectClass('zombie')).toBe('zombie-text-effect');
      expect(getCharacterTextEffectClass('robot')).toBe('robot-text-effect');
    });

    it('returns empty string for invalid character', () => {
      expect(getCharacterTextEffectClass('invalid' as CharacterType)).toBe('');
    });
  });

  describe('getCharacterClasses', () => {
    it('returns combined classes with effects by default', () => {
      expect(getCharacterClasses('ninja')).toBe('font-ninja ninja-theme ninja-text-effect');
      expect(getCharacterClasses('pirate')).toBe('font-pirate pirate-theme pirate-text-effect');
    });

    it('returns combined classes without effects when specified', () => {
      expect(getCharacterClasses('zombie', false)).toBe('font-zombie zombie-theme');
      expect(getCharacterClasses('robot', false)).toBe('font-robot robot-theme');
    });

    it('handles invalid characters gracefully', () => {
      expect(getCharacterClasses('invalid' as CharacterType)).toBe('');
      expect(getCharacterClasses('invalid' as CharacterType, false)).toBe('');
    });
  });
});