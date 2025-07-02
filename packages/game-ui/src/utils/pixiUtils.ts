/**
 * @deprecated This file is deprecated. Use the new canvas architecture instead.
 * Import from '@/canvas' for new functionality.
 */

import * as PIXI from 'pixi.js';
import { CANVAS_CONFIG } from '../canvas/utils/Constants';
import { DECK_CONFIG, DeckSprite } from '../canvas/entities/Deck/DeckSprite';
import { calculateCanvasSize as newCalculateCanvasSize } from '../canvas/utils/Math';

// Re-export for backward compatibility
export { CANVAS_CONFIG, DECK_CONFIG };

/**
 * @deprecated Use CanvasApplication from '../canvas/core/Application' instead
 */
export async function createPixiApp(width: number, height: number): Promise<PIXI.Application> {
  console.warn('createPixiApp is deprecated. Use CanvasApplication instead.');
  const app = new PIXI.Application();
  
  await app.init({
    width,
    height,
    backgroundColor: CANVAS_CONFIG.BACKGROUND_COLOR,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });

  return app;
}

/**
 * @deprecated Use DeckSprite from '../canvas/entities/Deck/DeckSprite' instead
 */
export function createDeckPlaceholder(): PIXI.Graphics {
  console.warn('createDeckPlaceholder is deprecated. Use DeckSprite instead.');
  const deckSprite = new DeckSprite();
  return deckSprite;
}

/**
 * @deprecated Use DeckSprite.positionDeck() method instead
 */
export function positionDeckPlaceholder(deck: PIXI.Graphics, canvasWidth: number, canvasHeight: number): void {
  console.warn('positionDeckPlaceholder is deprecated. Use DeckSprite.positionDeck() instead.');
  if (deck instanceof DeckSprite) {
    deck.positionDeck(canvasWidth, canvasHeight);
  } else {
    // Fallback for raw Graphics objects
    deck.x = 50;
    deck.y = (canvasHeight - DECK_CONFIG.HEIGHT) / 2;
  }
}

/**
 * @deprecated Use calculateCanvasSize from '../canvas/utils/Math' instead
 */
export function calculateCanvasSize(containerWidth: number, containerHeight: number): { width: number; height: number } {
  console.warn('calculateCanvasSize is deprecated. Use the version from canvas/utils/Math instead.');
  return newCalculateCanvasSize(containerWidth, containerHeight);
}

/**
 * @deprecated Use CanvasApplication.destroy() method instead
 */
export function destroyPixiApp(app: PIXI.Application): void {
  console.warn('destroyPixiApp is deprecated. Use CanvasApplication.destroy() instead.');
  if (app) {
    app.destroy(true, { children: true, texture: true });
  }
}