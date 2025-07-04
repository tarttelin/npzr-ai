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

