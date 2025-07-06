import * as PIXI from 'pixi.js';
import { Card } from '@npzr/core';

export type CardSize = 'normal' | 'small';

interface CardSpriteOptions {
  size: CardSize;
  spriteSheet?: PIXI.Texture;
  makeInteractive?: boolean;
}

/**
 * Reusable card sprite for displaying cards in various contexts
 */
export class CardSprite extends PIXI.Container {
  private card: Card;
  private options: CardSpriteOptions;

  constructor(card: Card, options: CardSpriteOptions) {
    super();
    this.card = card;
    this.options = options;
    
    this.createCardVisual();
    
    if (options.makeInteractive) {
      this.eventMode = 'static';
      this.cursor = 'pointer';
    }
  }

  /**
   * Get the card data
   */
  getCard(): Card {
    return this.card;
  }

  /**
   * Create the visual representation of the card
   */
  private createCardVisual(): void {
    // Clear any existing content
    this.removeChildren();

    const { cardWidth, cardHeight } = this.getCardDimensions();
    
    // Try to use sprite sheet for non-wild cards
    const coords = this.getSpriteCoordinates();
    const isWildCard = this.isWildCard();
    
    if (coords && this.options.spriteSheet && !isWildCard) {
      this.createSpriteCard(cardWidth, cardHeight, coords);
    } else {
      this.createFallbackCard(cardWidth, cardHeight, isWildCard);
    }
  }

  /**
   * Get card dimensions - consistent sizing with proper aspect ratio
   */
  private getCardDimensions(): { cardWidth: number; cardHeight: number } {
    // Use consistent 80px width with proper sprite sheet aspect ratio (280x190 = 1.47)
    const cardWidth = 80;
    const cardHeight = cardWidth / (280/190); // Maintains sprite sheet aspect ratio
    return { 
      cardWidth, 
      cardHeight // This gives us 80x54.4, which is close to our target
    };
  }

  /**
   * Check if this card is a wild card
   */
  private isWildCard(): boolean {
    return this.card.isWild();
  }

  /**
   * Get sprite sheet coordinates for this card
   */
  private getSpriteCoordinates(): { x: number, y: number, width: number, height: number } | null {
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
    
    const key = `${this.card.character?.toLowerCase()}-${this.card.bodyPart?.toLowerCase()}`;
    return coordinateMap[key] || null;
  }

  /**
   * Create sprite-based card visual
   */
  private createSpriteCard(cardWidth: number, cardHeight: number, coords: { x: number, y: number, width: number, height: number }): void {
    const texture = new PIXI.Texture({
      source: this.options.spriteSheet!.source,
      frame: new PIXI.Rectangle(coords.x, coords.y, coords.width, coords.height)
    });
    
    const sprite = new PIXI.Sprite(texture);
    sprite.width = cardWidth;
    sprite.height = cardHeight;
    this.addChild(sprite);
    
    // Add border
    const border = new PIXI.Graphics();
    border
      .rect(0, 0, cardWidth, cardHeight)
      .stroke({ width: 2, color: 0x333333 });
    this.addChild(border);
  }

  /**
   * Create fallback text-based card visual
   */
  private createFallbackCard(cardWidth: number, cardHeight: number, isWildCard: boolean): void {
    const cardBg = new PIXI.Graphics();
    
    if (isWildCard) {
      // Wild card - gold styling
      cardBg
        .rect(0, 0, cardWidth, cardHeight)
        .fill(0xFFD700)
        .stroke({ 
          width: 2, 
          color: 0xFF8C00 
        });
    } else {
      // Regular card fallback
      cardBg
        .rect(0, 0, cardWidth, cardHeight)
        .fill(0xFFFFFF)
        .stroke({ 
          width: 2, 
          color: 0x333333 
        });
    }
    
    this.addChild(cardBg);
    
    // Add text
    const text = new PIXI.Text({
      text: this.card.character || 'Wild',
      style: {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: 0x000000,
        align: 'center',
        fontWeight: 'bold'
      }
    });
    text.x = (cardWidth - text.width) / 2;
    text.y = (cardHeight - text.height) / 2;
    this.addChild(text);

    // Add body part text for non-wild cards
    if (!isWildCard) {
      const bodyPartText = new PIXI.Text({
        text: this.card.bodyPart || 'Card',
        style: {
          fontFamily: 'Arial',
          fontSize: 9,
          fill: 0x666666,
          align: 'center'
        }
      });
      bodyPartText.x = (cardWidth - bodyPartText.width) / 2;
      bodyPartText.y = cardHeight - 12;
      this.addChild(bodyPartText);
    }
  }
}