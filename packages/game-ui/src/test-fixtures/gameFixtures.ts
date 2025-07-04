import { GameEngine } from '@npzr/core';

/**
 * Creates a simple GameEngine with two players ready for testing
 */
export function createGameEngine(): GameEngine {
  const engine = new GameEngine();
  engine.createGame();
  engine.addPlayer('Human Player');
  engine.addPlayer('AI Opponent');
  return engine;
}