import React from 'react';
import { TurnIndicatorProps, CoreTurnIndicatorProps } from '../../../types/GameUI.types';
import './TurnIndicator.css';

/**
 * TurnIndicator component - Shows current player and game phase
 * 
 * Features:
 * - Current player name display
 * - Game phase status
 * - Visual turn indicator
 * - Action buttons for core engine
 * - Accessibility support
 */

const getPhaseText = (phase: 'setup' | 'playing' | 'finished'): string => {
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

// Legacy TurnIndicator
export const LegacyTurnIndicator: React.FC<TurnIndicatorProps> = ({
  currentPlayer,
  gamePhase,
}) => {
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

// Core TurnIndicator with enhanced functionality
export const CoreTurnIndicator: React.FC<CoreTurnIndicatorProps> = ({
  currentPlayer,
  gamePhase,
  winner,
  onDrawCard,
  canDraw = false,
  canPlay = false,
  canMove = false,
  canNominate = false,
  stateMessage,
}) => {
  const isGameActive = gamePhase === 'playing';
  const hasActivePlayer = currentPlayer !== null;

  return (
    <div 
      className={`turn-indicator ${isGameActive ? 'turn-indicator--active' : ''}`}
      data-testid="turn-indicator"
      role="status"
      aria-live="polite"
      aria-label={
        hasActivePlayer 
          ? `Current turn: ${currentPlayer.name}, Game phase: ${getPhaseText(gamePhase)}`
          : `Game phase: ${getPhaseText(gamePhase)}`
      }
    >
      <div className="turn-indicator__phase">
        {getPhaseText(gamePhase)}
      </div>
      
      {isGameActive && hasActivePlayer && (
        <div className="turn-indicator__current-player">
          <span className="turn-indicator__label">Turn:</span>
          <span className="turn-indicator__player-name">
            {currentPlayer.name}
          </span>
          
          {/* Show current state message */}
          {stateMessage && (
            <div className="turn-indicator__state-message">
              {stateMessage}
            </div>
          )}
        </div>
      )}

      {/* Action buttons for human player */}
      {isGameActive && hasActivePlayer && currentPlayer.name.includes('Human') && (
        <div className="turn-indicator__actions">
          {canDraw && onDrawCard && (
            <button 
              className="turn-indicator__action-btn turn-indicator__action-btn--draw"
              onClick={onDrawCard}
              data-testid="draw-card-btn"
            >
              Draw Card
            </button>
          )}
          
          {/* Status indicators for other actions */}
          {canPlay && (
            <div className="turn-indicator__status turn-indicator__status--play">
              Can Play Card
            </div>
          )}
          {canMove && (
            <div className="turn-indicator__status turn-indicator__status--move">
              Must Move Card
            </div>
          )}
          {canNominate && (
            <div className="turn-indicator__status turn-indicator__status--nominate">
              Nominate Wild Card
            </div>
          )}
        </div>
      )}

      {/* AI turn indicator */}
      {isGameActive && hasActivePlayer && !currentPlayer.name.includes('Human') && (
        <div className="turn-indicator__ai-turn">
          <span className="turn-indicator__ai-label">AI is thinking...</span>
        </div>
      )}
      
      {gamePhase === 'finished' && (
        <div className="turn-indicator__game-over" data-testid="game-over">
          {winner ? `🏆 ${winner.name} Wins!` : '🎮 Game Over'}
        </div>
      )}
    </div>
  );
};

// Main TurnIndicator export - automatically detects which props to use
export const TurnIndicator: React.FC<TurnIndicatorProps | CoreTurnIndicatorProps> = (props) => {
  // Type guard to detect legacy vs core props
  if ('currentPlayer' in props && props.currentPlayer && 'isActive' in props.currentPlayer) {
    // Legacy props
    return <LegacyTurnIndicator {...props as TurnIndicatorProps} />;
  } else {
    // Core props
    return <CoreTurnIndicator {...props as CoreTurnIndicatorProps} />;
  }
};