import * as PIXI from 'pixi.js';
import { Player } from '@npzr/core';
import { HandSprite } from '../Hand/HandSprite';
import { StackSprite } from '../Stack/StackSprite';
import { Z_LAYERS } from '../../utils/Constants';

/**
 * PlayerArea configuration
 */
export const PLAYER_AREA_CONFIG = {
  WIDTH: 800,
  HEIGHT: 300,
  SPACING: {
    HAND_TO_STACKS: 40,
    STACK_TO_STACK: 120,
    SIDE_PADDING: 20,
  },
  HEADER: {
    HEIGHT: 40,
    FONT_SIZE: 18,
    FONT_FAMILY: 'Arial, sans-serif',
  },
  TURN_INDICATOR: {
    COLOR: 0x1976D2, // Blue
    ALPHA: 0.3,
    BORDER_WIDTH: 3,
  },
  SCORE_DISPLAY: {
    FONT_SIZE: 14,
    SPACING: 20,
  },
} as const;

/**
 * PlayerAreaSprite represents a complete player area with hand, stacks, and UI
 */
export class PlayerAreaSprite extends PIXI.Container {
  private player: Player;
  private handSprite!: HandSprite;
  private stackSprites: StackSprite[] = [];
  private headerContainer!: PIXI.Container;
  private nameText!: PIXI.Text;
  private scoreText!: PIXI.Text;
  private stateText!: PIXI.Text;
  private turnIndicator!: PIXI.Graphics;
  private isActive: boolean = false;
  private spriteSheet?: PIXI.Texture;

  constructor(player: Player, spriteSheet?: PIXI.Texture) {
    super();
    
    this.player = player;
    this.spriteSheet = spriteSheet;
    this.zIndex = Z_LAYERS.PLAYER_AREAS;
    
    this.createHeader();
    this.createHandArea();
    this.createStackAreas();
    this.layout();
    this.updateFromPlayer();
  }

  /**
   * Create the header with player name, score, and state
   */
  private createHeader(): void {
    this.headerContainer = new PIXI.Container();
    this.addChild(this.headerContainer);

    // Turn indicator background
    this.turnIndicator = new PIXI.Graphics();
    this.headerContainer.addChild(this.turnIndicator);

    // Player name
    this.nameText = new PIXI.Text('', {
      fontFamily: PLAYER_AREA_CONFIG.HEADER.FONT_FAMILY,
      fontSize: PLAYER_AREA_CONFIG.HEADER.FONT_SIZE,
      fill: 0xFFFFFF,
      fontWeight: 'bold',
    });
    this.headerContainer.addChild(this.nameText);

    // Score display
    this.scoreText = new PIXI.Text('', {
      fontFamily: PLAYER_AREA_CONFIG.HEADER.FONT_FAMILY,
      fontSize: PLAYER_AREA_CONFIG.SCORE_DISPLAY.FONT_SIZE,
      fill: 0xCCCCCC,
    });
    this.headerContainer.addChild(this.scoreText);

    // Player state
    this.stateText = new PIXI.Text('', {
      fontFamily: PLAYER_AREA_CONFIG.HEADER.FONT_FAMILY,
      fontSize: PLAYER_AREA_CONFIG.SCORE_DISPLAY.FONT_SIZE,
      fill: 0xFFFF00,
    });
    this.headerContainer.addChild(this.stateText);
  }

  /**
   * Create the hand area
   */
  private createHandArea(): void {
    const hand = this.player.getHand();
    this.handSprite = new HandSprite(hand, 600, this.spriteSheet);
    this.addChild(this.handSprite);
  }

  /**
   * Create stack areas for the player
   */
  private createStackAreas(): void {
    const stacks = this.player.getMyStacks();
    
    // Create up to 3 stacks initially (players can have multiple stacks)
    const maxStacks = Math.max(3, stacks.length);
    
    for (let i = 0; i < maxStacks; i++) {
      const stack = stacks[i];
      if (stack) {
        const stackSprite = new StackSprite(stack, this.spriteSheet);
        this.stackSprites.push(stackSprite);
        this.addChild(stackSprite);
      } else {
        // Create empty stack placeholder
        const emptyStack = this.createEmptyStackPlaceholder();
        this.addChild(emptyStack);
      }
    }
  }

  /**
   * Create an empty stack placeholder for new stacks
   */
  private createEmptyStackPlaceholder(): PIXI.Container {
    const placeholder = new PIXI.Container();
    
    const background = new PIXI.Graphics();
    background.beginFill(0x444444, 0.3);
    background.drawRoundedRect(0, 0, 320, 160, 8);
    background.endFill();
    
    const text = new PIXI.Text('Empty Stack', {
      fontFamily: 'Arial',
      fontSize: 12,
      fill: 0x888888,
    });
    text.anchor.set(0.5);
    text.x = 160;
    text.y = 80;
    
    placeholder.addChild(background);
    placeholder.addChild(text);
    
    return placeholder;
  }

  /**
   * Layout all components within the player area
   */
  private layout(): void {
    const { SPACING, HEADER } = PLAYER_AREA_CONFIG;

    // Position header
    this.headerContainer.y = 0;

    // Update turn indicator
    this.updateTurnIndicator();

    // Position texts in header
    this.nameText.x = 10;
    this.nameText.y = 10;

    this.scoreText.x = 200;
    this.scoreText.y = 10;

    this.stateText.x = 10;
    this.stateText.y = 25;

    // Position hand below header
    this.handSprite.x = SPACING.SIDE_PADDING;
    this.handSprite.y = HEADER.HEIGHT + 10;

    // Position stacks below hand
    const stackY = this.handSprite.y + 140 + SPACING.HAND_TO_STACKS;
    
    this.stackSprites.forEach((stackSprite, index) => {
      stackSprite.x = SPACING.SIDE_PADDING + (index * SPACING.STACK_TO_STACK);
      stackSprite.y = stackY;
    });
  }

  /**
   * Update turn indicator visual
   */
  private updateTurnIndicator(): void {
    this.turnIndicator.clear();
    
    if (this.isActive) {
      this.turnIndicator.beginFill(
        PLAYER_AREA_CONFIG.TURN_INDICATOR.COLOR,
        PLAYER_AREA_CONFIG.TURN_INDICATOR.ALPHA
      );
      this.turnIndicator.lineStyle(
        PLAYER_AREA_CONFIG.TURN_INDICATOR.BORDER_WIDTH,
        PLAYER_AREA_CONFIG.TURN_INDICATOR.COLOR
      );
      this.turnIndicator.drawRoundedRect(
        0, 0, 
        PLAYER_AREA_CONFIG.WIDTH, 
        PLAYER_AREA_CONFIG.HEIGHT, 
        8
      );
      this.turnIndicator.endFill();
    }
  }

  /**
   * Update visual representation from player state
   */
  updateFromPlayer(): void {
    // Update texts
    this.nameText.text = this.player.getName();
    
    const score = this.player.getMyScore();
    const completedCharacters = Array.from(score.getCompletedCharacters());
    this.scoreText.text = `Score: ${completedCharacters.length} (${completedCharacters.join(', ')})`;
    
    const playerState = this.player.getState();
    this.stateText.text = playerState.getMessage();

    // Update hand
    this.handSprite.updateVisual();

    // Update stacks
    const currentStacks = this.player.getMyStacks();
    
    // Remove old stack sprites if player has fewer stacks now
    while (this.stackSprites.length > currentStacks.length) {
      const oldSprite = this.stackSprites.pop();
      if (oldSprite) {
        this.removeChild(oldSprite);
        oldSprite.destroy();
      }
    }

    // Update existing stacks
    this.stackSprites.forEach((stackSprite, index) => {
      if (currentStacks[index]) {
        stackSprite.updateVisual();
      }
    });

    // Add new stacks if player has more stacks now
    for (let i = this.stackSprites.length; i < currentStacks.length; i++) {
      const newStackSprite = new StackSprite(currentStacks[i], this.spriteSheet);
      this.stackSprites.push(newStackSprite);
      this.addChild(newStackSprite);
    }

    // Re-layout after changes
    this.layout();
  }

  /**
   * Set if this player area is active (current turn)
   */
  setActive(active: boolean): void {
    this.isActive = active;
    this.updateTurnIndicator();
  }

  /**
   * Get all stack areas for drop zone detection
   */
  getStackAreas(): PIXI.Rectangle[] {
    return this.stackSprites.map(sprite => {
      const bounds = sprite.getBounds();
      return new PIXI.Rectangle(bounds.x, bounds.y, bounds.width, bounds.height);
    });
  }

  /**
   * Get stack sprite by index
   */
  getStackSprite(index: number): StackSprite | undefined {
    return this.stackSprites[index];
  }

  /**
   * Get hand sprite
   */
  getHandSprite(): HandSprite {
    return this.handSprite;
  }

  /**
   * Get all stack sprites
   */
  getStackSprites(): StackSprite[] {
    return [...this.stackSprites];
  }

  /**
   * Handle card dropped on this player area
   */
  handleCardDrop(_cardId: string, localX: number, localY: number): { stackIndex: number; pile: string } | null {
    // Convert to local coordinates and find which stack/pile was targeted
    for (let i = 0; i < this.stackSprites.length; i++) {
      const stackSprite = this.stackSprites[i];
      const stackBounds = stackSprite.getBounds();
      
      // Check if point is within stack bounds
      if (localX >= stackBounds.x && localX <= stackBounds.x + stackBounds.width &&
          localY >= stackBounds.y && localY <= stackBounds.y + stackBounds.height) {
        // Determine which pile within the stack
        const relativeX = localX - stackSprite.x;
        
        // Simple pile detection based on position (head, torso, legs)
        if (relativeX < 110) {
          return { stackIndex: i, pile: 'head' };
        } else if (relativeX < 220) {
          return { stackIndex: i, pile: 'torso' };
        } else {
          return { stackIndex: i, pile: 'legs' };
        }
      }
    }
    
    return null;
  }

  /**
   * Clean up the player area
   */
  destroy(): void {
    this.handSprite.destroy();
    this.stackSprites.forEach(sprite => sprite.destroy());
    this.stackSprites = [];
    super.destroy();
  }
}