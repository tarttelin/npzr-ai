import * as PIXI from 'pixi.js';
import { Card, Character, BodyPart } from '@npzr/core';
import { CharacterType, SpriteCoordinates } from '../../../types/GameUI.types';
import { Z_LAYERS } from '../../utils/Constants';

/**
 * Sprite sheet coordinates from CLAUDE.md
 */
export const SPRITE_COORDINATES: Record<CharacterType, Record<'head' | 'torso' | 'legs', SpriteCoordinates>> = {
  ninja: {
    head: { x: 20, y: 10, width: 280, height: 190 },
    torso: { x: 20, y: 260, width: 280, height: 190 },
    legs: { x: 20, y: 510, width: 280, height: 190 }
  },
  pirate: {
    head: { x: 340, y: 10, width: 280, height: 190 },
    torso: { x: 340, y: 260, width: 280, height: 190 },
    legs: { x: 340, y: 510, width: 280, height: 190 }
  },
  zombie: {
    head: { x: 660, y: 10, width: 280, height: 190 },
    torso: { x: 660, y: 260, width: 280, height: 190 },
    legs: { x: 660, y: 510, width: 280, height: 190 }
  },
  robot: {
    head: { x: 980, y: 10, width: 280, height: 190 },
    torso: { x: 980, y: 260, width: 280, height: 190 },
    legs: { x: 980, y: 510, width: 280, height: 190 }
  }
};

/**
 * Card configuration
 */
export const CARD_CONFIG = {
  WIDTH: 100,
  HEIGHT: 140,
  SCALE: 0.35, // Scale down from sprite sheet size
  BORDER_RADIUS: 8,
  BORDER_COLOR: 0x333333,
  BORDER_WIDTH: 2,
  WILD_BG_COLOR: 0x4A148C, // Purple background for wild cards
  WILD_TEXT_COLOR: 0xFFFFFF,
} as const;

/**
 * Convert core Character enum to UI CharacterType
 */
function convertCharacterToUI(character: Character): CharacterType {
  switch (character) {
    case Character.Ninja:
      return 'ninja';
    case Character.Pirate:
      return 'pirate';
    case Character.Zombie:
      return 'zombie';
    case Character.Robot:
      return 'robot';
    default:
      return 'ninja';
  }
}

/**
 * Convert core BodyPart enum to string
 */
function convertBodyPartToString(bodyPart: BodyPart): 'head' | 'torso' | 'legs' {
  switch (bodyPart) {
    case BodyPart.Head:
      return 'head';
    case BodyPart.Torso:
      return 'torso';
    case BodyPart.Legs:
      return 'legs';
    default:
      return 'head';
  }
}

/**
 * CardSprite represents a single NPZR card using sprite sheet assets
 */
export class CardSprite extends PIXI.Container {
  private card: Card;
  private spriteTexture: PIXI.Sprite | null = null;
  private wildCardBackground: PIXI.Graphics | null = null;
  private wildCardText: PIXI.Text | null = null;
  private border: PIXI.Graphics;
  private isDragging = false;
  private dragOffset: { x: number; y: number } = { x: 0, y: 0 };

  constructor(card: Card, spriteSheet?: PIXI.Texture) {
    super();
    
    this.card = card;
    this.zIndex = Z_LAYERS.CARD;
    
    // Create border
    this.border = new PIXI.Graphics();
    this.addChild(this.border);

    // Initialize visual representation
    this.createCardVisual(spriteSheet);
    this.setupInteractivity();
  }

  /**
   * Create the visual representation of the card
   */
  private createCardVisual(spriteSheet?: PIXI.Texture): void {
    this.clearVisuals();

    if (this.card.isWild()) {
      this.createWildCardVisual();
    } else if (spriteSheet) {
      this.createSpriteCardVisual(spriteSheet);
    } else {
      this.createFallbackCardVisual();
    }

    this.createBorder();
  }

  /**
   * Create visual for wild cards (text-based)
   */
  private createWildCardVisual(): void {
    // Background
    this.wildCardBackground = new PIXI.Graphics();
    this.wildCardBackground
      .rect(0, 0, CARD_CONFIG.WIDTH, CARD_CONFIG.HEIGHT)
      .fill(CARD_CONFIG.WILD_BG_COLOR);
    this.addChild(this.wildCardBackground);

    // Text content
    const wildText = this.getWildCardText();
    this.wildCardText = new PIXI.Text({
      text: wildText,
      style: {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: CARD_CONFIG.WILD_TEXT_COLOR,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: CARD_CONFIG.WIDTH - 10
      }
    });

    // Center text
    this.wildCardText.x = (CARD_CONFIG.WIDTH - this.wildCardText.width) / 2;
    this.wildCardText.y = (CARD_CONFIG.HEIGHT - this.wildCardText.height) / 2;
    this.addChild(this.wildCardText);
  }

  /**
   * Create visual using sprite sheet
   */
  private createSpriteCardVisual(spriteSheet: PIXI.Texture): void {
    if (!this.card.character || !this.card.bodyPart) return;

    const character = convertCharacterToUI(this.card.character);
    const bodyPart = convertBodyPartToString(this.card.bodyPart);
    const coords = SPRITE_COORDINATES[character][bodyPart];

    // Create texture from sprite sheet region
    const textureFrame = new PIXI.Rectangle(coords.x, coords.y, coords.width, coords.height);
    const cardTexture = new PIXI.Texture({
      source: spriteSheet.source,
      frame: textureFrame
    });

    // Create sprite
    this.spriteTexture = new PIXI.Sprite(cardTexture);
    this.spriteTexture.width = CARD_CONFIG.WIDTH;
    this.spriteTexture.height = CARD_CONFIG.HEIGHT;
    this.addChild(this.spriteTexture);
  }

  /**
   * Create fallback visual when sprite sheet is not available
   */
  private createFallbackCardVisual(): void {
    const background = new PIXI.Graphics();
    background
      .rect(0, 0, CARD_CONFIG.WIDTH, CARD_CONFIG.HEIGHT)
      .fill(0xF5F5F5);
    this.addChild(background);

    // Card info text
    const cardText = this.getCardText();
    const text = new PIXI.Text({
      text: cardText,
      style: {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: 0x333333,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: CARD_CONFIG.WIDTH - 10
      }
    });

    text.x = (CARD_CONFIG.WIDTH - text.width) / 2;
    text.y = (CARD_CONFIG.HEIGHT - text.height) / 2;
    this.addChild(text);
  }

  /**
   * Create card border
   */
  private createBorder(): void {
    this.border.clear();
    this.border
      .rect(0, 0, CARD_CONFIG.WIDTH, CARD_CONFIG.HEIGHT)
      .stroke({ width: CARD_CONFIG.BORDER_WIDTH, color: CARD_CONFIG.BORDER_COLOR });
  }

  /**
   * Clear existing visuals
   */
  private clearVisuals(): void {
    if (this.spriteTexture) {
      this.removeChild(this.spriteTexture);
      this.spriteTexture.destroy();
      this.spriteTexture = null;
    }
    if (this.wildCardBackground) {
      this.removeChild(this.wildCardBackground);
      this.wildCardBackground.destroy();
      this.wildCardBackground = null;
    }
    if (this.wildCardText) {
      this.removeChild(this.wildCardText);
      this.wildCardText.destroy();
      this.wildCardText = null;
    }
  }

  /**
   * Get text for wild cards
   */
  private getWildCardText(): string {
    const nomination = this.card.getNomination ? this.card.getNomination() : null;
    
    if (nomination) {
      const char = nomination.character ? convertCharacterToUI(nomination.character) : 'Wild';
      const part = nomination.bodyPart ? convertBodyPartToString(nomination.bodyPart) : 'Wild';
      return `${char}\n${part}`;
    }

    // Default wild card text based on card type
    if (this.card.character && !this.card.bodyPart) {
      return `${convertCharacterToUI(this.card.character)}\nWild`;
    }
    if (!this.card.character && this.card.bodyPart) {
      return `Wild\n${convertBodyPartToString(this.card.bodyPart)}`;
    }
    return 'Wild\nWild';
  }

  /**
   * Get text for regular cards (fallback)
   */
  private getCardText(): string {
    if (!this.card.character || !this.card.bodyPart) return 'Unknown';
    
    const character = convertCharacterToUI(this.card.character);
    const bodyPart = convertBodyPartToString(this.card.bodyPart);
    return `${character}\n${bodyPart}`;
  }

  /**
   * Setup interactivity for drag and drop
   */
  private setupInteractivity(): void {
    this.eventMode = 'static';
    this.cursor = 'pointer';
    
    this.on('pointerdown', this.onDragStart.bind(this));
    this.on('pointerup', this.onDragEnd.bind(this));
    this.on('pointerupoutside', this.onDragEnd.bind(this));
    this.on('pointermove', this.onDragMove.bind(this));
    this.on('pointerover', this.onHover.bind(this));
    this.on('pointerout', this.onHoverEnd.bind(this));
  }

  /**
   * Handle drag start
   */
  private onDragStart(event: PIXI.FederatedPointerEvent): void {
    this.isDragging = true;
    this.alpha = 0.8;
    this.zIndex = Z_LAYERS.DRAGGING_CARD;
    
    const position = event.data.getLocalPosition(this.parent);
    this.dragOffset.x = position.x - this.x;
    this.dragOffset.y = position.y - this.y;
    
    this.emit('card:dragStart', { card: this.card, sprite: this });
  }

  /**
   * Handle drag move
   */
  private onDragMove(event: PIXI.FederatedPointerEvent): void {
    if (this.isDragging) {
      const position = event.data.getLocalPosition(this.parent);
      this.x = position.x - this.dragOffset.x;
      this.y = position.y - this.dragOffset.y;
      
      this.emit('card:dragMove', { card: this.card, sprite: this, position: { x: this.x, y: this.y } });
    }
  }

  /**
   * Handle drag end
   */
  private onDragEnd(event: PIXI.FederatedPointerEvent): void {
    if (this.isDragging) {
      this.isDragging = false;
      this.alpha = 1.0;
      this.zIndex = Z_LAYERS.CARD;
      
      const position = event.data.getLocalPosition(this.parent);
      this.emit('card:dragEnd', { 
        card: this.card, 
        sprite: this, 
        position: { x: position.x, y: position.y } 
      });
    }
  }

  /**
   * Handle hover start
   */
  private onHover(): void {
    if (!this.isDragging) {
      this.scale.set(1.05);
    }
  }

  /**
   * Handle hover end
   */
  private onHoverEnd(): void {
    if (!this.isDragging) {
      this.scale.set(1.0);
    }
  }

  /**
   * Update card visual (e.g., after nomination change)
   */
  updateVisual(spriteSheet?: PIXI.Texture): void {
    this.createCardVisual(spriteSheet);
  }

  /**
   * Get the card data
   */
  getCard(): Card {
    return this.card;
  }

  /**
   * Set card position with animation
   */
  animateToPosition(x: number, y: number, duration = 300): Promise<void> {
    return new Promise((resolve) => {
      const startX = this.x;
      const startY = this.y;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-out)
        const eased = 1 - Math.pow(1 - progress, 3);
        
        this.x = startX + (x - startX) * eased;
        this.y = startY + (y - startY) * eased;
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      
      animate();
    });
  }

  /**
   * Highlight card (e.g., for valid targets)
   */
  setHighlight(highlighted: boolean): void {
    if (highlighted) {
      this.border.clear();
      this.border
        .rect(0, 0, CARD_CONFIG.WIDTH, CARD_CONFIG.HEIGHT)
        .stroke({ width: CARD_CONFIG.BORDER_WIDTH + 2, color: 0x4CAF50 }); // Green highlight
    } else {
      this.createBorder();
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.clearVisuals();
    this.removeAllListeners();
    super.destroy();
  }
}