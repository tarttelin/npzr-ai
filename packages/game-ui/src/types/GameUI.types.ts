/**
 * Type definitions for the NPZR Game UI components
 * Includes both legacy mock types and new core engine integration types
 */

import { Card, Stack, Character, BodyPart, PlayerStateType } from '@npzr/core';

export type CharacterType = 'ninja' | 'pirate' | 'zombie' | 'robot';

// Legacy mock types (for backward compatibility during migration)
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

// New core engine integration types
export interface CorePlayerInfo {
  id: string;
  name: string;
  score: CharacterType[];
  handCount: number;
  hand: Card[];
  stacks: Stack[];
  state: PlayerStateType;
  stateMessage: string;
  isMyTurn: boolean;
  canDraw: boolean;
  canPlay: boolean;
  canMove: boolean;
  canNominate: boolean;
}

export interface CoreGameState {
  player1: CorePlayerInfo | null;
  player2: CorePlayerInfo | null;
  currentPlayer: CorePlayerInfo | null;
  gamePhase: 'setup' | 'playing' | 'finished';
  winner: CorePlayerInfo | null;
  isGameComplete: boolean;
  error: string | null;
}

// Sprite rendering types
export interface SpriteCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CharacterSpriteConfig {
  character: CharacterType;
  bodyPart: 'head' | 'torso' | 'legs';
  coordinates: SpriteCoordinates;
}

// Card visual types
export interface CardVisualInfo {
  id: string;
  character?: CharacterType;
  bodyPart?: 'head' | 'torso' | 'legs';
  isWild: boolean;
  nomination?: {
    character?: CharacterType;
    bodyPart?: 'head' | 'torso' | 'legs';
  };
  displayText?: string; // For wild cards without sprites
}

// Action types for Player methods
export interface PlayCardAction {
  card: Card;
  targetStackId?: string;
  targetPile?: BodyPart;
}

export interface MoveCardAction {
  cardId: string;
  fromStackId: string;
  fromPile: BodyPart;
  toStackId?: string;
  toPile: BodyPart;
}

export interface NominateWildAction {
  card: Card;
  character: Character;
  bodyPart: BodyPart;
}

export interface GamePageProps {
  // No props initially - will be extended in later phases
}

// Legacy GameHUD props (for backward compatibility)
export interface GameHUDProps {
  gameState: GameState;
  onNewGame: () => void;
  onPause?: () => void;
}

// New core engine GameHUD props
export interface CoreGameHUDProps {
  player1: CorePlayerInfo | null;
  player2: CorePlayerInfo | null;
  currentPlayer: CorePlayerInfo | null;
  gamePhase: 'setup' | 'playing' | 'finished';
  winner: CorePlayerInfo | null;
  onNewGame: () => void;
  onDrawCard: () => void;
  gameActions: {
    playCard: (card: Card, options?: { targetStackId?: string; targetPile?: any }) => void;
    moveCard: (options: { cardId: string; fromStackId: string; fromPile: any; toStackId?: string; toPile: any }) => void;
    nominateWild: (card: Card, nomination: { character: Character; bodyPart: any }) => void;
  };
}

// Legacy GameCanvas props (for backward compatibility)
export interface GameCanvasProps {
  width?: number;
  height?: number;
  gameState: GameState;
}

// New core engine GameCanvas props
export interface CoreGameCanvasProps {
  width?: number;
  height?: number;
  gameEngine: any; // GameEngine from @npzr/core
  players: [any | null, any | null]; // Player objects from @npzr/core
  currentPlayer: any | null; // Player object from @npzr/core
  gamePhase: 'setup' | 'playing' | 'finished';
  gameActions: {
    drawCard: () => void;
    playCard: (card: Card, options?: { targetStackId?: string; targetPile?: any }) => void;
    moveCard: (options: { cardId: string; fromStackId: string; fromPile: any; toStackId?: string; toPile: any }) => void;
    nominateWild: (card: Card, nomination: { character: Character; bodyPart: any }) => void;
  };
}

// Legacy PlayerPanel props (for backward compatibility)
export interface PlayerPanelProps {
  player: PlayerInfo;
  isCurrentPlayer: boolean;
  position: 'left' | 'right';
}

// New core engine PlayerPanel props
export interface CorePlayerPanelProps {
  player: CorePlayerInfo | null;
  isCurrentPlayer: boolean;
  position: 'left' | 'right';
}

export interface GameControlsProps {
  onNewGame: () => void;
  onPause?: () => void;
  disabled?: boolean;
}

// Legacy TurnIndicator props
export interface TurnIndicatorProps {
  currentPlayer: PlayerInfo;
  gamePhase: GameState['gamePhase'];
}

// New core engine TurnIndicator props
export interface CoreTurnIndicatorProps {
  currentPlayer: CorePlayerInfo | null;
  gamePhase: 'setup' | 'playing' | 'finished';
  winner?: CorePlayerInfo | null;
  onDrawCard?: () => void;
  canDraw?: boolean;
  canPlay?: boolean;
  canMove?: boolean;
  canNominate?: boolean;
  stateMessage?: string;
}

export interface CanvasSize {
  width: number;
  height: number;
}

export interface GameAction {
  type: 'NEW_GAME' | 'SWITCH_TURN' | 'ADD_COMPLETED_CHARACTER' | 'END_GAME' | 'PAUSE_GAME';
  payload?: any;
}