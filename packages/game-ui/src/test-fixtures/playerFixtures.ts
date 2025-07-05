import { faker } from '@faker-js/faker';
import { PlayerStateInfo, CharacterType } from '../types/GameUI.types';
import { PlayerStateType } from '@npzr/core';

/**
 * Creates a complete PlayerStateInfo instance for testing
 */
export function createPlayerStateInfo(overrides: Partial<PlayerStateInfo> = {}): PlayerStateInfo {
  const characters: CharacterType[] = ['ninja', 'pirate', 'zombie', 'robot'];
  const states = [
    PlayerStateType.DRAW_CARD,
    PlayerStateType.PLAY_CARD, 
    PlayerStateType.MOVE_CARD,
    PlayerStateType.NOMINATE_WILD,
    PlayerStateType.WAITING_FOR_OPPONENT,
    PlayerStateType.GAME_OVER
  ];
  
  const state = faker.helpers.arrayElement(states);
  const score = Array.from({ length: faker.number.int({ min: 0, max: 4 }) }, () => 
    faker.helpers.arrayElement(characters)
  );
  
  return {
    id: `player-${faker.string.alphanumeric(8)}`,
    name: faker.helpers.arrayElement(['Human Player', 'AI Opponent', faker.person.firstName()]),
    score,
    handCount: faker.number.int({ min: 0, max: 10 }),
    hand: [],
    stacks: [],
    state,
    stateMessage: getStateMessage(state),
    isMyTurn: faker.datatype.boolean(),
    canDraw: state === PlayerStateType.DRAW_CARD,
    canPlay: state === PlayerStateType.PLAY_CARD,
    canMove: state === PlayerStateType.MOVE_CARD,
    canNominate: state === PlayerStateType.NOMINATE_WILD,
    ...overrides
  };
}


function getStateMessage(state: PlayerStateType): string {
  const messages = {
    [PlayerStateType.DRAW_CARD]: 'Draw a card from the deck to start your turn',
    [PlayerStateType.PLAY_CARD]: 'Play a card from your hand',
    [PlayerStateType.MOVE_CARD]: 'Move a card to a different stack',
    [PlayerStateType.NOMINATE_WILD]: 'Nominate your wild card',
    [PlayerStateType.WAITING_FOR_OPPONENT]: 'Waiting for opponent',
    [PlayerStateType.GAME_OVER]: 'Game complete!'
  };
  return messages[state];
}