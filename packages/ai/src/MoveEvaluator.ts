import { Card, Character, BodyPart, Stack } from '@npzr/core';
import { GameAnalysis } from './GameStateAnalyzer.js';

export interface MoveEvaluation {
  fromStack: Stack;
  fromPile: BodyPart;
  toStack: Stack | null; // null means create new stack
  toPile: BodyPart;
  cardId: string;
  card: Card;
  value: number;
  reasoning: string;
  createsCascade: boolean;
  completesStack: boolean;
  disruptsOpponent: boolean;
  type: 'completion' | 'cascade' | 'disruption' | 'setup' | 'organization' | 'neutral';
}

export class MoveEvaluator {
  /**
   * Evaluate all possible moves and return them sorted by strategic value
   */
  evaluateAllMoves(
    ownStacks: Stack[], 
    opponentStacks: Stack[], 
    analysis: GameAnalysis
  ): MoveEvaluation[] {
    const evaluations: MoveEvaluation[] = [];
    const allStacks = [...ownStacks, ...opponentStacks];

    // First, add high-priority strategic moves
    
    // 1. Cascade opportunities (highest priority - completing stacks with chain potential)
    const cascadeOpportunities = this.findCascadeOpportunities(ownStacks, analysis);
    evaluations.push(...cascadeOpportunities);
    
    // 2. Disruption moves (steal opponent pieces strategically)
    const disruptionMoves = this.findDisruptionMoves(ownStacks, opponentStacks, analysis);
    evaluations.push(...disruptionMoves);
    
    // 3. Organization moves (consolidate matching characters)
    const organizationMoves = this.optimizeStackOrganization(ownStacks);
    evaluations.push(...organizationMoves);

    // Then, evaluate all other possible moves
    for (const fromStack of allStacks) {
      for (const fromPile of [BodyPart.Head, BodyPart.Torso, BodyPart.Legs]) {
        const cards = fromStack.getCardsFromPile(fromPile);
        if (cards.length === 0) continue;

        const topCard = cards[cards.length - 1];
        
        // Evaluate moves to existing stacks
        for (const toStack of allStacks) {
          if (toStack.getId() === fromStack.getId()) continue;
          
          for (const toPile of [BodyPart.Head, BodyPart.Torso, BodyPart.Legs]) {
            if (toStack.canAcceptCard(topCard, toPile)) {
              // Skip if this move is already covered by specialized analysis
              const isDuplicate = evaluations.some(existing => 
                existing.cardId === topCard.id && 
                existing.fromStack.getId() === fromStack.getId() &&
                existing.toStack?.getId() === toStack.getId() &&
                existing.fromPile === fromPile &&
                existing.toPile === toPile
              );
              
              if (!isDuplicate) {
                const evaluation = this.evaluateMove(
                  fromStack, fromPile, toStack, toPile, topCard, analysis, ownStacks, opponentStacks
                );
                evaluations.push(evaluation);
              }
            }
          }
        }

        // Evaluate creating new stack (only for own pieces)
        if (ownStacks.includes(fromStack)) {
          // Skip if this new stack move is already covered by specialized analysis
          const isDuplicate = evaluations.some(existing => 
            existing.cardId === topCard.id && 
            existing.fromStack.getId() === fromStack.getId() &&
            existing.toStack === null &&
            existing.fromPile === fromPile
          );
          
          if (!isDuplicate) {
            const newStackEvaluation = this.evaluateNewStackMove(
              fromStack, fromPile, topCard, analysis, ownStacks, opponentStacks
            );
            evaluations.push(newStackEvaluation);
          }
        }
      }
    }

    // Sort by value (highest first)
    return evaluations.sort((a, b) => b.value - a.value);
  }

  /**
   * Find cascade opportunities - moves that complete stacks and earn additional moves
   */
  findCascadeOpportunities(ownStacks: Stack[], analysis: GameAnalysis): MoveEvaluation[] {
    const cascadeOpportunities: MoveEvaluation[] = [];
    
    // Find completion opportunities for moves (not just hand-based ones)
    const moveCompletionOpportunities = this.findMoveCompletionOpportunities(ownStacks);
    
    // Look for completion opportunities that might cascade
    for (const opportunity of moveCompletionOpportunities) {
      const targetStack = ownStacks.find(s => s.getId() === opportunity.stackId);
      if (!targetStack) continue;

      // Find cards that can complete this stack
      for (const fromStack of ownStacks) {
        if (fromStack.getId() === targetStack.getId()) continue; // Don't move from same stack
        
        const cards = fromStack.getCardsFromPile(opportunity.neededCard);
        if (cards.length === 0) continue;

        const topCard = cards[cards.length - 1];
        if (this.cardMatchesRequirement(topCard, opportunity.character, opportunity.neededCard)) {
          if (targetStack.canAcceptCard(topCard, opportunity.neededCard)) {
            // Calculate cascade potential - how many additional completions this might enable
            const cascadePotential = this.calculateCascadePotential(fromStack, topCard, ownStacks, analysis);
            const baseValue = 1500;
            const cascadeBonus = cascadePotential * 500; // Bonus for each additional completion possible
            
            const evaluation: MoveEvaluation = {
              fromStack,
              fromPile: opportunity.neededCard,
              toStack: targetStack,
              toPile: opportunity.neededCard,
              cardId: topCard.id,
              card: topCard,
              value: baseValue + cascadeBonus,
              reasoning: `Complete ${opportunity.character} stack for cascade opportunity${cascadePotential > 0 ? ` (potential ${cascadePotential} additional completions)` : ''}`,
              createsCascade: true,
              completesStack: true,
              disruptsOpponent: false,
              type: 'cascade'
            };
            cascadeOpportunities.push(evaluation);
          }
        }
      }
    }

    return cascadeOpportunities;
  }

  /**
   * Find completion opportunities for moves - stacks that are 2/3 complete
   */
  private findMoveCompletionOpportunities(ownStacks: Stack[]): Array<{stackId: string, character: Character, neededCard: BodyPart}> {
    const opportunities: Array<{stackId: string, character: Character, neededCard: BodyPart}> = [];
    
    for (const stack of ownStacks) {
      const topCards = stack.getTopCards();
      const character = this.determineStackCharacter(topCards);
      
      if (character && character !== Character.Wild) {
        // Count pieces present
        const pieces = {
          head: topCards.head ? 1 : 0,
          torso: topCards.torso ? 1 : 0,
          legs: topCards.legs ? 1 : 0
        };
        
        const totalPieces = pieces.head + pieces.torso + pieces.legs;
        
        // If stack has exactly 2 pieces (2/3 complete), find the missing piece
        if (totalPieces === 2) {
          let neededCard: BodyPart;
          if (!topCards.head) neededCard = BodyPart.Head;
          else if (!topCards.torso) neededCard = BodyPart.Torso;
          else neededCard = BodyPart.Legs;
          
          opportunities.push({
            stackId: stack.getId(),
            character,
            neededCard
          });
        }
      }
    }
    
    return opportunities;
  }

  /**
   * Determine the character of a stack based on its top cards
   */
  private determineStackCharacter(topCards: {head?: Card, torso?: Card, legs?: Card}): Character | null {
    const cards = [topCards.head, topCards.torso, topCards.legs].filter(Boolean) as Card[];
    if (cards.length === 0) return null;
    
    // Count effective characters (considering wild card nominations)
    const charCounts = new Map<Character, number>();
    
    for (const card of cards) {
      const effectiveChar = this.getEffectiveCharacter(card);
      if (effectiveChar) {
        charCounts.set(effectiveChar, (charCounts.get(effectiveChar) || 0) + 1);
      }
    }
    
    if (charCounts.size === 0) return null;
    
    // Return the most common character
    let dominantChar: Character | null = null;
    let maxCount = 0;
    
    for (const [char, count] of charCounts) {
      if (count > maxCount) {
        maxCount = count;
        dominantChar = char;
      }
    }
    
    return dominantChar;
  }

  /**
   * Calculate how many additional completions might be possible after this move
   */
  private calculateCascadePotential(fromStack: Stack, movingCard: Card, ownStacks: Stack[], _analysis: GameAnalysis): number {
    let potential = 0;
    
    // After moving this card, check if the fromStack becomes completable
    if (fromStack.getCardsFromPile(BodyPart.Head).length > 0 || 
        fromStack.getCardsFromPile(BodyPart.Torso).length > 0 || 
        fromStack.getCardsFromPile(BodyPart.Legs).length > 0) {
      
      // Simulate the stack after card removal
      const remainingPieces = this.getStackPiecesAfterRemoval(fromStack, movingCard);
      
      // Check if this stack could be completed with available pieces
      if (this.canStackBeCompleted(remainingPieces, ownStacks)) {
        potential++;
      }
    }

    // Check if any other near-complete stacks could benefit from the reorganization
    for (const stack of ownStacks) {
      if (stack.getId() === fromStack.getId()) continue;
      
      const progress = this.calculateStackProgress(stack);
      if (progress === 2) { // Stack is 2/3 complete
        // Check if any piece from fromStack (after the move) could complete this stack
        const pieces = this.getAllMovablePieces(fromStack, movingCard);
        for (const piece of pieces) {
          if (this.wouldCompleteStackWithPiece(stack, piece)) {
            potential++;
            break; // Only count once per stack
          }
        }
      }
    }

    return Math.min(potential, 2); // Cap at 2 additional cascades for reasonable evaluation
  }

  /**
   * Get all pieces that would be movable from a stack after removing one specific card
   */
  private getAllMovablePieces(stack: Stack, excludeCard: Card): Card[] {
    const pieces: Card[] = [];
    
    for (const pile of [BodyPart.Head, BodyPart.Torso, BodyPart.Legs]) {
      const cards = stack.getCardsFromPile(pile);
      if (cards.length > 0) {
        const topCard = cards[cards.length - 1];
        if (topCard.id !== excludeCard.id) {
          pieces.push(topCard);
        } else if (cards.length > 1) {
          // If we're removing the top card, the next card becomes available
          pieces.push(cards[cards.length - 2]);
        }
      }
    }
    
    return pieces;
  }

  /**
   * Check if a stack can be completed using available pieces from own stacks
   */
  private canStackBeCompleted(stackPieces: { head?: Card; torso?: Card; legs?: Card }, ownStacks: Stack[]): boolean {
    const missing: BodyPart[] = [];
    if (!stackPieces.head) missing.push(BodyPart.Head);
    if (!stackPieces.torso) missing.push(BodyPart.Torso);
    if (!stackPieces.legs) missing.push(BodyPart.Legs);

    if (missing.length === 0) return true; // Already complete
    if (missing.length > 2) return false; // Too many missing pieces

    // Get the dominant character of the stack
    const existingPieces = [stackPieces.head, stackPieces.torso, stackPieces.legs].filter(Boolean) as Card[];
    if (existingPieces.length === 0) return false;

    const dominantChar = this.getEffectiveCharacter(existingPieces[0]);
    if (!dominantChar) return false;

    // Check if we have the missing pieces available
    for (const missingPart of missing) {
      let found = false;
      for (const stack of ownStacks) {
        const cards = stack.getCardsFromPile(missingPart);
        if (cards.length > 0) {
          const topCard = cards[cards.length - 1];
          const effectiveChar = this.getEffectiveCharacter(topCard);
          if (effectiveChar === dominantChar || topCard.isWild()) {
            found = true;
            break;
          }
        }
      }
      if (!found) return false;
    }

    return true;
  }

  /**
   * Get the pieces of a stack after removing a specific card
   */
  private getStackPiecesAfterRemoval(stack: Stack, removedCard: Card): { head?: Card; torso?: Card; legs?: Card } {
    const result: { head?: Card; torso?: Card; legs?: Card } = {};
    
    for (const pile of [BodyPart.Head, BodyPart.Torso, BodyPart.Legs]) {
      const cards = stack.getCardsFromPile(pile);
      if (cards.length > 0) {
        const topCard = cards[cards.length - 1];
        if (topCard.id !== removedCard.id) {
          if (pile === BodyPart.Head) result.head = topCard;
          if (pile === BodyPart.Torso) result.torso = topCard;
          if (pile === BodyPart.Legs) result.legs = topCard;
        } else if (cards.length > 1) {
          // If we're removing the top card, the next card becomes the top
          const nextCard = cards[cards.length - 2];
          if (pile === BodyPart.Head) result.head = nextCard;
          if (pile === BodyPart.Torso) result.torso = nextCard;
          if (pile === BodyPart.Legs) result.legs = nextCard;
        }
      }
    }
    
    return result;
  }

  /**
   * Check if a specific piece would complete a stack
   */
  private wouldCompleteStackWithPiece(stack: Stack, piece: Card): boolean {
    for (const pile of [BodyPart.Head, BodyPart.Torso, BodyPart.Legs]) {
      if (stack.canAcceptCard(piece, pile)) {
        if (this.wouldCompleteStack(stack, piece, pile)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Find disruption moves - stealing opponent pieces
   */
  findDisruptionMoves(
    ownStacks: Stack[], 
    opponentStacks: Stack[], 
    analysis: GameAnalysis
  ): MoveEvaluation[] {
    const disruptionMoves: MoveEvaluation[] = [];

    // Priority disruption: steal pieces from opponent stacks
    for (const opponentStack of opponentStacks) {
      for (const pile of [BodyPart.Head, BodyPart.Torso, BodyPart.Legs]) {
        const cards = opponentStack.getCardsFromPile(pile);
        if (cards.length === 0) continue;

        const topCard = cards[cards.length - 1];
        
        // Try to move this opponent piece to our stacks
        for (const ownStack of ownStacks) {
          for (const toPile of [BodyPart.Head, BodyPart.Torso, BodyPart.Legs]) {
            if (ownStack.canAcceptCard(topCard, toPile)) {
              const value = this.calculateDisruptionValue(
                opponentStack, pile, ownStack, toPile, topCard, analysis
              );
              
              const evaluation: MoveEvaluation = {
                fromStack: opponentStack,
                fromPile: pile,
                toStack: ownStack,
                toPile: toPile,
                cardId: topCard.id,
                card: topCard,
                value,
                reasoning: `Steal ${topCard.toString()} from opponent and add to own stack`,
                createsCascade: false,
                completesStack: this.wouldCompleteStack(ownStack, topCard, toPile),
                disruptsOpponent: true,
                type: 'disruption'
              };
              disruptionMoves.push(evaluation);
            }
          }
        }

        // Also consider creating new stack with stolen piece
        const newStackValue = this.calculateNewStackDisruptionValue(topCard, opponentStack, pile);
        const newStackEvaluation: MoveEvaluation = {
          fromStack: opponentStack,
          fromPile: pile,
          toStack: null,
          toPile: topCard.bodyPart !== BodyPart.Wild ? topCard.bodyPart : BodyPart.Head,
          cardId: topCard.id,
          card: topCard,
          value: newStackValue,
          reasoning: `Steal ${topCard.toString()} from opponent and start new stack`,
          createsCascade: false,
          completesStack: false,
          disruptsOpponent: true,
          type: 'disruption'
        };
        disruptionMoves.push(newStackEvaluation);
      }
    }

    return disruptionMoves;
  }

  /**
   * Optimize stack organization - consolidate characters
   */
  optimizeStackOrganization(ownStacks: Stack[]): MoveEvaluation[] {
    const organizationMoves: MoveEvaluation[] = [];

    // Look for opportunities to consolidate matching characters
    for (let i = 0; i < ownStacks.length; i++) {
      for (let j = i + 1; j < ownStacks.length; j++) {
        const stackA = ownStacks[i];
        const stackB = ownStacks[j];
        
        // Try to consolidate matching characters
        const moves = this.findConsolidationMoves(stackA, stackB);
        organizationMoves.push(...moves);
      }
    }

    return organizationMoves;
  }

  /**
   * Select the best move from evaluations
   */
  selectBestMove(evaluations: MoveEvaluation[]): MoveEvaluation | null {
    if (evaluations.length === 0) return null;
    
    // Already sorted by value, return highest
    return evaluations[0];
  }

  /**
   * Evaluate a specific move
   */
  private evaluateMove(
    fromStack: Stack,
    fromPile: BodyPart,
    toStack: Stack,
    toPile: BodyPart,
    card: Card,
    analysis: GameAnalysis,
    ownStacks: Stack[],
    opponentStacks: Stack[]
  ): MoveEvaluation {
    let value = 0;
    let reasoning = '';
    let type: MoveEvaluation['type'] = 'neutral';
    let completesStack = false;
    let createsCascade = false;
    let disruptsOpponent = false;

    // Check if this move completes a stack
    if (this.wouldCompleteStack(toStack, card, toPile)) {
      completesStack = true;
      createsCascade = true;
      value += 1000;
      reasoning = `Complete ${this.getStackDominantCharacter(toStack)} stack`;
      type = 'completion';
    }

    // Check if this disrupts opponent
    if (opponentStacks.includes(fromStack)) {
      disruptsOpponent = true;
      value += 400;
      reasoning += (reasoning ? ' + ' : '') + 'Steal opponent piece';
      if (type === 'neutral') type = 'disruption';
    }

    // Check if this helps own stack progress
    if (ownStacks.includes(toStack)) {
      const progress = this.calculateStackProgress(toStack);
      value += progress * 100;
      reasoning += (reasoning ? ' + ' : '') + `Build toward completion (${progress}/3)`;
      if (type === 'neutral') type = 'setup';
    }

    // Bonus for matching characters
    const toStackCharacter = this.getStackDominantCharacter(toStack);
    if (toStackCharacter && (card.character === toStackCharacter || card.isWild())) {
      value += 50;
      reasoning += (reasoning ? ' + ' : '') + 'Matching character';
    }

    return {
      fromStack,
      fromPile,
      toStack,
      toPile,
      cardId: card.id,
      card,
      value,
      reasoning: reasoning || 'Basic move',
      createsCascade,
      completesStack,
      disruptsOpponent,
      type
    };
  }

  /**
   * Evaluate creating a new stack with the card
   */
  private evaluateNewStackMove(
    fromStack: Stack,
    fromPile: BodyPart,
    card: Card,
    analysis: GameAnalysis,
    ownStacks: Stack[],
    opponentStacks: Stack[]
  ): MoveEvaluation {
    let value = 150; // Base value for new stack creation
    let reasoning = 'Create new stack';
    
    // Higher value if this helps organization
    if (ownStacks.includes(fromStack)) {
      const fromStackCharacter = this.getStackDominantCharacter(fromStack);
      if (fromStackCharacter && card.character !== fromStackCharacter && !card.isWild()) {
        value += 100;
        reasoning += ' for better organization';
      }
    }

    // Bonus if we have more matching pieces for this character
    if (!card.isWild()) {
      const matchingPieces = this.countMatchingPieces(card.character, ownStacks);
      value += matchingPieces * 25;
      reasoning += ` (${matchingPieces} matching pieces available)`;
    }

    const targetPile = card.bodyPart !== BodyPart.Wild ? card.bodyPart : BodyPart.Head;

    return {
      fromStack,
      fromPile,
      toStack: null,
      toPile: targetPile,
      cardId: card.id,
      card,
      value,
      reasoning,
      createsCascade: false,
      completesStack: false,
      disruptsOpponent: opponentStacks.includes(fromStack),
      type: 'organization'
    };
  }

  /**
   * Calculate disruption value for stealing opponent pieces
   */
  private calculateDisruptionValue(
    opponentStack: Stack,
    pile: BodyPart,
    ownStack: Stack,
    toPile: BodyPart,
    card: Card,
    _analysis: GameAnalysis
  ): number {
    let value = 400; // Base disruption value

    // Higher value if opponent stack is near completion
    const opponentProgress = this.calculateStackProgress(opponentStack);
    value += opponentProgress * 200;

    // Higher value if this helps complete our own stack
    if (this.wouldCompleteStack(ownStack, card, toPile)) {
      value += 600; // Double benefit: disrupt + complete
    }

    // Higher value if this matches our stack's character
    const ownStackCharacter = this.getStackDominantCharacter(ownStack);
    if (ownStackCharacter && (card.character === ownStackCharacter || card.isWild())) {
      value += 150;
    }

    return value;
  }

  /**
   * Calculate value for creating new stack with stolen piece
   */
  private calculateNewStackDisruptionValue(card: Card, opponentStack: Stack, _pile: BodyPart): number {
    let value = 300; // Base value for disruption + new stack

    // Higher value based on opponent progress lost
    const opponentProgress = this.calculateStackProgress(opponentStack);
    value += opponentProgress * 150;

    // Bonus if we can build on this character
    if (!card.isWild()) {
      // Assume we can find more pieces of this character
      value += 100;
    }

    return value;
  }

  /**
   * Find moves that consolidate matching characters between two stacks
   */
  private findConsolidationMoves(stackA: Stack, stackB: Stack): MoveEvaluation[] {
    const moves: MoveEvaluation[] = [];
    
    const charA = this.getStackDominantCharacter(stackA);
    const charB = this.getStackDominantCharacter(stackB);

    if (!charA || !charB) return moves;

    // Case 1: Different dominant characters - try moving matching pieces
    if (charA !== charB) {
      // Try moving cards from stackB to stackA if they match stackA's character
      for (const pile of [BodyPart.Head, BodyPart.Torso, BodyPart.Legs]) {
        const cards = stackB.getCardsFromPile(pile);
        if (cards.length === 0) continue;

        const topCard = cards[cards.length - 1];
        if (topCard.character === charA || topCard.isWild()) {
          if (stackA.canAcceptCard(topCard, pile)) {
            moves.push({
              fromStack: stackB,
              fromPile: pile,
              toStack: stackA,
              toPile: pile,
              cardId: topCard.id,
              card: topCard,
              value: 200,
              reasoning: `Consolidate ${charA} pieces`,
              createsCascade: false,
              completesStack: this.wouldCompleteStack(stackA, topCard, pile),
              disruptsOpponent: false,
              type: 'organization'
            });
          }
        }
      }

      // Try moving cards from stackA to stackB if they match stackB's character
      for (const pile of [BodyPart.Head, BodyPart.Torso, BodyPart.Legs]) {
        const cards = stackA.getCardsFromPile(pile);
        if (cards.length === 0) continue;

        const topCard = cards[cards.length - 1];
        if (topCard.character === charB || topCard.isWild()) {
          if (stackB.canAcceptCard(topCard, pile)) {
            moves.push({
              fromStack: stackA,
              fromPile: pile,
              toStack: stackB,
              toPile: pile,
              cardId: topCard.id,
              card: topCard,
              value: 200,
              reasoning: `Consolidate ${charB} pieces`,
              createsCascade: false,
              completesStack: this.wouldCompleteStack(stackB, topCard, pile),
              disruptsOpponent: false,
              type: 'organization'
            });
          }
        }
      }
    }

    // Case 2: Same dominant character - consolidate into the more pure stack
    if (charA === charB) {
      const purityA = this.calculateStackPurity(stackA, charA);
      const purityB = this.calculateStackPurity(stackB, charB);
      
      // Move pieces from the less pure stack to the more pure one
      if (purityA > purityB) {
        // Move matching pieces from stackB to stackA
        this.addConsolidationMovesFromTo(stackB, stackA, charA, moves);
      } else if (purityB > purityA) {
        // Move matching pieces from stackA to stackB
        this.addConsolidationMovesFromTo(stackA, stackB, charB, moves);
      }
    }

    return moves;
  }

  /**
   * Add consolidation moves from one stack to another for a specific character
   */
  private addConsolidationMovesFromTo(fromStack: Stack, toStack: Stack, character: Character, moves: MoveEvaluation[]): void {
    for (const pile of [BodyPart.Head, BodyPart.Torso, BodyPart.Legs]) {
      const cards = fromStack.getCardsFromPile(pile);
      if (cards.length === 0) continue;

      const topCard = cards[cards.length - 1];
      if ((topCard.character === character || topCard.isWild()) && toStack.canAcceptCard(topCard, pile)) {
        moves.push({
          fromStack,
          fromPile: pile,
          toStack,
          toPile: pile,
          cardId: topCard.id,
          card: topCard,
          value: 200,
          reasoning: `Consolidate ${character} pieces`,
          createsCascade: false,
          completesStack: this.wouldCompleteStack(toStack, topCard, pile),
          disruptsOpponent: false,
          type: 'organization'
        });
      }
    }
  }

  /**
   * Calculate how "pure" a stack is for a given character (0-1, higher is more pure)
   */
  private calculateStackPurity(stack: Stack, character: Character): number {
    const topCards = stack.getTopCards();
    const allCards = [topCards.head, topCards.torso, topCards.legs].filter(Boolean) as Card[];
    
    if (allCards.length === 0) return 0;
    
    let matchingCards = 0;
    for (const card of allCards) {
      const effectiveChar = this.getEffectiveCharacter(card);
      if (effectiveChar === character) {
        matchingCards++;
      }
    }
    
    return matchingCards / allCards.length;
  }

  /**
   * Check if a card matches the requirement for completion
   */
  private cardMatchesRequirement(card: Card, character: Character, bodyPart: BodyPart): boolean {
    if (card.isWild()) return true;
    return card.character === character && card.bodyPart === bodyPart;
  }

  /**
   * Check if moving a card would complete a stack
   */
  private wouldCompleteStack(stack: Stack, card: Card, pile: BodyPart): boolean {
    // Simulate the move
    const currentTopCards = {
      head: stack.getCardsFromPile(BodyPart.Head)[stack.getCardsFromPile(BodyPart.Head).length - 1],
      torso: stack.getCardsFromPile(BodyPart.Torso)[stack.getCardsFromPile(BodyPart.Torso).length - 1],
      legs: stack.getCardsFromPile(BodyPart.Legs)[stack.getCardsFromPile(BodyPart.Legs).length - 1]
    };

    // Add the new card
    if (pile === BodyPart.Head) currentTopCards.head = card;
    if (pile === BodyPart.Torso) currentTopCards.torso = card;
    if (pile === BodyPart.Legs) currentTopCards.legs = card;

    // Check if all piles have cards and they match
    if (!currentTopCards.head || !currentTopCards.torso || !currentTopCards.legs) {
      return false;
    }

    const headChar = this.getEffectiveCharacter(currentTopCards.head);
    const torsoChar = this.getEffectiveCharacter(currentTopCards.torso);
    const legsChar = this.getEffectiveCharacter(currentTopCards.legs);

    return headChar === torsoChar && torsoChar === legsChar;
  }

  /**
   * Get the effective character of a card (considering nominations)
   */
  private getEffectiveCharacter(card: Card): Character | null {
    if (card.isWild()) {
      return card.getEffectiveCharacter() !== Character.Wild ? card.getEffectiveCharacter() : null;
    }
    return card.character;
  }

  /**
   * Calculate how many pieces a stack has (0-3)
   */
  private calculateStackProgress(stack: Stack): number {
    let progress = 0;
    if (stack.getCardsFromPile(BodyPart.Head).length > 0) progress++;
    if (stack.getCardsFromPile(BodyPart.Torso).length > 0) progress++;
    if (stack.getCardsFromPile(BodyPart.Legs).length > 0) progress++;
    return progress;
  }

  /**
   * Get the dominant character in a stack (most common non-wild character)
   */
  private getStackDominantCharacter(stack: Stack): Character | null {
    const characters: Character[] = [];
    
    for (const pile of [BodyPart.Head, BodyPart.Torso, BodyPart.Legs]) {
      const cards = stack.getCardsFromPile(pile);
      if (cards.length > 0) {
        const topCard = cards[cards.length - 1];
        const effectiveChar = this.getEffectiveCharacter(topCard);
        if (effectiveChar) {
          characters.push(effectiveChar);
        }
      }
    }

    if (characters.length === 0) return null;
    
    // Return the most common character
    const counts = {} as Record<Character, number>;
    for (const char of characters) {
      counts[char] = (counts[char] || 0) + 1;
    }
    
    return Object.entries(counts).reduce((a, b) => counts[a[0] as Character] > counts[b[0] as Character] ? a : b)[0] as Character;
  }

  /**
   * Count matching pieces for a character across all own stacks
   */
  private countMatchingPieces(character: Character, ownStacks: Stack[]): number {
    let count = 0;
    
    for (const stack of ownStacks) {
      for (const pile of [BodyPart.Head, BodyPart.Torso, BodyPart.Legs]) {
        const cards = stack.getCardsFromPile(pile);
        for (const card of cards) {
          if (card.character === character || (card.isWild() && card.getEffectiveCharacter() === character)) {
            count++;
          }
        }
      }
    }
    
    return count;
  }
}