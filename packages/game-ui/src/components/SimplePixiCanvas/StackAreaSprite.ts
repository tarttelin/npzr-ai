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
  makeCardsDraggable?: boolean; // Enable dragging cards from this stack
}

export interface StackData {
  id: string;
  headCard?: Card;
  torsoCard?: Card;
  legsCard?: Card;
  isComplete: boolean;
}

export interface StackCardDragInfo {
  card: Card;
  sourceStackId: string;
  sourceBodyPart: string;
  cardContainer: PIXI.Container;
}

/**
 * Reusable stack area sprite for displaying drop zones and stack cards
 */
export class StackAreaSprite extends PIXI.Container {
  private options: StackAreaOptions;
  private readonly partWidth: number;
  private readonly partHeight: number;
  private readonly bodyParts = ['head', 'torso', 'legs'];
  private cardDragHandler?: (dragInfo: StackCardDragInfo) => void;

  constructor(options: StackAreaOptions) {
    super();
    this.options = options;
    this.partWidth = options.partWidth || 110;
    this.partHeight = options.partHeight || 58; // Adjusted to accommodate 80x54.4 cards
    
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
   * Set up the card dragging handler for stack cards
   */
  setCardDragHandler(handler: (dragInfo: StackCardDragInfo) => void): void {
    this.cardDragHandler = handler;
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
      
      // Enhanced styling for new stack vs existing stack
      if (this.options.isNewStack) {
        // New stack - dashed border with subtle background
        dropZone
          .roundRect(0, yPos, this.partWidth, this.partHeight, 4)
          .fill(0x2C5530, 0.1) // Very subtle green tint
          .stroke({ width: 2, color: 0x7CB342, alpha: 0.6 }); // Green dashed effect
      } else {
        // Existing stack - solid background with character-themed colors
        const bgColor = this.getBodyPartColor(bodyPart);
        dropZone
          .roundRect(0, yPos, this.partWidth, this.partHeight, 4)
          .fill(bgColor, 0.2)
          .stroke({ width: 2, color: bgColor, alpha: 0.8 });
      }
      
      // Add enhanced body part label with icon
      const labelText = this.getBodyPartLabel(bodyPart);
      const partLabel = new PIXI.Text({
        text: labelText,
        style: {
          fontFamily: 'Arial',
          fontSize: 11,
          fill: this.options.isNewStack ? 0xAAAAAA : 0xFFFFFF,
          align: 'center',
          fontWeight: 'bold',
          dropShadow: true,
          dropShadowColor: 0x000000,
          dropShadowAlpha: 0.5,
          dropShadowAngle: Math.PI / 4,
          dropShadowDistance: 1
        }
      });
      partLabel.x = (this.partWidth - partLabel.width) / 2;
      partLabel.y = yPos + (this.partHeight - partLabel.height) / 2;
      
      // Store metadata for drop detection
      dropZone.name = `${bodyPart}-zone`;
      (dropZone as any).stackIndex = this.options.index;
      (dropZone as any).bodyPart = bodyPart;
      (dropZone as any).isNewStack = this.options.isNewStack;
      
      this.addChild(dropZone);
      this.addChild(partLabel);
    });
    
    // Add enhanced stack label
    const stackText = this.options.isNewStack ? '+ New Stack' : `Stack ${this.options.index + 1}`;
    const stackLabel = new PIXI.Text({
      text: stackText,
      style: {
        fontFamily: 'Arial',
        fontSize: 13,
        fill: this.options.isNewStack ? 0x7CB342 : 0xFFFFFF,
        align: 'center',
        fontWeight: 'bold',
        dropShadow: true,
        dropShadowColor: 0x000000,
        dropShadowAlpha: 0.7,
        dropShadowAngle: Math.PI / 4,
        dropShadowDistance: 2
      }
    });
    stackLabel.x = (this.partWidth - stackLabel.width) / 2;
    stackLabel.y = -22;
    
    this.addChild(stackLabel);
  }

  /**
   * Update the stack with actual card data
   */
  updateStack(stackData: StackData): void {
    // Clear any existing cards (but keep the drop zone background)
    const cardsToRemove = this.children.filter(child => child.name?.startsWith('stack-card'));
    cardsToRemove.forEach(card => this.removeChild(card));

    // Clear any existing completion elements
    const elementsToRemove = this.children.filter(child => 
      child.name?.startsWith('stack-complete-highlight') ||
      child.name?.startsWith('stack-complete-glow') ||
      child.name?.startsWith('stack-complete-badge')
    );
    elementsToRemove.forEach(element => this.removeChild(element));

    // Position cards in their respective body part zones
    
    // Head card in head zone (top) - centered in zone
    if (stackData.headCard) {
      const headCard = new CardSprite(stackData.headCard, {
        size: 'small',
        spriteSheet: this.options.spriteSheet,
        makeInteractive: this.options.makeCardsDraggable || false
      });
      headCard.name = 'stack-card-head';
      headCard.x = 15; // Center: (110 - 80) / 2 = 15
      headCard.y = 3; // Center: (60 - 54) / 2 = 3
      
      // Apply drag handler if provided and dragging is enabled
      if (this.cardDragHandler && this.options.makeCardsDraggable && this.options.gameStackId) {
        this.cardDragHandler({
          card: stackData.headCard,
          sourceStackId: this.options.gameStackId,
          sourceBodyPart: 'head',
          cardContainer: headCard
        });
      }
      
      this.addChild(headCard);
    }

    // Torso card in torso zone (middle) - centered in zone
    if (stackData.torsoCard) {
      const torsoCard = new CardSprite(stackData.torsoCard, {
        size: 'small',
        spriteSheet: this.options.spriteSheet,
        makeInteractive: this.options.makeCardsDraggable || false
      });
      torsoCard.name = 'stack-card-torso';
      torsoCard.x = 15;
      torsoCard.y = (this.partHeight + 2) + 3; // Zone start + centering offset
      
      // Apply drag handler if provided and dragging is enabled
      if (this.cardDragHandler && this.options.makeCardsDraggable && this.options.gameStackId) {
        this.cardDragHandler({
          card: stackData.torsoCard,
          sourceStackId: this.options.gameStackId,
          sourceBodyPart: 'torso',
          cardContainer: torsoCard
        });
      }
      
      this.addChild(torsoCard);
    }

    // Legs card in legs zone (bottom) - centered in zone
    if (stackData.legsCard) {
      const legsCard = new CardSprite(stackData.legsCard, {
        size: 'small',
        spriteSheet: this.options.spriteSheet,
        makeInteractive: this.options.makeCardsDraggable || false
      });
      legsCard.name = 'stack-card-legs';
      legsCard.x = 15;
      legsCard.y = 2 * (this.partHeight + 2) + 3; // Zone start + centering offset
      
      // Apply drag handler if provided and dragging is enabled
      if (this.cardDragHandler && this.options.makeCardsDraggable && this.options.gameStackId) {
        this.cardDragHandler({
          card: stackData.legsCard,
          sourceStackId: this.options.gameStackId,
          sourceBodyPart: 'legs',
          cardContainer: legsCard
        });
      }
      
      this.addChild(legsCard);
    }

    // Enhanced complete stack highlighting
    if (stackData.isComplete) {
      const highlight = new PIXI.Graphics();
      highlight
        .roundRect(-4, -4, this.partWidth + 8, 3 * (this.partHeight + 2) + 8, 8)
        .stroke({ width: 4, color: 0xFFD700 }); // Gold highlight
      
      // Add inner glow effect
      const innerGlow = new PIXI.Graphics();
      innerGlow
        .roundRect(-2, -2, this.partWidth + 4, 3 * (this.partHeight + 2) + 4, 6)
        .stroke({ width: 2, color: 0xFFD700, alpha: 0.6 });
      
      highlight.name = 'stack-complete-highlight';
      innerGlow.name = 'stack-complete-glow';
      this.addChild(highlight);
      this.addChild(innerGlow);
      
      // Add completion badge
      const completeBadge = new PIXI.Text({
        text: '✓ COMPLETE',
        style: {
          fontFamily: 'Arial',
          fontSize: 10,
          fill: 0xFFD700,
          align: 'center',
          fontWeight: 'bold',
          dropShadow: true,
          dropShadowColor: 0x000000,
          dropShadowAlpha: 0.8,
          dropShadowDistance: 1
        }
      });
      completeBadge.x = (this.partWidth - completeBadge.width) / 2;
      completeBadge.y = 3 * (this.partHeight + 2) + 6;
      completeBadge.name = 'stack-complete-badge';
      this.addChild(completeBadge);
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

  /**
   * Trigger a completion celebration animation before stack removal
   */
  showCompletionCelebration(onComplete?: () => void): void {
    console.log('🎉 showCompletionCelebration called for stack:', this.options.gameStackId);
    
    // Force show completion highlights
    this.showCompletionHighlights();
    
    // Add pulsing animation to the highlights
    const highlight = this.children.find(child => child.name === 'stack-complete-highlight') as PIXI.Graphics;
    const glow = this.children.find(child => child.name === 'stack-complete-glow') as PIXI.Graphics;
    const badge = this.children.find(child => child.name === 'stack-complete-badge') as PIXI.Text;
    
    if (highlight && glow && badge) {
      // Create a pulsing effect
      let scale = 1;
      let growing = true;
      let pulseCount = 0;
      const maxPulses = 3;
      const pulseSpeed = 0.03; // Slower pulse speed for more satisfying animation
      
      const animate = () => {
        if (growing) {
          scale += pulseSpeed;
          if (scale >= 1.2) {
            growing = false;
            pulseCount++;
          }
        } else {
          scale -= pulseSpeed;
          if (scale <= 1) {
            growing = true;
          }
        }
        
        // Apply scale to highlights
        highlight.scale.set(scale);
        glow.scale.set(scale);
        badge.scale.set(scale);
        
        // Continue animation for specified number of pulses
        if (pulseCount < maxPulses) {
          requestAnimationFrame(animate);
        } else {
          // Reset scale and call completion callback
          highlight.scale.set(1);
          glow.scale.set(1);
          badge.scale.set(1);
          
          // Wait a moment then trigger completion
          setTimeout(() => {
            onComplete?.();
          }, 500);
        }
      };
      
      // Start the animation
      requestAnimationFrame(animate);
    } else {
      // If no highlights found, just delay briefly and complete
      setTimeout(() => {
        onComplete?.();
      }, 1000);
    }
  }

  /**
   * Force show completion highlights (extracted from updateStack)
   */
  private showCompletionHighlights(): void {
    // Clear any existing completion elements first
    const elementsToRemove = this.children.filter(child => 
      child.name?.startsWith('stack-complete-highlight') ||
      child.name?.startsWith('stack-complete-glow') ||
      child.name?.startsWith('stack-complete-badge')
    );
    elementsToRemove.forEach(element => this.removeChild(element));

    // Add completion highlights
    const highlight = new PIXI.Graphics();
    highlight
      .roundRect(-4, -4, this.partWidth + 8, 3 * (this.partHeight + 2) + 8, 8)
      .stroke({ width: 4, color: 0xFFD700 }); // Gold highlight
    
    // Add inner glow effect
    const innerGlow = new PIXI.Graphics();
    innerGlow
      .roundRect(-2, -2, this.partWidth + 4, 3 * (this.partHeight + 2) + 4, 6)
      .stroke({ width: 2, color: 0xFFD700, alpha: 0.6 });
    
    highlight.name = 'stack-complete-highlight';
    innerGlow.name = 'stack-complete-glow';
    this.addChild(highlight);
    this.addChild(innerGlow);
    
    // Add completion badge
    const completeBadge = new PIXI.Text({
      text: '🎉 COMPLETE! 🎉',
      style: {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: 0xFFD700,
        align: 'center',
        fontWeight: 'bold',
        dropShadow: true,
        dropShadowColor: 0x000000,
        dropShadowAlpha: 0.8,
        dropShadowDistance: 1
      }
    });
    completeBadge.x = (this.partWidth - completeBadge.width) / 2;
    completeBadge.y = 3 * (this.partHeight + 2) + 6;
    completeBadge.name = 'stack-complete-badge';
    this.addChild(completeBadge);
  }

  /**
   * Get themed color for body part zones
   */
  private getBodyPartColor(bodyPart: string): number {
    switch (bodyPart) {
      case 'head':
        return 0x8E24AA; // Purple for head/mind
      case 'torso':
        return 0xD32F2F; // Red for torso/heart
      case 'legs':
        return 0x1976D2; // Blue for legs/movement
      default:
        return 0x666666; // Default gray
    }
  }

  /**
   * Get enhanced label text with icons for body parts
   */
  private getBodyPartLabel(bodyPart: string): string {
    switch (bodyPart) {
      case 'head':
        return '🧠 Head';
      case 'torso':
        return '💗 Torso';
      case 'legs':
        return '🦵 Legs';
      default:
        return bodyPart.charAt(0).toUpperCase() + bodyPart.slice(1);
    }
  }
}