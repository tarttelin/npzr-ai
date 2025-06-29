import { Card, Character, BodyPart } from './Card.js';
import { PlayCardOptions } from './Player.js';
import { GameAnalysis, StackProgress } from './GameStateAnalyzer.js';
import { Stack } from './Stack.js';

export interface CardEvaluation {
  card: Card;
  placement: PlayCardOptions;
  value: number; // Higher = better move
  reasoning: string; // For debugging
  type: 'completion' | 'building' | 'blocking' | 'neutral';
}

export class CardSelector {
  /**
   * Evaluate all possible moves and return them sorted by value (highest first)
   */
  evaluateAllMoves(hand: Card[], gameAnalysis: GameAnalysis, ownStacks: Stack[], opponentStacks: Stack[]): CardEvaluation[] {
    const evaluations: CardEvaluation[] = [];

    for (const card of hand) {
      // Find completion moves
      evaluations.push(...this.findCompletionMoves([card], ownStacks, gameAnalysis));
      
      // Find blocking moves
      evaluations.push(...this.findBlockingMoves([card], opponentStacks, gameAnalysis));
      
      // Find building moves
      evaluations.push(...this.findBuildingMoves([card], ownStacks, gameAnalysis));
      
      // Find neutral new stack moves
      evaluations.push(...this.findNeutralMoves([card], gameAnalysis));
    }

    // Apply wild card conservation penalties
    for (const evaluation of evaluations) {
      if (evaluation.card.isWild() && this.shouldSaveWildCard(evaluation.card, gameAnalysis)) {
        evaluation.value -= 500; // Wild card misuse penalty
        evaluation.reasoning += " (wild card conservation penalty applied)";
      }
    }

    // Sort by value (highest first)
    return evaluations.sort((a, b) => b.value - a.value);
  }

  /**
   * Find moves that complete own characters
   */
  findCompletionMoves(hand: Card[], ownStacks: Stack[], gameAnalysis: GameAnalysis): CardEvaluation[] {
    const evaluations: CardEvaluation[] = [];

    for (const opportunity of gameAnalysis.completionOpportunities) {
      const suitableCards = hand.filter(card => {
        if (card.isWild()) {
          return true; // Wild cards can complete anything
        }
        return card.character === opportunity.character && card.bodyPart === opportunity.neededCard;
      });

      for (const card of suitableCards) {
        const stack = ownStacks.find(s => s.getId() === opportunity.stackId);
        if (stack) {
          evaluations.push({
            card,
            placement: {
              targetStackId: opportunity.stackId,
              targetPile: opportunity.neededCard
            },
            value: 1000, // Stack completion - highest priority
            reasoning: `Completes ${opportunity.character.charAt(0).toUpperCase() + opportunity.character.slice(1)} stack`,
            type: 'completion'
          });
        }
      }
    }

    return evaluations;
  }

  /**
   * Find moves that block opponent critical completions
   */
  findBlockingMoves(hand: Card[], opponentStacks: Stack[], gameAnalysis: GameAnalysis): CardEvaluation[] {
    const evaluations: CardEvaluation[] = [];

    for (const blockingOp of gameAnalysis.blockingOpportunities) {
      const suitableCards = hand.filter(card => {
        if (card.isWild()) {
          return true; // Wild cards can block anything
        }
        return card.bodyPart === blockingOp.targetPile;
      });

      for (const card of suitableCards) {
        const stack = opponentStacks.find(s => s.getId() === blockingOp.stackId);
        if (stack) {
          const stackProgress = gameAnalysis.opponentProgress.get(blockingOp.character);
          const value = this.calculateBlockingValue(stackProgress, blockingOp.urgency);
          
          evaluations.push({
            card,
            placement: {
              targetStackId: blockingOp.stackId,
              targetPile: blockingOp.targetPile
            },
            value,
            reasoning: `Blocks ${blockingOp.character.charAt(0).toUpperCase() + blockingOp.character.slice(1)} ${blockingOp.targetPile} (${blockingOp.urgency})`,
            type: 'blocking'
          });
        }
      }
    }

    return evaluations;
  }

  /**
   * Find moves that build toward character completions
   */
  findBuildingMoves(hand: Card[], ownStacks: Stack[], gameAnalysis: GameAnalysis): CardEvaluation[] {
    const evaluations: CardEvaluation[] = [];

    for (const card of hand) {
      if (card.isWild()) {
        continue; // Handle wild cards separately
      }

      // Look for existing stacks that match this card's character
      for (const stack of ownStacks) {
        const topCards = stack.getTopCards();
        const stackCharacter = this.getStackCharacter(topCards);
        
        if (stackCharacter === card.character) {
          // Check if we can place this card in the appropriate pile
          const canPlace = this.canPlaceCardInPile(stack, card, card.bodyPart);
          if (canPlace) {
            const stackProgress = gameAnalysis.ownProgress.get(card.character);
            const value = this.calculateBuildingValue(stackProgress);
            
            evaluations.push({
              card,
              placement: {
                targetStackId: stack.getId(),
                targetPile: card.bodyPart
              },
              value,
              reasoning: `Builds ${card.character.charAt(0).toUpperCase() + card.character.slice(1)} ${card.bodyPart} (${stackProgress?.completionLevel}/3 complete)`,
              type: 'building'
            });
          }
        }
      }
    }

    return evaluations;
  }

  /**
   * Find neutral moves (new stack creation)
   */
  findNeutralMoves(hand: Card[], gameAnalysis: GameAnalysis): CardEvaluation[] {
    const evaluations: CardEvaluation[] = [];

    for (const card of hand) {
      if (card.isWild()) {
        // Wild cards can be placed as new stacks with default nomination
        evaluations.push({
          card,
          placement: {
            targetPile: BodyPart.Head // Default placement for wild cards
          },
          value: this.calculateNewStackValue(card, gameAnalysis),
          reasoning: `Creates new stack with wild card`,
          type: 'neutral'
        });
      } else {
        // New stack placement for regular cards
        evaluations.push({
          card,
          placement: {
            targetPile: card.bodyPart
          },
          value: this.calculateNewStackValue(card, gameAnalysis),
          reasoning: `Creates new ${card.character.charAt(0).toUpperCase() + card.character.slice(1)} stack`,
          type: 'neutral'
        });
      }
    }

    return evaluations;
  }

  /**
   * Determine if a wild card should be saved for later
   */
  shouldSaveWildCard(wildCard: Card, gameAnalysis: GameAnalysis): boolean {
    // Never save wild cards if we have completion opportunities
    if (gameAnalysis.completionOpportunities.length > 0) {
      return false;
    }

    // Never save wild cards if opponent has critical threats
    const criticalThreats = gameAnalysis.blockingOpportunities.filter(op => op.urgency === 'critical');
    if (criticalThreats.length > 0) {
      return false;
    }

    // Save wild cards in early game unless we have many
    if (gameAnalysis.gamePhase === 'early') {
      const wildCardsInHand = gameAnalysis.ownWildCards?.filter(card => card.isWild()).length || 0;
      return wildCardsInHand < 2; // Save if we have less than 2 wild cards
    }

    // In late game, use wild cards more liberally
    if (gameAnalysis.gamePhase === 'late') {
      return false;
    }

    // Medium game - conservative approach
    return true;
  }

  /**
   * Select the best move from evaluated options
   */
  selectBestMove(evaluations: CardEvaluation[]): CardEvaluation | null {
    if (evaluations.length === 0) {
      return null;
    }

    // Sort by value (highest first) and return the best move
    const sorted = evaluations.sort((a, b) => b.value - a.value);
    return sorted[0];
  }

  /**
   * Calculate value for blocking moves based on opponent progress
   */
  private calculateBlockingValue(stackProgress: StackProgress | undefined, urgency: string): number {
    // Urgency is more important than stack progress for blocking value
    switch (urgency) {
      case 'critical':
        return 800; // Block opponent near completion
      case 'important':
        return 400; // Block opponent moderate progress
      case 'optional':
        return 200; // Preventive blocking
      default:
        return 200;
    }
  }

  /**
   * Calculate value for building moves based on stack progress
   */
  private calculateBuildingValue(stackProgress: StackProgress | undefined): number {
    if (!stackProgress) {
      return 100; // Default building value
    }

    if (stackProgress.completionLevel === 2) {
      return 500; // 2/3 completion - high value
    } else if (stackProgress.completionLevel === 1) {
      return 300; // 1/3 completion - medium value
    } else {
      return 100; // Foundation building
    }
  }

  /**
   * Calculate value for new stack creation
   */
  private calculateNewStackValue(card: Card, gameAnalysis: GameAnalysis): number {
    // Prioritize high-value characters in early/mid game
    if (gameAnalysis.gamePhase !== 'late') {
      if ([Character.Ninja, Character.Pirate].includes(card.character)) {
        return 150; // High-value character
      }
    }

    return 100; // Standard new stack value
  }

  /**
   * Check if a card can be placed in a specific pile of a stack
   */
  private canPlaceCardInPile(stack: Stack, card: Card, pile: BodyPart): boolean {
    const topCards = stack.getTopCards();
    
    // Check if the pile already has a card
    let existingCard: Card | undefined;
    if (pile === BodyPart.Head) existingCard = topCards.head;
    else if (pile === BodyPart.Torso) existingCard = topCards.torso;
    else if (pile === BodyPart.Legs) existingCard = topCards.legs;
    
    return !existingCard; // Can only place if pile is empty
  }

  /**
   * Determine the character type of a stack based on its top cards
   */
  private getStackCharacter(topCards: { head?: Card; torso?: Card; legs?: Card }): Character | null {
    // Check each card for effective character
    const cards = [topCards.head, topCards.torso, topCards.legs].filter(Boolean) as Card[];
    
    for (const card of cards) {
      const effectiveChar = card.getEffectiveCharacter();
      if (effectiveChar !== Character.Wild) {
        return effectiveChar;
      }
    }

    return null; // No clear character type
  }
}