import { Card } from '@npzr/core';
import { CardPlayEvaluation } from './CardPlayEvaluator.js';
import { MoveEvaluation } from './MoveEvaluator.js';
import { DisruptionOpportunity } from './GameStateAnalyzer.js';

export interface DifficultyConfig {
  level: 'easy' | 'medium' | 'hard';
  wildCardConservation: number; // 0.0-1.0 (probability of saving wilds)
  disruptionAggression: number; // 0.0-1.0 (likelihood to disrupt opponent)
  mistakeRate: number; // 0.0-0.3 (probability of suboptimal moves)
  cascadeOptimization: boolean; // Whether to optimize multi-move sequences
}

export class DifficultyManager {
  private static readonly EASY_CONFIG: DifficultyConfig = {
    level: 'easy',
    wildCardConservation: 0.2,
    disruptionAggression: 0.1,
    mistakeRate: 0.2,
    cascadeOptimization: false
  };

  private static readonly MEDIUM_CONFIG: DifficultyConfig = {
    level: 'medium',
    wildCardConservation: 0.6,
    disruptionAggression: 0.5,
    mistakeRate: 0.1,
    cascadeOptimization: true
  };

  private static readonly HARD_CONFIG: DifficultyConfig = {
    level: 'hard',
    wildCardConservation: 0.9,
    disruptionAggression: 0.8,
    mistakeRate: 0.02,
    cascadeOptimization: true
  };

  /**
   * Get difficulty configuration for a given level
   */
  getConfig(level: 'easy' | 'medium' | 'hard'): DifficultyConfig {
    switch (level) {
      case 'easy':
        return DifficultyManager.EASY_CONFIG;
      case 'medium':
        return DifficultyManager.MEDIUM_CONFIG;
      case 'hard':
        return DifficultyManager.HARD_CONFIG;
      default:
        throw new Error(`Unknown difficulty level: ${level}`);
    }
  }

  /**
   * Apply difficulty-based modifications to card play evaluations
   */
  applyDifficultyToCardDecision(
    evaluations: CardPlayEvaluation[], 
    config: DifficultyConfig
  ): CardPlayEvaluation[] {
    let modifiedEvaluations = [...evaluations];

    // Filter out wild card plays based on conservation rate
    modifiedEvaluations = this.applyWildCardConservation(modifiedEvaluations, config);

    // Filter disruption plays based on aggression level
    modifiedEvaluations = this.applyDisruptionFilter(modifiedEvaluations, config);

    // Apply mistake rate by potentially selecting suboptimal moves
    if (this.shouldMakeMistake(config)) {
      modifiedEvaluations = this.introduceRandomization(modifiedEvaluations, config);
    }

    return modifiedEvaluations;
  }

  /**
   * Apply difficulty-based modifications to move evaluations
   */
  applyDifficultyToMoveDecision(
    evaluations: MoveEvaluation[], 
    config: DifficultyConfig
  ): MoveEvaluation[] {
    let modifiedEvaluations = [...evaluations];

    // Filter cascade moves based on optimization setting
    if (!config.cascadeOptimization) {
      modifiedEvaluations = modifiedEvaluations.filter(e => e.type !== 'cascade');
    }

    // Filter disruption moves based on aggression level
    modifiedEvaluations = this.applyMoveDisruptionFilter(modifiedEvaluations, config);

    // Apply mistake rate
    if (this.shouldMakeMistake(config)) {
      modifiedEvaluations = this.introduceMoveRandomization(modifiedEvaluations, config);
    }

    return modifiedEvaluations;
  }

  /**
   * Check if AI should make a mistake based on difficulty
   */
  shouldMakeMistake(config: DifficultyConfig): boolean {
    return Math.random() < config.mistakeRate;
  }

  /**
   * Adjust wild card strategy based on conservation rate
   */
  adjustWildCardStrategy(wildCards: Card[], config: DifficultyConfig): Card[] {
    // For easy difficulty, allow all wild cards to be played
    if (config.level === 'easy') {
      return wildCards;
    }

    // For medium/hard, apply conservation logic
    const shouldConserve = Math.random() < config.wildCardConservation;
    if (shouldConserve && wildCards.length > 1) {
      // Keep some wild cards for later
      return wildCards.slice(0, Math.max(1, Math.floor(wildCards.length * 0.5)));
    }

    return wildCards;
  }

  /**
   * Adjust disruption opportunities based on aggression level
   */
  adjustDisruptionStrategy(
    opportunities: DisruptionOpportunity[], 
    config: DifficultyConfig
  ): DisruptionOpportunity[] {
    // Filter opportunities based on aggression level
    const shouldDisrupt = Math.random() < config.disruptionAggression;
    
    if (!shouldDisrupt) {
      return [];
    }

    // For easy difficulty, only consider critical disruptions
    if (config.level === 'easy') {
      return opportunities.filter(opp => opp.urgency === 'critical');
    }

    // For medium difficulty, consider critical and important
    if (config.level === 'medium') {
      return opportunities.filter(opp => 
        opp.urgency === 'critical' || opp.urgency === 'important'
      );
    }

    // For hard difficulty, consider all disruptions
    return opportunities;
  }

  /**
   * Filter wild card plays based on conservation settings
   */
  private applyWildCardConservation(
    evaluations: CardPlayEvaluation[],
    config: DifficultyConfig
  ): CardPlayEvaluation[] {
    if (config.level === 'easy') {
      return evaluations; // Easy mode uses wild cards freely
    }

    const wildCardPlays = evaluations.filter(e => e.card.isWild());
    const regularPlays = evaluations.filter(e => !e.card.isWild());

    // Apply conservation logic - sometimes skip wild card plays
    const shouldConserveWilds = Math.random() < config.wildCardConservation;
    
    if (shouldConserveWilds && regularPlays.length > 0) {
      // Skip wild cards if we have good regular card options
      const bestRegularValue = Math.max(...regularPlays.map(p => p.value));
      const filteredWildPlays = wildCardPlays.filter(p => p.value > bestRegularValue * 1.5);
      return [...regularPlays, ...filteredWildPlays];
    }

    return evaluations;
  }

  /**
   * Filter disruption plays based on aggression level
   */
  private applyDisruptionFilter(
    evaluations: CardPlayEvaluation[],
    config: DifficultyConfig
  ): CardPlayEvaluation[] {
    const nonDisruptionPlays = evaluations.filter(e => e.type !== 'disruption');

    const shouldDisrupt = Math.random() < config.disruptionAggression;
    
    if (!shouldDisrupt) {
      return nonDisruptionPlays;
    }

    return evaluations;
  }

  /**
   * Filter move disruptions based on aggression level
   */
  private applyMoveDisruptionFilter(
    evaluations: MoveEvaluation[],
    config: DifficultyConfig
  ): MoveEvaluation[] {
    const nonDisruptionMoves = evaluations.filter(e => e.type !== 'disruption');

    const shouldDisrupt = Math.random() < config.disruptionAggression;
    
    if (!shouldDisrupt) {
      return nonDisruptionMoves;
    }

    return evaluations;
  }

  /**
   * Introduce randomization for mistakes in card play
   */
  private introduceRandomization(
    evaluations: CardPlayEvaluation[],
    config: DifficultyConfig
  ): CardPlayEvaluation[] {
    if (evaluations.length === 0) return evaluations;

    // For easy difficulty, sometimes pick from top 3 instead of best
    if (config.level === 'easy') {
      const topMoves = evaluations.slice(0, Math.min(3, evaluations.length));
      return [topMoves[Math.floor(Math.random() * topMoves.length)], ...evaluations.slice(1)];
    }

    // For medium difficulty, occasionally pick second best
    if (config.level === 'medium' && evaluations.length > 1) {
      if (Math.random() < 0.3) { // 30% chance to pick second best
        return [evaluations[1], evaluations[0], ...evaluations.slice(2)];
      }
    }

    return evaluations;
  }

  /**
   * Introduce randomization for mistakes in move decisions
   */
  private introduceMoveRandomization(
    evaluations: MoveEvaluation[],
    config: DifficultyConfig
  ): MoveEvaluation[] {
    if (evaluations.length === 0) return evaluations;

    // Similar logic to card randomization
    if (config.level === 'easy') {
      const topMoves = evaluations.slice(0, Math.min(3, evaluations.length));
      return [topMoves[Math.floor(Math.random() * topMoves.length)], ...evaluations.slice(1)];
    }

    if (config.level === 'medium' && evaluations.length > 1) {
      if (Math.random() < 0.3) {
        return [evaluations[1], evaluations[0], ...evaluations.slice(2)];
      }
    }

    return evaluations;
  }
}