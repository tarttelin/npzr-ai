export enum PlayerStateType {
  WAITING_FOR_OPPONENT = 'waiting_for_opponent',
  DRAW_CARD = 'draw_card',
  PLAY_CARD = 'play_card',
  NOMINATE_WILD = 'nominate_wild',
  MOVE_CARD = 'move_card',
  GAME_OVER = 'game_over'
}

export interface Action {
  type: 'draw' | 'play' | 'move' | 'nominate';
  description: string;
}

export class PlayerState {
  constructor(
    private stateType: PlayerStateType,
    private message: string
  ) {}

  getState(): PlayerStateType {
    return this.stateType;
  }

  getMessage(): string {
    return this.message;
  }

  canDrawCard(): boolean {
    return this.stateType === PlayerStateType.DRAW_CARD;
  }

  canPlayCard(): boolean {
    return this.stateType === PlayerStateType.PLAY_CARD;
  }

  canMoveCard(): boolean {
    return this.stateType === PlayerStateType.MOVE_CARD;
  }

  canNominate(): boolean {
    return this.stateType === PlayerStateType.NOMINATE_WILD;
  }

  isWaiting(): boolean {
    return this.stateType === PlayerStateType.WAITING_FOR_OPPONENT;
  }

  isGameOver(): boolean {
    return this.stateType === PlayerStateType.GAME_OVER;
  }

  getValidActions(): Action[] {
    const actions: Action[] = [];

    if (this.canDrawCard()) {
      actions.push({ type: 'draw', description: 'Draw a card from the deck' });
    }

    if (this.canPlayCard()) {
      actions.push({ type: 'play', description: 'Play a card from your hand' });
    }

    if (this.canMoveCard()) {
      actions.push({ type: 'move', description: 'Move a card between stacks' });
    }

    if (this.canNominate()) {
      actions.push({ type: 'nominate', description: 'Nominate what your wild card represents' });
    }

    return actions;
  }

  static waitingForOpponent(): PlayerState {
    return new PlayerState(
      PlayerStateType.WAITING_FOR_OPPONENT,
      "Waiting for opponent to complete their turn"
    );
  }

  static drawCard(): PlayerState {
    return new PlayerState(
      PlayerStateType.DRAW_CARD,
      "Draw a card from the deck to start your turn"
    );
  }

  static playCard(): PlayerState {
    return new PlayerState(
      PlayerStateType.PLAY_CARD,
      "Play a card from your hand"
    );
  }

  static nominateWild(): PlayerState {
    return new PlayerState(
      PlayerStateType.NOMINATE_WILD,
      "Nominate what your wild card represents"
    );
  }

  static moveCard(): PlayerState {
    return new PlayerState(
      PlayerStateType.MOVE_CARD,
      "You must move a card between stacks"
    );
  }

  static gameOver(winner: string): PlayerState {
    return new PlayerState(
      PlayerStateType.GAME_OVER,
      `Game over! ${winner} wins`
    );
  }
}