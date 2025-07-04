import * as PIXI from 'pixi.js';
import { CanvasApplication } from '../core/Application';

/**
 * Manages all user interactions with the canvas
 */
export class InteractionSystem {
  private app: CanvasApplication;
  private isDragging = false;
  private dragTarget: PIXI.Container | null = null;
  private dragOffset = { x: 0, y: 0 };

  constructor(app: CanvasApplication) {
    this.app = app;
    this.setupGlobalInteractions();
  }

  /**
   * Setup global interaction handlers
   */
  private setupGlobalInteractions(): void {
    const stage = this.app.getStage();
    
    // Enable global interaction
    stage.eventMode = 'static';
    
    // Global pointer events
    stage.on('pointermove', this.onGlobalPointerMove.bind(this));
    stage.on('pointerup', this.onGlobalPointerUp.bind(this));
    stage.on('pointerupoutside', this.onGlobalPointerUp.bind(this));
  }

  /**
   * Enable dragging for a display object
   */
  enableDrag(target: PIXI.Container): void {
    target.eventMode = 'static';
    target.cursor = 'pointer';
    
    target.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
      this.startDrag(target, event);
    });
  }

  /**
   * Disable dragging for a display object
   */
  disableDrag(target: PIXI.Container): void {
    target.off('pointerdown');
    target.cursor = 'default';
  }

  /**
   * Start dragging a target
   */
  private startDrag(target: PIXI.Container, event: PIXI.FederatedPointerEvent): void {
    if (this.isDragging) return;

    this.isDragging = true;
    this.dragTarget = target;
    
    // Calculate offset from pointer to object origin
    const localPosition = event.getLocalPosition(target.parent);
    this.dragOffset.x = localPosition.x - target.x;
    this.dragOffset.y = localPosition.y - target.y;
    
    // Bring to front
    if (target.parent) {
      target.parent.setChildIndex(target, target.parent.children.length - 1);
    }
    
    // Emit drag start event
    target.emit('drag:start', { target, originalEvent: event });
    
    // Stop propagation to prevent other interactions
    event.stopPropagation();
  }

  /**
   * Handle global pointer move
   */
  private onGlobalPointerMove(event: PIXI.FederatedPointerEvent): void {
    if (!this.isDragging || !this.dragTarget) return;

    const localPosition = event.getLocalPosition(this.dragTarget.parent);
    
    // Update target position
    this.dragTarget.x = localPosition.x - this.dragOffset.x;
    this.dragTarget.y = localPosition.y - this.dragOffset.y;
    
    // Emit drag move event
    this.dragTarget.emit('drag:move', { 
      target: this.dragTarget, 
      position: { x: this.dragTarget.x, y: this.dragTarget.y },
      originalEvent: event 
    });
  }

  /**
   * Handle global pointer up
   */
  private onGlobalPointerUp(event: PIXI.FederatedPointerEvent): void {
    if (!this.isDragging || !this.dragTarget) return;

    const target = this.dragTarget;
    
    // Emit drag end event
    target.emit('drag:end', { 
      target, 
      position: { x: target.x, y: target.y },
      originalEvent: event 
    });
    
    // Reset drag state
    this.isDragging = false;
    this.dragTarget = null;
    this.dragOffset = { x: 0, y: 0 };
  }

  /**
   * Check if currently dragging
   */
  get dragging(): boolean {
    return this.isDragging;
  }

  /**
   * Get current drag target
   */
  get currentDragTarget(): PIXI.Container | null {
    return this.dragTarget;
  }

  /**
   * Add click handler to a display object
   */
  addClickHandler(
    target: PIXI.Container, 
    handler: (event: PIXI.FederatedPointerEvent) => void
  ): void {
    target.eventMode = 'static';
    target.cursor = 'pointer';
    target.on('pointerdown', handler);
  }

  /**
   * Add hover handlers to a display object
   */
  addHoverHandlers(
    target: PIXI.Container,
    onHover: (event: PIXI.FederatedPointerEvent) => void,
    onHoverEnd: (event: PIXI.FederatedPointerEvent) => void
  ): void {
    target.eventMode = 'static';
    target.on('pointerover', onHover);
    target.on('pointerout', onHoverEnd);
  }

  /**
   * Remove all interaction handlers from a display object
   */
  removeHandlers(target: PIXI.Container): void {
    target.removeAllListeners();
    target.eventMode = 'none';
    target.cursor = 'default';
  }

  /**
   * Cleanup the interaction system
   */
  destroy(): void {
    const stage = this.app.getStage();
    stage.removeAllListeners();
    
    this.isDragging = false;
    this.dragTarget = null;
  }
}