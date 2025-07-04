import React from 'react';
import { GameHUDProps, CoreGameHUDProps } from '../../types/GameUI.types';
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
 * - Supports both legacy and core engine props
 */

// Legacy GameHUD component (for backward compatibility)
export const LegacyGameHUD: React.FC<GameHUDProps> = ({
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

// Core Engine GameHUD component  
export const CoreGameHUD: React.FC<CoreGameHUDProps> = ({
  player1,
  player2,
  currentPlayer,
  gamePhase,
  winner,
  onNewGame,
  onDrawCard,
}) => {
  return (
    <div className="game-hud" data-testid="game-hud" role="banner">
      {/* Left Player Panel */}
      <div className="game-hud__section game-hud__section--left">
        {player1 && (
          <PlayerPanel
            player={player1}
            isCurrentPlayer={currentPlayer?.id === player1.id}
            position="left"
          />
        )}
      </div>

      {/* Center Turn Indicator */}
      <div className="game-hud__section game-hud__section--center">
        <TurnIndicator
          currentPlayer={currentPlayer}
          gamePhase={gamePhase}
          winner={winner}
          onDrawCard={onDrawCard}
          canDraw={currentPlayer?.canDraw || false}
          canPlay={currentPlayer?.canPlay || false}
          canMove={currentPlayer?.canMove || false}
          canNominate={currentPlayer?.canNominate || false}
          stateMessage={currentPlayer?.stateMessage}
        />
      </div>

      {/* Right Player Panel */}
      <div className="game-hud__section game-hud__section--right">
        {player2 && (
          <PlayerPanel
            player={player2}
            isCurrentPlayer={currentPlayer?.id === player2.id}
            position="right"
          />
        )}
      </div>

      {/* Game Controls */}
      <div className="game-hud__section game-hud__section--controls">
        <GameControls
          onNewGame={onNewGame}
          disabled={gamePhase === 'finished'}
        />
      </div>
    </div>
  );
};

// Main GameHUD export - automatically detects which props to use
export const GameHUD: React.FC<GameHUDProps | CoreGameHUDProps> = (props) => {
  // Type guard to detect which props we're getting
  if ('gameState' in props) {
    // Legacy props
    return <LegacyGameHUD {...props as GameHUDProps} />;
  } else {
    // Core engine props
    return <CoreGameHUD {...props as CoreGameHUDProps} />;
  }
};