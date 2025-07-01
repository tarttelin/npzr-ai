import { Card, Character, BodyPart, CardNomination } from './Card.js';
import { Hand } from './Hand.js';
import { Stack } from './Stack.js';
import { Score } from './Score.js';
import { PlayerState } from './PlayerState.js';

export interface PlayCardOptions {
  targetStackId?: string;
  targetPile?: BodyPart;
}

export interface MoveOptions {
  cardId: string;
  fromStackId: string;
  fromPile: BodyPart;
  toStackId?: string; // Optional - if not provided, creates new stack
  toPile: BodyPart;
}

export interface Position {
  stackId: string;
  pile: BodyPart;
}

export class Player {
  private hand = new Hand();
  private score = new Score();
  private currentState = PlayerState.waitingForOpponent();

  constructor(
    private readonly playerId: string,
    private readonly name: string,
    private gameEngine: any // TODO: proper type when GameEngine is implemented
  ) {}

  // Player identity
  getId(): string {
    return this.playerId;
  }

  getName(): string {
    return this.name;
  }

  // Player state
  getState(): PlayerState {
    return this.currentState;
  }

  // Game information
  getHand(): Hand {
    return this.hand;
  }

  getMyStacks(): Stack[] {
    return this.gameEngine.getStacksForPlayer(this.playerId);
  }

  getOpponentStacks(): Stack[] {
    return this.gameEngine.getStacksForOpponent(this.playerId);
  }

  getMyScore(): Score {
    return this.score;
  }

  getOpponentScore(): Score {
    return this.gameEngine.getOpponentScore(this.playerId);
  }

  // Actions
  drawCard(): void {
    if (!this.currentState.canDrawCard()) {
      throw new Error(`Cannot draw card in state: ${this.currentState.getState()}`);
    }
    
    this.gameEngine.playerDrawCard(this.playerId);
  }

  playCard(card: Card, options: PlayCardOptions = {}): void {
    if (!this.currentState.canPlayCard()) {
      throw new Error(`Cannot play card in state: ${this.currentState.getState()}`);
    }

    if (!this.hand.hasCard(card)) {
      throw new Error(`Card ${card.id} not found in hand`);
    }

    this.gameEngine.playerPlayCard(this.playerId, card, options);
  }

  moveCard(moveOptions: MoveOptions): void {
    if (!this.currentState.canMoveCard()) {
      throw new Error(`Cannot move card in state: ${this.currentState.getState()}`);
    }

    this.gameEngine.playerMoveCard(this.playerId, moveOptions);
  }

  nominateWildCard(card: Card, nomination: CardNomination): void {
    if (!this.currentState.canNominate()) {
      throw new Error(`Cannot nominate wild card in state: ${this.currentState.getState()}`);
    }

    if (!card.isWild()) {
      throw new Error('Can only nominate wild cards');
    }

    this.gameEngine.playerNominateWild(this.playerId, card, nomination);
  }

  // Utility methods
  canPlayCard(card: Card): boolean {
    return this.currentState.canPlayCard() && this.hand.hasCard(card);
  }

  canMoveCard(from: Position, to: Position): boolean {
    if (!this.currentState.canMoveCard()) {
      return false;
    }
    
    return this.gameEngine.canMoveCard(from, to);
  }

  isMyTurn(): boolean {
    return !this.currentState.isWaiting() && !this.currentState.isGameOver();
  }

  // Internal methods for GameEngine to update player state
  setState(newState: PlayerState): void {
    this.currentState = newState;
  }

  addCardToHand(card: Card): void {
    this.hand.add(card);
  }

  removeCardFromHand(card: Card): Card {
    return this.hand.remove(card);
  }

  addToScore(character: Character): void {
    this.score.addCharacter(character);
  }

  hasWon(): boolean {
    return this.score.isWinning();
  }
}