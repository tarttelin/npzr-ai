import * as PIXI from 'pixi.js';
import { Card } from '@npzr/core';
import { CardSprite } from './CardSprite';

export interface StackAreaOptions {
  index: number;
  isNewStack?: boolean;
  partWidth?: number;
  partHeight?: number;
  spriteSheet?: PIXI.Texture;
  gameStackId?: string; // Actual game stack ID (stack1, stack3, etc.)
}

export interface StackData {
  id: string;
  headCard?: Card;
  torsoCard?: Card;
  legsCard?: Card;
  isComplete: boolean;
}

/**
 * Reusable stack area sprite for displaying drop zones and stack cards
 */
export class StackAreaSprite extends PIXI.Container {
  private options: StackAreaOptions;
  private readonly partWidth: number;
  private readonly partHeight: number;
  private readonly bodyParts = ['head', 'torso', 'legs'];

  constructor(options: StackAreaOptions) {
    super();
    this.options = options;
    this.partWidth = options.partWidth || 110;
    this.partHeight = options.partHeight || 45;
    
    this.createStackArea();
    
    this.name = `stack-${options.index}`;
  }

  /**
   * Get the stack index
   */
  getIndex(): number {
    return this.options.index;
  }

  /**
   * Check if this is a new stack area
   */
  isNewStack(): boolean {
    return this.options.isNewStack || false;
  }

  /**
   * Create the visual stack area with drop zones
   */
  private createStackArea(): void {
    // Clear any existing content
    this.removeChildren();

    // Create drop zones for each body part (head, torso, legs)
    this.bodyParts.forEach((bodyPart, partIndex) => {
      const dropZone = new PIXI.Graphics();
      const yPos = partIndex * (this.partHeight + 2);
      
      // Different styling for new stack vs existing stack
      if (this.options.isNewStack) {
        dropZone
          .rect(0, yPos, this.partWidth, this.partHeight)
          .fill(0x444444, 0.2)
          .stroke({ width: 1, color: 0x888888 });
      } else {
        dropZone
          .rect(0, yPos, this.partWidth, this.partHeight)
          .fill(0x333333, 0.3)
          .stroke({ width: 2, color: 0x666666 });
      }
      
      // Add body part label
      const partLabel = new PIXI.Text({
        text: bodyPart.charAt(0).toUpperCase() + bodyPart.slice(1),
        style: {
          fontFamily: 'Arial',
          fontSize: 10,
          fill: 0xCCCCCC,
          align: 'center'
        }
      });
      partLabel.x = 5;
      partLabel.y = yPos + 2;
      
      // Store metadata for drop detection
      dropZone.name = `${bodyPart}-zone`;
      (dropZone as any).stackIndex = this.options.index;
      (dropZone as any).bodyPart = bodyPart;
      (dropZone as any).isNewStack = this.options.isNewStack;
      
      this.addChild(dropZone);
      this.addChild(partLabel);
    });
    
    // Add stack label
    const stackLabel = new PIXI.Text({
      text: this.options.isNewStack ? 'New Stack' : `Stack ${this.options.index + 1}`,
      style: {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: this.options.isNewStack ? 0x999999 : 0xFFFFFF,
        align: 'center',
        fontWeight: 'bold'
      }
    });
    stackLabel.x = (this.partWidth - stackLabel.width) / 2;
    stackLabel.y = -18;
    
    this.addChild(stackLabel);
  }

  /**
   * Update the stack with actual card data
   */
  updateStack(stackData: StackData): void {
    // Clear any existing cards (but keep the drop zone background)
    const cardsToRemove = this.children.filter(child => child.name?.startsWith('stack-card'));
    cardsToRemove.forEach(card => this.removeChild(card));

    // Clear any existing completion highlight
    const highlightToRemove = this.children.filter(child => child.name?.startsWith('stack-complete-highlight'));
    highlightToRemove.forEach(highlight => this.removeChild(highlight));

    // Position cards in their respective body part zones
    
    // Head card in head zone (top) - centered in zone
    if (stackData.headCard) {
      const headCard = new CardSprite(stackData.headCard, {
        size: 'small',
        spriteSheet: this.options.spriteSheet,
        makeInteractive: false
      });
      headCard.name = 'stack-card-head';
      headCard.x = 5; // Center: (110 - 100) / 2 = 5
      headCard.y = 2.5; // Center: (45 - 40) / 2 = 2.5
      this.addChild(headCard);
    }

    // Torso card in torso zone (middle) - centered in zone
    if (stackData.torsoCard) {
      const torsoCard = new CardSprite(stackData.torsoCard, {
        size: 'small',
        spriteSheet: this.options.spriteSheet,
        makeInteractive: false
      });
      torsoCard.name = 'stack-card-torso';
      torsoCard.x = 5;
      torsoCard.y = (this.partHeight + 2) + 2.5; // Zone start + centering offset
      this.addChild(torsoCard);
    }

    // Legs card in legs zone (bottom) - centered in zone
    if (stackData.legsCard) {
      const legsCard = new CardSprite(stackData.legsCard, {
        size: 'small',
        spriteSheet: this.options.spriteSheet,
        makeInteractive: false
      });
      legsCard.name = 'stack-card-legs';
      legsCard.x = 5;
      legsCard.y = 2 * (this.partHeight + 2) + 2.5; // Zone start + centering offset
      this.addChild(legsCard);
    }

    // Highlight complete stacks
    if (stackData.isComplete) {
      const highlight = new PIXI.Graphics();
      highlight
        .rect(-2, -2, this.partWidth + 4, 3 * (this.partHeight + 2) + 4)
        .stroke({ width: 3, color: 0x00FF00, alpha: 0.8 });
      highlight.name = 'stack-complete-highlight';
      this.addChild(highlight);
    }
  }

  /**
   * Get drop zone information for a local position
   */
  getDropZoneAt(localPos: PIXI.Point): { bodyPart: string; gameStackId: string; isNewStack: boolean } | null {
    // Check each body part zone
    for (let partIndex = 0; partIndex < this.bodyParts.length; partIndex++) {
      const bodyPart = this.bodyParts[partIndex];
      const zoneY = partIndex * (this.partHeight + 2);
      
      // Check if point is within this body part zone
      if (localPos.x >= 0 && localPos.x <= this.partWidth && 
          localPos.y >= zoneY && localPos.y <= zoneY + this.partHeight) {
        return { 
          bodyPart: bodyPart,
          gameStackId: this.options.gameStackId || 'new',
          isNewStack: this.options.isNewStack || false
        };
      }
    }
    
    return null;
  }
}