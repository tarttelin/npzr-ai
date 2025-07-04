import { useEffect, useRef, useCallback } from 'react';
import { CanvasApplication } from '../../../canvas/core/Application';
import { GameplayScene } from '../../../canvas/scenes/GameplayScene';
import { EventBridge } from '../../../bridge/EventBridge';
import { calculateCanvasSize } from '../../../canvas/utils/Math';

interface UsePixiAppOptions {
  width: number;
  height: number;
  onResize?: (width: number, height: number) => void;
}

/**
 * Custom hook for managing PixiJS application lifecycle with new architecture
 */
export function usePixiApp({ width, height, onResize }: UsePixiAppOptions) {
  const canvasAppRef = useRef<CanvasApplication | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<GameplayScene | null>(null);
  const eventBridgeRef = useRef<EventBridge | null>(null);
  const initializingRef = useRef<boolean>(false);

  /**
   * Setup scene event handlers
   */
  const setupSceneEvents = useCallback((scene: GameplayScene, eventBridge: EventBridge) => {
    // Forward scene events to React layer
    scene.on('game:deckClick', (data) => {
      eventBridge.emitToReact('game:deckClick', data);
    });

    scene.on('game:deckHover', (data) => {
      eventBridge.emitToReact('game:deckHover', data);
    });

    scene.on('game:deckHoverEnd', () => {
      eventBridge.emitToReact('game:deckHoverEnd', undefined);
    });

    // Listen for React events to update canvas
    eventBridge.onReactEvent('ui:updateDeck', (data) => {
      scene.updateDeckCount(data.cardCount);
    });
  }, []);

  /**
   * Initialize PixiJS application with new architecture
   */
  const initializeApp = useCallback(async () => {
    // Prevent multiple simultaneous initializations (React StrictMode protection)
    if (!containerRef.current || canvasAppRef.current || initializingRef.current) {
      // Skip initialization if already in progress or completed
      return;
    }

    initializingRef.current = true;

    // Ensure any existing app is properly cleaned up first
    if (canvasAppRef.current) {
      canvasAppRef.current.destroy();
      canvasAppRef.current = null;
    }

    try {
      // Use current dimensions from props - avoiding dependency issues
      const currentWidth = width;
      const currentHeight = height;
      
      // Calculate responsive canvas size
      const { width: canvasWidth, height: canvasHeight } = calculateCanvasSize(currentWidth, currentHeight);

      // Create canvas application
      const canvasApp = new CanvasApplication();
      await canvasApp.init(containerRef.current, canvasWidth, canvasHeight);
      canvasAppRef.current = canvasApp;

      // Create gameplay scene
      const scene = new GameplayScene(canvasApp);
      canvasApp.addToStage(scene);
      sceneRef.current = scene;

      // Setup event bridge
      const eventBridge = EventBridge.getInstance();
      eventBridgeRef.current = eventBridge;

      // Setup scene event handlers
      setupSceneEvents(scene, eventBridge);

      // Trigger resize callback if provided
      if (onResize) {
        onResize(canvasWidth, canvasHeight);
      }
    } catch (error) {
      console.error('Failed to initialize PixiJS application:', error);
    } finally {
      initializingRef.current = false;
    }
  }, []);

  /**
   * Resize PixiJS application
   */
  const resizeApp = useCallback((newWidth: number, newHeight: number) => {
    if (!canvasAppRef.current || !sceneRef.current) return;

    const { width: canvasWidth, height: canvasHeight } = calculateCanvasSize(newWidth, newHeight);
    
    // Resize the canvas application
    canvasAppRef.current.resize(canvasWidth, canvasHeight);
    
    // Update scene layout
    sceneRef.current.onResize(canvasWidth, canvasHeight);

    // Trigger resize callback
    onResize?.(canvasWidth, canvasHeight);
  }, [onResize]);

  /**
   * Cleanup PixiJS application
   */
  const cleanup = useCallback(() => {
    initializingRef.current = false;
    
    if (sceneRef.current) {
      sceneRef.current.destroy();
      sceneRef.current = null;
    }
    if (canvasAppRef.current) {
      canvasAppRef.current.destroy();
      canvasAppRef.current = null;
    }
    if (eventBridgeRef.current) {
      eventBridgeRef.current.destroy();
      eventBridgeRef.current = null;
    }
    // Cleanup completed
  }, []);

  // Initialize app on mount (only once)
  useEffect(() => {
    // Initialize PixiJS application once on mount
    initializeApp();
    return cleanup;
  }, []); // Empty dependency array - only run once on mount

  // Handle resize when dimensions change
  useEffect(() => {
    if (canvasAppRef.current && sceneRef.current) {
      const { width: canvasWidth, height: canvasHeight } = calculateCanvasSize(width, height);
      
      // Resize the canvas application
      canvasAppRef.current.resize(canvasWidth, canvasHeight);
      
      // Update scene layout
      sceneRef.current.onResize(canvasWidth, canvasHeight);

      // Trigger resize callback if provided
      if (onResize) {
        onResize(canvasWidth, canvasHeight);
      }
    }
  }, [width, height]); // Only depend on width/height, not functions

  return {
    containerRef,
    app: canvasAppRef.current,
    scene: sceneRef.current,
    eventBridge: eventBridgeRef.current,
    resize: resizeApp,
    cleanup,
  };
}