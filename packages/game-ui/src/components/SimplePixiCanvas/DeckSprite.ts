import * as PIXI from 'pixi.js';

export interface DeckOptions {
  width?: number;
  height?: number;
  cardCount?: number;
  x?: number;
  y?: number;
}

/**
 * Reusable deck sprite for displaying the card deck
 */
export class DeckSprite extends PIXI.Container {
  private readonly deckWidth: number;
  private readonly deckHeight: number;
  private cardCount: number;

  constructor(options: DeckOptions = {}) {
    super();
    this.deckWidth = options.width || 80;
    this.deckHeight = options.height || 120;
    this.cardCount = options.cardCount || 44;
    
    this.createDeck();
    
    if (options.x !== undefined) this.x = options.x;
    if (options.y !== undefined) this.y = options.y;
  }

  /**
   * Get the current card count
   */
  getCardCount(): number {
    return this.cardCount;
  }

  /**
   * Update the card count (for visual feedback)
   */
  updateCardCount(count: number): void {
    this.cardCount = count;
    // Could add visual changes here (darker when empty, etc.)
  }

  /**
   * Create the visual deck
   */
  private createDeck(): void {
    // Clear any existing content
    this.removeChildren();

    // Create the main deck rectangle
    const deckGraphics = new PIXI.Graphics();
    deckGraphics
      .rect(0, 0, this.deckWidth, this.deckHeight)
      .fill(0x1976D2) // Blue deck color
      .stroke({ width: 2, color: 0x0D47A1 }); // Darker blue border
    
    // Make it interactive
    this.eventMode = 'static';
    this.cursor = 'pointer';
    
    this.addChild(deckGraphics);
    
    // Add card count text (optional visual enhancement)
    const countText = new PIXI.Text({
      text: this.cardCount.toString(),
      style: {
        fontFamily: 'Arial',
        fontSize: 16,
        fill: 0xFFFFFF,
        align: 'center',
        fontWeight: 'bold'
      }
    });
    countText.x = (this.deckWidth - countText.width) / 2;
    countText.y = (this.deckHeight - countText.height) / 2;
    this.addChild(countText);
  }

  /**
   * Set up click handler
   */
  onDeckClick(callback: () => void): void {
    this.removeAllListeners('pointerdown');
    this.on('pointerdown', callback);
  }

  /**
   * Set up hover handlers
   */
  onDeckHover(onHover: () => void, onHoverEnd: () => void): void {
    this.removeAllListeners('pointerover');
    this.removeAllListeners('pointerout');
    this.on('pointerover', onHover);
    this.on('pointerout', onHoverEnd);
  }
}