import { Player, MoveOptions } from './Player.js';
import { PlayerStateType } from './PlayerState.js';
import { GameStateAnalyzer, GameAnalysis } from './GameStateAnalyzer.js';
import { CardPlayEvaluator, isWildCardPlayOption } from './CardPlayEvaluator.js';
import { MoveEvaluator } from './MoveEvaluator.js';
import { DifficultyManager, DifficultyConfig } from './DifficultyManager.js';

export type Difficulty = 'easy' | 'medium' | 'hard';

export class AIPlayer {
  private analyzer: GameStateAnalyzer;
  private cardPlayEvaluator: CardPlayEvaluator;
  private moveEvaluator: MoveEvaluator;
  private difficultyManager: DifficultyManager;
  private difficultyConfig: DifficultyConfig;

  constructor(
    private readonly player: Player,
    private readonly difficulty: Difficulty
  ) {
    this.analyzer = new GameStateAnalyzer();
    this.cardPlayEvaluator = new CardPlayEvaluator();
    this.moveEvaluator = new MoveEvaluator();
    this.difficultyManager = new DifficultyManager();
    this.difficultyConfig = this.difficultyManager.getConfig(difficulty);
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
   * Handle DRAW_CARD state - always draw when required
   */
  private handleDrawCard(): void {
    console.log('AI: Drawing card');
    this.player.drawCard();
  }

  /**
   * Handle PLAY_CARD state - intelligently select and play card using unified evaluation with difficulty
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
    
    // Apply difficulty-based wild card conservation
    const availableCards = this.difficultyManager.adjustWildCardStrategy(cards, this.difficultyConfig);
    
    // Use unified CardPlayEvaluator for optimal placement+nomination coordination
    const allEvaluations = this.cardPlayEvaluator.evaluateAllPlays(availableCards, analysis, myStacks, opponentStacks, hand);
    
    // Apply difficulty-based modifications to evaluations
    const difficultyAdjustedEvaluations = this.difficultyManager.applyDifficultyToCardDecision(allEvaluations, this.difficultyConfig);
    
    const bestPlay = this.cardPlayEvaluator.selectBestPlay(difficultyAdjustedEvaluations);
    
    if (!bestPlay) {
      console.warn('AI: No valid plays found');
      return;
    }
    
    // Execute the play with difficulty-aware logging
    const difficultyIndicator = this.getDifficultyIndicator();
    
    if (isWildCardPlayOption(bestPlay)) {
      // Wild card: execute placement + nomination in one coordinated decision
      console.log(`AI (${difficultyIndicator}): Playing wild card ${bestPlay.card.toString()} to ${bestPlay.placement.targetPile} as ${bestPlay.nomination.character} ${bestPlay.nomination.bodyPart} - ${bestPlay.reasoning} (combined value: ${bestPlay.combinedValue})`);
      
      // Play the card
      this.player.playCard(bestPlay.card, bestPlay.placement);
      
      // Immediately nominate (no separate decision phase needed)
      this.player.nominateWildCard(bestPlay.card, {
        character: bestPlay.nomination.character,
        bodyPart: bestPlay.nomination.bodyPart
      });
    } else {
      // Regular card: just place it
      console.log(`AI (${difficultyIndicator}): Playing ${bestPlay.card.toString()} - ${bestPlay.reasoning} (value: ${bestPlay.value}, type: ${bestPlay.type})`);
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
   * Handle MOVE_CARD state - strategically move cards to optimize position with difficulty
   */
  private handleMoveCard(): void {
    const analysis = this.getGameAnalysis();
    const myStacks = this.player.getMyStacks();
    const opponentStacks = this.player.getOpponentStacks();
    
    // Use MoveEvaluator to find the best strategic move
    const allEvaluations = this.moveEvaluator.evaluateAllMoves(myStacks, opponentStacks, analysis);
    
    // Apply difficulty-based modifications to move evaluations
    const difficultyAdjustedEvaluations = this.difficultyManager.applyDifficultyToMoveDecision(allEvaluations, this.difficultyConfig);
    
    const bestMove = this.moveEvaluator.selectBestMove(difficultyAdjustedEvaluations);
    
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
      
      const difficultyIndicator = this.getDifficultyIndicator();
      console.log(`AI (${difficultyIndicator}): Moving ${bestMove.card.toString()} ${stackInfo} - ${bestMove.reasoning} (value: ${bestMove.value}, type: ${bestMove.type})`);
      this.player.moveCard(moveOptions);
    } else {
      console.warn('AI: No strategic moves found');
    }
  }


  /**
   * Get difficulty configuration for external access
   */
  getDifficultyConfig(): DifficultyConfig {
    return this.difficultyConfig;
  }

  /**
   * Get difficulty indicator for logging
   */
  private getDifficultyIndicator(): string {
    switch (this.difficulty) {
      case 'easy': return '😊 Easy';
      case 'medium': return '🎯 Medium';
      case 'hard': return '🔥 Hard';
      default: return this.difficulty;
    }
  }

  /**
   * Enhanced strategy information that includes difficulty context
   */
  getStrategy(): string {
    const analysis = this.getGameAnalysis();
    const baseStrategy = this.analyzer.getAnalysisSummary(analysis);
    const config = this.difficultyConfig;
    
    const difficultyInfo = `Difficulty: ${this.difficulty.toUpperCase()} | ` +
      `Wild Conservation: ${Math.round(config.wildCardConservation * 100)}% | ` +
      `Disruption Aggression: ${Math.round(config.disruptionAggression * 100)}% | ` +
      `Mistake Rate: ${Math.round(config.mistakeRate * 100)}% | ` +
      `Cascade Optimization: ${config.cascadeOptimization ? 'ON' : 'OFF'}`;
    
    return `${baseStrategy}\n\n--- AI Difficulty Settings ---\n${difficultyInfo}`;
  }

  /**
   * Log game result when game is over
   */
  private logGameResult(): void {
    const state = this.player.getState();
    const difficultyIndicator = this.getDifficultyIndicator();
    console.log(`AI (${difficultyIndicator}): Game over - ${state.getMessage()}`);
  }
}