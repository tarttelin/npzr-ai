import * as PIXI from 'pixi.js';

/**
 * Canvas configuration constants
 */
export const CANVAS_CONFIG = {
  MIN_WIDTH: 800,
  MIN_HEIGHT: 600,
  ASPECT_RATIO: 4 / 3,
  BACKGROUND_COLOR: 0x2E7D32, // Green baize color
} as const;

/**
 * Deck placeholder configuration
 */
export const DECK_CONFIG = {
  WIDTH: 80,
  HEIGHT: 120,
  BORDER_RADIUS: 8,
  COLOR: 0x1976D2, // Blue color
  BORDER_COLOR: 0x0D47A1, // Darker blue border
  BORDER_WIDTH: 2,
} as const;

/**
 * Create a PixiJS application with standard configuration
 */
export function createPixiApp(width: number, height: number): PIXI.Application {
  const app = new PIXI.Application({
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
 * Create a rounded rectangle sprite for the deck placeholder
 */
export function createDeckPlaceholder(): PIXI.Graphics {
  const deck = new PIXI.Graphics();
  
  // Draw the main rectangle with rounded corners
  deck.beginFill(DECK_CONFIG.COLOR);
  deck.lineStyle(DECK_CONFIG.BORDER_WIDTH, DECK_CONFIG.BORDER_COLOR);
  deck.drawRoundedRect(
    0,
    0,
    DECK_CONFIG.WIDTH,
    DECK_CONFIG.HEIGHT,
    DECK_CONFIG.BORDER_RADIUS
  );
  deck.endFill();

  return deck;
}

/**
 * Position the deck placeholder on the left side of the canvas
 */
export function positionDeckPlaceholder(deck: PIXI.Graphics, _canvasWidth: number, canvasHeight: number): void {
  // Position deck on left side, vertically centered
  deck.x = 50; // 50px from left edge
  deck.y = (canvasHeight - DECK_CONFIG.HEIGHT) / 2; // Vertically centered
}

/**
 * Calculate responsive canvas size based on container
 */
export function calculateCanvasSize(containerWidth: number, containerHeight: number): { width: number; height: number } {
  // Ensure minimum size
  const minWidth = Math.max(containerWidth, CANVAS_CONFIG.MIN_WIDTH);
  const minHeight = Math.max(containerHeight, CANVAS_CONFIG.MIN_HEIGHT);

  // Calculate size maintaining aspect ratio
  const aspectRatio = CANVAS_CONFIG.ASPECT_RATIO;
  let width = minWidth;
  let height = width / aspectRatio;

  // If height exceeds container, adjust based on height
  if (height > minHeight) {
    height = minHeight;
    width = height * aspectRatio;
  }

  return { width: Math.floor(width), height: Math.floor(height) };
}

/**
 * Cleanup PixiJS application resources
 */
export function destroyPixiApp(app: PIXI.Application): void {
  if (app) {
    app.destroy(true, { children: true, texture: true });
  }
}