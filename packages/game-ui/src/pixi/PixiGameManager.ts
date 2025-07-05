import * as PIXI from 'pixi.js';
import { EventBridge } from '../bridge/EventBridge';
import { logger } from '@npzr/logging';

/**
 * Standalone PixiJS Game Manager
 * Completely independent of React - manages its own lifecycle
 */
export class PixiGameManager {
  private app: PIXI.Application | null = null;
  private eventBridge: EventBridge;
  private container: HTMLElement | null = null;
  private isInitialized = false;

  constructor() {
    this.eventBridge = EventBridge.getInstance();
    this.setupEventListeners();
  }

  /**
   * Initialize PixiJS application in the dedicated container
   */
  async init(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('PixiGameManager already initialized');
      return;
    }

    // Get the dedicated PixiJS container
    this.container = document.getElementById('pixi-container');
    if (!this.container) {
      throw new Error('pixi-container element not found');
    }

    logger.info('Initializing standalone PixiJS application...');

    // Create PixiJS application
    this.app = new PIXI.Application();
    
    await this.app.init({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x2C5530, // Green baize background
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    // Add canvas to the dedicated container
    this.container.appendChild(this.app.canvas);

    // Setup basic scene
    this.setupScene();

    // Handle window resize
    this.setupResize();

    this.isInitialized = true;
    logger.info('✅ Standalone PixiJS application initialized');

    // Notify React that PixiJS is ready
    this.eventBridge.emitToReact('pixi:ready', {});
  }

  /**
   * Setup basic game scene
   */
  private setupScene(): void {
    if (!this.app) return;

    // Create simple deck representation
    const deckRect = new PIXI.Graphics();
    deckRect
      .rect(0, 0, 80, 120)
      .fill(0x1976D2) // Blue deck
      .stroke({ width: 2, color: 0x0D47A1 });
    
    deckRect.x = 50;
    deckRect.y = (this.app.screen.height - 120) / 2;
    deckRect.eventMode = 'static';
    deckRect.cursor = 'pointer';
    
    // Handle deck clicks
    deckRect.on('pointerdown', () => {
      logger.info('Deck clicked in PixiJS');
      this.eventBridge.emitToReact('game:deckClick', { cardCount: 44 });
    });

    this.app.stage.addChild(deckRect);

    // Add simple text
    const text = new PIXI.Text({
      text: 'PixiJS Game Canvas\nClick the blue deck!',
      style: {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: 0xFFFFFF,
        align: 'center'
      }
    });
    text.x = this.app.screen.width / 2 - text.width / 2;
    text.y = 50;
    this.app.stage.addChild(text);

    logger.info('Basic PixiJS scene created');
  }

  /**
   * Setup event listeners for React communication
   */
  private setupEventListeners(): void {
    // Listen for commands from React
    this.eventBridge.onReactEvent('pixi:updateGameState', (data) => {
      logger.info('Received game state update from React:', data);
      this.updateGameVisuals(data);
    });

    this.eventBridge.onReactEvent('pixi:destroy', () => {
      this.destroy();
    });
  }

  /**
   * Update game visuals based on state from React
   */
  private updateGameVisuals(gameState: any): void {
    if (!this.app) return;

    logger.info('Updating PixiJS visuals with game state:', gameState);
    // Here we would update the visual representation based on game state
    // For now, just log that we received the update
  }

  /**
   * Setup window resize handling
   */
  private setupResize(): void {
    if (!this.app) return;

    const handleResize = () => {
      if (this.app) {
        this.app.renderer.resize(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener('resize', handleResize);
  }

  /**
   * Destroy PixiJS application
   */
  destroy(): void {
    if (this.app) {
      logger.info('Destroying standalone PixiJS application');
      this.app.destroy(true);
      this.app = null;
    }
    this.isInitialized = false;
  }

  /**
   * Check if initialized
   */
  get initialized(): boolean {
    return this.isInitialized;
  }
}