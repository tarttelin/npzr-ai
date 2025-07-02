import React from 'react';
import './RulesPage.css';

export const RulesPage: React.FC = () => {
  return (
    <div className="rules-page">
      <div className="container">
        <h1>NPZR Game Rules</h1>
        <div className="rules-content">
          <p className="coming-soon">
            📚 Comprehensive game rules and strategy guide coming soon!
          </p>
          <p>
            In the meantime, NPZR is a tactical two-player card game where you build complete characters 
            by collecting matching head, torso, and leg cards. Use wild cards strategically and disrupt 
            your opponent's progress to claim victory!
          </p>
        </div>
      </div>
    </div>
  );
};