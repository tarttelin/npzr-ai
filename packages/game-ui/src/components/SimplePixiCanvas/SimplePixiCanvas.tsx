import React, { useRef, useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { EventBridge } from '../../bridge/EventBridge';
import { logger } from '@npzr/logging';

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

        logger.info('✅ Simple PixiJS canvas ready');
        onPixiReady?.(app);

      } catch (error) {
        logger.error('Failed to initialize PixiJS:', error);
      }
    };

    initPixi();

    return () => {
      mounted = false;
      if (appRef.current) {
        logger.info('Destroying simple PixiJS canvas');
        appRef.current.destroy();
        appRef.current = null;
      }
    };
  }, [width, height, onPixiReady]);

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