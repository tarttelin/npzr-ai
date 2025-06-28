import { Player, PlayCardOptions, MoveOptions } from './Player.js';
import { PlayerStateType } from './PlayerState.js';
import { Card, Character, BodyPart } from './Card.js';
import { Stack } from './Stack.js';

export type Difficulty = 'easy' | 'medium' | 'hard';

export class AIPlayer {
  private lastPlayedCard: Card | null = null;

  constructor(
    private readonly player: Player,
    private readonly difficulty: Difficulty
  ) {}

  /**
   * Main decision-making method - handles the current player state
   */
  makeMove(): void {
    if (!this.player.isMyTurn()) {
      return;
    }

    const currentState = this.getCurrentState();

    try {
      switch (currentState) {
        case PlayerStateType.DRAW_CARD:
          this.handleDrawCard();
          break;
        case PlayerStateType.PLAY_CARD:
          this.handlePlayCard();
          break;
        case PlayerStateType.NOMINATE_WILD:
          this.handleNominateWild();
          break;
        case PlayerStateType.MOVE_CARD:
          this.handleMoveCard();
          break;
        case PlayerStateType.WAITING_FOR_OPPONENT:
          // Do nothing - wait for opponent
          break;
        case PlayerStateType.GAME_OVER:
          this.logGameResult();
          break;
        default:
          console.warn(`AIPlayer: Unknown state ${currentState}`);
      }
    } catch (error) {
      console.error(`AIPlayer error in state ${currentState}:`, error);
    }
  }

  /**
   * Check if it's the AI's turn and act accordingly
   */
  takeTurnIfReady(): void {
    if (this.player.isMyTurn()) {
      this.makeMove();
    }
  }

  /**
   * Get current player state info
   */
  getCurrentState(): PlayerStateType {
    return this.player.getState().getState();
  }

  /**
   * Basic logging/debugging - returns strategy description
   */
  getStrategy(): string {
    const state = this.getCurrentState();
    const handSize = this.player.getHand().size();
    const myStacks = this.player.getMyStacks().length;
    const score = this.player.getMyScore().size();
    
    return `AI (${this.difficulty}): State=${state}, Hand=${handSize}, Stacks=${myStacks}, Score=${score}`;
  }

  /**
   * Handle DRAW_CARD state - always draw when required
   */
  private handleDrawCard(): void {
    console.log('AI: Drawing card');
    this.player.drawCard();
  }

  /**
   * Handle PLAY_CARD state - intelligently place card on existing character stack or create new one
   */
  private handlePlayCard(): void {
    const hand = this.player.getHand();
    const cards = hand.getCards();
    
    if (cards.length === 0) {
      console.warn('AI: No cards in hand to play');
      return;
    }

    // Simple strategy: play first card in hand
    const cardToPlay = cards[0];
    this.lastPlayedCard = cardToPlay;
    
    const placement = this.findBestPlacement(cardToPlay);
    
    console.log(`AI: Playing card ${cardToPlay.toString()} ${placement.targetStackId ? 'on existing stack' : 'on new stack'}`);
    this.player.playCard(cardToPlay, placement);
  }

  /**
   * Find the best placement for a card - prioritize existing character stacks
   */
  private findBestPlacement(card: Card): PlayCardOptions {
    const myStacks = this.player.getMyStacks();
    
    // Skip wild cards for now - they need special handling
    if (card.isWild()) {
      return {
        targetPile: BodyPart.Head // Default placement for wild cards
      };
    }

    // Look for existing stacks with the same character
    for (const stack of myStacks) {
      const topCards = stack.getTopCards();
      
      // Check if this stack is for the same character
      const stackCharacter = this.getStackCharacter(topCards);
      if (stackCharacter === card.character) {
        // Try to place the card in the appropriate pile
        const targetPile = card.bodyPart;
        
        // Check if the pile already has a card of the same type
        let existingCard: Card | undefined;
        if (targetPile === BodyPart.Head) existingCard = topCards.head;
        else if (targetPile === BodyPart.Torso) existingCard = topCards.torso;
        else if (targetPile === BodyPart.Legs) existingCard = topCards.legs;
        
        if (!existingCard) {
          // Empty pile - perfect place for this card
          return {
            targetStackId: stack.getId(),
            targetPile: targetPile
          };
        }
      }
    }

    // No suitable existing stack found - create new stack
    return {
      targetPile: card.bodyPart
    };
  }

  /**
   * Determine the character type of a stack based on its top cards
   */
  private getStackCharacter(topCards: { head?: Card; torso?: Card; legs?: Card }): Character | null {
    // Check head card first
    if (topCards.head && topCards.head.character !== Character.Wild) {
      return topCards.head.getEffectiveCharacter();
    }
    
    // Check torso card
    if (topCards.torso && topCards.torso.character !== Character.Wild) {
      return topCards.torso.getEffectiveCharacter();
    }
    
    // Check legs card
    if (topCards.legs && topCards.legs.character !== Character.Wild) {
      return topCards.legs.getEffectiveCharacter();
    }

    return null; // No clear character type
  }

  /**
   * Handle NOMINATE_WILD state - nominate as first valid character/bodypart
   */
  private handleNominateWild(): void {
    if (!this.lastPlayedCard || !this.lastPlayedCard.isWild()) {
      console.warn('AI: Expected to nominate wild card but no wild card found');
      return;
    }

    // Simple strategy: nominate as Ninja Head (first valid combination)
    const nomination = {
      character: Character.Ninja,
      bodyPart: BodyPart.Head
    };

    console.log(`AI: Nominating wild card as ${nomination.character} ${nomination.bodyPart}`);
    this.player.nominateWildCard(this.lastPlayedCard, nomination);
  }

  /**
   * Handle MOVE_CARD state - move first available card to first available location
   */
  private handleMoveCard(): void {
    const myStacks = this.player.getMyStacks();
    const opponentStacks = this.player.getOpponentStacks();
    const allStacks = [...myStacks, ...opponentStacks];

    // Find first move opportunity
    for (const fromStack of allStacks) {
      const move = this.findFirstValidMove(fromStack, allStacks);
      if (move) {
        console.log(`AI: Moving card ${move.cardId} from ${move.fromStackId} to ${move.toStackId}`);
        this.player.moveCard(move);
        return;
      }
    }

    console.warn('AI: No valid moves found');
  }

  /**
   * Find the first valid move from a given stack
   */
  private findFirstValidMove(fromStack: Stack, allStacks: Stack[]): MoveOptions | null {
    const piles = [BodyPart.Head, BodyPart.Torso, BodyPart.Legs];
    
    for (const fromPile of piles) {
      const cards = fromStack.getCardsFromPile(fromPile);
      if (cards.length === 0) continue;

      const topCard = cards[cards.length - 1];
      
      for (const toStack of allStacks) {
        if (toStack.getId() === fromStack.getId()) continue;
        
        for (const toPile of piles) {
          if (toStack.canAcceptCard(topCard, toPile)) {
            return {
              cardId: topCard.id,
              fromStackId: fromStack.getId(),
              fromPile: fromPile,
              toStackId: toStack.getId(),
              toPile: toPile
            };
          }
        }
      }
    }

    return null;
  }

  /**
   * Log game result when game is over
   */
  private logGameResult(): void {
    const state = this.player.getState();
    console.log(`AI: Game over - ${state.getMessage()}`);
  }
}