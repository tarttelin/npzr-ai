import React, { useState, useEffect } from 'react';
import { GameCanvasProps, CoreGameCanvasProps } from '../../types/GameUI.types';
import { usePixiApp } from './hooks/usePixiApp';
import './GameCanvas.css';

/**
 * GameCanvas component - Renders the game area using PixiJS
 * 
 * Features:
 * - Green baize casino-style background
 * - Real game entity rendering with sprite assets
 * - Interactive gameplay elements
 * - Responsive canvas sizing
 * - Proper PixiJS lifecycle management
 * - Supports both legacy and core engine props
 */

// Legacy GameCanvas component
export const LegacyGameCanvas: React.FC<GameCanvasProps> = ({ 
  width = 800, 
  height = 600, 
  gameState 
}) => {
  const [canvasSize, setCanvasSize] = useState({ width, height });

  const { containerRef } = usePixiApp({
    width: canvasSize.width,
    height: canvasSize.height,
    onResize: (newWidth, newHeight) => {
      setCanvasSize({ width: newWidth, height: newHeight });
    },
  });

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({ 
          width: rect.width || width, 
          height: rect.height || height 
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [width, height, containerRef]);

  return (
    <div className="game-canvas" data-testid="game-canvas">
      <div 
        ref={containerRef} 
        className="canvas-container"
        style={{ width: '100%', height: '100%' }}
      />
      
      {/* Debug info - will be removed in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="canvas-debug-info">
          <small>
            Canvas: {canvasSize.width}×{canvasSize.height} | 
            Phase: {gameState.gamePhase} | 
            Turn: {gameState.currentTurn}
          </small>
        </div>
      )}
    </div>
  );
};

// Core GameCanvas component with real game engine integration
export const CoreGameCanvas: React.FC<CoreGameCanvasProps> = ({
  width = 800,
  height = 600,
  gameEngine,
  players,
  currentPlayer,
  gamePhase,
  gameActions
}) => {
  const [canvasSize, setCanvasSize] = useState({ width, height });

  const { containerRef, scene, eventBridge } = usePixiApp({
    width: canvasSize.width,
    height: canvasSize.height,
    onResize: (newWidth, newHeight) => {
      setCanvasSize({ width: newWidth, height: newHeight });
    },
  });

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({ 
          width: rect.width || width, 
          height: rect.height || height 
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [width, height, containerRef]);

  // Set up game action event handlers
  useEffect(() => {
    if (!eventBridge) return;

    // Listen for deck click to draw card
    const handleDeckClick = () => {
      if (currentPlayer && currentPlayer.getName().includes('Human')) {
        gameActions.drawCard();
      }
    };

    // Listen for card play events
    const handleCardPlay = (data: any) => {
      if (data.card && data.targetStackId !== undefined) {
        gameActions.playCard(data.card, {
          targetStackId: data.targetStackId,
          targetPile: data.targetPile
        });
      }
    };

    // Listen for card move events
    const handleCardMove = (data: any) => {
      gameActions.moveCard({
        cardId: data.cardId,
        fromStackId: data.fromStackId,
        fromPile: data.fromPile,
        toStackId: data.toStackId,
        toPile: data.toPile
      });
    };

    // Listen for wild card nomination events
    const handleWildNomination = (data: any) => {
      gameActions.nominateWild(data.card, {
        character: data.character,
        bodyPart: data.bodyPart
      });
    };

    // Set up event listeners
    eventBridge.onCanvasEvent('game:deckClick', handleDeckClick);
    eventBridge.onCanvasEvent('game:cardPlay', handleCardPlay);
    eventBridge.onCanvasEvent('game:cardMove', handleCardMove);
    eventBridge.onCanvasEvent('game:wildNomination', handleWildNomination);

    return () => {
      eventBridge.offCanvasEvent('game:deckClick', handleDeckClick);
      eventBridge.offCanvasEvent('game:cardPlay', handleCardPlay);
      eventBridge.offCanvasEvent('game:cardMove', handleCardMove);
      eventBridge.offCanvasEvent('game:wildNomination', handleWildNomination);
    };
  }, [eventBridge, currentPlayer, gameActions]);

  // Update canvas scene when game state changes
  useEffect(() => {
    if (!scene || !gameEngine) return;

    // Update deck count
    const deckSize = gameEngine.getDeckSize ? gameEngine.getDeckSize() : 44;
    eventBridge?.emitToCanvas('ui:updateDeck', { cardCount: deckSize });

    // Update player hands
    if (players[0]) {
      const handSize = players[0].getHand().size();
      eventBridge?.emitToCanvas('ui:updateHand', { 
        playerId: players[0].getId(), 
        handSize 
      });
    }

    if (players[1]) {
      const handSize = players[1].getHand().size();
      eventBridge?.emitToCanvas('ui:updateHand', { 
        playerId: players[1].getId(), 
        handSize 
      });
    }

    // Update valid move highlights
    if (currentPlayer && currentPlayer.getName().includes('Human')) {
      // Highlight valid moves based on current player state
      const playerState = currentPlayer.getState();
      
      if (playerState.canPlayCard()) {
        eventBridge?.emitToCanvas('ui:highlightValidMoves', { 
          cardId: 'any' // Highlight all playable cards
        });
      } else {
        eventBridge?.emitToCanvas('ui:clearHighlights', undefined);
      }
    }
  }, [scene, gameEngine, players, currentPlayer, eventBridge]);

  const [player1, player2] = players;

  return (
    <div className="game-canvas" data-testid="game-canvas">
      <div 
        ref={containerRef} 
        className="canvas-container"
        style={{ width: '100%', height: '100%' }}
      />
      
      {/* Debug info - will be removed in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="canvas-debug-info">
          <small>
            Canvas: {canvasSize.width}×{canvasSize.height} | 
            Phase: {gamePhase} | 
            Current: {currentPlayer?.getName() || 'None'} |
            P1 Hand: {player1?.getHand().size() || 0} |
            P2 Hand: {player2?.getHand().size() || 0}
          </small>
        </div>
      )}

      {/* Game loading indicator */}
      {!gameEngine && (
        <div className="canvas-loading">
          <div>Loading game engine...</div>
        </div>
      )}
    </div>
  );
};

// Main GameCanvas export - automatically detects which props to use
export const GameCanvas: React.FC<GameCanvasProps | CoreGameCanvasProps> = (props) => {
  // Type guard to detect legacy vs core props
  if ('gameState' in props) {
    // Legacy props
    return <LegacyGameCanvas {...props as GameCanvasProps} />;
  } else {
    // Core props
    return <CoreGameCanvas {...props as CoreGameCanvasProps} />;
  }
};