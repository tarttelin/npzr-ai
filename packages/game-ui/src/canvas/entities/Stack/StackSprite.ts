import * as PIXI from 'pixi.js';
import { Stack, BodyPart } from '@npzr/core';
import { CardSprite } from '../Card/CardSprite';
import { Z_LAYERS } from '../../utils/Constants';

/**
 * Stack configuration
 */
export const STACK_CONFIG = {
  WIDTH: 320, // Width to fit 3 piles side by side
  HEIGHT: 160, // Height for card piles
  PILE_WIDTH: 100,
  PILE_HEIGHT: 140,
  PILE_SPACING: 10,
  CARD_OFFSET: 3, // Offset for stacked cards
  BORDER_COLOR: 0x666666,
  BORDER_WIDTH: 1,
  DROP_ZONE_COLOR: 0x4CAF50, // Green for valid drop zones
  DROP_ZONE_ALPHA: 0.3,
  COMPLETION_GLOW_COLOR: 0xFFD700, // Gold for completed stacks
} as const;

/**
 * StackSprite represents a player's stack with head/torso/legs piles
 */
export class StackSprite extends PIXI.Container {
  private stack: Stack;
  private pileContainers: Map<BodyPart, PIXI.Container> = new Map();
  private pileBackgrounds: Map<BodyPart, PIXI.Graphics> = new Map();
  private cardSprites: Map<string, CardSprite> = new Map();
  private spriteSheet?: PIXI.Texture;

  constructor(stack: Stack, spriteSheet?: PIXI.Texture) {
    super();
    
    this.stack = stack;
    this.spriteSheet = spriteSheet;
    this.zIndex = Z_LAYERS.STACKS;
    
    this.createPileStructure();
    this.setupInteractivity();
    this.updateVisual();
  }

  /**
   * Create the pile structure (head, torso, legs)
   */
  private createPileStructure(): void {
    const piles = [BodyPart.Head, BodyPart.Torso, BodyPart.Legs];
    
    piles.forEach((pile, index) => {
      // Create container for this pile
      const pileContainer = new PIXI.Container();
      pileContainer.x = index * (STACK_CONFIG.PILE_WIDTH + STACK_CONFIG.PILE_SPACING);
      pileContainer.y = 0;
      
      // Create background for drop zone
      const background = new PIXI.Graphics();
      this.updatePileBackground(background, false);
      pileContainer.addChild(background);
      
      // Store references
      this.pileContainers.set(pile, pileContainer);
      this.pileBackgrounds.set(pile, background);
      this.addChild(pileContainer);
      
      // Add pile label
      this.addPileLabel(pileContainer, pile);
    });
  }

  /**
   * Add label to pile
   */
  private addPileLabel(container: PIXI.Container, pile: BodyPart): void {
    const labelText = pile === BodyPart.Head ? 'HEAD' : 
                     pile === BodyPart.Torso ? 'TORSO' : 'LEGS';
    
    const label = new PIXI.Text({
      text: labelText,
      style: {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: 0x666666,
        align: 'center'
      }
    });
    
    label.x = (STACK_CONFIG.PILE_WIDTH - label.width) / 2;
    label.y = STACK_CONFIG.PILE_HEIGHT + 5;
    container.addChild(label);
  }

  /**
   * Update pile background visual
   */
  private updatePileBackground(background: PIXI.Graphics, isDropZone: boolean): void {
    background.clear();
    
    if (isDropZone) {
      // Highlight as drop zone
      background
        .rect(0, 0, STACK_CONFIG.PILE_WIDTH, STACK_CONFIG.PILE_HEIGHT)
        .fill(STACK_CONFIG.DROP_ZONE_COLOR, STACK_CONFIG.DROP_ZONE_ALPHA)
        .stroke({ width: STACK_CONFIG.BORDER_WIDTH + 1, color: STACK_CONFIG.DROP_ZONE_COLOR });
    } else {
      // Normal state
      background
        .rect(0, 0, STACK_CONFIG.PILE_WIDTH, STACK_CONFIG.PILE_HEIGHT)
        .stroke({ width: STACK_CONFIG.BORDER_WIDTH, color: STACK_CONFIG.BORDER_COLOR });
    }
  }

  /**
   * Setup interactivity for drag and drop
   */
  private setupInteractivity(): void {
    this.eventMode = 'static';
    
    // Set up drop zone handling for each pile
    this.pileContainers.forEach((container, pile) => {
      container.eventMode = 'static';
      
      container.on('pointerenter', () => {
        this.emit('stack:pileEnter', { stack: this.stack, pile, stackSprite: this });
      });
      
      container.on('pointerleave', () => {
        this.emit('stack:pileLeave', { stack: this.stack, pile, stackSprite: this });
      });
      
      container.on('pointerup', () => {
        this.emit('stack:pileDrop', { stack: this.stack, pile, stackSprite: this });
      });
    });
  }

  /**
   * Update visual representation based on stack state
   */
  updateVisual(): void {
    // Clear existing card sprites
    this.cardSprites.forEach(sprite => {
      sprite.destroy();
    });
    this.cardSprites.clear();

    // Add cards to appropriate piles
    const piles = [BodyPart.Head, BodyPart.Torso, BodyPart.Legs];
    
    piles.forEach(pile => {
      const cards = this.stack.getCardsFromPile(pile);
      const container = this.pileContainers.get(pile);
      
      if (!container) return;
      
      cards.forEach((card, index) => {
        const cardSprite = new CardSprite(card, this.spriteSheet);
        
        // Position card in pile with slight offset for stacking effect
        cardSprite.x = index * STACK_CONFIG.CARD_OFFSET;
        cardSprite.y = index * STACK_CONFIG.CARD_OFFSET;
        
        // Set up card interactions
        cardSprite.on('card:dragStart', (data) => {
          this.emit('card:dragStart', { ...data, fromStack: this.stack, fromPile: pile });
        });
        
        cardSprite.on('card:dragMove', (data) => {
          this.emit('card:dragMove', data);
        });
        
        cardSprite.on('card:dragEnd', (data) => {
          this.emit('card:dragEnd', { ...data, fromStack: this.stack, fromPile: pile });
        });
        
        container.addChild(cardSprite);
        this.cardSprites.set(card.id, cardSprite);
      });
    });

    // Update completion visual
    this.updateCompletionVisual();
  }

  /**
   * Update visual for stack completion
   */
  private updateCompletionVisual(): void {
    if (this.stack.isComplete()) {
      // Add completion glow effect
      const glow = new PIXI.Graphics();
      glow
        .rect(-5, -5, STACK_CONFIG.WIDTH + 10, STACK_CONFIG.HEIGHT + 10)
        .stroke({ width: 3, color: STACK_CONFIG.COMPLETION_GLOW_COLOR });
      
      // Add glow to back of container
      this.addChildAt(glow, 0);
      
      // Emit completion event
      this.emit('stack:completed', { stack: this.stack, character: this.stack.getCompletedCharacter() });
    }
  }

  /**
   * Highlight valid drop zones
   */
  setDropZoneHighlight(pile: BodyPart | null): void {
    this.pileBackgrounds.forEach((background, currentPile) => {
      const isHighlighted = pile === currentPile;
      this.updatePileBackground(background, isHighlighted);
    });
  }

  /**
   * Set overall stack highlight
   */
  setHighlight(highlighted: boolean): void {
    this.alpha = highlighted ? 0.8 : 1.0;
  }

  /**
   * Get stack data
   */
  getStack(): Stack {
    return this.stack;
  }

  /**
   * Get pile container for hit testing
   */
  getPileContainer(pile: BodyPart): PIXI.Container | undefined {
    return this.pileContainers.get(pile);
  }

  /**
   * Check if a point is over a specific pile
   */
  isPointOverPile(globalPoint: PIXI.Point): BodyPart | null {
    for (const [pile, container] of this.pileContainers) {
      const localPoint = container.toLocal(globalPoint);
      
      if (localPoint.x >= 0 && localPoint.x <= STACK_CONFIG.PILE_WIDTH &&
          localPoint.y >= 0 && localPoint.y <= STACK_CONFIG.PILE_HEIGHT) {
        return pile;
      }
    }
    return null;
  }

  /**
   * Animate card being added to pile
   */
  async animateCardAdd(card: CardSprite, targetPile: BodyPart): Promise<void> {
    const container = this.pileContainers.get(targetPile);
    if (!container) return;

    // Calculate target position
    const existingCards = this.stack.getCardsFromPile(targetPile).length;
    const targetX = container.x + (existingCards * STACK_CONFIG.CARD_OFFSET);
    const targetY = container.y + (existingCards * STACK_CONFIG.CARD_OFFSET);

    // Animate card to position
    await card.animateToPosition(targetX, targetY);
  }

  /**
   * Update sprite sheet for re-rendering
   */
  updateSpriteSheet(spriteSheet: PIXI.Texture): void {
    this.spriteSheet = spriteSheet;
    
    // Update all card sprites
    this.cardSprites.forEach(cardSprite => {
      cardSprite.updateVisual(spriteSheet);
    });
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.cardSprites.forEach(sprite => sprite.destroy());
    this.cardSprites.clear();
    this.pileContainers.clear();
    this.pileBackgrounds.clear();
    this.removeAllListeners();
    super.destroy();
  }
}