import React from 'react';
import { TurnIndicatorProps } from '../../../types/GameUI.types';
import './TurnIndicator.css';

/**
 * TurnIndicator component - Shows current player and game phase
 * 
 * Features:
 * - Current player name display
 * - Game phase status
 * - Visual turn indicator
 * - Accessibility support
 */
export const TurnIndicator: React.FC<TurnIndicatorProps> = ({
  currentPlayer,
  gamePhase,
}) => {
  const getPhaseText = (phase: typeof gamePhase): string => {
    switch (phase) {
      case 'setup':
        return 'Setting up...';
      case 'playing':
        return 'Playing';
      case 'finished':
        return 'Game Over';
      default:
        return 'Ready';
    }
  };

  const isGameActive = gamePhase === 'playing';

  return (
    <div 
      className={`turn-indicator ${isGameActive ? 'turn-indicator--active' : ''}`}
      data-testid="turn-indicator"
      role="status"
      aria-live="polite"
      aria-label={`Current turn: ${currentPlayer.name}, Game phase: ${getPhaseText(gamePhase)}`}
    >
      <div className="turn-indicator__phase">
        {getPhaseText(gamePhase)}
      </div>
      
      {isGameActive && (
        <div className="turn-indicator__current-player">
          <span className="turn-indicator__label">Turn:</span>
          <span className="turn-indicator__player-name">
            {currentPlayer.name}
          </span>
        </div>
      )}
      
      {gamePhase === 'finished' && (
        <div className="turn-indicator__game-over" data-testid="game-over">
          🎮
        </div>
      )}
    </div>
  );
};