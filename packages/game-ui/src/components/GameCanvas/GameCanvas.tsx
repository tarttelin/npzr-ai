import React, { useState, useEffect } from 'react';
import { CoreGameCanvasProps } from '../../types/GameUI.types';
import { usePixiApp } from './hooks/usePixiApp';
import { logger } from '@npzr/logging';
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
 * - Core engine integration
 */
export const GameCanvas: React.FC<CoreGameCanvasProps> = ({
  width = 800,
  height = 600,
  gameEngine,
  players,
  currentPlayer,
  gamePhase,
  gameActions
}) => {
  const [canvasSize, setCanvasSize] = useState({ width, height });

  // Stable onResize callback
  const handleResize = React.useCallback((newWidth: number, newHeight: number) => {
    setCanvasSize({ width: newWidth, height: newHeight });
  }, []);

  const { containerRef, scene, eventBridge } = usePixiApp({
    width: canvasSize.width,
    height: canvasSize.height,
    onResize: handleResize,
  });

  // Debug when scene becomes available
  React.useEffect(() => {
    logger.info('Scene availability changed', { hasScene: !!scene });
  }, [scene]);

  // Debug when players become available
  React.useEffect(() => {
    logger.info('Players availability changed', { 
      hasPlayer1: !!players[0], 
      hasPlayer2: !!players[1],
      player1Name: players[0]?.getName(),
      player2Name: players[1]?.getName()
    });
  }, [players]);

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

    // Listen for deck click - only draw if player can draw
    const handleDeckClick = () => {
      if (currentPlayer && currentPlayer.getName().includes('Human')) {
        const playerState = currentPlayer.getState();
        
        if (playerState.canDrawCard()) {
          gameActions.drawCard();
        }
        // Note: When player can't draw, deck is visually disabled (gray) and click is ignored
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

  // Initialize scene with players when they become available
  useEffect(() => {
    logger.debug('Checking player initialization', { 
      hasScene: !!scene, 
      player1: !!players[0], 
      player2: !!players[1],
      hasInitializeMethod: scene && typeof scene.initializeWithPlayers === 'function'
    });

    if (!scene) {
      logger.warn('No scene available for player initialization');
      return;
    }

    if (!players[0] || !players[1]) {
      logger.warn('Players not ready for initialization', { 
        player1: !!players[0], 
        player2: !!players[1] 
      });
      return;
    }

    // Initialize the scene with both players
    if (typeof scene.initializeWithPlayers === 'function') {
      logger.info('Initializing GameplayScene with players', {
        player1Name: players[0]?.getName(),
        player2Name: players[1]?.getName()
      });
      scene.initializeWithPlayers(players);
      logger.info('Successfully initialized GameplayScene with players');
    } else {
      logger.error('Scene does not have initializeWithPlayers method');
    }
  }, [scene, players]);

  // Update canvas scene when game state changes
  useEffect(() => {
    if (!scene || !gameEngine) return;

    // Update deck count
    const deckSize = gameEngine.getDeckSize ? gameEngine.getDeckSize() : 44;
    scene.updateDeckCount(deckSize);

    // Update player areas with current game state - pass fresh player references
    if (typeof scene.updatePlayerAreas === 'function') {
      scene.updatePlayerAreas(players);
    }

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

    // Update deck clickable state and move highlights
    if (currentPlayer && currentPlayer.getName().includes('Human')) {
      // Update deck clickable state based on current player state
      const playerState = currentPlayer.getState();
      const canDraw = playerState.canDrawCard();
      
      if (scene && typeof scene.getDeckSprite === 'function') {
        // Access the deck sprite and update its clickable state
        const deckSprite = scene.getDeckSprite();
        if (deckSprite && typeof deckSprite.setClickable === 'function') {
          deckSprite.setClickable(canDraw);
        }
      }
      
      if (playerState.canPlayCard()) {
        eventBridge?.emitToCanvas('ui:highlightValidMoves', { 
          cardId: 'any' // Highlight all playable cards
        });
      } else {
        eventBridge?.emitToCanvas('ui:clearHighlights', undefined);
      }
    }
  }, [scene, gameEngine, players, currentPlayer, eventBridge]);

  // Update current player highlighting
  useEffect(() => {
    if (!scene || !currentPlayer || !players[0] || !players[1]) return;

    // Determine which player index is current
    let currentPlayerIndex = 0;
    if (currentPlayer.getId() === players[1]?.getId()) {
      currentPlayerIndex = 1;
    }

    // Update scene to highlight current player
    if (typeof scene.setCurrentPlayer === 'function') {
      scene.setCurrentPlayer(currentPlayerIndex);
      logger.debug(`Set current player to index ${currentPlayerIndex} (${currentPlayer.getName()})`);
    }
  }, [scene, currentPlayer, players]);

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