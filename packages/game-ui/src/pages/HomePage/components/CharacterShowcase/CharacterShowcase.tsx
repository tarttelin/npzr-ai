import React from 'react';
import { getCharacterFontClass } from '../../../../utils/characterUtils';
import './CharacterShowcase.css';

export const CharacterShowcase: React.FC = () => {
  return (
    <section className="characters section" aria-labelledby="characters-heading">
      <div className="container">
        <h2 id="characters-heading">Meet the Warriors</h2>
        <div className="character-grid">
          <article className="character-card ninja" tabIndex={0}>
            <div className="character-icon ninja-large" aria-hidden="true"></div>
            <h3 className={getCharacterFontClass('ninja')}>NINJA</h3>
            <p className={getCharacterFontClass('ninja')}>Silent. Deadly. Unstoppable.</p>
            <div className="character-stats">
              <span className={`stat ${getCharacterFontClass('ninja')}`}>Stealth Master</span>
            </div>
          </article>
          
          <article className="character-card pirate" tabIndex={0}>
            <div className="character-icon pirate-large" aria-hidden="true"></div>
            <h3 className={getCharacterFontClass('pirate')}>PIRATE</h3>
            <p className={getCharacterFontClass('pirate')}>Fearless. Cunning. Ruthless.</p>
            <div className="character-stats">
              <span className={`stat ${getCharacterFontClass('pirate')}`}>Sea Dominator</span>
            </div>
          </article>
          
          <article className="character-card zombie" tabIndex={0}>
            <div className="character-icon zombie-large" aria-hidden="true"></div>
            <h3 className={getCharacterFontClass('zombie')}>ZOMBIE</h3>
            <p className={getCharacterFontClass('zombie')}>Relentless. Hungry. Undying.</p>
            <div className="character-stats">
              <span className={`stat ${getCharacterFontClass('zombie')}`}>Undead Horde</span>
            </div>
          </article>
          
          <article className="character-card robot" tabIndex={0}>
            <div className="character-icon robot-large" aria-hidden="true"></div>
            <h3 className={getCharacterFontClass('robot')}>ROBOT</h3>
            <p className={getCharacterFontClass('robot')}>Precise. Powerful. Programmed to win.</p>
            <div className="character-stats">
              <span className={`stat ${getCharacterFontClass('robot')}`}>Tech Supremacy</span>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
};