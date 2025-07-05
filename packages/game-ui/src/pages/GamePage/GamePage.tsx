import React, { useState } from 'react';
import { Card, Character, BodyPart } from '@npzr/core';
import { GamePageProps } from '../../types/GameUI.types';
import { GameHUD } from '../../components/GameHUD/GameHUD';
import { EventBridge } from '../../bridge/EventBridge';
import { SimplePixiCanvas } from '../../components/SimplePixiCanvas/SimplePixiCanvas';
import { WildCardNomination } from '../../components/WildCardNomination/WildCardNomination';
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
  const eventBridge = EventBridge.getInstance();
  
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

  // Wild card nomination state
  const [wildCardNomination, setWildCardNomination] = useState<{
    isOpen: boolean;
    card: Card | null;
    cardName: string;
  }>({
    isOpen: false,
    card: null,
    cardName: ''
  });

  // Handle wild card nomination trigger
  const handleWildCardNominationTrigger = (card: Card, nomination: { character: Character; bodyPart: BodyPart }) => {
    // If nomination is already provided, use it directly
    if (nomination.character && nomination.bodyPart) {
      nominateWild(card, nomination);
    } else {
      // Otherwise, show the nomination UI
      const cardName = `${card.character || 'Wild'} ${card.bodyPart || 'Card'}`;
      setWildCardNomination({
        isOpen: true,
        card,
        cardName
      });
    }
  };

  const handleNominateWild = (character: Character, bodyPart: BodyPart) => {
    if (wildCardNomination.card) {
      nominateWild(wildCardNomination.card, { character, bodyPart });
    }
    setWildCardNomination({ isOpen: false, card: null, cardName: '' });
  };

  const handleCancelNomination = () => {
    setWildCardNomination({ isOpen: false, card: null, cardName: '' });
  };

  // Send game state updates to PixiJS (memoized to prevent infinite loops)
  const gameStateData = React.useMemo(() => {
    if (!gameEngine || !players[0] || !players[1]) return null;
    
    return {
      players: players.filter(player => player !== null).map(player => ({
        name: player!.getName(),
        handSize: player!.getHand().size(),
        handCards: player!.getHand().getCards(), // Include actual card data
        stackCount: player!.getMyStacks().length,
        isCurrentPlayer: player === currentPlayer
      })),
      currentPlayer: currentPlayer?.getName(),
      gamePhase: isGameComplete ? ('finished' as const) : ('playing' as const)
    };
  }, [gameEngine, players, currentPlayer, isGameComplete, players[0]?.getHand().size(), players[1]?.getHand().size()]);

  React.useEffect(() => {
    if (gameStateData) {
      console.log('React sending game state to PixiJS:', gameStateData);
      eventBridge.emitToCanvas('pixi:updateGameState', gameStateData);
    } else {
      console.log('No game state data to send to PixiJS');
    }
  }, [gameStateData, eventBridge]);

  // Listen for events from PixiJS
  React.useEffect(() => {
    const handleDeckClick = () => {
      if (currentPlayer && currentPlayer.getName().includes('Human')) {
        const playerState = currentPlayer.getState();
        if (playerState.canDrawCard()) {
          drawCard();
        }
      }
    };

    const handlePixiReady = () => {
      console.log('PixiJS is ready, sending initial game state');
      if (gameStateData) {
        console.log('Sending initial state to PixiJS:', gameStateData);
        eventBridge.emitToCanvas('pixi:updateGameState', gameStateData);
      }
    };

    eventBridge.onCanvasEvent('game:deckClick', handleDeckClick);
    eventBridge.onCanvasEvent('pixi:ready', handlePixiReady);

    return () => {
      eventBridge.offCanvasEvent('game:deckClick', handleDeckClick);
      eventBridge.offCanvasEvent('pixi:ready', handlePixiReady);
    };
  }, [currentPlayer, drawCard, eventBridge, gameStateData]);

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
        <div className="game-page__hud react-ui-interactive">
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

        {/* Simple PixiJS Canvas */}
        <div className="game-page__canvas">
          <SimplePixiCanvas 
            width={800} 
            height={600}
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

      {/* Wild Card Nomination Modal */}
      <div className="react-ui-interactive">
        <WildCardNomination
          isOpen={wildCardNomination.isOpen}
          cardName={wildCardNomination.cardName}
          onNominate={handleNominateWild}
          onCancel={handleCancelNomination}
        />
      </div>
    </div>
  );
};