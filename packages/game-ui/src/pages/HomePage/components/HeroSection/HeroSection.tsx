import React from 'react';
import './HeroSection.css';

export const HeroSection: React.FC = () => {
  return (
    <section className="hero-section">
      <div className="container">
        <div className="hero-content">
          <div className="game-logo">
            <p className="tagline">The Ultimate Tactical Card Game</p>
          </div>
          
          <div className="character-showcase" aria-label="Game characters showcase">
            <div className="character-hero ninja-hero" aria-label="Ninja character">
              <div className="character-icon ninja-icon"></div>
            </div>
            <div className="character-hero pirate-hero" aria-label="Pirate character">
              <div className="character-icon pirate-icon"></div>
            </div>
            <div className="character-hero zombie-hero" aria-label="Zombie character">
              <div className="character-icon zombie-icon"></div>
            </div>
            <div className="character-hero robot-hero" aria-label="Robot character">
              <div className="character-icon robot-icon"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};