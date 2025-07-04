import { faker } from '@faker-js/faker';

/**
 * Creates mock game actions with jest functions
 */
export function createMockGameActions() {
  return {
    drawCard: jest.fn(),
    playCard: jest.fn(),
    moveCard: jest.fn(),
    nominateWild: jest.fn()
  };
}

/**
 * Creates mock game engine for testing
 */
export function createMockGameEngine() {
  return {
    players: [null, null],
    currentPlayerId: 'player1',
    gamePhase: faker.helpers.arrayElement(['setup', 'playing', 'finished']),
    createNewGame: jest.fn(),
    isInitialized: true,
    error: null
  };
}

/**
 * Creates mock useGameEngine hook return value
 */
export function createMockUseGameEngine() {
  return {
    gameEngine: null,
    players: [null, null] as [null, null],
    currentPlayer: null,
    isGameComplete: false,
    winner: null,
    createNewGame: jest.fn(),
    isInitialized: true,
    error: null
  };
}

/**
 * Creates mock usePlayerState hook return value
 */
export function createMockUsePlayerState() {
  return {
    humanPlayerState: null,
    aiPlayerState: null,
    currentPlayerState: null,
    gamePhase: faker.helpers.arrayElement(['setup', 'playing', 'finished']),
    hasError: false,
    errorMessage: null,
    gameActions: createMockGameActions()
  };
}