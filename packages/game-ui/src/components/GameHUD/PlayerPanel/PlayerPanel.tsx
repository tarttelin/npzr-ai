import React from 'react';
import { PlayerPanelProps, CorePlayerPanelProps, PlayerInfo, CorePlayerInfo } from '../../../types/GameUI.types';
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
 * - Supports both legacy and core engine player data
 */

// Core rendering component
const PlayerPanelCore: React.FC<{
  player: PlayerInfo | CorePlayerInfo;
  isCurrentPlayer: boolean;
  position: 'left' | 'right';
}> = ({ player, isCurrentPlayer, position }) => {
  const panelClasses = [
    'player-panel',
    `player-panel--${position}`,
    isCurrentPlayer ? 'player-panel--active' : 'player-panel--inactive',
  ].join(' ');

  // Handle additional info for core players
  const isCore = 'state' in player;
  const corePlayer = isCore ? (player as CorePlayerInfo) : null;

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
          <span className="player-panel__stat-label">Completed</span>
          <span className="player-panel__stat-value player-panel__characters" data-testid={`${position}-score`}>
            {formatCompletedCharacters(player.score) || '—'}
          </span>
        </div>
        
        <div className="player-panel__stat">
          <span className="player-panel__stat-label">Cards</span>
          <span className="player-panel__stat-value" data-testid={`${position}-hand-count`}>
            {player.handCount}
          </span>
        </div>

        {/* Show current state for core players */}
        {corePlayer && isCurrentPlayer && corePlayer.stateMessage && (
          <div className="player-panel__stat">
            <span className="player-panel__stat-label">Action</span>
            <span className="player-panel__stat-value player-panel__state" data-testid={`${position}-state`}>
              {corePlayer.stateMessage}
            </span>
          </div>
        )}
      </div>

      {/* Show available actions for core players */}
      {corePlayer && isCurrentPlayer && (
        <div className="player-panel__actions">
          {corePlayer.canDraw && (
            <div className="player-panel__action-indicator player-panel__action--draw">
              Draw
            </div>
          )}
          {corePlayer.canPlay && (
            <div className="player-panel__action-indicator player-panel__action--play">
              Play
            </div>
          )}
          {corePlayer.canMove && (
            <div className="player-panel__action-indicator player-panel__action--move">
              Move
            </div>
          )}
          {corePlayer.canNominate && (
            <div className="player-panel__action-indicator player-panel__action--nominate">
              Nominate
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Legacy PlayerPanel
export const LegacyPlayerPanel: React.FC<PlayerPanelProps> = (props) => {
  return <PlayerPanelCore {...props} />;
};

// Core PlayerPanel
export const CorePlayerPanel: React.FC<CorePlayerPanelProps> = ({ player, isCurrentPlayer, position }) => {
  if (!player) {
    return (
      <div className={`player-panel player-panel--${position} player-panel--empty`}>
        <div className="player-panel__header">
          <h3 className="player-panel__name">Waiting for player...</h3>
        </div>
      </div>
    );
  }

  return <PlayerPanelCore player={player} isCurrentPlayer={isCurrentPlayer} position={position} />;
};

// Main PlayerPanel export - automatically detects which props to use
export const PlayerPanel: React.FC<PlayerPanelProps | CorePlayerPanelProps> = (props) => {
  // Type guard to detect legacy vs core props
  if (props.player && 'isActive' in props.player) {
    // Legacy props
    return <LegacyPlayerPanel {...props as PlayerPanelProps} />;
  } else {
    // Core props (player could be null)
    return <CorePlayerPanel {...props as CorePlayerPanelProps} />;
  }
};