import React from 'react';
import { GameControlsProps } from '../../../types/GameUI.types';
import './GameControls.css';

/**
 * GameControls component - Game action buttons and controls
 * 
 * Features:
 * - New Game button
 * - Disabled state support
 * - Keyboard accessibility
 */
export const GameControls: React.FC<GameControlsProps> = ({
  onNewGame,
  disabled = false,
}) => {
  const handleNewGame = () => {
    if (!disabled) {
      onNewGame();
    }
  };

  return (
    <div className="game-controls" data-testid="game-controls">
      <button
        className="game-controls__button game-controls__button--primary"
        onClick={handleNewGame}
        disabled={disabled}
        data-testid="new-game-button"
        aria-label="Start a new game"
      >
        New Game
      </button>
    </div>
  );
};