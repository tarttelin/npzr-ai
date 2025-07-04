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

  /**
   * Initialize the PixiJS application
   */
  async init(container: HTMLElement, width: number, height: number): Promise<void> {
    if (this.isInitialized) {
      throw new Error('Canvas application is already initialized');
    }

    this.container = container;
    this.app = new PIXI.Application();

    await this.app.init({
      width,
      height,
      backgroundColor: CANVAS_CONFIG.BACKGROUND_COLOR,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    // Add canvas to container
    this.container.appendChild(this.app.canvas);
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
   * Cleanup and destroy the application
   */
  destroy(): void {
    if (this.app) {
      this.app.destroy(true, { children: true, texture: true });
      this.app = null;
    }
    this.container = null;
    this.isInitialized = false;
  }
}