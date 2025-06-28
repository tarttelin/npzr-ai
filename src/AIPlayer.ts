import { Player, PlayCardOptions, MoveOptions } from './Player.js';
import { PlayerStateType } from './PlayerState.js';
import { Card, Character, BodyPart } from './Card.js';
import { Stack } from './Stack.js';
import { GameStateAnalyzer, GameAnalysis } from './GameStateAnalyzer.js';

export type Difficulty = 'easy' | 'medium' | 'hard';

export class AIPlayer {
  private lastPlayedCard: Card | null = null;
  private analyzer: GameStateAnalyzer;

  constructor(
    private readonly player: Player,
    private readonly difficulty: Difficulty
  ) {
    this.analyzer = new GameStateAnalyzer();
  }

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
   * Get comprehensive game state analysis
   */
  getGameAnalysis(): GameAnalysis {
    return this.analyzer.analyzeGameState(
      this.player.getMyStacks(),
      this.player.getOpponentStacks(),
      this.player.getHand(),
      this.player.getMyScore(),
      this.player.getOpponentScore()
    );
  }

  /**
   * Enhanced strategy information using game state analysis
   */
  getStrategy(): string {
    const analysis = this.getGameAnalysis();
    return this.analyzer.getAnalysisSummary(analysis);
  }

  /**
   * Handle DRAW_CARD state - always draw when required
   */
  private handleDrawCard(): void {
    console.log('AI: Drawing card');
    this.player.drawCard();
  }

  /**
   * Handle PLAY_CARD state - intelligently place card using game state analysis
   */
  private handlePlayCard(): void {
    const hand = this.player.getHand();
    const cards = hand.getCards();
    
    if (cards.length === 0) {
      console.warn('AI: No cards in hand to play');
      return;
    }

    const analysis = this.getGameAnalysis();
    const cardToPlay = this.selectBestCard(cards, analysis);
    this.lastPlayedCard = cardToPlay;
    
    const placement = this.findBestPlacement(cardToPlay, analysis);
    
    console.log(`AI: Playing card ${cardToPlay.toString()} ${placement.targetStackId ? 'on existing stack' : 'on new stack'} (${analysis.gamePhase} phase, ${analysis.threatLevel} threat)`);
    this.player.playCard(cardToPlay, placement);
  }

  /**
   * Select the best card to play based on game state analysis
   */
  private selectBestCard(cards: Card[], analysis: GameAnalysis): Card {
    // Priority 1: Cards that complete own stacks
    for (const opportunity of analysis.completionOpportunities) {
      const completionCard = cards.find(card => 
        (card.character === opportunity.character && card.bodyPart === opportunity.neededCard) ||
        card.isWild()
      );
      if (completionCard) {
        return completionCard;
      }
    }

    // Priority 2: Cards that block critical opponent completions
    for (const block of analysis.blockingOpportunities) {
      if (block.urgency === 'critical') {
        const blockingCard = cards.find(card => 
          card.bodyPart === block.targetPile || card.isWild()
        );
        if (blockingCard) {
          return blockingCard;
        }
      }
    }

    // Priority 3: Cards for existing character stacks (continuation)
    const myStacks = this.player.getMyStacks();
    for (const stack of myStacks) {
      const topCards = stack.getTopCards();
      const character = this.getStackCharacter(topCards);
      if (character && character !== Character.Wild) {
        const continuationCard = cards.find(card => 
          card.character === character && !card.isWild()
        );
        if (continuationCard) {
          return continuationCard;
        }
      }
    }

    // Priority 4: High-value characters in early/mid game
    if (analysis.gamePhase !== 'late') {
      const highValueCards = cards.filter(card => 
        !card.isWild() && [Character.Ninja, Character.Pirate].includes(card.character)
      );
      if (highValueCards.length > 0) {
        return highValueCards[0];
      }
    }

    // Fallback: First available card
    return cards[0];
  }

  /**
   * Find the best placement for a card using game state analysis
   */
  private findBestPlacement(card: Card, _analysis?: GameAnalysis): PlayCardOptions {
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
    if (topCards.head) {
      const effectiveChar = topCards.head.getEffectiveCharacter();
      if (effectiveChar !== Character.Wild) {
        return effectiveChar;
      }
    }
    
    // Check torso card
    if (topCards.torso) {
      const effectiveChar = topCards.torso.getEffectiveCharacter();
      if (effectiveChar !== Character.Wild) {
        return effectiveChar;
      }
    }
    
    // Check legs card
    if (topCards.legs) {
      const effectiveChar = topCards.legs.getEffectiveCharacter();
      if (effectiveChar !== Character.Wild) {
        return effectiveChar;
      }
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