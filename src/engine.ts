import { 
  GameState, 
  PlayCardAction, 
  MoveAction, 
  Card, 
  PlayerId, 
  Character,
  BodyPart,
  CardNomination 
} from './types.js';
import { createGameState, checkGameWinner } from './game.js';
import { executeTurn, drawCard } from './turns.js';
import { executeMove, processStackCompletions, usePendingMove } from './moves.js';
import { nominateWildCard, isWildCard } from './wildcards.js';
import { validateCardPlay } from './turns.js';

export class NPZRGameEngine {
  private gameState: GameState;

  constructor() {
    this.gameState = createGameState();
  }

  // Game State Access
  public getGameState(): Readonly<GameState> {
    return { ...this.gameState };
  }

  public getCurrentPlayer(): PlayerId {
    return this.gameState.currentPlayer;
  }

  public getWinner(): PlayerId | undefined {
    return this.gameState.winner;
  }

  public isGameFinished(): boolean {
    return this.gameState.gamePhase === 'finished';
  }

  public getPendingMoves(): number {
    return this.gameState.pendingMoves;
  }

  // Turn Management
  public playTurn(
    regularCardAction: PlayCardAction,
    wildCardActions: PlayCardAction[] = []
  ): boolean {
    if (this.isGameFinished()) {
      return false;
    }

    return executeTurn(this.gameState, regularCardAction, wildCardActions);
  }

  public drawCard(): Card | null {
    if (this.isGameFinished()) {
      return null;
    }

    return drawCard(this.gameState);
  }

  // Card Management
  public validateCardPlay(card: Card, targetStackId?: string): boolean {
    return validateCardPlay(this.gameState, card, targetStackId);
  }

  public nominateWildCard(card: Card, nomination: CardNomination): boolean {
    if (!isWildCard(card)) {
      return false;
    }

    return nominateWildCard(card, nomination.character, nomination.bodyPart);
  }

  // Move Management
  public executeMove(moveAction: MoveAction): boolean {
    if (this.isGameFinished() || this.gameState.pendingMoves <= 0) {
      return false;
    }

    const success = executeMove(this.gameState, moveAction);
    if (success) {
      usePendingMove(this.gameState);
      processStackCompletions(this.gameState);
      
      // Check for winner after move
      const winner = checkGameWinner(this.gameState);
      if (winner) {
        this.gameState.gamePhase = 'finished';
        this.gameState.winner = winner;
      }
    }

    return success;
  }

  // Game Information
  public getPlayerHand(playerId: PlayerId): Card[] {
    const player = this.gameState.players.find(p => p.id === playerId);
    return player ? [...player.hand] : [];
  }

  public getPlayerScore(playerId: PlayerId): Set<Character> {
    const player = this.gameState.players.find(p => p.id === playerId);
    return player ? new Set(player.scoredCharacters) : new Set();
  }

  public getStacks() {
    return [...this.gameState.stacks];
  }

  public getDeckSize(): number {
    return this.gameState.deck.length;
  }

  // Utility Methods
  public reset(): void {
    this.gameState = createGameState();
  }

  public clone(): NPZRGameEngine {
    const newEngine = new NPZRGameEngine();
    
    // Deep clone the game state, handling Sets properly
    const clonedState = JSON.parse(JSON.stringify(this.gameState, (key, value) => {
      if (value instanceof Set) {
        return Array.from(value);
      }
      return value;
    }));
    
    // Restore Set objects for scoredCharacters
    for (let i = 0; i < clonedState.players.length; i++) {
      clonedState.players[i].scoredCharacters = new Set(clonedState.players[i].scoredCharacters);
    }
    
    newEngine.gameState = clonedState;
    return newEngine;
  }

  // Game State Validation
  public validateGameState(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check deck size
    const totalCards = this.gameState.deck.length + 
                      this.gameState.players[0].hand.length + 
                      this.gameState.players[1].hand.length +
                      this.gameState.stacks.reduce((total, stack) => {
                        return total + Object.values(stack.piles).reduce((pileTotal, pile) => {
                          return pileTotal + pile.cards.length;
                        }, 0);
                      }, 0);

    if (totalCards !== 44) {
      errors.push(`Invalid total card count: ${totalCards}, expected 44`);
    }

    // Check player hands
    for (const player of this.gameState.players) {
      if (player.hand.length > 10) {
        errors.push(`Player ${player.id} has too many cards: ${player.hand.length}`);
      }
    }

    // Check pending moves
    if (this.gameState.pendingMoves < 0) {
      errors.push(`Invalid pending moves: ${this.gameState.pendingMoves}`);
    }

    // Check game phase consistency
    if (this.gameState.gamePhase === 'finished' && !this.gameState.winner) {
      errors.push('Game marked as finished but no winner set');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Debug and Testing Methods
  public getGameStateForTesting(): GameState {
    return this.gameState;
  }

  public setGameStateForTesting(state: GameState): void {
    this.gameState = state;
  }
}