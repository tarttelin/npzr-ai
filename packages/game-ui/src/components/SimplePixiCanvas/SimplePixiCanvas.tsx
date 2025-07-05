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
    
    return cardContainer;
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