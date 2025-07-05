import React from 'react';
import { GamePageProps } from '../../types/GameUI.types';
import { GameHUD } from '../../components/GameHUD/GameHUD';
import { GameCanvas } from '../../components/GameCanvas/GameCanvas';
import { useGameEngine } from '../../hooks/useGameEngine';
import { usePlayerState } from '../../hooks/usePlayerState';
import './GamePage.css';

/**
 * GamePage component - Main game interface page
 * 
 * Features:
 * - Split-screen layout with HUD (top) and Canvas (bottom)
 * - Real game engine integration with Player-centric architecture
 * - Responsive design
 * - Keyboard shortcuts support
 * - AI opponent integration
 */
export const GamePage: React.FC<GamePageProps> = () => {
  // Core game engine integration
  const { 
    gameEngine, 
    players, 
    currentPlayer, 
    isGameComplete, 
    winner, 
    createNewGame,
    isInitialized,
    error: engineError
  } = useGameEngine({
    enableAI: true,
    aiDifficulty: 'medium',
    playerName: 'Human Player',
    aiName: 'AI Opponent'
  });

  // Player state integration
  const {
    player1,
    player2,
    currentPlayer: currentPlayerState,
    gamePhase,
    winner: winnerState,
    drawCard,
    playCard,
    moveCard,
    nominateWild,
    error: playerError
  } = usePlayerState(players, currentPlayer, isGameComplete, winner);

  // Error handling
  const hasError = engineError || playerError;
  const errorMessage = engineError || playerError;

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          // Could implement pause functionality here
          break;
        case 'n':
        case 'N':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            createNewGame();
          }
          break;
        case 'd':
        case 'D':
          // Quick draw card if it's player's turn
          if (currentPlayerState?.canDraw) {
            drawCard();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPlayerState?.canDraw, createNewGame, drawCard]);

  // Show loading state during initialization
  if (!isInitialized) {
    return (
      <div className="game-page" data-testid="game-page">
        <div className="game-page__loading">
          <div>Initializing NPZR Game Engine...</div>
        </div>
      </div>
    );
  }

  // Show error state if there's an issue
  if (hasError) {
    return (
      <div className="game-page" data-testid="game-page">
        <div className="game-page__error">
          <h2>Game Error</h2>
          <p>{errorMessage}</p>
          <button onClick={createNewGame} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-page" data-testid="game-page">
      <div className="game-page__container">
        {/* HUD Section */}
        <div className="game-page__hud">
          <GameHUD
            player1={player1}
            player2={player2}
            currentPlayer={currentPlayerState}
            gamePhase={gamePhase}
            winner={winnerState}
            onNewGame={createNewGame}
            onDrawCard={drawCard}
          />
        </div>

        {/* Canvas Section */}
        <div className="game-page__canvas">
          <GameCanvas
            gameEngine={gameEngine}
            players={players}
            currentPlayer={currentPlayer}
            gamePhase={gamePhase}
            gameActions={{
              drawCard,
              playCard,
              moveCard,
              nominateWild
            }}
          />
        </div>
      </div>

      {/* Accessibility info */}
      <div className="game-page__accessibility sr-only" aria-live="polite">
        Current game phase: {gamePhase}
        {gamePhase === 'playing' && currentPlayerState && (
          `, Current turn: ${currentPlayerState.name}`
        )}
        {gamePhase === 'playing' && currentPlayerState && (
          `, Current state: ${currentPlayerState.stateMessage}`
        )}
      </div>

      {/* Keyboard shortcuts help */}
      {process.env.NODE_ENV === 'development' && (
        <div className="game-page__shortcuts">
          <small>
            Shortcuts: Ctrl+N (New Game), D (Draw Card)
          </small>
        </div>
      )}
    </div>
  );
};