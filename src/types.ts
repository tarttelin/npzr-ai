export enum Character {
  Ninja = 'ninja',
  Pirate = 'pirate',
  Zombie = 'zombie',
  Robot = 'robot'
}

export enum BodyPart {
  Head = 'head',
  Torso = 'torso',
  Legs = 'legs'
}

export enum CardType {
  Regular = 'regular',
  WildCharacter = 'wild_character',
  WildPosition = 'wild_position',
  WildUniversal = 'wild_universal'
}

export type PlayerId = 'player1' | 'player2';

export interface CardNomination {
  character: Character;
  bodyPart: BodyPart;
}

export interface Card {
  id: string;
  type: CardType;
  character?: Character;
  bodyPart?: BodyPart;
  nomination?: CardNomination;
  isFastCard: boolean;
}

export interface Pile {
  bodyPart: BodyPart;
  cards: Card[];
}

export interface Stack {
  id: string;
  owner: PlayerId;
  piles: Record<BodyPart, Pile>;
}

export interface Player {
  id: PlayerId;
  hand: Card[];
  scoredCharacters: Set<Character>;
}

export enum TurnPhase {
  Draw = 'draw',
  PlayCard = 'play_card',
  AwaitMove = 'await_move',
  Complete = 'complete'
}

export interface TurnState {
  phase: TurnPhase;
  cardsPlayedThisTurn: Card[];
  lastCardWasWild: boolean;
  movesEarnedThisTurn: number;
  canContinuePlaying: boolean;
  hasDrawnCard: boolean;
}

export type TurnContinuation = 'continue' | 'await_move' | 'end_turn';

export interface GameState {
  players: [Player, Player];
  currentPlayer: PlayerId;
  deck: Card[];
  stacks: Stack[];
  pendingMoves: number;
  gamePhase: 'setup' | 'playing' | 'finished';
  winner?: PlayerId;
  currentTurnState?: TurnState;
}

export interface MoveAction {
  cardId: string;
  fromStackId: string;
  fromPile: BodyPart;
  toStackId: string;
  toPile: BodyPart;
}

export interface PlayCardAction {
  card: Card;
  targetStackId?: string;
  targetPile?: BodyPart;
  nomination?: CardNomination;
}

export interface GameAction {
  type: 'draw' | 'play_card' | 'execute_move' | 'complete_stack';
  playerId: PlayerId;
  data?: any;
}