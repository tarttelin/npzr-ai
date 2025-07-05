import * as PIXI from 'pixi.js';
import { Player } from '@npzr/core';
import { CanvasApplication } from '../core/Application';
import { DeckSprite } from '../entities/Deck/DeckSprite';
import { PlayerAreaSprite } from '../entities/PlayerArea/PlayerAreaSprite';
import { InteractionSystem } from '../systems/InteractionSystem';
import { Z_LAYERS } from '../utils/Constants';
import { logger } from '@npzr/logging';

/**
 * Main gameplay scene that contains all game objects
 */
export class GameplayScene extends PIXI.Container {
  private app: CanvasApplication;
  private interactionSystem: InteractionSystem;
  private deckSprite!: DeckSprite;
  private playerAreas: PlayerAreaSprite[] = [];

  constructor(app: CanvasApplication) {
    super();
    this.app = app;
    this.interactionSystem = new InteractionSystem(app);
    
    // ENABLE SORTABLE CHILDREN - might fix rendering issues
    this.sortableChildren = true;
    logger.info('GameplayScene constructor - enabled sortableChildren');
    
    this.setupScene();
  }

  /**
   * Initialize the scene with game objects
   */
  private setupScene(): void {
    // Create and add deck sprite
    this.deckSprite = new DeckSprite();
    this.deckSprite.zIndex = Z_LAYERS.DECK;
    this.addChild(this.deckSprite);
    
    // SOLUTION: Pre-create empty PlayerAreaSprites during setupScene
    this.createEmptyPlayerAreas();
    
    // Setup deck interactions
    this.setupDeckInteractions();
    
    // Position elements based on current canvas size
    this.layout();
  }

  /**
   * Pre-create empty PlayerAreaSprites during setupScene (when rendering works)
   */
  private createEmptyPlayerAreas(): void {
    // Create mock players for initial setup
    const mockPlayers = [
      {
        getName: () => 'Player 1 (Loading...)',
        getHand: () => ({ size: () => 0, getCards: () => [] }),
        getMyStacks: () => [],
        getMyScore: () => ({ getCompletedCharacters: () => new Set() }),
        getState: () => ({ getMessage: () => 'Waiting for game...' })
      },
      {
        getName: () => 'Player 2 (Loading...)',
        getHand: () => ({ size: () => 0, getCards: () => [] }),
        getMyStacks: () => [],
        getMyScore: () => ({ getCompletedCharacters: () => new Set() }),
        getState: () => ({ getMessage: () => 'Waiting for game...' })
      }
    ] as any[];
    
    // Create PlayerAreaSprites during setupScene when rendering works
    mockPlayers.forEach((mockPlayer, index) => {
      try {
        const playerArea = new PlayerAreaSprite(mockPlayer);
        playerArea.x = 100 + (index * 400);
        playerArea.y = 300;
        playerArea.zIndex = 10 + index;
        this.playerAreas.push(playerArea);
        this.addChild(playerArea);
        logger.info(`Pre-created PlayerAreaSprite ${index} during setupScene`);
      } catch (error) {
        logger.error(`Error creating PlayerAreaSprite ${index}:`, error);
      }
    });
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
    
    // Position deck (center-left of canvas)
    this.deckSprite.positionDeck(width, height);
    
    // Position player areas
    this.layoutPlayerAreas(width, height);
  }

  /**
   * Layout player areas on the canvas
   */
  private layoutPlayerAreas(_canvasWidth: number, canvasHeight: number): void {
    const availableHeight = canvasHeight - 40; // Leave some margin
    const areaHeight = 300;
    
    logger.info('Laying out player areas', {
      canvasHeight,
      availableHeight,
      areaHeight,
      playerAreaCount: this.playerAreas.length
    });
    
    this.playerAreas.forEach((playerArea, index) => {
      // Position human player at bottom, AI at top
      if (index === 0) {
        // Human player area at bottom
        playerArea.x = 200; // Leave space for deck on left
        playerArea.y = availableHeight - areaHeight;
      } else if (index === 1) {
        // AI player area at top
        playerArea.x = 200;
        playerArea.y = 20;
      }
      
      logger.info(`Positioned player area ${index}`, {
        position: { x: playerArea.x, y: playerArea.y },
        visible: playerArea.visible,
        alpha: playerArea.alpha
      });
    });
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
   * Initialize game with players - UPDATE EXISTING APPROACH
   */
  initializeWithPlayers(players: [Player | null, Player | null], spriteSheet?: PIXI.Texture): void {
    logger.info('GameplayScene.initializeWithPlayers called - updating existing PlayerAreaSprites');
    
    // Update existing PlayerAreaSprites with real player data
    players.forEach((player, index) => {
      if (player && this.playerAreas[index]) {
        logger.info(`Updating PlayerAreaSprite ${index} with ${player.getName()}`);
        
        try {
          // Use proper method to update the player
          logger.info(`About to call updatePlayer on PlayerAreaSprite ${index}`);
          console.log(`About to call updatePlayer on PlayerAreaSprite ${index} with player: ${player.getName()}`);
          
          if (typeof this.playerAreas[index].updatePlayer === 'function') {
            this.playerAreas[index].updatePlayer(player, spriteSheet);
            logger.info(`updatePlayer call completed for ${index}`);
          } else {
            logger.error(`updatePlayer method not found on PlayerAreaSprite ${index}`);
            console.error(`updatePlayer method not found on PlayerAreaSprite ${index}`);
          }
          
          logger.info(`Successfully updated PlayerAreaSprite ${index} - should now show ${player.getName()}`);
        } catch (error) {
          logger.error(`Error updating PlayerAreaSprite ${index}:`, error);
          console.error(`Error updating PlayerAreaSprite ${index}:`, error);
        }
      } else {
        logger.warn(`Cannot update PlayerAreaSprite ${index}: player=${!!player}, playerArea=${!!this.playerAreas[index]}`);
      }
    });
    
    logger.info('Player area updates completed');
  }

  /**
   * Setup interactions for a player area
   */
  private setupPlayerAreaInteractions(playerArea: PlayerAreaSprite, playerIndex: number): void {
    // Setup drag & drop from hand to stacks
    const handSprite = playerArea.getHandSprite();
    
    // Listen for card drag events from hand
    handSprite.on('hand:cardDragStart', (data: any) => {
      logger.debug(`Card drag started from player ${playerIndex} hand:`, data);
      this.emit('game:cardDragStart', { playerIndex, ...data });
    });

    handSprite.on('hand:cardDragEnd', (data: any) => {
      logger.debug(`Card drag ended from player ${playerIndex} hand:`, data);
      
      // Determine drop target
      const dropTarget = this.findDropTarget(data.card, data.globalX, data.globalY);
      
      if (dropTarget) {
        this.emit('game:cardPlay', {
          card: data.card,
          targetStackId: dropTarget.stackId,
          targetPile: dropTarget.pile,
          playerIndex
        });
      } else {
        // Invalid drop - return card to hand
        logger.info('Invalid card drop - returning to hand');
        // Hand sprite will handle returning the card automatically
      }
    });
  }

  /**
   * Find the drop target for a dragged card
   */
  private findDropTarget(_card: any, globalX: number, globalY: number): { stackId: string; pile: string } | null {
    for (const playerArea of this.playerAreas) {
      const stackSprites = playerArea.getStackSprites();
      
      for (let i = 0; i < stackSprites.length; i++) {
        const stackSprite = stackSprites[i];
        const bounds = stackSprite.getBounds();
        
        // Check if point is within bounds
        if (globalX >= bounds.x && globalX <= bounds.x + bounds.width &&
            globalY >= bounds.y && globalY <= bounds.y + bounds.height) {
          // Convert to local coordinates for pile detection
          const localPos = stackSprite.toLocal({ x: globalX, y: globalY });
          
          // Determine which pile (head, torso, legs)
          let pile = 'torso'; // default
          if (localPos.x < 110) pile = 'head';
          else if (localPos.x > 220) pile = 'legs';
          
          return {
            stackId: `stack-${i}`, // Simple ID for now
            pile
          };
        }
      }
    }
    
    return null;
  }

  /**
   * Update all player areas from current game state
   */
  updatePlayerAreas(players?: [Player | null, Player | null]): void {
    if (players) {
      // Update with fresh player references
      players.forEach((player, index) => {
        if (player && this.playerAreas[index]) {
          this.playerAreas[index].updatePlayer(player);
        }
      });
    } else {
      // Fallback to updating with existing references
      this.playerAreas.forEach(playerArea => {
        playerArea.updateFromPlayer();
      });
    }
  }

  /**
   * Set the current player (highlight their area)
   */
  setCurrentPlayer(playerIndex: number): void {
    
    this.playerAreas.forEach((playerArea, index) => {
      playerArea.setActive(index === playerIndex);
    });
  }

  /**
   * Get player area by index
   */
  getPlayerArea(index: number): PlayerAreaSprite | undefined {
    return this.playerAreas[index];
  }

  /**
   * Clear all player areas
   */
  private clearPlayerAreas(): void {
    this.playerAreas.forEach(playerArea => {
      this.removeChild(playerArea);
      playerArea.destroy();
    });
    this.playerAreas = [];
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
    this.clearPlayerAreas();
    this.interactionSystem.destroy();
    this.deckSprite.destroy();
    super.destroy();
  }
}