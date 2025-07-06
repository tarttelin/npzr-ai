import React, { useRef, useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { EventBridge } from '../../bridge/EventBridge';
import { logger } from '@npzr/logging';
import { Card } from '@npzr/core';
import { StackAreaSprite, StackData, StackCardDragInfo } from './StackAreaSprite';
import { DeckSprite } from './DeckSprite';
import { HandContainerSprite, PlayerHandData } from './HandContainerSprite';

interface SimplePixiCanvasProps {
  width?: number;
  height?: number;
  onPixiReady?: (app: PIXI.Application) => void;
}

/**
 * Simple PixiJS Canvas Component
 * Clean separation - React manages lifecycle, PixiJS manages rendering
 */
export const SimplePixiCanvas: React.FC<SimplePixiCanvasProps> = ({
  width = 800,
  height = 600,
  onPixiReady
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const eventBridge = EventBridge.getInstance();
  const humanHandContainerRef = useRef<HandContainerSprite | null>(null);
  const aiHandContainerRef = useRef<HandContainerSprite | null>(null);
  const stacksContainerRef = useRef<PIXI.Container | null>(null);
  const spriteSheetRef = useRef<PIXI.Texture | null>(null);
  const previousStacksRef = useRef<any[]>([]);

  useEffect(() => {
    let mounted = true;

    const initPixi = async () => {
      if (!containerRef.current || appRef.current) return;

      try {
        logger.info('Initializing simple PixiJS canvas...');
        
        const app = new PIXI.Application();
        await app.init({
          width,
          height,
          backgroundColor: 0x2C5530, // Green baize
          antialias: true,
        });

        if (!mounted) {
          app.destroy();
          return;
        }

        containerRef.current.appendChild(app.canvas);
        appRef.current = app;

        // Load sprite sheet
        try {
          const spriteSheet = await PIXI.Assets.load('/img/sprite-sheet-padded.png');
          spriteSheetRef.current = spriteSheet;
          logger.info('✅ Sprite sheet loaded successfully');
        } catch (error) {
          logger.warn('Failed to load sprite sheet, using fallback visuals:', error);
        }

        // Create deck using DeckSprite
        const deck = new DeckSprite({
          width: 80,
          height: 120,
          cardCount: 44,
          x: 50,
          y: (height - 120) / 2
        });
        
        deck.onDeckClick(() => {
          logger.info('Simple deck clicked');
          eventBridge.emitToReact('game:deckClick', { cardCount: 44 });
        });

        app.stage.addChild(deck);

        // Add text
        const text = new PIXI.Text({
          text: 'Simple PixiJS Canvas\nClick the deck!',
          style: { fontFamily: 'Arial', fontSize: 20, fill: 0xFFFFFF }
        });
        text.x = width / 2 - text.width / 2;
        text.y = 50;
        app.stage.addChild(text);

        // Create hand container for human player using HandContainerSprite
        const handContainer = new HandContainerSprite({
          x: 50,
          y: height - 160, // Near bottom for human player
          playerName: 'Your',
          spriteSheet: spriteSheetRef.current || undefined,
          makeCardsDraggable: true
        });
        
        // Set up card drag handler
        handContainer.setCardDragHandler(makeCardDraggable);
        
        app.stage.addChild(handContainer);
        humanHandContainerRef.current = handContainer;

        // Create hand container for AI player using HandContainerSprite  
        const aiHandContainer = new HandContainerSprite({
          x: 50,
          y: 50, // Near top for AI player
          playerName: 'AI Opponent',
          spriteSheet: spriteSheetRef.current || undefined,
          makeCardsDraggable: false // AI cards should not be draggable
        });
        
        app.stage.addChild(aiHandContainer);
        aiHandContainerRef.current = aiHandContainer;

        // Create stack areas for human player
        const stacksContainer = new PIXI.Container();
        stacksContainer.x = 200;
        stacksContainer.y = height - 350; // Above hand area
        app.stage.addChild(stacksContainer);
        stacksContainerRef.current = stacksContainer;

        // Add stacks label
        const stacksLabel = new PIXI.Text({
          text: 'Your Stacks:',
          style: {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0xFFFFFF,
            fontWeight: 'bold'
          }
        });
        stacksLabel.x = 200;
        stacksLabel.y = height - 380;
        app.stage.addChild(stacksLabel);

        // Create initial stack areas (just one "new stack" area initially)
        createStackAreas([]);

        logger.info('✅ Simple PixiJS canvas ready');
        onPixiReady?.(app);

        // Notify React that PixiJS is ready and request initial state
        eventBridge.emitToReact('pixi:ready', {});

      } catch (error) {
        logger.error('Failed to initialize PixiJS:', error);
      }
    };

    // Listen for game state updates from React
    const handleGameStateUpdate = (gameState: any) => {
      logger.info('PixiJS received game state update:', gameState);
      console.log('PixiJS received game state update:', gameState);
      
      if (appRef.current && humanHandContainerRef.current && gameState?.players) {
        // Update human player (typically players[0])
        if (gameState.players[0]) {
          console.log('Updating human player hand with:', gameState.players[0]);
          updatePlayerHand(humanHandContainerRef.current, gameState.players[0]);
          updateHumanPlayerStacks(gameState.players[0]);
        }
        
        // Update AI player (typically players[1])
        if (gameState.players[1] && aiHandContainerRef.current) {
          console.log('Updating AI player hand with:', gameState.players[1]);
          updatePlayerHand(aiHandContainerRef.current, gameState.players[1]);
        }
      } else {
        console.log('Cannot update hands - missing components:', {
          hasApp: !!appRef.current,
          hasHumanHandContainer: !!humanHandContainerRef.current,
          hasAIHandContainer: !!aiHandContainerRef.current,
          hasPlayerData: !!gameState?.players
        });
      }
    };


    // Setup event listeners before initializing
    eventBridge.onReactEvent('pixi:updateGameState', handleGameStateUpdate);
    
    initPixi();

    return () => {
      mounted = false;
      eventBridge.offReactEvent('pixi:updateGameState', handleGameStateUpdate);
      if (appRef.current) {
        logger.info('Destroying simple PixiJS canvas');
        appRef.current.destroy();
        appRef.current = null;
      }
    };
  }, [width, height, onPixiReady]);



  /**
   * Make a card draggable with drop zone detection
   */
  const makeCardDraggable = (cardContainer: PIXI.Container, card: Card) => {
    cardContainer.eventMode = 'static';
    cardContainer.cursor = 'pointer';
    
    let dragData: { 
      dragging: boolean; 
      originalX: number; 
      originalY: number; 
      offsetX: number; 
      offsetY: number; 
      card: Card;
      cardContainer: PIXI.Container;
    } | null = null;

    cardContainer.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
      const globalPos = event.global;
      const localPos = cardContainer.parent.toLocal(globalPos);
      
      dragData = {
        dragging: true,
        originalX: cardContainer.x,
        originalY: cardContainer.y,
        offsetX: localPos.x - cardContainer.x,
        offsetY: localPos.y - cardContainer.y,
        card: card,
        cardContainer: cardContainer
      };
      
      // Store drag data globally so stage can handle it
      (appRef.current!.stage as any).dragData = dragData;
      
      // Bring card to front
      cardContainer.parent.setChildIndex(cardContainer, cardContainer.parent.children.length - 1);
      
      console.log('Started dragging card:', card.character, card.bodyPart);
      
      // Stop event propagation
      event.stopPropagation();
    });

    // Handle drag on the stage level to avoid interference from other elements
    if (!appRef.current!.stage.listenerCount('pointermove')) {
      appRef.current!.stage.eventMode = 'static';
      
      appRef.current!.stage.on('pointermove', (event: PIXI.FederatedPointerEvent) => {
        const handDragData = (appRef.current!.stage as any).dragData;
        const stackDragData = (appRef.current!.stage as any).stackDragData;
        const activeDragData = handDragData?.dragging ? handDragData : stackDragData?.dragging ? stackDragData : null;
        
        if (!activeDragData?.dragging) return;
        
        const globalPos = event.global;
        const localPos = activeDragData.cardContainer.parent.toLocal(globalPos);
        
        activeDragData.cardContainer.x = localPos.x - activeDragData.offsetX;
        activeDragData.cardContainer.y = localPos.y - activeDragData.offsetY;
      });

      appRef.current!.stage.on('pointerup', (event: PIXI.FederatedPointerEvent) => {
        const handDragData = (appRef.current!.stage as any).dragData;
        const stackDragData = (appRef.current!.stage as any).stackDragData;
        const activeDragData = handDragData?.dragging ? handDragData : stackDragData?.dragging ? stackDragData : null;
        
        if (!activeDragData?.dragging) return;
        
        const dropTarget = findDropTarget(event.global);
        const isStackToStack = !!activeDragData.sourceStackId; // Stack cards have sourceStackId
        
        if (dropTarget) {
          if (isStackToStack) {
            // Stack-to-stack move - emit cardMove event
            console.log('Moving card from stack:', activeDragData.sourceStackId, activeDragData.sourceBodyPart, 'to stack:', dropTarget.gameStackId, dropTarget.bodyPart);
            eventBridge.emitToReact('game:cardMove', {
              card: activeDragData.card,
              sourceStackId: activeDragData.sourceStackId,
              sourceBodyPart: activeDragData.sourceBodyPart,
              targetStackId: dropTarget.gameStackId,
              targetPile: dropTarget.bodyPart
            });
          } else {
            // Hand-to-stack play - emit cardPlay event
            console.log('Playing card from hand to stack:', dropTarget.gameStackId, 'body part:', dropTarget.bodyPart, 'new stack:', dropTarget.isNewStack);
            eventBridge.emitToReact('game:cardPlay', { 
              card: activeDragData.card,
              targetStackId: dropTarget.gameStackId,
              targetPile: dropTarget.bodyPart
            });
          }
          
          // Reset card position for now (React will handle the actual move)
          activeDragData.cardContainer.x = activeDragData.originalX;
          activeDragData.cardContainer.y = activeDragData.originalY;
        } else {
          // Return to original position
          activeDragData.cardContainer.x = activeDragData.originalX;
          activeDragData.cardContainer.y = activeDragData.originalY;
          console.log('Card dropped outside valid area, returning to original position');
        }
        
        // Clear appropriate drag data
        if (isStackToStack) {
          (appRef.current!.stage as any).stackDragData = null;
        } else {
          (appRef.current!.stage as any).dragData = null;
        }
      });
    }
  };

  /**
   * Make a stack card draggable with drop zone detection for stack-to-stack moves
   */
  const makeStackCardDraggable = (dragInfo: StackCardDragInfo) => {
    const { card, sourceStackId, sourceBodyPart, cardContainer } = dragInfo;
    
    cardContainer.eventMode = 'static';
    cardContainer.cursor = 'pointer';
    
    let dragData: { 
      dragging: boolean; 
      originalX: number; 
      originalY: number; 
      offsetX: number; 
      offsetY: number; 
      card: Card;
      cardContainer: PIXI.Container;
      sourceStackId: string;
      sourceBodyPart: string;
    } | null = null;

    cardContainer.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
      const globalPos = event.global;
      const localPos = cardContainer.parent.toLocal(globalPos);
      
      dragData = {
        dragging: true,
        originalX: cardContainer.x,
        originalY: cardContainer.y,
        offsetX: localPos.x - cardContainer.x,
        offsetY: localPos.y - cardContainer.y,
        card: card,
        cardContainer: cardContainer,
        sourceStackId: sourceStackId,
        sourceBodyPart: sourceBodyPart
      };
      
      // Store drag data globally so stage can handle it
      (appRef.current!.stage as any).stackDragData = dragData;
      
      // Bring card to front
      cardContainer.parent.setChildIndex(cardContainer, cardContainer.parent.children.length - 1);
      
      console.log('Started dragging stack card:', card.character, card.bodyPart, 'from', sourceStackId, sourceBodyPart);
      
      // Stop event propagation
      event.stopPropagation();
    });

    // The stack card drag handling will be managed by the existing stage-level handlers
    // but we need to distinguish between hand drags and stack drags in the pointerup handler
  };

  /**
   * Find the drop target (stack area and body part) under the pointer (using StackAreaSprite)
   */
  const findDropTarget = (globalPos: PIXI.Point): { gameStackId: string; bodyPart: string; isNewStack: boolean } | null => {
    const stacksContainer = stacksContainerRef.current;
    if (!stacksContainer) return null;

    // Check each stack area
    for (let i = 0; i < stacksContainer.children.length; i++) {
      const stackArea = stacksContainer.children[i] as StackAreaSprite;
      const stackLocalPos = stackArea.toLocal(globalPos);
      
      // Use StackAreaSprite's built-in drop zone detection
      const dropZone = stackArea.getDropZoneAt(stackLocalPos);
      if (dropZone) {
        console.log('Drop detected on zone:', dropZone.bodyPart, 'gameStackId:', dropZone.gameStackId, 'at stack local pos:', stackLocalPos.x, stackLocalPos.y);
        return dropZone;
      }
    }
    
    return null;
  };

  /**
   * Create stack areas for card play - dynamic based on player stacks (using StackAreaSprite)
   */
  const createStackAreas = (playerStacks?: any[]) => {
    const stacksContainer = stacksContainerRef.current;
    if (!stacksContainer || !appRef.current) return;

    // Clear existing stack areas
    stacksContainer.removeChildren();

    const stackCount = (playerStacks?.length || 0) + 1; // Existing stacks + 1 new
    
    // Create stack areas for existing stacks plus one new
    for (let i = 0; i < stackCount; i++) {
      const isNewStack = i >= (playerStacks?.length || 0);
      const gameStackId = isNewStack ? 'new' : playerStacks![i].id;
      const stackArea = new StackAreaSprite({
        index: i,
        isNewStack: isNewStack,
        gameStackId: gameStackId,
        spriteSheet: spriteSheetRef.current || undefined,
        makeCardsDraggable: !isNewStack // Enable dragging on existing stacks only
      });
      stackArea.name = gameStackId; // Use actual game stack ID as name
      stackArea.x = i * 130; // Space stacks horizontally with more room
      
      // Set up stack card drag handler for existing stacks
      if (!isNewStack) {
        stackArea.setCardDragHandler(makeStackCardDraggable);
      }
      
      stacksContainer.addChild(stackArea);
    }
  };


  /**
   * Update player hand display (using HandContainerSprite) - works for both human and AI
   */
  const updatePlayerHand = (handContainer: HandContainerSprite, playerData: any) => {
    if (!handContainer || !appRef.current) return;
    
    logger.info('Updating player hand display', { 
      handSize: playerData.handSize,
      playerName: playerData.name,
      hasCardData: !!playerData.handCards,
      cardCount: playerData.handCards?.length || 0
    });
    
    // Update sprite sheet if available
    handContainer.updateSpriteSheet(spriteSheetRef.current || undefined);
    
    // Use HandContainerSprite's built-in update method
    const handDataFormatted: PlayerHandData = {
      name: playerData.name || 'Player',
      handSize: playerData.handSize || 0,
      handCards: playerData.handCards || []
    };
    
    handContainer.updateHand(handDataFormatted);
    
    logger.info(`Updated hand display with ${playerData.handCards?.length || 0} actual cards using ${spriteSheetRef.current ? 'sprite sheet' : 'fallback'} visuals`);
  };

  /**
   * Update human player stacks display
   */
  const updateHumanPlayerStacks = (playerData: any) => {
    const stacksContainer = stacksContainerRef.current;
    if (!stacksContainer || !appRef.current) return;

    logger.info('Updating human player stacks display', { 
      stackCount: playerData.stackCount,
      playerName: playerData.name,
      hasStackData: !!playerData.stacks,
      stackDataCount: playerData.stacks?.length || 0
    });

    const currentStacks = playerData.stacks || [];
    const previousStacks = previousStacksRef.current;
    
    // Detect completed stacks by finding which stacks were removed
    if (previousStacks.length > 0) {
      const currentStackIds = new Set(currentStacks.map((s: any) => s.id));
      const removedStacks = previousStacks.filter(prevStack => !currentStackIds.has(prevStack.id));
      
      if (removedStacks.length > 0) {
        console.log('🎉 Detected completed stacks (removed from game state):', removedStacks.map(s => s.id));
        
        // Trigger celebrations for removed stacks BEFORE recreating the display
        removedStacks.forEach(removedStack => {
          const stackArea = stacksContainer.children.find(
            child => child.name === removedStack.id
          ) as StackAreaSprite;
          
          if (stackArea && stackArea instanceof StackAreaSprite) {
            console.log('🎉 Starting celebration for completed stack:', removedStack.id);
            stackArea.showCompletionCelebration(() => {
              console.log('Celebration finished for completed stack:', removedStack.id);
            });
          } else {
            console.warn('Stack not found for celebration:', removedStack.id);
          }
        });
        
        // Delay the stack recreation to allow celebrations to show
        setTimeout(() => {
          // Recreate stack areas based on current player stacks (after celebration)
          createStackAreas(currentStacks);
          
          // Then update each remaining stack with actual card data
          currentStacks.forEach((stack: any) => {
            updateStackDisplay(stack);
          });
        }, 2000); // 2 second delay to show celebration
      } else {
        // No completed stacks, normal update
        createStackAreas(currentStacks);
        currentStacks.forEach((stack: any) => {
          updateStackDisplay(stack);
        });
      }
    } else {
      // First time or no previous stacks, normal update
      createStackAreas(currentStacks);
      currentStacks.forEach((stack: any) => {
        updateStackDisplay(stack);
      });
    }

    // Update the previous stacks reference for next comparison
    previousStacksRef.current = [...currentStacks];
  };

  /**
   * Update a specific stack display (using StackAreaSprite) - find by stack ID
   */
  const updateStackDisplay = (stackData: any) => {
    const stacksContainer = stacksContainerRef.current;
    if (!stacksContainer) return;

    // Find the canvas stack by game stack ID, not by array index
    const stackArea = stacksContainer.children.find(
      child => child.name === stackData.id
    ) as StackAreaSprite;
    
    if (!stackArea || !(stackArea instanceof StackAreaSprite)) {
      console.warn(`Canvas stack not found for game stack ID: ${stackData.id}`);
      return;
    }

    // Normal update - completion detection is now handled at the higher level
    const stackDataFormatted: StackData = {
      id: stackData.id,
      headCard: stackData.headCard,
      torsoCard: stackData.torsoCard,
      legsCard: stackData.legsCard,
      isComplete: stackData.isComplete
    };
    
    stackArea.updateStack(stackDataFormatted);
  };


  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        position: 'relative' 
      }} 
    />
  );
};