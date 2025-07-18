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

  // Handle wild card nomination trigger (commented out as not currently used)
  // const handleWildCardNominationTrigger = (card: Card, nomination: { character: Character; bodyPart: BodyPart }) => {
  //   // If nomination is already provided, use it directly
  //   if (nomination.character && nomination.bodyPart) {
  //     nominateWild(card, nomination);
  //   } else {
  //     // Otherwise, show the nomination UI
  //     const cardName = `${card.character || 'Wild'} ${card.bodyPart || 'Card'}`;
  //     setWildCardNomination({
  //       isOpen: true,
  //       card,
  //       cardName
  //     });
  //   }
  // };

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
        stacks: player!.getMyStacks().map(stack => {
          const topCards = stack.getTopCards();
          return {
            id: stack.getId(),
            headCard: topCards.head,
            torsoCard: topCards.torso,
            legsCard: topCards.legs,
            isComplete: stack.isComplete()
          };
        }),
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

    const handleCardPlay = (data: { card: any; targetStackId?: string; targetPile?: string }) => {
      console.log('Card play event received:', data);
      
      if (currentPlayer && currentPlayer.getName().includes('Human')) {
        const playerState = currentPlayer.getState();
        if (playerState.canPlayCard()) {
          console.log('Attempting to play card:', data.card.character, data.card.bodyPart, 'to', data.targetPile, 'on', data.targetStackId);
          
          try {
            // Check if card body part matches target pile (for validation)
            console.log('Card body part:', data.card.bodyPart, 'Target pile:', data.targetPile);
            
            // Convert string body part to enum
            let targetPile: BodyPart;
            switch (data.targetPile) {
              case 'head':
                targetPile = BodyPart.Head;
                break;
              case 'torso':
                targetPile = BodyPart.Torso;
                break;
              case 'legs':
                targetPile = BodyPart.Legs;
                break;
              default:
                throw new Error(`Invalid body part: ${data.targetPile}`);
            }

            // Validate that card can go to target pile
            if (data.card.bodyPart !== 'wild' && data.card.bodyPart !== data.targetPile) {
              console.warn(`Card body part ${data.card.bodyPart} does not match target pile ${data.targetPile}`);
              // For now, let the game engine handle the validation
            }

            if (data.targetStackId === 'new') {
              // Creating a new stack - play card with target pile
              console.log('Playing to new stack with options:', { targetPile });
              playCard(data.card, { targetPile });
            } else {
              // Playing to an existing stack
              console.log('Playing to existing stack with options:', { targetStackId: data.targetStackId, targetPile });
              playCard(data.card, { 
                targetStackId: data.targetStackId,
                targetPile 
              });
            }
            console.log('Card played successfully');
          } catch (error) {
            console.error('Failed to play card:', error);
            console.error('Error details:', error);
          }
        } else {
          console.log('Cannot play card in current state:', playerState.getState());
        }
      }
    };

    const handleCardMove = (data: { card: any; sourceStackId: string; sourceBodyPart: string; targetStackId: string; targetPile: string }) => {
      console.log('Card move event received:', data);
      
      if (currentPlayer && currentPlayer.getName().includes('Human')) {
        const playerState = currentPlayer.getState();
        if (playerState.canPlayCard() || playerState.getState() === 'move_card') { // Allow moves when in move_card state
          console.log('Attempting to move card:', data.card.character, data.card.bodyPart, 'from', data.sourceStackId, data.sourceBodyPart, 'to', data.targetStackId, data.targetPile);
          
          try {
            // Convert string body parts to enums
            let sourceBodyPart: BodyPart;
            let targetPile: BodyPart;
            
            // Convert source body part
            switch (data.sourceBodyPart) {
              case 'head':
                sourceBodyPart = BodyPart.Head;
                break;
              case 'torso':
                sourceBodyPart = BodyPart.Torso;
                break;
              case 'legs':
                sourceBodyPart = BodyPart.Legs;
                break;
              default:
                throw new Error(`Invalid source body part: ${data.sourceBodyPart}`);
            }
            
            // Convert target pile
            switch (data.targetPile) {
              case 'head':
                targetPile = BodyPart.Head;
                break;
              case 'torso':
                targetPile = BodyPart.Torso;
                break;
              case 'legs':
                targetPile = BodyPart.Legs;
                break;
              default:
                throw new Error(`Invalid target body part: ${data.targetPile}`);
            }

            if (data.targetStackId === 'new') {
              // Moving to a new stack
              console.log('Moving to new stack with options:', { cardId: data.card.id, fromStackId: data.sourceStackId, fromPile: sourceBodyPart, toPile: targetPile });
              moveCard({
                cardId: data.card.id,
                fromStackId: data.sourceStackId,
                fromPile: sourceBodyPart,
                toPile: targetPile
              });
            } else {
              // Moving to an existing stack
              console.log('Moving to existing stack with options:', { cardId: data.card.id, fromStackId: data.sourceStackId, fromPile: sourceBodyPart, toStackId: data.targetStackId, toPile: targetPile });
              moveCard({
                cardId: data.card.id,
                fromStackId: data.sourceStackId,
                fromPile: sourceBodyPart,
                toStackId: data.targetStackId,
                toPile: targetPile
              });
            }
            console.log('Card moved successfully');
          } catch (error) {
            console.error('Failed to move card:', error);
            console.error('Error details:', error);
          }
        } else {
          console.log('Cannot move card in current state:', playerState.getState());
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
    eventBridge.onCanvasEvent('game:cardPlay', handleCardPlay);
    eventBridge.onCanvasEvent('game:cardMove', handleCardMove);
    eventBridge.onCanvasEvent('pixi:ready', handlePixiReady);

    return () => {
      eventBridge.offCanvasEvent('game:deckClick', handleDeckClick);
      eventBridge.offCanvasEvent('game:cardPlay', handleCardPlay);
      eventBridge.offCanvasEvent('game:cardMove', handleCardMove);
      eventBridge.offCanvasEvent('pixi:ready', handlePixiReady);
    };
  }, [currentPlayer, drawCard, playCard, moveCard, eventBridge]);

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