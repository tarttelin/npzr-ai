import React, { useRef, useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { EventBridge } from '../../bridge/EventBridge';
import { logger } from '@npzr/logging';
import { Card } from '@npzr/core';

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
  const handContainerRef = useRef<PIXI.Container | null>(null);
  const stacksContainerRef = useRef<PIXI.Container | null>(null);
  const spriteSheetRef = useRef<PIXI.Texture | null>(null);

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

        // Create simple deck
        const deck = new PIXI.Graphics();
        deck
          .rect(0, 0, 80, 120)
          .fill(0x1976D2)
          .stroke({ width: 2, color: 0x0D47A1 });
        
        deck.x = 50;
        deck.y = (height - 120) / 2;
        deck.eventMode = 'static';
        deck.cursor = 'pointer';
        
        deck.on('pointerdown', () => {
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

        // Create hand container for human player
        const handContainer = new PIXI.Container();
        handContainer.x = 50;
        handContainer.y = height - 160; // Near bottom for human player
        app.stage.addChild(handContainer);
        handContainerRef.current = handContainer;

        // Add hand label
        const handLabel = new PIXI.Text({
          text: 'Your Hand:',
          style: {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0xFFFFFF,
            fontWeight: 'bold'
          }
        });
        handLabel.x = 50;
        handLabel.y = height - 190;
        app.stage.addChild(handLabel);

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

        // Create initial stack areas (empty drop zones)
        createStackAreas();

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
      
      if (appRef.current && handContainerRef.current && gameState?.players?.[0]) {
        console.log('Updating human player hand with:', gameState.players[0]);
        updateHumanPlayerHand(gameState.players[0]);
        updateHumanPlayerStacks(gameState.players[0]);
      } else {
        console.log('Cannot update hand - missing components:', {
          hasApp: !!appRef.current,
          hasHandContainer: !!handContainerRef.current,
          hasPlayerData: !!gameState?.players?.[0]
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
   * Get sprite sheet coordinates for a character/bodypart combination
   */
  const getSpriteCoordinates = (character: string, bodyPart: string) => {
    // Use exact coordinates from CLAUDE.md
    const coordinateMap: { [key: string]: { x: number, y: number, width: number, height: number } } = {
      'ninja-head': { x: 20, y: 10, width: 280, height: 190 },
      'pirate-head': { x: 340, y: 10, width: 280, height: 190 },
      'zombie-head': { x: 660, y: 10, width: 280, height: 190 },
      'robot-head': { x: 980, y: 10, width: 280, height: 190 },
      'ninja-torso': { x: 20, y: 260, width: 280, height: 190 },
      'pirate-torso': { x: 340, y: 260, width: 280, height: 190 },
      'zombie-torso': { x: 660, y: 260, width: 280, height: 190 },
      'robot-torso': { x: 980, y: 260, width: 280, height: 190 },
      'ninja-legs': { x: 20, y: 510, width: 280, height: 190 },
      'pirate-legs': { x: 340, y: 510, width: 280, height: 190 },
      'zombie-legs': { x: 660, y: 510, width: 280, height: 190 },
      'robot-legs': { x: 980, y: 510, width: 280, height: 190 }
    };
    
    const key = `${character.toLowerCase()}-${bodyPart.toLowerCase()}`;
    return coordinateMap[key] || null;
  };

  /**
   * Create a card visual with sprite sheet or fallback
   */
  const createSimpleCard = (card: Card, index: number, spriteSheet?: PIXI.Texture): PIXI.Container => {
    const cardContainer = new PIXI.Container();
    
    // Debug card data
    console.log('Creating card:', {
      id: card.id,
      character: card.character,
      bodyPart: card.bodyPart,
      isWild: card.isWild,
      hasCharacter: !!card.character,
      hasBodyPart: !!card.bodyPart,
      characterType: typeof card.character,
      bodyPartType: typeof card.bodyPart
    });
    
    // Try to use sprite sheet for non-wild cards
    const coords = getSpriteCoordinates(card.character || '', card.bodyPart || '');
    const isWildCard = card.isWild() || 
                      card.character === 'wild' || 
                      card.bodyPart === 'wild' ||
                      !card.character ||
                      !card.bodyPart;
    
    console.log('Card evaluation:', {
      coords: coords,
      hasSpriteSheet: !!spriteSheet,
      isWildCard: isWildCard,
      willUseSprite: !!(coords && spriteSheet && !isWildCard),
      character: card.character,
      bodyPart: card.bodyPart,
      coordinateKey: `${card.character?.toLowerCase()}-${card.bodyPart?.toLowerCase()}`
    });
    
    const createFallbackCard = () => {
      // Use same dimensions as sprite cards for consistency
      const cardWidth = 80;
      const cardHeight = cardWidth / (280/190); // Match sprite aspect ratio
      
      const cardBg = new PIXI.Graphics();
      
      if (card.isWild() || card.character === 'wild' || card.bodyPart === 'wild') {
        // Wild card - special styling
        cardBg
          .rect(0, 0, cardWidth, cardHeight)
          .fill(0xFFD700) // Gold background for wild cards
          .stroke({ width: 2, color: 0xFF8C00 });
      } else {
        // Regular card fallback
        cardBg
          .rect(0, 0, cardWidth, cardHeight)
          .fill(0xFFFFFF)
          .stroke({ width: 2, color: 0x333333 });
      }
      
      cardContainer.addChild(cardBg);
      
      // Add text labels
      const characterText = new PIXI.Text({
        text: card.character || 'Wild',
        style: {
          fontFamily: 'Arial',
          fontSize: 12,
          fill: 0x000000,
          fontWeight: 'bold',
          align: 'center'
        }
      });
      characterText.x = (cardWidth - characterText.width) / 2;
      characterText.y = 8;
      cardContainer.addChild(characterText);
      
      const bodyPartText = new PIXI.Text({
        text: card.bodyPart || 'Card',
        style: {
          fontFamily: 'Arial',
          fontSize: 10,
          fill: 0x666666,
          align: 'center'
        }
      });
      bodyPartText.x = (cardWidth - bodyPartText.width) / 2;
      bodyPartText.y = cardHeight - 20;
      cardContainer.addChild(bodyPartText);
    };

    if (coords && spriteSheet && !isWildCard) {
      // Use sprite sheet
      console.log('Creating sprite with coords:', coords);
      console.log('Sprite sheet dimensions:', spriteSheet.width, 'x', spriteSheet.height);
      
      try {
        const texture = new PIXI.Texture({
          source: spriteSheet.source,
          frame: new PIXI.Rectangle(coords.x, coords.y, coords.width, coords.height)
        });
        
        const sprite = new PIXI.Sprite(texture);
        // Scale down to card size while maintaining aspect ratio
        // Original sprite is 280x190, so aspect ratio is 280/190 = 1.47
        const cardWidth = 80;
        const cardHeight = cardWidth / (280/190); // Maintain aspect ratio
        sprite.width = cardWidth;
        sprite.height = cardHeight;
        cardContainer.addChild(sprite);
        
        // Add a border that matches the sprite dimensions
        const border = new PIXI.Graphics();
        border
          .rect(0, 0, cardWidth, cardHeight)
          .stroke({ width: 2, color: 0x333333 });
        cardContainer.addChild(border);
        
        console.log('✅ Successfully created sprite card');
      } catch (error) {
        console.error('❌ Failed to create sprite:', error);
        // Fall back to text rendering
        createFallbackCard();
      }
      
    } else {
      // Fallback for wild cards or missing sprite sheet
      console.log('Using fallback card rendering');
      createFallbackCard();
    }
    
    // Position the card with spacing
    cardContainer.x = index * 90; // 80px card + 10px spacing
    
    // Make card draggable
    makeCardDraggable(cardContainer, card);
    
    return cardContainer;
  };

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
        const stageDragData = (appRef.current!.stage as any).dragData;
        if (!stageDragData?.dragging) return;
        
        const globalPos = event.global;
        const localPos = stageDragData.cardContainer.parent.toLocal(globalPos);
        
        stageDragData.cardContainer.x = localPos.x - stageDragData.offsetX;
        stageDragData.cardContainer.y = localPos.y - stageDragData.offsetY;
      });

      appRef.current!.stage.on('pointerup', (event: PIXI.FederatedPointerEvent) => {
        const stageDragData = (appRef.current!.stage as any).dragData;
        if (!stageDragData?.dragging) return;
        
        const dropTarget = findDropTarget(event.global);
        
        if (dropTarget) {
          console.log('Dropped card on stack:', dropTarget.stackIndex);
          // Emit event to React for game engine integration
          eventBridge.emitToReact('game:cardPlay', { 
            card: stageDragData.card,
            targetStackId: `stack-${dropTarget.stackIndex}`,
            targetPile: 'head' // For now, assume head pile
          });
          
          // Reset card position for now (React will handle the actual move)
          stageDragData.cardContainer.x = stageDragData.originalX;
          stageDragData.cardContainer.y = stageDragData.originalY;
        } else {
          // Return to original position
          stageDragData.cardContainer.x = stageDragData.originalX;
          stageDragData.cardContainer.y = stageDragData.originalY;
          console.log('Card dropped outside valid area, returning to hand');
        }
        
        // Clear drag data
        (appRef.current!.stage as any).dragData = null;
      });
    }
  };

  /**
   * Find the drop target (stack area) under the pointer
   */
  const findDropTarget = (globalPos: PIXI.Point): { stackIndex: number } | null => {
    const stacksContainer = stacksContainerRef.current;
    if (!stacksContainer) return null;

    // Check each stack area
    for (let i = 0; i < stacksContainer.children.length; i++) {
      const stackArea = stacksContainer.children[i] as PIXI.Container;
      const localPos = stackArea.toLocal(globalPos);
      
      // Check if point is within stack bounds
      if (localPos.x >= 0 && localPos.x <= 100 && 
          localPos.y >= 0 && localPos.y <= 140) {
        return { stackIndex: i };
      }
    }
    
    return null;
  };

  /**
   * Create stack areas for card play
   */
  const createStackAreas = () => {
    const stacksContainer = stacksContainerRef.current;
    if (!stacksContainer || !appRef.current) return;

    // Clear existing stack areas
    stacksContainer.removeChildren();

    // Create 4 initial stack areas (expandable as needed)
    for (let i = 0; i < 4; i++) {
      const stackArea = createStackArea(i);
      stackArea.x = i * 120; // Space stacks horizontally
      stacksContainer.addChild(stackArea);
    }
  };

  /**
   * Create a single stack area (drop zone)
   */
  const createStackArea = (index: number): PIXI.Container => {
    const stackContainer = new PIXI.Container();
    
    // Create drop zone background
    const dropZone = new PIXI.Graphics();
    dropZone
      .rect(0, 0, 100, 140)
      .fill(0x444444, 0.3)
      .stroke({ width: 2, color: 0x666666, style: 'dashed' as any });
    
    // Don't make drop zones interactive - they're just visual indicators
    // The drag system will detect drops using coordinate checking
    
    // Add drop zone label
    const label = new PIXI.Text({
      text: `Stack ${index + 1}`,
      style: {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: 0xCCCCCC,
        align: 'center'
      }
    });
    label.x = (100 - label.width) / 2;
    label.y = 5;
    
    stackContainer.addChild(dropZone);
    stackContainer.addChild(label);
    stackContainer.name = `stack-${index}`;
    
    return stackContainer;
  };

  /**
   * Update human player hand display
   */
  const updateHumanPlayerHand = (playerData: any) => {
    const handContainer = handContainerRef.current;
    if (!handContainer || !appRef.current) return;
    
    logger.info('Updating human player hand display', { 
      handSize: playerData.handSize,
      playerName: playerData.name,
      hasCardData: !!playerData.handCards,
      cardCount: playerData.handCards?.length || 0
    });
    
    // Clear existing cards
    handContainer.removeChildren();
    
    // Use actual card data if available
    if (playerData.handCards && playerData.handCards.length > 0) {
      console.log('About to create cards:', playerData.handCards);
      console.log('Sprite sheet available:', !!spriteSheetRef.current);
      
      playerData.handCards.forEach((card: Card, index: number) => {
        console.log(`Creating card ${index}:`, card);
        const cardVisual = createSimpleCard(card, index, spriteSheetRef.current || undefined);
        handContainer.addChild(cardVisual);
      });
      
      logger.info(`Updated hand display with ${playerData.handCards.length} actual cards using ${spriteSheetRef.current ? 'sprite sheet' : 'fallback'} visuals`);
    } else {
      logger.info('No card data available, hand is empty');
    }
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

    // Clear existing stack displays but keep the drop zones
    // We'll overlay the actual stacks on top of the drop zones
    
    if (playerData.stacks && playerData.stacks.length > 0) {
      playerData.stacks.forEach((stack: any, index: number) => {
        updateStackDisplay(index, stack);
      });
    }
  };

  /**
   * Update a specific stack display
   */
  const updateStackDisplay = (stackIndex: number, stackData: any) => {
    const stacksContainer = stacksContainerRef.current;
    if (!stacksContainer) return;

    const stackArea = stacksContainer.children[stackIndex] as PIXI.Container;
    if (!stackArea) return;

    // Clear any existing cards in this stack (but keep the drop zone background)
    const cardsToRemove = stackArea.children.filter(child => child.name?.startsWith('stack-card'));
    cardsToRemove.forEach(card => stackArea.removeChild(card));

    // Add cards from the stack data
    let cardYOffset = 30; // Start below the label

    if (stackData.headCard) {
      const headCard = createStackCard(stackData.headCard, 0);
      headCard.name = 'stack-card-head';
      headCard.y = cardYOffset;
      stackArea.addChild(headCard);
      cardYOffset += 25; // Overlap cards slightly
    }

    if (stackData.torsoCard) {
      const torsoCard = createStackCard(stackData.torsoCard, 1);
      torsoCard.name = 'stack-card-torso';
      torsoCard.y = cardYOffset;
      stackArea.addChild(torsoCard);
      cardYOffset += 25;
    }

    if (stackData.legsCard) {
      const legsCard = createStackCard(stackData.legsCard, 2);
      legsCard.name = 'stack-card-legs';
      legsCard.y = cardYOffset;
      stackArea.addChild(legsCard);
    }

    // Highlight complete stacks
    if (stackData.isComplete) {
      const highlight = new PIXI.Graphics();
      highlight
        .rect(-5, -5, 110, 150)
        .stroke({ width: 3, color: 0x00FF00, alpha: 0.8 });
      highlight.name = 'stack-complete-highlight';
      stackArea.addChild(highlight);
    }
  };

  /**
   * Create a smaller card for stack display
   */
  const createStackCard = (card: any, index: number): PIXI.Container => {
    const cardContainer = new PIXI.Container();
    
    // Use smaller dimensions for stack cards
    const cardWidth = 70;
    const cardHeight = cardWidth / (280/190); // Maintain aspect ratio
    
    // Try to use sprite sheet first
    const coords = getSpriteCoordinates(card.character || '', card.bodyPart || '');
    const isWildCard = card.isWild() || 
                      card.character === 'wild' || 
                      card.bodyPart === 'wild' ||
                      !card.character ||
                      !card.bodyPart;

    if (coords && spriteSheetRef.current && !isWildCard) {
      // Use sprite sheet
      const texture = new PIXI.Texture({
        source: spriteSheetRef.current.source,
        frame: new PIXI.Rectangle(coords.x, coords.y, coords.width, coords.height)
      });
      
      const sprite = new PIXI.Sprite(texture);
      sprite.width = cardWidth;
      sprite.height = cardHeight;
      cardContainer.addChild(sprite);
      
      // Add border
      const border = new PIXI.Graphics();
      border
        .rect(0, 0, cardWidth, cardHeight)
        .stroke({ width: 1, color: 0x333333 });
      cardContainer.addChild(border);
    } else {
      // Fallback rendering for wild cards or missing sprites
      const cardBg = new PIXI.Graphics();
      
      if (isWildCard) {
        cardBg
          .rect(0, 0, cardWidth, cardHeight)
          .fill(0xFFD700)
          .stroke({ width: 1, color: 0xFF8C00 });
      } else {
        cardBg
          .rect(0, 0, cardWidth, cardHeight)
          .fill(0xFFFFFF)
          .stroke({ width: 1, color: 0x333333 });
      }
      
      cardContainer.addChild(cardBg);
      
      // Add small text
      const text = new PIXI.Text({
        text: `${card.character || 'W'}\n${card.bodyPart || 'C'}`,
        style: {
          fontFamily: 'Arial',
          fontSize: 8,
          fill: 0x000000,
          align: 'center'
        }
      });
      text.x = (cardWidth - text.width) / 2;
      text.y = (cardHeight - text.height) / 2;
      cardContainer.addChild(text);
    }
    
    return cardContainer;
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