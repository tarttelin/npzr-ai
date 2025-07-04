/**
 * Type definitions for the NPZR Game UI components
 * Core engine integration types only
 */

import { Card, Stack, Character, BodyPart, PlayerStateType } from '@npzr/core';

export type CharacterType = 'ninja' | 'pirate' | 'zombie' | 'robot';

// Core engine integration types
export interface PlayerStateInfo {
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

export interface GameState {
  player1: PlayerStateInfo | null;
  player2: PlayerStateInfo | null;
  currentPlayer: PlayerStateInfo | null;
  gamePhase: 'setup' | 'playing' | 'finished';
  winner: PlayerStateInfo | null;
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

// Core engine GameHUD props
export interface CoreGameHUDProps {
  player1: PlayerStateInfo | null;
  player2: PlayerStateInfo | null;
  currentPlayer: PlayerStateInfo | null;
  gamePhase: 'setup' | 'playing' | 'finished';
  winner: PlayerStateInfo | null;
  onNewGame: () => void;
  onDrawCard: () => void;
  gameActions: {
    playCard: (card: Card, options?: { targetStackId?: string; targetPile?: any }) => void;
    moveCard: (options: { cardId: string; fromStackId: string; fromPile: any; toStackId?: string; toPile: any }) => void;
    nominateWild: (card: Card, nomination: { character: Character; bodyPart: any }) => void;
  };
}

// Core engine GameCanvas props
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

// Core engine PlayerPanel props
export interface CorePlayerPanelProps {
  player: PlayerStateInfo | null;
  isCurrentPlayer: boolean;
  position: 'left' | 'right';
}

export interface GameControlsProps {
  onNewGame: () => void;
  disabled?: boolean;
}

// Core engine TurnIndicator props
export interface CoreTurnIndicatorProps {
  currentPlayer: PlayerStateInfo | null;
  gamePhase: 'setup' | 'playing' | 'finished';
  winner?: PlayerStateInfo | null;
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
  type: 'NEW_GAME' | 'SWITCH_TURN' | 'ADD_COMPLETED_CHARACTER' | 'END_GAME';
  payload?: any;
}