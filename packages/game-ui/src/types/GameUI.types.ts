/**
 * Type definitions for the NPZR Game UI components
 */

export type CharacterType = 'ninja' | 'pirate' | 'zombie' | 'robot';

export interface PlayerInfo {
  name: string;
  score: CharacterType[]; // Array of completed characters
  handCount: number;
  isActive: boolean;
}

export interface GameState {
  players: {
    player1: PlayerInfo;
    player2: PlayerInfo;
  };
  currentTurn: 'player1' | 'player2';
  gamePhase: 'setup' | 'playing' | 'finished';
  winner?: 'player1' | 'player2' | 'draw';
}

export interface GamePageProps {
  // No props initially - will be extended in later phases
}

export interface GameHUDProps {
  gameState: GameState;
  onNewGame: () => void;
  onPause?: () => void;
}

export interface GameCanvasProps {
  width?: number;
  height?: number;
  gameState: GameState;
}

export interface PlayerPanelProps {
  player: PlayerInfo;
  isCurrentPlayer: boolean;
  position: 'left' | 'right';
}

export interface GameControlsProps {
  onNewGame: () => void;
  onPause?: () => void;
  disabled?: boolean;
}

export interface TurnIndicatorProps {
  currentPlayer: PlayerInfo;
  gamePhase: GameState['gamePhase'];
}

export interface CanvasSize {
  width: number;
  height: number;
}

export interface GameAction {
  type: 'NEW_GAME' | 'SWITCH_TURN' | 'ADD_COMPLETED_CHARACTER' | 'END_GAME' | 'PAUSE_GAME';
  payload?: any;
}