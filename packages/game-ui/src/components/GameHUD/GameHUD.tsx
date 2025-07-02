import React from 'react';
import { GameHUDProps } from '../../types/GameUI.types';
import { PlayerPanel } from './PlayerPanel/PlayerPanel';
import { GameControls } from './GameControls/GameControls';
import { TurnIndicator } from './TurnIndicator/TurnIndicator';
import './GameHUD.css';

/**
 * GameHUD component - Main heads-up display for game information
 * 
 * Features:
 * - Player panels on left and right
 * - Turn indicator in center
 * - Game controls on far right
 * - Responsive layout
 * - Accessibility support
 */
export const GameHUD: React.FC<GameHUDProps> = ({
  gameState,
  onNewGame,
  onPause,
}) => {
  const currentPlayer = gameState.players[gameState.currentTurn];

  return (
    <div className="game-hud" data-testid="game-hud" role="banner">
      {/* Left Player Panel */}
      <div className="game-hud__section game-hud__section--left">
        <PlayerPanel
          player={gameState.players.player1}
          isCurrentPlayer={gameState.currentTurn === 'player1'}
          position="left"
        />
      </div>

      {/* Center Turn Indicator */}
      <div className="game-hud__section game-hud__section--center">
        <TurnIndicator
          currentPlayer={currentPlayer}
          gamePhase={gameState.gamePhase}
        />
      </div>

      {/* Right Player Panel */}
      <div className="game-hud__section game-hud__section--right">
        <PlayerPanel
          player={gameState.players.player2}
          isCurrentPlayer={gameState.currentTurn === 'player2'}
          position="right"
        />
      </div>

      {/* Game Controls */}
      <div className="game-hud__section game-hud__section--controls">
        <GameControls
          onNewGame={onNewGame}
          onPause={onPause}
          disabled={gameState.gamePhase === 'finished'}
        />
      </div>
    </div>
  );
};