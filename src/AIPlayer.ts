import { Player, MoveOptions } from './Player.js';
import { PlayerStateType } from './PlayerState.js';
import { Card, BodyPart } from './Card.js';
import { Stack } from './Stack.js';
import { GameStateAnalyzer, GameAnalysis } from './GameStateAnalyzer.js';
import { CardPlayEvaluator, isWildCardPlayOption } from './CardPlayEvaluator.js';

export type Difficulty = 'easy' | 'medium' | 'hard';

export class AIPlayer {
  private analyzer: GameStateAnalyzer;
  private cardPlayEvaluator: CardPlayEvaluator;

  constructor(
    private readonly player: Player,
    private readonly difficulty: Difficulty
  ) {
    this.analyzer = new GameStateAnalyzer();
    this.cardPlayEvaluator = new CardPlayEvaluator();
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
   * Handle PLAY_CARD state - intelligently select and play card using unified evaluation
   */
  private handlePlayCard(): void {
    const hand = this.player.getHand();
    const cards = hand.getCards();
    
    if (cards.length === 0) {
      console.warn('AI: No cards in hand to play');
      return;
    }

    const analysis = this.getGameAnalysis();
    const myStacks = this.player.getMyStacks();
    const opponentStacks = this.player.getOpponentStacks();
    
    // Use unified CardPlayEvaluator for optimal placement+nomination coordination
    const evaluations = this.cardPlayEvaluator.evaluateAllPlays(cards, analysis, myStacks, opponentStacks, hand);
    const bestPlay = this.cardPlayEvaluator.selectBestPlay(evaluations);
    
    if (!bestPlay) {
      console.warn('AI: No valid plays found');
      return;
    }
    
    // Execute the play
    if (isWildCardPlayOption(bestPlay)) {
      // Wild card: execute placement + nomination in one coordinated decision
      console.log(`AI: Playing wild card ${bestPlay.card.toString()} to ${bestPlay.placement.targetPile} as ${bestPlay.nomination.character} ${bestPlay.nomination.bodyPart} - ${bestPlay.reasoning} (combined value: ${bestPlay.combinedValue})`);
      
      // Play the card
      this.player.playCard(bestPlay.card, bestPlay.placement);
      
      // Immediately nominate (no separate decision phase needed)
      this.player.nominateWildCard(bestPlay.card, {
        character: bestPlay.nomination.character,
        bodyPart: bestPlay.nomination.bodyPart
      });
    } else {
      // Regular card: just place it
      console.log(`AI: Playing ${bestPlay.card.toString()} - ${bestPlay.reasoning} (value: ${bestPlay.value}, type: ${bestPlay.type})`);
      this.player.playCard(bestPlay.card, bestPlay.placement);
    }
  }


  /**
   * Handle NOMINATE_WILD state - should not be reached with unified system
   */
  private handleNominateWild(): void {
    console.error('AI: NOMINATE_WILD state reached - this indicates an implementation error. Wild cards should be handled in PLAY_CARD phase with unified system.');
  }

  /**
   * Handle MOVE_CARD state - strategically move cards to optimize position
   */
  private handleMoveCard(): void {
    const analysis = this.getGameAnalysis();
    const move = this.selectBestMove(analysis);
    
    if (move) {
      console.log(`AI: Moving card ${move.cardId} strategically`);
      this.player.moveCard(move);
    } else {
      console.warn('AI: No strategic moves found');
    }
  }

  /**
   * Select the best strategic move from available options
   */
  private selectBestMove(analysis: GameAnalysis): MoveOptions | null {
    const myStacks = this.player.getMyStacks();
    const opponentStacks = this.player.getOpponentStacks();
    const allStacks = [...myStacks, ...opponentStacks];
    
    // Priority 1: Moves that complete own characters
    for (const opportunity of analysis.completionOpportunities) {
      const move = this.findMoveForCompletion(opportunity, allStacks);
      if (move) return move;
    }

    // Priority 2: Moves that disrupt critical opponent completions
    for (const disruption of analysis.disruptionOpportunities) {
      if (disruption.urgency === 'critical') {
        const move = this.findMoveForDisruption(disruption, allStacks);
        if (move) return move;
      }
    }

    // Priority 3: Any valid move that improves position
    return this.findFirstValidMove(allStacks[0], allStacks);
  }

  /**
   * Find a move that can complete a character
   */
  private findMoveForCompletion(opportunity: any, allStacks: Stack[]): MoveOptions | null {
    // Look for cards that can be moved to complete the stack
    for (const fromStack of allStacks) {
      const cards = fromStack.getCardsFromPile(opportunity.neededCard);
      if (cards.length > 0) {
        const card = cards[cards.length - 1]; // Top card
        if (card.character === opportunity.character || card.isWild()) {
          const targetStack = allStacks.find(s => s.getId() === opportunity.stackId);
          if (targetStack && targetStack.canAcceptCard(card, opportunity.neededCard)) {
            return {
              cardId: card.id,
              fromStackId: fromStack.getId(),
              fromPile: opportunity.neededCard,
              toStackId: opportunity.stackId,
              toPile: opportunity.neededCard
            };
          }
        }
      }
    }
    return null;
  }

  /**
   * Find a move that can disrupt opponent completion
   */
  private findMoveForDisruption(disruption: any, allStacks: Stack[]): MoveOptions | null {
    // Look for cards that can be moved to disrupt the opponent
    for (const fromStack of allStacks) {
      const cards = fromStack.getCardsFromPile(disruption.targetPile);
      if (cards.length > 0) {
        const card = cards[cards.length - 1]; // Top card
        const targetStack = allStacks.find(s => s.getId() === disruption.stackId);
        if (targetStack && targetStack.canAcceptCard(card, disruption.targetPile)) {
          return {
            cardId: card.id,
            fromStackId: fromStack.getId(),
            fromPile: disruption.targetPile,
            toStackId: disruption.stackId,
            toPile: disruption.targetPile
          };
        }
      }
    }
    return null;
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
   * Get missing body parts for a stack's top cards
   */
  private getMissingBodyParts(topCards: { head?: Card; torso?: Card; legs?: Card }): BodyPart[] {
    const missing: BodyPart[] = [];
    if (!topCards.head) missing.push(BodyPart.Head);
    if (!topCards.torso) missing.push(BodyPart.Torso);
    if (!topCards.legs) missing.push(BodyPart.Legs);
    return missing;
  }

  /**
   * Log game result when game is over
   */
  private logGameResult(): void {
    const state = this.player.getState();
    console.log(`AI: Game over - ${state.getMessage()}`);
  }
}