import { Card, Character, BodyPart } from './Card.js';
import { Stack } from './Stack.js';
import { Hand } from './Hand.js';
import { GameAnalysis } from './GameStateAnalyzer.js';

export interface NominationOption {
  character: Character;
  bodyPart: BodyPart;
  value: number;
  reasoning: string;
  completesStack: boolean;
  enablesFutureCompletion: boolean;
}

export type WildCardType = 'character' | 'position' | 'universal';

export class WildCardNominator {
  /**
   * Evaluate all possible nominations for a wild card played in a specific position
   */
  evaluateNominations(wildCard: Card, targetStack: Stack | null, gameAnalysis: GameAnalysis, hand: Hand, ownStacks: Stack[], playedPosition: BodyPart): NominationOption[] {
    const options: NominationOption[] = [];
    const wildType = this.getWildCardType(wildCard);
    
    // Get all valid nomination combinations based on wild card type and played position
    const validCombinations = this.getValidNominations(wildCard, wildType, playedPosition);
    
    for (const { character, bodyPart } of validCombinations) {
      const option = this.evaluateNominationOption(
        character,
        bodyPart,
        wildCard,
        targetStack,
        gameAnalysis,
        hand
      );
      options.push(option);
    }
    
    // Sort by value (highest first)
    return options.sort((a, b) => b.value - a.value);
  }

  /**
   * Select the best nomination from evaluated options
   */
  selectBestNomination(options: NominationOption[]): NominationOption {
    if (options.length === 0) {
      // Fallback option
      return {
        character: Character.Ninja,
        bodyPart: BodyPart.Head,
        value: 0,
        reasoning: 'Fallback nomination when no options available',
        completesStack: false,
        enablesFutureCompletion: false
      };
    }
    
    return options[0]; // Highest value option
  }

  /**
   * Check if nomination would complete a stack
   */
  considerStackCompletion(wildCard: Card, stack: Stack): boolean {
    if (!stack) return false;
    
    const topCards = stack.getTopCards();
    const pieces = [topCards.head, topCards.torso, topCards.legs].filter(Boolean);
    
    // Need exactly 2 pieces to complete with the wild card (making 3 total)
    return pieces.length === 2;
  }

  /**
   * Find nominations that optimize for future building (with position constraint)
   */
  optimizeForFutureBuilding(wildCard: Card, hand: Hand, stacks: Stack[], playedPosition: BodyPart): NominationOption[] {
    const options: NominationOption[] = [];
    const handCards = hand.getCards();
    
    // Analyze which characters we have the most support for in hand
    const characterSupport = new Map<Character, number>();
    
    for (const card of handCards) {
      if (!card.isWild()) {
        const current = characterSupport.get(card.character) || 0;
        characterSupport.set(card.character, current + 1);
      }
    }
    
    // Find nominations that align with hand composition (constrained by played position)
    for (const [character, count] of characterSupport.entries()) {
      if (count >= 2) { // Good future potential
        // Only consider this character if we can nominate it for the played position
        options.push({
          character,
          bodyPart: playedPosition, // Must match played position
          value: 300 + (count * 50), // Base value + hand support bonus
          reasoning: `Future building potential: ${count} ${character} cards in hand`,
          completesStack: false,
          enablesFutureCompletion: true
        });
      }
    }
    
    return options;
  }

  /**
   * Evaluate a specific nomination option
   */
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
      value = 1000; // Highest priority
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
          const progressValue = this.calculateBuildingValue(stackProgress, bodyPart);
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

  /**
   * Determine the type of wild card
   */
  private getWildCardType(wildCard: Card): WildCardType {
    const isCharacterWild = wildCard.character !== Character.Wild && wildCard.bodyPart === BodyPart.Wild;
    const isPositionWild = wildCard.character === Character.Wild && wildCard.bodyPart !== BodyPart.Wild;
    const isUniversalWild = wildCard.character === Character.Wild && wildCard.bodyPart === BodyPart.Wild;
    
    if (isCharacterWild) return 'character';
    if (isPositionWild) return 'position';
    if (isUniversalWild) return 'universal';
    
    // Shouldn't happen for valid wild cards, but default to universal
    return 'universal';
  }

  /**
   * Get valid nomination combinations based on wild card type and played position constraint
   */
  private getValidNominations(wildCard: Card, wildType: WildCardType, playedPosition: BodyPart): Array<{ character: Character; bodyPart: BodyPart }> {
    const combinations: Array<{ character: Character; bodyPart: BodyPart }> = [];
    const characters = [Character.Ninja, Character.Pirate, Character.Zombie, Character.Robot];

    // If not actually a wild card, return empty array
    if (!wildCard.isWild()) {
      return combinations;
    }

    switch (wildType) {
      case 'character': {
        // Character is fixed, body part must match played position
        const fixedCharacter = wildCard.character;
        // Can only nominate the character for the position where it was played
        combinations.push({ character: fixedCharacter, bodyPart: playedPosition });
        break;
      }
        
      case 'position': {
        // Body part is fixed and must match played position
        const fixedBodyPart = wildCard.bodyPart;
        if (fixedBodyPart === playedPosition) {
          // Position wild matches where it was played - valid for any character
          for (const character of characters) {
            combinations.push({ character, bodyPart: fixedBodyPart });
          }
        }
        // If position wild doesn't match played position, no valid nominations
        break;
      }
        
      case 'universal':
        // Body part must match played position, character can be any
        for (const character of characters) {
          combinations.push({ character, bodyPart: playedPosition });
        }
        break;
    }

    return combinations;
  }

  /**
   * Calculate value for building moves
   */
  private calculateBuildingValue(stackProgress: any, bodyPart: BodyPart): number {
    // Check if this body part is actually missing
    const missingParts = stackProgress.missingPieces || [];
    if (!missingParts.includes(bodyPart)) {
      return 0; // Already have this piece
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
   * Calculate value for starting new characters
   */
  private calculateNewCharacterValue(character: Character, hand: Hand): number {
    const handCards = hand.getCards();
    const supportingCards = handCards.filter(card => 
      !card.isWild() && card.character === character
    ).length;
    
    // Base value for high-value characters
    const baseValue = [Character.Ninja, Character.Pirate].includes(character) ? 150 : 100;
    
    // Bonus for hand support
    const supportBonus = supportingCards * 25;
    
    return baseValue + supportBonus;
  }

  /**
   * Get bonus points based on wild card type optimization
   */
  private getWildCardTypeBonus(wildCard: Card, character: Character, bodyPart: BodyPart): number {
    const wildType = this.getWildCardType(wildCard);
    
    switch (wildType) {
      case 'character':
        // Character wilds are most efficient when used for that character
        return wildCard.character === character ? 50 : 0;
        
      case 'position':
        // Position wilds are most efficient when used for that position
        return wildCard.bodyPart === bodyPart ? 50 : 0;
        
      case 'universal':
        // Universal wilds are most valuable for rare combinations
        return 25; // Always some bonus for flexibility
        
      default:
        return 0;
    }
  }

  /**
   * Find missing body parts for a character across all stacks
   */
  private findMissingPartsForCharacter(character: Character, stacks: Stack[]): BodyPart[] {
    const allParts = [BodyPart.Head, BodyPart.Torso, BodyPart.Legs];
    const existingParts = new Set<BodyPart>();
    
    for (const stack of stacks) {
      const topCards = stack.getTopCards();
      
      // Check if this stack is for the target character
      const stackCharacter = this.getStackCharacter(topCards);
      if (stackCharacter === character) {
        if (topCards.head) existingParts.add(BodyPart.Head);
        if (topCards.torso) existingParts.add(BodyPart.Torso);
        if (topCards.legs) existingParts.add(BodyPart.Legs);
      }
    }
    
    return allParts.filter(part => !existingParts.has(part));
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

  /**
   * Determine if this nomination will enable future completion
   */
  private willEnableFutureCompletion(character: Character, bodyPart: BodyPart, hand: Hand, stackProgress: any): boolean {
    const handCards = hand.getCards();
    
    // Count supporting cards in hand for this character
    const supportingCards = handCards.filter(card => 
      !card.isWild() && card.character === character
    ).length;
    
    // If we have existing progress and cards in hand, this enables future completion
    if (stackProgress && stackProgress.completionLevel >= 1 && supportingCards > 0) {
      return true;
    }
    
    // If starting new character with multiple supporting cards, this enables future completion
    if (!stackProgress && supportingCards >= 2) {
      return true;
    }
    
    return false;
  }
}