/**
 * Simple browser-compatible EventEmitter implementation
 */
class SimpleEventEmitter {
  private events: Record<string, Function[]> = {};

  on(event: string, listener: Function): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  off(event: string, listener: Function): void {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== listener);
  }

  emit(event: string, ...args: any[]): void {
    if (!this.events[event]) return;
    this.events[event].forEach(listener => listener(...args));
  }

  removeAllListeners(event?: string): void {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }
}

/**
 * Event types for communication between React and Canvas layers
 */
export interface CanvasEvents {
  // Game events from canvas to React
  'game:deckClick': { cardCount: number };
  'game:deckHover': { cardCount: number };
  'game:deckHoverEnd': void;
  'game:cardClick': { cardId: string };
  'game:cardDrag': { cardId: string; position: { x: number; y: number } };
  'game:stackClick': { stackId: string };
  'game:cardPlay': { card: any; targetStackId?: string; targetPile?: any };
  'game:cardMove': { cardId: string; fromStackId: string; fromPile: any; toStackId?: string; toPile: any };
  'game:wildNomination': { card: any; character: any; bodyPart: any };
  
  // PixiJS lifecycle events
  'pixi:ready': {};
  'pixi:destroy': void;
  'pixi:updateGameState': {
    players: Array<{
      name: string;
      handSize: number;
      handCards: any[];
      stackCount: number;
      isCurrentPlayer: boolean;
    }>;
    currentPlayer: string | undefined;
    gamePhase: 'setup' | 'playing' | 'finished';
  };
  
  // UI events from React to canvas
  'ui:newGame': void;
  'ui:pauseGame': void;
  'ui:resumeGame': void;
  'ui:updateDeck': { cardCount: number };
  'ui:updateHand': { playerId: string; handSize: number };
  'ui:highlightValidMoves': { cardId: string };
  'ui:clearHighlights': void;
}

/**
 * Bridge for communication between React components and PixiJS canvas
 * Uses EventEmitter pattern for loose coupling
 */
export class EventBridge extends SimpleEventEmitter {
  private static instance: EventBridge | null = null;

  /**
   * Singleton pattern - ensures only one bridge exists
   */
  static getInstance(): EventBridge {
    if (!EventBridge.instance) {
      EventBridge.instance = new EventBridge();
    }
    return EventBridge.instance;
  }

  /**
   * Emit an event from canvas to React
   */
  emitToReact<K extends keyof CanvasEvents>(
    event: K, 
    data: CanvasEvents[K]
  ): void {
    this.emit(`react:${event}`, data);
  }

  /**
   * Emit an event from React to canvas
   */
  emitToCanvas<K extends keyof CanvasEvents>(
    event: K, 
    data: CanvasEvents[K]
  ): void {
    this.emit(`canvas:${event}`, data);
  }

  /**
   * Listen for events from canvas (for React components)
   */
  onCanvasEvent<K extends keyof CanvasEvents>(
    event: K,
    listener: (data: CanvasEvents[K]) => void
  ): void {
    this.on(`react:${event}`, listener);
  }

  /**
   * Listen for events from React (for canvas)
   */
  onReactEvent<K extends keyof CanvasEvents>(
    event: K,
    listener: (data: CanvasEvents[K]) => void
  ): void {
    this.on(`canvas:${event}`, listener);
  }

  /**
   * Remove listener for canvas events
   */
  offCanvasEvent<K extends keyof CanvasEvents>(
    event: K,
    listener: (data: CanvasEvents[K]) => void
  ): void {
    this.off(`react:${event}`, listener);
  }

  /**
   * Remove listener for React events
   */
  offReactEvent<K extends keyof CanvasEvents>(
    event: K,
    listener: (data: CanvasEvents[K]) => void
  ): void {
    this.off(`canvas:${event}`, listener);
  }

  /**
   * Clear all listeners
   */
  clearAllListeners(): void {
    this.removeAllListeners();
  }

  /**
   * Destroy the bridge (for cleanup)
   */
  destroy(): void {
    this.clearAllListeners();
    EventBridge.instance = null;
  }
}