import { Player, MoveOptions, PlayerStateType } from '@npzr/core';
import { GameStateAnalyzer, GameAnalysis } from './GameStateAnalyzer.js';
import { CardPlayEvaluator, isWildCardPlayOption } from './CardPlayEvaluator.js';
import { MoveEvaluator } from './MoveEvaluator.js';
import { DifficultyManager, DifficultyConfig } from './DifficultyManager.js';
import { logger } from '@npzr/logging';

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
          logger.warn(`AIPlayer: Unknown state ${currentState}`, { state: currentState, action: 'makeMove' });
      }
    } catch (error) {
      logger.error(`AIPlayer error in state ${currentState}`, { 
        state: currentState, 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        action: 'makeMove'
      });
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
    logger.info('AI: Drawing card', { action: 'draw_card', difficulty: this.difficulty });
    this.player.drawCard();
  }

  /**
   * Handle PLAY_CARD state - intelligently select and play card using unified evaluation with difficulty
   */
  private handlePlayCard(): void {
    const hand = this.player.getHand();
    const cards = hand.getCards();
    
    if (cards.length === 0) {
      logger.warn('AI: No cards in hand to play', { action: 'play_card', handSize: 0, difficulty: this.difficulty });
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
      logger.warn('AI: No valid plays found', { action: 'play_card', difficulty: this.difficulty });
      return;
    }
    
    // Execute the play with difficulty-aware logging
    const difficultyIndicator = this.getDifficultyIndicator();
    
    if (isWildCardPlayOption(bestPlay)) {
      // Wild card: execute placement + nomination in one coordinated decision
      logger.info(`AI (${difficultyIndicator}): Playing wild card ${bestPlay.card.toString()} to ${bestPlay.placement.targetPile} as ${bestPlay.nomination.character} ${bestPlay.nomination.bodyPart} - ${bestPlay.reasoning} (combined value: ${bestPlay.combinedValue})`, {
        action: 'play_card',
        cardType: 'wild',
        difficulty: this.difficulty,
        cardId: bestPlay.card.id,
        targetPile: bestPlay.placement.targetPile,
        nomination: { character: bestPlay.nomination.character, bodyPart: bestPlay.nomination.bodyPart },
        value: bestPlay.combinedValue,
        reasoning: bestPlay.reasoning
      });
      
      // Play the card
      this.player.playCard(bestPlay.card, bestPlay.placement);
      
      // Immediately nominate (no separate decision phase needed)
      this.player.nominateWildCard(bestPlay.card, {
        character: bestPlay.nomination.character,
        bodyPart: bestPlay.nomination.bodyPart
      });
    } else {
      // Regular card: just place it
      logger.info(`AI (${difficultyIndicator}): Playing ${bestPlay.card.toString()} - ${bestPlay.reasoning} (value: ${bestPlay.value}, type: ${bestPlay.type})`, {
        action: 'play_card',
        cardType: 'regular',
        difficulty: this.difficulty,
        cardId: bestPlay.card.id,
        value: bestPlay.value,
        type: bestPlay.type,
        reasoning: bestPlay.reasoning
      });
      this.player.playCard(bestPlay.card, bestPlay.placement);
    }
  }


  /**
   * Handle NOMINATE_WILD state - should not be reached with unified system
   */
  private handleNominateWild(): void {
    logger.error('AI: NOMINATE_WILD state reached - this indicates an implementation error. Wild cards should be handled in PLAY_CARD phase with unified system.', {
      action: 'nominate_wild',
      difficulty: this.difficulty,
      error: 'unexpected_state'
    });
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
      logger.info(`AI (${difficultyIndicator}): Moving ${bestMove.card.toString()} ${stackInfo} - ${bestMove.reasoning} (value: ${bestMove.value}, type: ${bestMove.type})`, {
        action: 'move_card',
        difficulty: this.difficulty,
        cardId: bestMove.cardId,
        fromStack: bestMove.fromStack.getId(),
        toStack: bestMove.toStack?.getId(),
        value: bestMove.value,
        type: bestMove.type,
        reasoning: bestMove.reasoning
      });
      this.player.moveCard(moveOptions);
    } else {
      logger.warn('AI: No strategic moves found', { action: 'move_card', difficulty: this.difficulty });
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
    logger.info(`AI (${difficultyIndicator}): Game over - ${state.getMessage()}`, {
      action: 'game_over',
      difficulty: this.difficulty,
      message: state.getMessage()
    });
  }
}