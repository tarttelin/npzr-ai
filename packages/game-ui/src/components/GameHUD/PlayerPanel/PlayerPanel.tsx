import React from 'react';
import { CorePlayerPanelProps } from '../../../types/GameUI.types';
import { formatCompletedCharacters } from '../../../utils/characterUtils';
import './PlayerPanel.css';

/**
 * PlayerPanel component - Displays individual player information
 * 
 * Features:
 * - Player name and score
 * - Hand count indicator
 * - Active player highlighting
 * - Position-aware styling (left/right)
 * - Core engine player data
 */

export const PlayerPanel: React.FC<CorePlayerPanelProps> = ({ 
  player, 
  isCurrentPlayer, 
  position 
}) => {
  if (!player) {
    return null;
  }

  const panelClasses = [
    'player-panel',
    `player-panel--${position}`,
    isCurrentPlayer ? 'player-panel--active' : 'player-panel--inactive',
  ].join(' ');

  return (
    <div 
      className={panelClasses}
      data-testid={`player-panel-${position}`}
      role="group"
      aria-label={`${player.name} player information`}
    >
      {/* Player Name */}
      <div className="player-panel__header">
        <h3 className="player-panel__name" data-testid="player-name">
          {player.name}
        </h3>
        {isCurrentPlayer && (
          <span className="player-panel__current-indicator" aria-hidden="true">
            ▶
          </span>
        )}
      </div>

      {/* Score Display */}
      <div className="player-panel__score">
        <span className="player-panel__score-label">Completed:</span>
        <div className="player-panel__score-value" data-testid="completed-characters">
          {formatCompletedCharacters(player.score)}
        </div>
      </div>

      {/* Hand Count */}
      <div className="player-panel__hand">
        <span className="player-panel__hand-label">Cards:</span>
        <span className="player-panel__hand-count" data-testid="hand-count">
          {player.handCount}
        </span>
      </div>

      {/* Additional Core Engine Info */}
      <div className="player-panel__status">
        <div className="player-panel__status-row">
          <span className="player-panel__status-label">Action:</span>
          <span className="player-panel__status-value" data-testid="player-status">
            {player.stateMessage || 'Waiting...'}
          </span>
        </div>
      </div>

      {/* Accessibility */}
      <div className="sr-only" aria-live="polite">
        {isCurrentPlayer ? `${player.name} is the current player` : ''}
      </div>
    </div>
  );
};