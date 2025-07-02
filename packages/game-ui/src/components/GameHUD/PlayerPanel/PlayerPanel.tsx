import React from 'react';
import { PlayerPanelProps } from '../../../types/GameUI.types';
import './PlayerPanel.css';

/**
 * PlayerPanel component - Displays individual player information
 * 
 * Features:
 * - Player name and score
 * - Hand count indicator
 * - Active player highlighting
 * - Position-aware styling (left/right)
 */
export const PlayerPanel: React.FC<PlayerPanelProps> = ({
  player,
  isCurrentPlayer,
  position,
}) => {
  const panelClasses = [
    'player-panel',
    `player-panel--${position}`,
    isCurrentPlayer ? 'player-panel--active' : 'player-panel--inactive',
  ].join(' ');

  return (
    <div className={panelClasses} data-testid={`player-panel-${position}`}>
      <div className="player-panel__header">
        <h3 className="player-panel__name">{player.name}</h3>
        {isCurrentPlayer && (
          <div className="player-panel__turn-indicator" aria-label="Current turn">
            ●
          </div>
        )}
      </div>
      
      <div className="player-panel__stats">
        <div className="player-panel__stat">
          <span className="player-panel__stat-label">Score</span>
          <span className="player-panel__stat-value" data-testid={`${position}-score`}>
            {player.score}
          </span>
        </div>
        
        <div className="player-panel__stat">
          <span className="player-panel__stat-label">Cards</span>
          <span className="player-panel__stat-value" data-testid={`${position}-hand-count`}>
            {player.handCount}
          </span>
        </div>
      </div>
    </div>
  );
};