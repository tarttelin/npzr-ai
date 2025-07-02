import { renderHook, act } from '@testing-library/react';
import { useGameState } from './useGameState';

describe('useGameState', () => {
  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useGameState());
    
    expect(result.current.gameState).toEqual({
      players: {
        player1: {
          name: 'Player 1',
          score: 0,
          handCount: 5,
          isActive: true,
        },
        player2: {
          name: 'Player 2',
          score: 0,
          handCount: 5,
          isActive: false,
        },
      },
      currentTurn: 'player1',
      gamePhase: 'setup',
    });
  });

  it('provides all expected functions', () => {
    const { result } = renderHook(() => useGameState());
    
    expect(typeof result.current.startNewGame).toBe('function');
    expect(typeof result.current.switchTurn).toBe('function');
    expect(typeof result.current.updateScore).toBe('function');
    expect(typeof result.current.endGame).toBe('function');
    expect(typeof result.current.pauseGame).toBe('function');
  });

  it('starts a new game correctly', () => {
    const { result } = renderHook(() => useGameState());
    
    act(() => {
      result.current.startNewGame();
    });
    
    expect(result.current.gameState.gamePhase).toBe('playing');
    expect(result.current.gameState.players.player1.isActive).toBe(true);
    expect(result.current.gameState.players.player2.isActive).toBe(false);
    expect(result.current.gameState.currentTurn).toBe('player1');
  });

  it('switches turns correctly', () => {
    const { result } = renderHook(() => useGameState());
    
    // Start the game first
    act(() => {
      result.current.startNewGame();
    });
    
    // Switch to player 2
    act(() => {
      result.current.switchTurn();
    });
    
    expect(result.current.gameState.currentTurn).toBe('player2');
    expect(result.current.gameState.players.player1.isActive).toBe(false);
    expect(result.current.gameState.players.player2.isActive).toBe(true);
    
    // Switch back to player 1
    act(() => {
      result.current.switchTurn();
    });
    
    expect(result.current.gameState.currentTurn).toBe('player1');
    expect(result.current.gameState.players.player1.isActive).toBe(true);
    expect(result.current.gameState.players.player2.isActive).toBe(false);
  });

  it('updates player scores correctly', () => {
    const { result } = renderHook(() => useGameState());
    
    act(() => {
      result.current.updateScore('player1', 3);
    });
    
    expect(result.current.gameState.players.player1.score).toBe(3);
    expect(result.current.gameState.players.player2.score).toBe(0);
    
    act(() => {
      result.current.updateScore('player2', 2);
    });
    
    expect(result.current.gameState.players.player1.score).toBe(3);
    expect(result.current.gameState.players.player2.score).toBe(2);
  });

  it('ends game correctly', () => {
    const { result } = renderHook(() => useGameState());
    
    // Start the game first
    act(() => {
      result.current.startNewGame();
    });
    
    // End the game
    act(() => {
      result.current.endGame('player1');
    });
    
    expect(result.current.gameState.gamePhase).toBe('finished');
    expect(result.current.gameState.winner).toBe('player1');
    expect(result.current.gameState.players.player1.isActive).toBe(false);
    expect(result.current.gameState.players.player2.isActive).toBe(false);
  });

  it('pauses game correctly', () => {
    const { result } = renderHook(() => useGameState());
    
    // Start the game first
    act(() => {
      result.current.startNewGame();
    });
    
    expect(result.current.gameState.gamePhase).toBe('playing');
    
    // Pause the game
    act(() => {
      result.current.pauseGame();
    });
    
    expect(result.current.gameState.gamePhase).toBe('setup');
    expect(result.current.gameState.players.player1.isActive).toBe(false);
    expect(result.current.gameState.players.player2.isActive).toBe(false);
  });

  it('handles multiple score updates', () => {
    const { result } = renderHook(() => useGameState());
    
    act(() => {
      result.current.updateScore('player1', 1);
      result.current.updateScore('player1', 2);
      result.current.updateScore('player2', 3);
    });
    
    expect(result.current.gameState.players.player1.score).toBe(2);
    expect(result.current.gameState.players.player2.score).toBe(3);
  });

  it('can end game with different winners', () => {
    const { result } = renderHook(() => useGameState());
    
    act(() => {
      result.current.endGame('player2');
    });
    
    expect(result.current.gameState.winner).toBe('player2');
    
    // Reset by starting new game
    act(() => {
      result.current.startNewGame();
    });
    
    act(() => {
      result.current.endGame('draw');
    });
    
    expect(result.current.gameState.winner).toBe('draw');
  });

  it('maintains state consistency after multiple operations', () => {
    const { result } = renderHook(() => useGameState());
    
    // Complex sequence of operations
    act(() => {
      result.current.startNewGame();
      result.current.updateScore('player1', 1);
      result.current.switchTurn();
      result.current.updateScore('player2', 2);
      result.current.switchTurn();
    });
    
    expect(result.current.gameState.gamePhase).toBe('playing');
    expect(result.current.gameState.currentTurn).toBe('player1');
    expect(result.current.gameState.players.player1.score).toBe(1);
    expect(result.current.gameState.players.player2.score).toBe(2);
    expect(result.current.gameState.players.player1.isActive).toBe(true);
    expect(result.current.gameState.players.player2.isActive).toBe(false);
  });
});