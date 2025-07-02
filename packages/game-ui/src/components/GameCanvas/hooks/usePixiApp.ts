import { useEffect, useRef, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { 
  createPixiApp, 
  createDeckPlaceholder, 
  positionDeckPlaceholder, 
  destroyPixiApp,
  calculateCanvasSize 
} from '../../../utils/pixiUtils';

interface UsePixiAppOptions {
  width: number;
  height: number;
  onResize?: (width: number, height: number) => void;
}

/**
 * Custom hook for managing PixiJS application lifecycle
 */
export function usePixiApp({ width, height, onResize }: UsePixiAppOptions) {
  const appRef = useRef<PIXI.Application | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const deckRef = useRef<PIXI.Graphics | null>(null);

  /**
   * Initialize PixiJS application
   */
  const initializeApp = useCallback(() => {
    if (!containerRef.current || appRef.current) return;

    // Calculate responsive canvas size
    const { width: canvasWidth, height: canvasHeight } = calculateCanvasSize(width, height);

    // Create PixiJS application
    const app = createPixiApp(canvasWidth, canvasHeight);
    appRef.current = app;

    // Add canvas to container
    containerRef.current.appendChild(app.view as HTMLCanvasElement);

    // Create and position deck placeholder
    const deck = createDeckPlaceholder();
    positionDeckPlaceholder(deck, canvasWidth, canvasHeight);
    app.stage.addChild(deck);
    deckRef.current = deck;

    // Trigger resize callback
    onResize?.(canvasWidth, canvasHeight);
  }, [width, height, onResize]);

  /**
   * Resize PixiJS application
   */
  const resizeApp = useCallback((newWidth: number, newHeight: number) => {
    if (!appRef.current || !deckRef.current) return;

    const { width: canvasWidth, height: canvasHeight } = calculateCanvasSize(newWidth, newHeight);
    
    // Resize the renderer
    appRef.current.renderer.resize(canvasWidth, canvasHeight);
    
    // Reposition deck placeholder
    positionDeckPlaceholder(deckRef.current, canvasWidth, canvasHeight);

    // Trigger resize callback
    onResize?.(canvasWidth, canvasHeight);
  }, [onResize]);

  /**
   * Cleanup PixiJS application
   */
  const cleanup = useCallback(() => {
    if (appRef.current) {
      destroyPixiApp(appRef.current);
      appRef.current = null;
      deckRef.current = null;
    }
  }, []);

  // Initialize app on mount
  useEffect(() => {
    initializeApp();
    return cleanup;
  }, [initializeApp, cleanup]);

  // Handle resize
  useEffect(() => {
    if (appRef.current) {
      resizeApp(width, height);
    }
  }, [width, height, resizeApp]);

  return {
    containerRef,
    app: appRef.current,
    resize: resizeApp,
    cleanup,
  };
}