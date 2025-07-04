import * as PIXI from 'pixi.js';

/**
 * Canvas application configuration
 */
export interface CanvasConfig {
  width: number;
  height: number;
  backgroundColor?: number;
  antialias?: boolean;
  resolution?: number;
  autoDensity?: boolean;
}

/**
 * Canvas size information
 */
export interface CanvasSize {
  width: number;
  height: number;
}

/**
 * Position information
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Drag event data
 */
export interface DragEventData {
  target: PIXI.Container;
  position?: Position;
  originalEvent: PIXI.FederatedPointerEvent;
}

/**
 * Deck interaction events
 */
export interface DeckEventData {
  cardCount: number;
}

/**
 * Animation configuration
 */
export interface AnimationConfig {
  duration: number;
  easing?: string;
  delay?: number;
  onComplete?: () => void;
  onUpdate?: (progress: number) => void;
}

/**
 * Scene interface for all game scenes
 */
export interface IScene extends PIXI.Container {
  layout(): void;
  onResize(width: number, height: number): void;
  update(deltaTime: number): void;
  destroy(): void;
}

/**
 * Entity interface for all game entities
 */
export interface IEntity extends PIXI.Container {
  update?(deltaTime: number): void;
  destroy(): void;
}

/**
 * System interface for all game systems
 */
export interface ISystem {
  update?(deltaTime: number): void;
  destroy(): void;
}

/**
 * Card data structure (matches core game logic)
 */
export interface CardData {
  id: string;
  character: 'ninja' | 'pirate' | 'zombie' | 'robot';
  bodyPart: 'head' | 'torso' | 'legs';
  isWild?: boolean;
  nomination?: {
    character?: 'ninja' | 'pirate' | 'zombie' | 'robot';
    bodyPart?: 'head' | 'torso' | 'legs';
  };
}

/**
 * Stack data structure
 */
export interface StackData {
  id: string;
  playerId: string;
  cards: CardData[];
  position: Position;
}

/**
 * Player area data structure
 */
export interface PlayerAreaData {
  playerId: string;
  stacks: StackData[];
  handSize: number;
  position: Position;
}