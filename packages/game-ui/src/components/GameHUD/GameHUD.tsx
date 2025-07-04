import React from 'react';
import { CoreGameHUDProps } from '../../types/GameUI.types';
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
export const GameHUD: React.FC<CoreGameHUDProps> = ({
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
          disabled={false}
        />
      </div>
    </div>
  );
};