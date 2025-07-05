import { useEffect, useRef, useCallback } from 'react';
import { CanvasApplication } from '../../../canvas/core/Application';
import { GameplayScene } from '../../../canvas/scenes/GameplayScene';
import { EventBridge } from '../../../bridge/EventBridge';
import { calculateCanvasSize } from '../../../canvas/utils/Math';

// Global singleton to prevent multiple PixiJS applications
let globalPixiApp: CanvasApplication | null = null;
let globalScene: GameplayScene | null = null;
let globalEventBridge: EventBridge | null = null;
let initializationPromise: Promise<void> | null = null;
let activeComponentCount = 0;

// Global cleanup function
const cleanupGlobalPixiApp = () => {
  console.log('🗑️ Cleaning up global PixiJS application...');
  
  if (globalScene) {
    globalScene.destroy();
    globalScene = null;
  }
  if (globalPixiApp) {
    globalPixiApp.destroy();
    globalPixiApp = null;
  }
  if (globalEventBridge) {
    globalEventBridge.destroy();
    globalEventBridge = null;
  }
  initializationPromise = null;
  
  console.log('✅ Global PixiJS cleanup completed');
};

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
  const initializedRef = useRef<boolean>(false);

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
    // Use global singleton to prevent multiple PixiJS applications
    if (!containerRef.current) {
      console.log('No container available for PixiJS initialization');
      return;
    }

    // If already initializing globally, wait for it
    if (initializationPromise) {
      console.log('Waiting for existing PixiJS initialization...');
      await initializationPromise;
      canvasAppRef.current = globalPixiApp;
      sceneRef.current = globalScene;
      eventBridgeRef.current = globalEventBridge;
      return;
    }

    // If already initialized globally, reuse
    if (globalPixiApp && globalScene && globalEventBridge) {
      console.log('Reusing existing PixiJS application');
      canvasAppRef.current = globalPixiApp;
      sceneRef.current = globalScene;
      eventBridgeRef.current = globalEventBridge;
      
      // Add canvas to this container if not already added
      if (globalPixiApp.getApp().canvas.parentElement !== containerRef.current) {
        containerRef.current.appendChild(globalPixiApp.getApp().canvas);
      }
      return;
    }

    console.log('Starting PixiJS initialization (singleton)...');
    
    // Create initialization promise to prevent concurrent initializations
    initializationPromise = (async () => {
      try {
        // Calculate responsive canvas size using current dimensions
        const { width: canvasWidth, height: canvasHeight } = calculateCanvasSize(width, height);

        // Create canvas application
        const canvasApp = new CanvasApplication();
        await canvasApp.init(containerRef.current!, canvasWidth, canvasHeight);
        globalPixiApp = canvasApp;
        canvasAppRef.current = canvasApp;

        // Create gameplay scene
        const scene = new GameplayScene(canvasApp);
        canvasApp.addToStage(scene);
        globalScene = scene;
        sceneRef.current = scene;

        // Setup event bridge
        const eventBridge = EventBridge.getInstance();
        globalEventBridge = eventBridge;
        eventBridgeRef.current = eventBridge;

        // Setup scene event handlers
        setupSceneEvents(scene, eventBridge);

        // Trigger resize callback if provided
        if (onResize) {
          onResize(canvasWidth, canvasHeight);
        }

        console.log('✅ PixiJS singleton initialization completed');
      } catch (error) {
        console.error('Failed to initialize PixiJS application:', error);
        // Reset globals on error
        globalPixiApp = null;
        globalScene = null;
        globalEventBridge = null;
        throw error;
      } finally {
        initializationPromise = null;
      }
    })();

    await initializationPromise;
  }, [setupSceneEvents]);

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
    console.log('Cleaning up PixiJS hook references...');
    
    // Decrement active component count
    activeComponentCount--;
    console.log(`Active PixiJS components: ${activeComponentCount}`);
    
    // Clear local references
    canvasAppRef.current = null;
    sceneRef.current = null;
    eventBridgeRef.current = null;
    
    // If this is the last component, cleanup global resources
    if (activeComponentCount <= 0) {
      cleanupGlobalPixiApp();
    }
    
    console.log('PixiJS hook cleanup completed');
  }, []);

  // Initialize app on mount (only once)
  useEffect(() => {
    // Increment active component count
    activeComponentCount++;
    console.log(`Active PixiJS components: ${activeComponentCount}`);
    
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
  }, [width, height, onResize]); // Include onResize in dependencies

  return {
    containerRef,
    app: canvasAppRef.current,
    scene: sceneRef.current,
    eventBridge: eventBridgeRef.current,
    resize: resizeApp,
    cleanup,
  };
}