import React from 'react';
import './GameIntro.css';

export const GameIntro: React.FC = () => {
  return (
    <section className="game-intro section">
      <div className="container">
        <h2>Choose Your Destiny</h2>
        <p className="intro-text">
          In the world of NPZR, four legendary forces collide in epic tactical combat. 
          Master the art of strategy as you build your army of ninjas, pirates, zombies, 
          and robots to claim victory!
        </p>
      </div>
    </section>
  );
};