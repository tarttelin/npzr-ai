import React from 'react';
import { getCharacterLetter, getCharacterFontClass } from '../../../../utils/characterUtils';
import { CharacterType } from '../../../../types/GameUI.types';
import './HeroSection.css';

export const HeroSection: React.FC = () => {
  const characters: CharacterType[] = ['ninja', 'pirate', 'zombie', 'robot'];

  return (
    <section className="hero-section">
      <div className="container">
        <div className="hero-content">
          <div className="game-logo">
            <h1 className="game-title">
              {characters.map(character => (
                <span 
                  key={character}
                  className={`character-letter ${getCharacterFontClass(character)} ${character}-letter`}
                >
                  {getCharacterLetter(character)}
                </span>
              ))}
            </h1>
            <p className="tagline">The Ultimate Tactical Card Game</p>
          </div>
          
          <div className="character-showcase" aria-label="Game characters showcase">
            <div className="character-hero ninja-hero" aria-label="Ninja character">
              <div className="character-icon ninja-icon"></div>
              <span className={`character-name ${getCharacterFontClass('ninja')}`}>NINJA</span>
            </div>
            <div className="character-hero pirate-hero" aria-label="Pirate character">
              <div className="character-icon pirate-icon"></div>
              <span className={`character-name ${getCharacterFontClass('pirate')}`}>PIRATE</span>
            </div>
            <div className="character-hero zombie-hero" aria-label="Zombie character">
              <div className="character-icon zombie-icon"></div>
              <span className={`character-name ${getCharacterFontClass('zombie')}`}>ZOMBIE</span>
            </div>
            <div className="character-hero robot-hero" aria-label="Robot character">
              <div className="character-icon robot-icon"></div>
              <span className={`character-name ${getCharacterFontClass('robot')}`}>ROBOT</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};