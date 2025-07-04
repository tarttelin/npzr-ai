import * as PIXI from 'pixi.js';
import { CanvasApplication } from '../core/Application';
import { DeckSprite } from '../entities/Deck/DeckSprite';
import { InteractionSystem } from '../systems/InteractionSystem';

/**
 * Main gameplay scene that contains all game objects
 */
export class GameplayScene extends PIXI.Container {
  private app: CanvasApplication;
  private interactionSystem: InteractionSystem;
  private deckSprite!: DeckSprite;

  constructor(app: CanvasApplication) {
    super();
    this.app = app;
    this.interactionSystem = new InteractionSystem(app);
    
    this.setupScene();
  }

  /**
   * Initialize the scene with game objects
   */
  private setupScene(): void {
    // Create and add deck sprite
    this.deckSprite = new DeckSprite();
    this.addChild(this.deckSprite);
    
    // Setup deck interactions
    this.setupDeckInteractions();
    
    // Position elements based on current canvas size
    this.layout();
  }

  /**
   * Setup interactions for the deck
   */
  private setupDeckInteractions(): void {
    // Listen for deck clicks
    this.deckSprite.on('deck:click', (data: { cardCount: number }) => {
      console.log('Deck clicked, cards remaining:', data.cardCount);
      
      // Animate the deck interaction
      this.deckSprite.animateCardDraw();
      
      // Emit event to parent/bridge
      this.emit('game:deckClick', data);
    });
    
    // Add hover effects
    this.interactionSystem.addHoverHandlers(
      this.deckSprite,
      () => this.onDeckHover(),
      () => this.onDeckHoverEnd()
    );
  }

  /**
   * Handle deck hover
   */
  private onDeckHover(): void {
    // Could add visual feedback like tooltip or glow effect
    this.emit('game:deckHover', { cardCount: this.deckSprite.getCardCount() });
  }

  /**
   * Handle deck hover end
   */
  private onDeckHoverEnd(): void {
    this.emit('game:deckHoverEnd');
  }

  /**
   * Layout all scene elements based on canvas size
   */
  layout(): void {
    const { width, height } = this.app.getSize();
    
    // Position deck
    this.deckSprite.positionDeck(width, height);
    
    // Future: Position other game elements
    // - Player areas
    // - Card stacks
    // - Hand areas
  }

  /**
   * Update deck card count
   */
  updateDeckCount(count: number): void {
    this.deckSprite.setCardCount(count);
  }

  /**
   * Get the deck sprite for external access
   */
  getDeckSprite(): DeckSprite {
    return this.deckSprite;
  }

  /**
   * Handle canvas resize
   */
  onResize(_width: number, _height: number): void {
    this.layout();
  }

  /**
   * Update scene (called each frame if needed)
   */
  update(_deltaTime: number): void {
    // Future: Update animations, particles, etc.
    // For now, this scene is mostly static
  }

  /**
   * Get the deck sprite for external access
   */
  getDeck(): DeckSprite {
    return this.deckSprite;
  }

  /**
   * Get the interaction system
   */
  getInteractionSystem(): InteractionSystem {
    return this.interactionSystem;
  }

  /**
   * Clean up the scene
   */
  destroy(): void {
    this.interactionSystem.destroy();
    this.deckSprite.destroy();
    super.destroy();
  }
}