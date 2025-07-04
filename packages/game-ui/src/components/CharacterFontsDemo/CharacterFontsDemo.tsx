import React from 'react';
import { CharacterType } from '../../types/GameUI.types';
import { 
  getCharacterLetter, 
  getCharacterClasses,
  getCharacterFontClass,
  getCharacterColor
} from '../../utils/characterUtils';
import './CharacterFontsDemo.css';

interface CharacterFontsDemoProps {
  showEffects?: boolean;
  className?: string;
}

const characters: CharacterType[] = ['ninja', 'pirate', 'zombie', 'robot'];

const characterNames = {
  ninja: 'Ninja',
  pirate: 'Pirate', 
  zombie: 'Zombie',
  robot: 'Robot'
} as const;

const characterDescriptions = {
  ninja: 'Silent, swift, and deadly',
  pirate: 'Swashbuckling sea adventurer',
  zombie: 'Undead horror from beyond',
  robot: 'Mechanical precision machine'
} as const;

/**
 * Demo component showcasing character-specific fonts
 */
export const CharacterFontsDemo: React.FC<CharacterFontsDemoProps> = ({ 
  showEffects = true,
  className = ''
}) => {
  return (
    <div className={`character-fonts-demo ${className}`}>
      <div className="demo-header">
        <h1 className="demo-title">NPZR Character Fonts</h1>
        <p className="demo-subtitle">
          Meet the Warriors - Each with their own distinctive style
        </p>
      </div>

      <div className="characters-grid">
        {characters.map(character => (
          <div 
            key={character}
            className={`character-card ${getCharacterFontClass(character)}`}
            style={{ 
              borderColor: getCharacterColor(character),
              '--character-color': getCharacterColor(character)
            } as React.CSSProperties}
          >
            <div className="character-letter-display">
              <span 
                className={`character-letter ${showEffects ? getCharacterClasses(character) : getCharacterFontClass(character)}`}
              >
                {getCharacterLetter(character)}
              </span>
            </div>
            
            <div className="character-info">
              <h2 
                className={`character-name ${showEffects ? getCharacterClasses(character, false) : getCharacterFontClass(character)}`}
              >
                {characterNames[character]}
              </h2>
              
              <p 
                className={`character-description ${getCharacterFontClass(character)}`}
                style={{ color: getCharacterColor(character) }}
              >
                {characterDescriptions[character]}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="demo-controls">
        <h3>Font Specifications:</h3>
        <div className="font-specs">
          <div className="spec-item">
            <strong>Ninja:</strong> Impact/Arial Black (Bold, Sharp)
          </div>
          <div className="spec-item">
            <strong>Robot:</strong> DS-Digital/Orbitron (7-Segment LCD)
          </div>
          <div className="spec-item">
            <strong>Pirate:</strong> Dancing Script/Pacifico (Cursive Script)
          </div>
          <div className="spec-item">
            <strong>Zombie:</strong> Creepster (Horror/Spooky)
          </div>
        </div>
      </div>
    </div>
  );
};