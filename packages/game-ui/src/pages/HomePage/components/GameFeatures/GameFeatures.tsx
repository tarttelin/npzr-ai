import React from 'react';
import './GameFeatures.css';

export const GameFeatures: React.FC = () => {
  return (
    <section className="game-features section" aria-labelledby="features-heading">
      <div className="container">
        <h2 id="features-heading">Epic Gameplay Features</h2>
        <div className="features-grid">
          <div className="feature">
            <div className="feature-icon tactical" aria-hidden="true">🎯</div>
            <h3>Tactical Strategy</h3>
            <p>Build complete characters by collecting head, torso, and leg cards in strategic combinations</p>
          </div>
          
          <div className="feature">
            <div className="feature-icon wild" aria-hidden="true">⚡</div>
            <h3>Wild Card Chaos</h3>
            <p>Game-changing wild cards with nomination mechanics that can shift the battle instantly</p>
          </div>
          
          <div className="feature">
            <div className="feature-icon cascade" aria-hidden="true">🔄</div>
            <h3>Move Cascading</h3>
            <p>Chain reactions that can completely turn the tide - one move leads to another in epic sequences</p>
          </div>
          
          <div className="feature">
            <div className="feature-icon defensive" aria-hidden="true">⚔️</div>
            <h3>Defensive Play</h3>
            <p>Block opponents by playing cards on their stacks - offense and defense in perfect balance</p>
          </div>
        </div>
      </div>
    </section>
  );
};