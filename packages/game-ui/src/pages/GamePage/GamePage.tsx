import React from 'react';
import { GamePageProps } from '../../types/GameUI.types';
import { GameHUD } from '../../components/GameHUD/GameHUD';
import { GameCanvas } from '../../components/GameCanvas/GameCanvas';
import { useGameState } from '../../hooks/useGameState';
import './GamePage.css';

/**
 * GamePage component - Main game interface page
 * 
 * Features:
 * - Split-screen layout with HUD (top) and Canvas (bottom)
 * - Game state management
 * - Responsive design
 * - Keyboard shortcuts support
 * - Integration with game engine (future)
 */
export const GamePage: React.FC<GamePageProps> = () => {
  const { gameState, startNewGame, pauseGame } = useGameState();

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          if (gameState.gamePhase === 'playing') {
            pauseGame();
          }
          break;
        case 'n':
        case 'N':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            startNewGame();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState.gamePhase, startNewGame, pauseGame]);

  return (
    <div className="game-page" data-testid="game-page">
      <div className="game-page__container">
        {/* HUD Section */}
        <div className="game-page__hud">
          <GameHUD
            gameState={gameState}
            onNewGame={startNewGame}
            onPause={pauseGame}
          />
        </div>

        {/* Canvas Section */}
        <div className="game-page__canvas">
          <GameCanvas
            gameState={gameState}
          />
        </div>
      </div>

      {/* Accessibility info */}
      <div className="game-page__accessibility sr-only" aria-live="polite">
        Current game phase: {gameState.gamePhase}
        {gameState.gamePhase === 'playing' && (
          `, Current turn: ${gameState.players[gameState.currentTurn].name}`
        )}
      </div>

      {/* Keyboard shortcuts help */}
      {process.env.NODE_ENV === 'development' && (
        <div className="game-page__shortcuts">
          <small>
            Shortcuts: Ctrl+N (New Game), Esc (Pause)
          </small>
        </div>
      )}
    </div>
  );
};