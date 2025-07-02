import { useReducer, useCallback } from 'react';
import { GameState, GameAction } from '../types/GameUI.types';

/**
 * Initial game state with mock data for Phase 1
 */
const initialGameState: GameState = {
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
};

/**
 * Game state reducer
 */
function gameStateReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'NEW_GAME':
      return {
        ...initialGameState,
        gamePhase: 'playing',
      };

    case 'SWITCH_TURN': {
      const newCurrentTurn = state.currentTurn === 'player1' ? 'player2' : 'player1';
      return {
        ...state,
        currentTurn: newCurrentTurn,
        players: {
          ...state.players,
          player1: {
            ...state.players.player1,
            isActive: newCurrentTurn === 'player1',
          },
          player2: {
            ...state.players.player2,
            isActive: newCurrentTurn === 'player2',
          },
        },
      };
    }

    case 'UPDATE_SCORE': {
      const { player, score } = action.payload;
      return {
        ...state,
        players: {
          ...state.players,
          [player]: {
            ...state.players[player as keyof typeof state.players],
            score,
          },
        },
      };
    }

    case 'END_GAME':
      return {
        ...state,
        gamePhase: 'finished',
        winner: action.payload.winner,
        players: {
          ...state.players,
          player1: {
            ...state.players.player1,
            isActive: false,
          },
          player2: {
            ...state.players.player2,
            isActive: false,
          },
        },
      };

    case 'PAUSE_GAME':
      return {
        ...state,
        gamePhase: 'setup',
        players: {
          ...state.players,
          player1: {
            ...state.players.player1,
            isActive: false,
          },
          player2: {
            ...state.players.player2,
            isActive: false,
          },
        },
      };

    default:
      return state;
  }
}

/**
 * Custom hook for managing game state
 */
export function useGameState() {
  const [gameState, dispatch] = useReducer(gameStateReducer, initialGameState);

  const startNewGame = useCallback(() => {
    dispatch({ type: 'NEW_GAME' });
  }, []);

  const switchTurn = useCallback(() => {
    dispatch({ type: 'SWITCH_TURN' });
  }, []);

  const updateScore = useCallback((player: 'player1' | 'player2', score: number) => {
    dispatch({ type: 'UPDATE_SCORE', payload: { player, score } });
  }, []);

  const endGame = useCallback((winner: 'player1' | 'player2' | 'draw') => {
    dispatch({ type: 'END_GAME', payload: { winner } });
  }, []);

  const pauseGame = useCallback(() => {
    dispatch({ type: 'PAUSE_GAME' });
  }, []);

  return {
    gameState,
    startNewGame,
    switchTurn,
    updateScore,
    endGame,
    pauseGame,
  };
}