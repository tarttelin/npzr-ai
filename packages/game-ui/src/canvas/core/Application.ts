import * as PIXI from 'pixi.js';
import { CANVAS_CONFIG } from '../utils/Constants';

/**
 * Main PixiJS Application wrapper
 * Manages the core PixiJS application lifecycle and provides a clean interface
 */
export class CanvasApplication {
  private app: PIXI.Application | null = null;
  private container: HTMLElement | null = null;
  private isInitialized = false;
  private contextLostHandler: ((event: Event) => void) | null = null;

  /**
   * Initialize the PixiJS application
   */
  async init(container: HTMLElement, width: number, height: number): Promise<void> {
    if (this.isInitialized) {
      throw new Error('Canvas application is already initialized');
    }

    // Initialize PixiJS Application
    
    this.container = container;
    this.app = new PIXI.Application();

    try {
      await this.app.init({
        width,
        height,
        backgroundColor: CANVAS_CONFIG.BACKGROUND_COLOR,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        preference: 'webgl', // Prefer WebGL for better compatibility
      });
      
      // PixiJS Application initialized successfully
    } catch (error) {
      console.error('❌ Failed to initialize PixiJS Application:', error);
      throw error;
    }

    // Add canvas to container
    this.container.appendChild(this.app.canvas);
    
    // Setup WebGL context loss recovery
    this.setupContextLossRecovery();
    
    this.isInitialized = true;
  }

  /**
   * Resize the application
   */
  resize(width: number, height: number): void {
    if (!this.app) {
      throw new Error('Canvas application not initialized');
    }

    this.app.renderer.resize(width, height);
  }

  /**
   * Get the PixiJS application instance
   */
  getApp(): PIXI.Application {
    if (!this.app) {
      throw new Error('Canvas application not initialized');
    }
    return this.app;
  }

  /**
   * Get the main stage
   */
  getStage(): PIXI.Container {
    return this.getApp().stage;
  }

  /**
   * Add a child to the main stage
   */
  addToStage(child: PIXI.Container): void {
    this.getStage().addChild(child);
  }

  /**
   * Remove a child from the main stage
   */
  removeFromStage(child: PIXI.Container): void {
    this.getStage().removeChild(child);
  }

  /**
   * Check if the application is initialized
   */
  get initialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get current canvas size
   */
  getSize(): { width: number; height: number } {
    const app = this.getApp();
    return {
      width: app.renderer.width,
      height: app.renderer.height,
    };
  }

  /**
   * Setup WebGL context loss recovery
   */
  private setupContextLossRecovery(): void {
    if (!this.app?.canvas) return;

    // Handle context lost events
    this.contextLostHandler = (event: Event) => {
      console.warn('WebGL context lost, attempting recovery...');
      event.preventDefault();
      
      // Try to recover context after a brief delay
      setTimeout(() => {
        this.attemptContextRecovery();
      }, 100);
    };

    // Add event listeners for context loss
    this.app.canvas.addEventListener('webglcontextlost', this.contextLostHandler);
    this.app.canvas.addEventListener('webglcontextrestored', () => {
      console.log('WebGL context successfully restored');
    });
  }

  /**
   * Attempt to recover WebGL context
   */
  private attemptContextRecovery(): void {
    if (!this.app || !this.container) return;

    try {
      // Check if context is actually lost
      const gl = this.app.canvas.getContext('webgl') || this.app.canvas.getContext('experimental-webgl');
      if (gl && (gl as WebGLRenderingContext).isContextLost?.()) {
        console.warn('WebGL context is lost, waiting for restoration...');
        return;
      }

      // Force a re-render to check if everything is working
      this.app.render();
      console.log('WebGL context recovery successful');
    } catch (error) {
      console.error('WebGL context recovery failed:', error);
    }
  }

  /**
   * Cleanup and destroy the application
   */
  destroy(): void {
    
    // Remove WebGL context event listeners
    if (this.app?.canvas && this.contextLostHandler) {
      this.app.canvas.removeEventListener('webglcontextlost', this.contextLostHandler);
      this.contextLostHandler = null;
    }

    if (this.app) {
      try {
        // Properly destroy with cleanup options
        this.app.destroy(true, { children: true, texture: true });
        // PixiJS Application destroyed successfully
      } catch (error) {
        console.warn('⚠️ Error during PixiJS Application destruction:', error);
      }
      this.app = null;
    }
    this.container = null;
    this.isInitialized = false;
  }
}