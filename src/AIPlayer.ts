import { Player, MoveOptions } from './Player.js';
import { PlayerStateType } from './PlayerState.js';
import { GameStateAnalyzer, GameAnalysis } from './GameStateAnalyzer.js';
import { CardPlayEvaluator, isWildCardPlayOption } from './CardPlayEvaluator.js';
import { MoveEvaluator } from './MoveEvaluator.js';

export type Difficulty = 'easy' | 'medium' | 'hard';

export class AIPlayer {
  private analyzer: GameStateAnalyzer;
  private cardPlayEvaluator: CardPlayEvaluator;
  private moveEvaluator: MoveEvaluator;

  constructor(
    private readonly player: Player,
    private readonly difficulty: Difficulty
  ) {
    this.analyzer = new GameStateAnalyzer();
    this.cardPlayEvaluator = new CardPlayEvaluator();
    this.moveEvaluator = new MoveEvaluator();
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
    const myStacks = this.player.getMyStacks();
    const opponentStacks = this.player.getOpponentStacks();
    
    // Use MoveEvaluator to find the best strategic move
    const evaluations = this.moveEvaluator.evaluateAllMoves(myStacks, opponentStacks, analysis);
    const bestMove = this.moveEvaluator.selectBestMove(evaluations);
    
    if (bestMove) {
      const moveOptions: MoveOptions = {
        cardId: bestMove.cardId,
        fromStackId: bestMove.fromStack.getId(),
        fromPile: bestMove.fromPile,
        toStackId: bestMove.toStack?.getId(), // undefined means create new stack
        toPile: bestMove.toPile
      };
      
      const stackInfo = bestMove.toStack ? 
        `to ${bestMove.toStack.getId()}` : 
        'to new stack';
      
      console.log(`AI: Moving ${bestMove.card.toString()} ${stackInfo} - ${bestMove.reasoning} (value: ${bestMove.value}, type: ${bestMove.type})`);
      this.player.moveCard(moveOptions);
    } else {
      console.warn('AI: No strategic moves found');
    }
  }


  /**
   * Log game result when game is over
   */
  private logGameResult(): void {
    const state = this.player.getState();
    console.log(`AI: Game over - ${state.getMessage()}`);
  }
}