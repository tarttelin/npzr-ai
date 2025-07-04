import * as PIXI from 'pixi.js';
import { Z_LAYERS } from '../../utils/Constants';

/**
 * Deck configuration
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
 * Deck sprite represents the deck of cards on the canvas
 */
export class DeckSprite extends PIXI.Graphics {
  private cardCount: number = 44; // Default NPZR deck size
  private isClickable: boolean = true;

  constructor() {
    super();
    this.zIndex = Z_LAYERS.DECK;
    this.createDeckVisual();
    this.setupInteractivity();
  }

  /**
   * Create the visual representation of the deck
   */
  private createDeckVisual(): void {
    this.clear();
    
    // Choose colors based on clickable state
    const fillColor = this.isClickable ? DECK_CONFIG.COLOR : 0x757575; // Gray when not clickable
    const borderColor = this.isClickable ? DECK_CONFIG.BORDER_COLOR : 0x424242;
    
    // Draw the main rectangle with rounded corners (PixiJS v8 API)
    this
      .rect(0, 0, DECK_CONFIG.WIDTH, DECK_CONFIG.HEIGHT)
      .fill(fillColor)
      .stroke({ width: DECK_CONFIG.BORDER_WIDTH, color: borderColor });
  }

  /**
   * Setup interactivity for the deck
   */
  private setupInteractivity(): void {
    this.eventMode = 'static';
    this.updateCursor();
    
    this.on('pointerover', this.onHover.bind(this));
    this.on('pointerout', this.onHoverEnd.bind(this));
    this.on('pointerdown', this.onClick.bind(this));
  }

  /**
   * Update cursor based on clickable state
   */
  private updateCursor(): void {
    this.cursor = this.isClickable ? 'pointer' : 'not-allowed';
  }

  /**
   * Handle hover start
   */
  private onHover(): void {
    this.alpha = 0.8;
  }

  /**
   * Handle hover end
   */
  private onHoverEnd(): void {
    this.alpha = 1.0;
  }

  /**
   * Handle click/tap
   */
  private onClick(): void {
    this.emit('deck:click', { cardCount: this.cardCount });
  }

  /**
   * Update the card count and refresh visual if needed
   */
  setCardCount(count: number): void {
    this.cardCount = count;
    
    // Could add visual changes based on card count
    // e.g., change opacity, add card count text, etc.
    if (count === 0) {
      this.alpha = 0.3;
    } else {
      this.alpha = 1.0;
    }
  }

  /**
   * Get current card count
   */
  getCardCount(): number {
    return this.cardCount;
  }

  /**
   * Position the deck on the canvas
   */
  positionDeck(_canvasWidth: number, canvasHeight: number): void {
    // Position deck on left side, vertically centered
    this.x = 50; // 50px from left edge
    this.y = (canvasHeight - DECK_CONFIG.HEIGHT) / 2; // Vertically centered
  }

  /**
   * Animate deck interaction (e.g., when drawing a card)
   */
  animateCardDraw(): Promise<void> {
    return new Promise((resolve) => {
      // Simple scale animation
      const originalScale = this.scale.x;
      
      // Scale down slightly
      this.scale.set(originalScale * 0.95);
      
      // Scale back to original
      setTimeout(() => {
        this.scale.set(originalScale);
        resolve();
      }, 150);
    });
  }

  /**
   * Set whether the deck can be clicked
   */
  setClickable(clickable: boolean): void {
    if (this.isClickable !== clickable) {
      this.isClickable = clickable;
      this.createDeckVisual(); // Redraw with new colors
      this.updateCursor();
    }
  }

  /**
   * Check if deck is clickable
   */
  getClickable(): boolean {
    return this.isClickable;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.removeAllListeners();
    super.destroy();
  }
}