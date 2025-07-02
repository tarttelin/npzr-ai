import React from 'react';
import './CharacterShowcase.css';

export const CharacterShowcase: React.FC = () => {
  return (
    <section className="characters section" aria-labelledby="characters-heading">
      <div className="container">
        <h2 id="characters-heading">Meet the Warriors</h2>
        <div className="character-grid">
          <article className="character-card ninja" tabIndex={0}>
            <div className="character-icon ninja-large" aria-hidden="true"></div>
            <h3>NINJA</h3>
            <p>Silent. Deadly. Unstoppable.</p>
            <div className="character-stats">
              <span className="stat">Stealth Master</span>
            </div>
          </article>
          
          <article className="character-card pirate" tabIndex={0}>
            <div className="character-icon pirate-large" aria-hidden="true"></div>
            <h3>PIRATE</h3>
            <p>Fearless. Cunning. Ruthless.</p>
            <div className="character-stats">
              <span className="stat">Sea Dominator</span>
            </div>
          </article>
          
          <article className="character-card zombie" tabIndex={0}>
            <div className="character-icon zombie-large" aria-hidden="true"></div>
            <h3>ZOMBIE</h3>
            <p>Relentless. Hungry. Undying.</p>
            <div className="character-stats">
              <span className="stat">Undead Horde</span>
            </div>
          </article>
          
          <article className="character-card robot" tabIndex={0}>
            <div className="character-icon robot-large" aria-hidden="true"></div>
            <h3>ROBOT</h3>
            <p>Precise. Powerful. Programmed to win.</p>
            <div className="character-stats">
              <span className="stat">Tech Supremacy</span>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
};