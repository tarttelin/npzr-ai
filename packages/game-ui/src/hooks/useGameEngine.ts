import { useCallback, useEffect, useRef, useState } from 'react';
import { GameEngine, Player } from '@npzr/core';
import { AIPlayer } from '@npzr/ai';

export interface UseGameEngineOptions {
  enableAI?: boolean;
  aiDifficulty?: 'easy' | 'medium' | 'hard';
  playerName?: string;
  aiName?: string;
}

export interface UseGameEngineReturn {
  gameEngine: GameEngine | null;
  players: [Player | null, Player | null];
  currentPlayer: Player | null;
  isGameComplete: boolean;
  winner: Player | null;
  createNewGame: () => void;
  isInitialized: boolean;
  error: string | null;
}

/**
 * Hook for managing GameEngine lifecycle and Player instances
 * Provides the core integration layer between UI and game logic
 */
export function useGameEngine(options: UseGameEngineOptions = {}): UseGameEngineReturn {
  const {
    enableAI = true,
    aiDifficulty = 'medium',
    playerName = 'Human Player',
    aiName = 'AI Opponent'
  } = options;

  const [gameEngine, setGameEngine] = useState<GameEngine | null>(null);
  const [players, setPlayers] = useState<[Player | null, Player | null]>([null, null]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [winner, setWinner] = useState<Player | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const aiPlayerRef = useRef<AIPlayer | null>(null);
  const gameStateUpdateIntervalRef = useRef<number | null>(null);

  /**
   * Initialize a new game engine instance
   */
  const initializeGameEngine = useCallback(() => {
    try {
      setError(null);
      
      // Create new game engine
      const engine = new GameEngine();
      engine.createGame();
      
      // Add human player
      const humanPlayer = engine.addPlayer(playerName);
      
      // Add AI player if enabled
      let aiPlayer: Player | null = null;
      if (enableAI) {
        aiPlayer = engine.addPlayer(aiName);
        
        // Create AI controller
        aiPlayerRef.current = new AIPlayer(aiPlayer, aiDifficulty);
      }
      
      setGameEngine(engine);
      setPlayers([humanPlayer, aiPlayer]);
      setCurrentPlayer(humanPlayer);
      setIsGameComplete(false);
      setWinner(null);
      setIsInitialized(true);
      
      return engine;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize game engine';
      setError(errorMessage);
      console.error('Game engine initialization error:', err);
      return null;
    }
  }, [enableAI, aiDifficulty, playerName, aiName]);

  /**
   * Create a new game
   */
  const createNewGame = useCallback(() => {
    // Cleanup existing game
    if (gameStateUpdateIntervalRef.current) {
      clearInterval(gameStateUpdateIntervalRef.current);
    }
    aiPlayerRef.current = null;
    
    // Initialize new game
    initializeGameEngine();
  }, [initializeGameEngine]);

  /**
   * Update game state from engine
   */
  const updateGameState = useCallback(() => {
    if (!gameEngine || !players[0]) return;

    try {
      // Check if game is complete
      const gameComplete = gameEngine.isGameComplete();
      setIsGameComplete(gameComplete);
      
      if (gameComplete) {
        const gameWinner = gameEngine.getWinner();
        setWinner(gameWinner);
        
        // Stop polling when game is complete
        if (gameStateUpdateIntervalRef.current) {
          clearInterval(gameStateUpdateIntervalRef.current);
        }
        return;
      }

      // Determine current player based on player states
      const humanPlayer = players[0];
      const aiPlayer = players[1];
      
      let current: Player | null = null;
      
      if (humanPlayer.isMyTurn()) {
        current = humanPlayer;
      } else if (aiPlayer && aiPlayer.isMyTurn()) {
        current = aiPlayer;
        
        // Trigger AI turn if it's the AI's turn
        if (aiPlayerRef.current && !gameComplete) {
          // Small delay to make AI moves visible
          setTimeout(() => {
            try {
              // AI will automatically play when it's their turn
              // The AIPlayer should handle turn logic internally
              console.log('AI turn detected - AI should play automatically');
            } catch (err) {
              console.error('AI turn error:', err);
            }
          }, 1000);
        }
      }
      
      setCurrentPlayer(current);
    } catch (err) {
      console.error('Game state update error:', err);
      setError(err instanceof Error ? err.message : 'Game state update failed');
    }
  }, [gameEngine, players]);

  /**
   * Initialize game on mount
   */
  useEffect(() => {
    if (!isInitialized) {
      initializeGameEngine();
    }
  }, [isInitialized, initializeGameEngine]);

  /**
   * Set up game state polling
   */
  useEffect(() => {
    if (!gameEngine || !isInitialized) return;

    // Poll game state every 100ms for responsive updates
    gameStateUpdateIntervalRef.current = setInterval(updateGameState, 100);
    
    // Initial update
    updateGameState();

    return () => {
      if (gameStateUpdateIntervalRef.current) {
        clearInterval(gameStateUpdateIntervalRef.current);
      }
    };
  }, [gameEngine, isInitialized, updateGameState]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (gameStateUpdateIntervalRef.current) {
        clearInterval(gameStateUpdateIntervalRef.current);
      }
      aiPlayerRef.current = null;
    };
  }, []);

  return {
    gameEngine,
    players,
    currentPlayer,
    isGameComplete,
    winner,
    createNewGame,
    isInitialized,
    error
  };
}