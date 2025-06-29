import { Card, Character, BodyPart } from './Card.js';
import { PlayCardOptions } from './Player.js';
import { GameAnalysis, StackProgress } from './GameStateAnalyzer.js';
import { Stack } from './Stack.js';
import { Hand } from './Hand.js';
import { NominationOption } from './WildCardNominator.js';

export interface RegularCardEvaluation {
  card: Card;
  placement: PlayCardOptions;
  value: number;
  reasoning: string;
  type: 'completion' | 'building' | 'blocking' | 'neutral';
}

export interface WildCardPlayOption {
  card: Card;
  placement: PlayCardOptions;
  nomination: NominationOption;
  value: number; // Combined placement + nomination value (for sorting compatibility)
  combinedValue: number; // placement strategic value + nomination strategic value
  placementValue: number;
  nominationValue: number;
  reasoning: string;
  type: 'completion' | 'building' | 'blocking' | 'neutral';
}

export type CardPlayEvaluation = RegularCardEvaluation | WildCardPlayOption;

export function isWildCardPlayOption(evaluation: CardPlayEvaluation): evaluation is WildCardPlayOption {
  return 'nomination' in evaluation;
}

/**
 * Unified card and nomination evaluation system that eliminates coordination blindness
 * between placement and nomination decisions for wild cards.
 */
export class CardPlayEvaluator {
  /**
   * Evaluate all possible plays (placement for regular cards, placement+nomination for wild cards)
   */
  evaluateAllPlays(hand: Card[], gameAnalysis: GameAnalysis, ownStacks: Stack[], opponentStacks: Stack[], myHand: Hand): CardPlayEvaluation[] {
    const evaluations: CardPlayEvaluation[] = [];

    for (const card of hand) {
      if (card.isWild()) {
        // Evaluate all placement+nomination combinations for wild cards
        evaluations.push(...this.evaluateWildCardPlays(card, gameAnalysis, ownStacks, opponentStacks, myHand));
      } else {
        // Evaluate placement only for regular cards
        evaluations.push(...this.evaluateRegularCardPlays(card, gameAnalysis, ownStacks, opponentStacks));
      }
    }

    // Apply wild card conservation penalties where appropriate
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
   * Evaluate all valid placement+nomination combinations for a wild card
   */
  private evaluateWildCardPlays(wildCard: Card, gameAnalysis: GameAnalysis, ownStacks: Stack[], opponentStacks: Stack[], hand: Hand): WildCardPlayOption[] {
    const options: WildCardPlayOption[] = [];
    const validPositions = this.getValidPlacementPositions(wildCard);

    for (const position of validPositions) {
      // Evaluate placement opportunities at this position
      const placementOptions = this.getWildCardPlacementOptions(wildCard, position, gameAnalysis, ownStacks, opponentStacks);
      
      for (const placement of placementOptions) {
        // For each placement, evaluate all valid nominations
        const nominations = this.evaluateNominationsForPosition(wildCard, position, placement.targetStack, gameAnalysis, hand, ownStacks);
        
        for (const nomination of nominations) {
          const combinedValue = placement.value + nomination.value;
          options.push({
            card: wildCard,
            placement: placement.placement,
            nomination,
            value: combinedValue, // For sorting compatibility
            combinedValue,
            placementValue: placement.value,
            nominationValue: nomination.value,
            reasoning: `${placement.reasoning} + ${nomination.reasoning}`,
            type: placement.type
          });
        }
      }
    }

    return options;
  }

  /**
   * Evaluate placement opportunities for regular (non-wild) cards
   */
  private evaluateRegularCardPlays(card: Card, gameAnalysis: GameAnalysis, ownStacks: Stack[], opponentStacks: Stack[]): RegularCardEvaluation[] {
    const evaluations: RegularCardEvaluation[] = [];

    // Find completion moves
    evaluations.push(...this.findCompletionMoves([card], ownStacks, gameAnalysis));
    
    // Find blocking moves
    evaluations.push(...this.findBlockingMoves([card], opponentStacks, gameAnalysis));
    
    // Find building moves
    evaluations.push(...this.findBuildingMoves([card], ownStacks, gameAnalysis));
    
    // Find neutral new stack moves
    evaluations.push(...this.findNeutralMoves([card], gameAnalysis));

    return evaluations;
  }

  /**
   * Get all valid placement positions for a wild card based on its type
   */
  private getValidPlacementPositions(wildCard: Card): BodyPart[] {
    if (!wildCard.isWild()) {
      return [wildCard.bodyPart]; // Regular cards only go in their designated position
    }

    // Character wild cards (e.g., "Ninja Wild") - can be placed in any position
    if (wildCard.character !== Character.Wild && wildCard.bodyPart === BodyPart.Wild) {
      return [BodyPart.Head, BodyPart.Torso, BodyPart.Legs];
    }

    // Position wild cards (e.g., "Wild Head") - can only be placed in matching position
    if (wildCard.character === Character.Wild && wildCard.bodyPart !== BodyPart.Wild) {
      return [wildCard.bodyPart];
    }

    // Universal wild cards (e.g., "Wild Wild") - can be placed in any position
    if (wildCard.character === Character.Wild && wildCard.bodyPart === BodyPart.Wild) {
      return [BodyPart.Head, BodyPart.Torso, BodyPart.Legs];
    }

    return [];
  }

  /**
   * Get placement opportunities for a wild card at a specific position
   */
  private getWildCardPlacementOptions(wildCard: Card, position: BodyPart, gameAnalysis: GameAnalysis, ownStacks: Stack[], opponentStacks: Stack[]): Array<{placement: PlayCardOptions, value: number, reasoning: string, type: 'completion' | 'building' | 'blocking' | 'neutral', targetStack?: Stack}> {
    const options: Array<{placement: PlayCardOptions, value: number, reasoning: string, type: 'completion' | 'building' | 'blocking' | 'neutral', targetStack?: Stack}> = [];

    // Check for completion opportunities at this position
    for (const opportunity of gameAnalysis.completionOpportunities) {
      if (opportunity.neededCard === position) {
        const stack = ownStacks.find(s => s.getId() === opportunity.stackId);
        if (stack) {
          options.push({
            placement: {
              targetStackId: opportunity.stackId,
              targetPile: position
            },
            value: 1000,
            reasoning: `Completes ${opportunity.character} stack`,
            type: 'completion',
            targetStack: stack
          });
        }
      }
    }

    // Check for blocking opportunities at this position
    for (const blockingOp of gameAnalysis.blockingOpportunities) {
      if (blockingOp.targetPile === position) {
        const stack = opponentStacks.find(s => s.getId() === blockingOp.stackId);
        if (stack) {
          const stackProgress = gameAnalysis.opponentProgress.get(blockingOp.character);
          const value = this.calculateBlockingValue(stackProgress, blockingOp.urgency);
          
          options.push({
            placement: {
              targetStackId: blockingOp.stackId,
              targetPile: position
            },
            value,
            reasoning: `Blocks ${blockingOp.character} ${blockingOp.targetPile} (${blockingOp.urgency})`,
            type: 'blocking',
            targetStack: stack
          });
        }
      }
    }

    // Check for building opportunities at this position
    for (const stack of ownStacks) {
      if (this.canPlaceCardInPile(stack, wildCard, position)) {
        const topCards = stack.getTopCards();
        const stackCharacter = this.getStackCharacter(topCards);
        
        if (stackCharacter) {
          const stackProgress = gameAnalysis.ownProgress.get(stackCharacter);
          const value = this.calculateBuildingValue(stackProgress);
          
          options.push({
            placement: {
              targetStackId: stack.getId(),
              targetPile: position
            },
            value,
            reasoning: `Builds ${stackCharacter} ${position} (${stackProgress?.completionLevel}/3 complete)`,
            type: 'building',
            targetStack: stack
          });
        }
      }
    }

    // Always include neutral new stack option
    options.push({
      placement: {
        targetPile: position
      },
      value: this.calculateNewStackValue(wildCard, gameAnalysis),
      reasoning: `Creates new stack`,
      type: 'neutral'
    });

    return options;
  }

  /**
   * Evaluate nominations for a wild card played at a specific position
   */
  private evaluateNominationsForPosition(wildCard: Card, playedPosition: BodyPart, targetStack: Stack | undefined, gameAnalysis: GameAnalysis, hand: Hand, ownStacks: Stack[]): NominationOption[] {
    const options: NominationOption[] = [];
    const validCombinations = this.getValidNominations(wildCard, playedPosition);
    
    for (const { character, bodyPart } of validCombinations) {
      const option = this.evaluateNominationOption(
        character,
        bodyPart,
        wildCard,
        targetStack || null,
        gameAnalysis,
        hand
      );
      options.push(option);
    }
    
    // Sort by value (highest first)
    return options.sort((a, b) => b.value - a.value);
  }

  /**
   * Get valid nomination combinations based on wild card type and played position constraint
   */
  private getValidNominations(wildCard: Card, playedPosition: BodyPart): Array<{ character: Character; bodyPart: BodyPart }> {
    const combinations: Array<{ character: Character; bodyPart: BodyPart }> = [];
    const characters = [Character.Ninja, Character.Pirate, Character.Zombie, Character.Robot];

    // Character wild cards - character is fixed, body part must match played position
    if (wildCard.character !== Character.Wild && wildCard.bodyPart === BodyPart.Wild) {
      combinations.push({ character: wildCard.character, bodyPart: playedPosition });
    }
    // Position wild cards - body part is fixed and must match played position
    else if (wildCard.character === Character.Wild && wildCard.bodyPart !== BodyPart.Wild) {
      if (wildCard.bodyPart === playedPosition) {
        for (const character of characters) {
          combinations.push({ character, bodyPart: wildCard.bodyPart });
        }
      }
    }
    // Universal wild cards - any character, but body part must match played position
    else if (wildCard.character === Character.Wild && wildCard.bodyPart === BodyPart.Wild) {
      for (const character of characters) {
        combinations.push({ character, bodyPart: playedPosition });
      }
    }

    return combinations;
  }

  /**
   * Select the best play from evaluated options
   */
  selectBestPlay(evaluations: CardPlayEvaluation[]): CardPlayEvaluation | null {
    if (evaluations.length === 0) {
      return null;
    }

    // Sort by value (highest first) and return the best play
    const sorted = evaluations.sort((a, b) => b.value - a.value);
    return sorted[0];
  }

  // ========================================
  // Helper methods (preserved from CardSelector and WildCardNominator)
  // ========================================

  private findCompletionMoves(hand: Card[], ownStacks: Stack[], gameAnalysis: GameAnalysis): RegularCardEvaluation[] {
    const evaluations: RegularCardEvaluation[] = [];

    for (const opportunity of gameAnalysis.completionOpportunities) {
      const suitableCards = hand.filter(card => {
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
            value: 1000,
            reasoning: `Completes ${opportunity.character.charAt(0).toUpperCase() + opportunity.character.slice(1)} stack`,
            type: 'completion'
          });
        }
      }
    }

    return evaluations;
  }

  private findBlockingMoves(hand: Card[], opponentStacks: Stack[], gameAnalysis: GameAnalysis): RegularCardEvaluation[] {
    const evaluations: RegularCardEvaluation[] = [];

    for (const blockingOp of gameAnalysis.blockingOpportunities) {
      const suitableCards = hand.filter(card => {
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

  private findBuildingMoves(hand: Card[], ownStacks: Stack[], gameAnalysis: GameAnalysis): RegularCardEvaluation[] {
    const evaluations: RegularCardEvaluation[] = [];

    for (const card of hand) {
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

  private findNeutralMoves(hand: Card[], gameAnalysis: GameAnalysis): RegularCardEvaluation[] {
    const evaluations: RegularCardEvaluation[] = [];

    for (const card of hand) {
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

    return evaluations;
  }

  private shouldSaveWildCard(wildCard: Card, gameAnalysis: GameAnalysis): boolean {
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
      return wildCardsInHand < 2;
    }

    // In late game, use wild cards more liberally
    if (gameAnalysis.gamePhase === 'late') {
      return false;
    }

    // Medium game - conservative approach
    return true;
  }

  private calculateBlockingValue(stackProgress: StackProgress | undefined, urgency: string): number {
    switch (urgency) {
      case 'critical':
        return 800;
      case 'important':
        return 400;
      case 'optional':
        return 200;
      default:
        return 200;
    }
  }

  private calculateBuildingValue(stackProgress: StackProgress | undefined): number {
    if (!stackProgress) {
      return 100;
    }

    if (stackProgress.completionLevel === 2) {
      return 500;
    } else if (stackProgress.completionLevel === 1) {
      return 300;
    } else {
      return 100;
    }
  }

  private calculateNewStackValue(card: Card, gameAnalysis: GameAnalysis): number {
    if (gameAnalysis.gamePhase !== 'late') {
      if ([Character.Ninja, Character.Pirate].includes(card.character)) {
        return 150;
      }
    }

    return 100;
  }

  private canPlaceCardInPile(stack: Stack, card: Card, pile: BodyPart): boolean {
    const topCards = stack.getTopCards();
    
    let existingCard: Card | undefined;
    if (pile === BodyPart.Head) existingCard = topCards.head;
    else if (pile === BodyPart.Torso) existingCard = topCards.torso;
    else if (pile === BodyPart.Legs) existingCard = topCards.legs;
    
    return !existingCard;
  }

  private getStackCharacter(topCards: { head?: Card; torso?: Card; legs?: Card }): Character | null {
    const cards = [topCards.head, topCards.torso, topCards.legs].filter(Boolean) as Card[];
    
    for (const card of cards) {
      const effectiveChar = card.getEffectiveCharacter();
      if (effectiveChar !== Character.Wild) {
        return effectiveChar;
      }
    }

    return null;
  }

  private evaluateNominationOption(
    character: Character,
    bodyPart: BodyPart,
    wildCard: Card,
    targetStack: Stack | null,
    gameAnalysis: GameAnalysis,
    hand: Hand
  ): NominationOption {
    let value = 0;
    let reasoning = '';
    let completesStack = false;
    let enablesFutureCompletion = false;

    // Check for immediate stack completion
    const completionOpp = gameAnalysis.completionOpportunities.find(
      opp => opp.character === character && opp.neededCard === bodyPart
    );
    
    if (completionOpp) {
      value = 1000;
      reasoning = `Completes ${character} stack immediately`;
      completesStack = true;
    } else {
      // Check for critical blocking
      const criticalBlock = gameAnalysis.blockingOpportunities.find(
        block => block.character === character && block.targetPile === bodyPart && block.urgency === 'critical'
      );
      
      if (criticalBlock) {
        value = 800;
        reasoning = `Blocks critical opponent ${character} ${bodyPart}`;
      } else {
        // Check for building toward completion
        const stackProgress = gameAnalysis.ownProgress.get(character);
        if (stackProgress) {
          const progressValue = this.calculateBuildingValueForNomination(stackProgress, bodyPart);
          if (progressValue > 0) {
            value = progressValue;
            reasoning = `Builds toward ${character} completion (${stackProgress.completionLevel}/3)`;
            enablesFutureCompletion = this.willEnableFutureCompletion(character, bodyPart, hand, stackProgress);
          }
        } else {
          // New character start
          value = this.calculateNewCharacterValue(character, hand);
          reasoning = `Starts new ${character} development`;
          enablesFutureCompletion = this.willEnableFutureCompletion(character, bodyPart, hand, null);
        }
      }
    }

    // Apply wild card type bonuses
    const typeBonus = this.getWildCardTypeBonus(wildCard, character, bodyPart);
    value += typeBonus;
    
    if (typeBonus > 0) {
      reasoning += ` (wild card type bonus: +${typeBonus})`;
    }

    return {
      character,
      bodyPart,
      value,
      reasoning,
      completesStack,
      enablesFutureCompletion
    };
  }

  private calculateBuildingValueForNomination(stackProgress: any, bodyPart: BodyPart): number {
    const missingParts = stackProgress.missingPieces || [];
    if (!missingParts.includes(bodyPart)) {
      return 0;
    }

    if (stackProgress.completionLevel === 2) {
      return 500;
    } else if (stackProgress.completionLevel === 1) {
      return 300;
    } else {
      return 100;
    }
  }

  private calculateNewCharacterValue(character: Character, hand: Hand): number {
    const handCards = hand.getCards();
    const supportingCards = handCards.filter(card => 
      !card.isWild() && card.character === character
    ).length;
    
    const baseValue = [Character.Ninja, Character.Pirate].includes(character) ? 150 : 100;
    const supportBonus = supportingCards * 25;
    
    return baseValue + supportBonus;
  }

  private getWildCardTypeBonus(wildCard: Card, character: Character, bodyPart: BodyPart): number {
    if (wildCard.character !== Character.Wild && wildCard.bodyPart === BodyPart.Wild) {
      // Character wild
      return wildCard.character === character ? 50 : 0;
    }
    
    if (wildCard.character === Character.Wild && wildCard.bodyPart !== BodyPart.Wild) {
      // Position wild
      return wildCard.bodyPart === bodyPart ? 50 : 0;
    }
    
    if (wildCard.character === Character.Wild && wildCard.bodyPart === BodyPart.Wild) {
      // Universal wild
      return 25;
    }
    
    return 0;
  }

  private willEnableFutureCompletion(character: Character, bodyPart: BodyPart, hand: Hand, stackProgress: any): boolean {
    const handCards = hand.getCards();
    
    const supportingCards = handCards.filter(card => 
      !card.isWild() && card.character === character
    ).length;
    
    if (stackProgress && stackProgress.completionLevel >= 1 && supportingCards > 0) {
      return true;
    }
    
    if (!stackProgress && supportingCards >= 2) {
      return true;
    }
    
    return false;
  }
}