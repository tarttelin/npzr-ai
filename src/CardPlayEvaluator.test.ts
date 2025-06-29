import { CardPlayEvaluator, isWildCardPlayOption } from './CardPlayEvaluator.js';
import { Card, Character, BodyPart } from './Card.js';
import { Stack } from './Stack.js';
import { Hand } from './Hand.js';
import { GameAnalysis } from './GameStateAnalyzer.js';

describe('CardPlayEvaluator', () => {
  let evaluator: CardPlayEvaluator;
  let mockStack: Stack;
  let mockHand: Hand;
  let mockGameAnalysis: GameAnalysis;

  beforeEach(() => {
    evaluator = new CardPlayEvaluator();
    
    // Create mock stack
    mockStack = {
      getId: () => 'stack1',
      getTopCards: () => ({ head: undefined, torso: undefined, legs: undefined }),
      canAcceptCard: () => true,
      getCardsFromPile: () => []
    } as any;

    // Create mock hand
    mockHand = {
      getCards: () => []
    } as any;

    // Create mock game analysis
    mockGameAnalysis = {
      ownProgress: new Map(),
      opponentProgress: new Map(),
      gamePhase: 'early',
      threatLevel: 'low',
      completionOpportunities: [],
      disruptionOpportunities: [],
      ownWildCards: [],
      totalWildCards: 0
    };
  });

  describe('Unified Wild Card Evaluation', () => {
    it('should evaluate placement+nomination combinations for universal wild cards', () => {
      const universalWild = new Card('1', Character.Wild, BodyPart.Wild);
      const hand = [universalWild];
      
      const evaluations = evaluator.evaluateAllPlays(hand, mockGameAnalysis, [], [], mockHand);
      
      // Universal wild should have 3 placement positions × character options for each position
      const wildCardOptions = evaluations.filter(isWildCardPlayOption);
      expect(wildCardOptions.length).toBeGreaterThan(0);
      
      // Each option should have both placement and nomination values
      expect(wildCardOptions.every(opt => opt.placementValue >= 0)).toBe(true);
      expect(wildCardOptions.every(opt => opt.nominationValue >= 0)).toBe(true);
      expect(wildCardOptions.every(opt => opt.combinedValue === opt.placementValue + opt.nominationValue)).toBe(true);
    });

    it('should evaluate placement+nomination combinations for character wild cards', () => {
      const ninjaWild = new Card('1', Character.Ninja, BodyPart.Wild);
      const hand = [ninjaWild];
      
      const evaluations = evaluator.evaluateAllPlays(hand, mockGameAnalysis, [], [], mockHand);
      
      const wildCardOptions = evaluations.filter(isWildCardPlayOption);
      
      // Character wilds should only nominate for their fixed character
      expect(wildCardOptions.every(opt => opt.nomination.character === Character.Ninja)).toBe(true);
      
      // Should have options for each valid placement position (head, torso, legs)
      const positions = new Set(wildCardOptions.map(opt => opt.nomination.bodyPart));
      expect(positions.size).toBe(3); // Head, Torso, Legs
    });

    it('should evaluate placement+nomination combinations for position wild cards', () => {
      const headWild = new Card('1', Character.Wild, BodyPart.Head);
      const hand = [headWild];
      
      const evaluations = evaluator.evaluateAllPlays(hand, mockGameAnalysis, [], [], mockHand);
      
      const wildCardOptions = evaluations.filter(isWildCardPlayOption);
      
      // Position wilds should only nominate for their fixed body part
      expect(wildCardOptions.every(opt => opt.nomination.bodyPart === BodyPart.Head)).toBe(true);
      
      // Should have options for different characters
      const characters = new Set(wildCardOptions.map(opt => opt.nomination.character));
      expect(characters.size).toBe(4); // Ninja, Pirate, Zombie, Robot
    });
  });

  describe('Optimal Placement Selection', () => {
    it('should choose placement position that maximizes nomination value', () => {
      const universalWild = new Card('1', Character.Wild, BodyPart.Wild);
      
      // Setup scenario where Head position offers better nomination opportunities
      mockGameAnalysis.completionOpportunities = [{
        character: Character.Ninja,
        stackId: 'stack1',
        neededCard: BodyPart.Head,
        priority: 'high'
      }];
      
      const hand = [universalWild];
      const evaluations = evaluator.evaluateAllPlays(hand, mockGameAnalysis, [mockStack], [], mockHand);
      const bestPlay = evaluator.selectBestPlay(evaluations);
      
      expect(isWildCardPlayOption(bestPlay!)).toBe(true);
      if (isWildCardPlayOption(bestPlay!)) {
        // Should choose Head placement for the completion opportunity
        expect(bestPlay.placement.targetPile).toBe(BodyPart.Head);
        expect(bestPlay.nomination.character).toBe(Character.Ninja);
        expect(bestPlay.nomination.bodyPart).toBe(BodyPart.Head);
      }
    });

    it('should coordinate placement and nomination for optimal blocking', () => {
      const universalWild = new Card('1', Character.Wild, BodyPart.Wild);
      
      // Setup critical disruption opportunity: opponent has Pirate Head that can be disrupted
      mockGameAnalysis.disruptionOpportunities = [{
        character: Character.Pirate,
        stackId: 'opponentStack',
        targetPile: BodyPart.Head,
        urgency: 'critical'
      }];
      
      const opponentStack = {
        getId: () => 'opponentStack',
        getTopCards: () => ({ 
          head: new Card('2', Character.Pirate, BodyPart.Head), 
          torso: new Card('3', Character.Pirate, BodyPart.Torso), 
          legs: undefined 
        }),
        canAcceptCard: () => true,
        getCardsFromPile: () => []
      } as any;
      const hand = [universalWild];
      const evaluations = evaluator.evaluateAllPlays(hand, mockGameAnalysis, [], [opponentStack], mockHand);
      const bestPlay = evaluator.selectBestPlay(evaluations);
      
      expect(isWildCardPlayOption(bestPlay!)).toBe(true);
      if (isWildCardPlayOption(bestPlay!)) {
        // Should choose Head placement and nominate as DIFFERENT character to disrupt existing Pirate head
        expect(bestPlay.placement.targetPile).toBe(BodyPart.Head);
        expect(bestPlay.nomination.character).not.toBe(Character.Pirate); // Any character except Pirate disrupts the stack
        expect(bestPlay.nomination.bodyPart).toBe(BodyPart.Head);
        expect(bestPlay.reasoning).toContain('Disrupts critical opponent pirate head');
      }
    });
  });

  describe('Regular Card Evaluation', () => {
    it('should handle regular cards without nomination complexity', () => {
      const regularCard = new Card('1', Character.Ninja, BodyPart.Head);
      const hand = [regularCard];
      
      const evaluations = evaluator.evaluateAllPlays(hand, mockGameAnalysis, [], [], mockHand);
      
      // Regular cards should not have nomination options
      expect(evaluations.every(evaluation => !isWildCardPlayOption(evaluation))).toBe(true);
      
      // Should have at least one neutral placement option
      expect(evaluations.length).toBeGreaterThan(0);
      expect(evaluations[0].card).toBe(regularCard);
      expect(evaluations[0].placement.targetPile).toBe(BodyPart.Head);
    });
  });

  describe('Placement Constraint Validation', () => {
    it('should only allow valid placements for position wild cards', () => {
      const headWild = new Card('1', Character.Wild, BodyPart.Head);
      const hand = [headWild];
      
      const evaluations = evaluator.evaluateAllPlays(hand, mockGameAnalysis, [], [], mockHand);
      const wildCardOptions = evaluations.filter(isWildCardPlayOption);
      
      // Position wild cards should only be placed in their designated position
      expect(wildCardOptions.every(opt => opt.placement.targetPile === BodyPart.Head)).toBe(true);
    });

    it('should allow all placements for universal wild cards', () => {
      const universalWild = new Card('1', Character.Wild, BodyPart.Wild);
      const hand = [universalWild];
      
      const evaluations = evaluator.evaluateAllPlays(hand, mockGameAnalysis, [], [], mockHand);
      const wildCardOptions = evaluations.filter(isWildCardPlayOption);
      
      // Universal wilds should have options for all body parts
      const placements = new Set(wildCardOptions.map(opt => opt.placement.targetPile));
      expect(placements.has(BodyPart.Head)).toBe(true);
      expect(placements.has(BodyPart.Torso)).toBe(true);
      expect(placements.has(BodyPart.Legs)).toBe(true);
    });

    it('should allow all placements for character wild cards', () => {
      const ninjaWild = new Card('1', Character.Ninja, BodyPart.Wild);
      const hand = [ninjaWild];
      
      const evaluations = evaluator.evaluateAllPlays(hand, mockGameAnalysis, [], [], mockHand);
      const wildCardOptions = evaluations.filter(isWildCardPlayOption);
      
      // Character wilds should have options for all body parts
      const placements = new Set(wildCardOptions.map(opt => opt.placement.targetPile));
      expect(placements.has(BodyPart.Head)).toBe(true);
      expect(placements.has(BodyPart.Torso)).toBe(true);
      expect(placements.has(BodyPart.Legs)).toBe(true);
    });
  });

  describe('Strategic Value Calculation', () => {
    it('should prefer high-value placement+nomination combinations', () => {
      const universalWild = new Card('1', Character.Wild, BodyPart.Wild);
      
      // Setup high-value completion opportunity
      mockGameAnalysis.completionOpportunities = [{
        character: Character.Ninja,
        stackId: 'stack1',
        neededCard: BodyPart.Head,
        priority: 'high'
      }];
      
      const hand = [universalWild];
      const evaluations = evaluator.evaluateAllPlays(hand, mockGameAnalysis, [mockStack], [], mockHand);
      
      // Find the completion option
      const completionOptions = evaluations.filter(evaluation => 
        isWildCardPlayOption(evaluation) && 
        evaluation.nomination.character === Character.Ninja && 
        evaluation.nomination.bodyPart === BodyPart.Head
      );
      
      expect(completionOptions.length).toBeGreaterThan(0);
      if (isWildCardPlayOption(completionOptions[0])) {
        expect(completionOptions[0].combinedValue).toBeGreaterThan(1000); // High completion value
      }
    });

    it('should include wild card type bonuses in evaluation', () => {
      const ninjaWild = new Card('1', Character.Ninja, BodyPart.Wild);
      const hand = [ninjaWild];
      
      const evaluations = evaluator.evaluateAllPlays(hand, mockGameAnalysis, [], [], mockHand);
      const wildCardOptions = evaluations.filter(isWildCardPlayOption);
      
      // Character wilds should have type bonuses when used optimally
      expect(wildCardOptions.every(opt => opt.reasoning.includes('wild card type bonus'))).toBe(true);
    });
  });

  describe('Mixed Hand Evaluation', () => {
    it('should evaluate both wild and regular cards together', () => {
      const regularCard = new Card('1', Character.Ninja, BodyPart.Head);
      const wildCard = new Card('2', Character.Wild, BodyPart.Wild);
      const hand = [regularCard, wildCard];
      
      const evaluations = evaluator.evaluateAllPlays(hand, mockGameAnalysis, [], [], mockHand);
      
      // Should have both regular and wild card evaluations
      const regularEvals = evaluations.filter(evaluation => !isWildCardPlayOption(evaluation));
      const wildEvals = evaluations.filter(evaluation => isWildCardPlayOption(evaluation));
      
      expect(regularEvals.length).toBeGreaterThan(0);
      expect(wildEvals.length).toBeGreaterThan(0);
      
      // Regular card evaluations should use the regular card
      expect(regularEvals.every(evaluation => evaluation.card === regularCard)).toBe(true);
      
      // Wild card evaluations should use the wild card
      expect(wildEvals.every(evaluation => evaluation.card === wildCard)).toBe(true);
    });
  });

  describe('Performance Requirements', () => {
    it('should complete evaluation in under 100ms for complex scenarios', () => {
      const hand = [
        new Card('1', Character.Wild, BodyPart.Wild),
        new Card('2', Character.Ninja, BodyPart.Wild),
        new Card('3', Character.Wild, BodyPart.Head),
        new Card('4', Character.Pirate, BodyPart.Torso)
      ];
      
      // Complex game state
      mockGameAnalysis.completionOpportunities = [
        { character: Character.Ninja, stackId: 'stack1', neededCard: BodyPart.Head, priority: 'high' },
        { character: Character.Pirate, stackId: 'stack2', neededCard: BodyPart.Torso, priority: 'medium' }
      ];
      
      mockGameAnalysis.disruptionOpportunities = [
        { character: Character.Robot, stackId: 'opStack1', targetPile: BodyPart.Legs, urgency: 'critical' },
        { character: Character.Zombie, stackId: 'opStack2', targetPile: BodyPart.Head, urgency: 'important' }
      ];
      
      const startTime = performance.now();
      
      const evaluations = evaluator.evaluateAllPlays(hand, mockGameAnalysis, [mockStack], [mockStack], mockHand);
      const bestPlay = evaluator.selectBestPlay(evaluations);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100); // Should complete in under 100ms
      expect(bestPlay).toBeDefined();
      expect(evaluations.length).toBeGreaterThan(0);
    });
  });

  describe('Integration Scenarios', () => {
    it('should demonstrate coordination advantage over separate systems', () => {
      // Scenario: Universal wild with two possible placements
      // - Head position: good for building (300 points) + weak nomination (100 points) = 400 total
      // - Torso position: okay building (200 points) + strong blocking nomination (800 points) = 1000 total
      
      const universalWild = new Card('1', Character.Wild, BodyPart.Wild);
      
      // Setup scenario where Head disruption is much stronger than other placements
      mockGameAnalysis.disruptionOpportunities = [{
        character: Character.Pirate,
        stackId: 'opponentStack',
        targetPile: BodyPart.Head,
        urgency: 'critical' // High disruption value - opponent has Pirate Head that can be disrupted
      }];
      
      const ownStack = {
        getId: () => 'ownStack',
        getTopCards: () => ({ 
          head: new Card('2', Character.Ninja, BodyPart.Head), 
          torso: undefined, 
          legs: undefined 
        }),
        canAcceptCard: () => true,
        getCardsFromPile: () => []
      } as any;
      
      const opponentStack = {
        getId: () => 'opponentStack',
        getTopCards: () => ({ 
          head: new Card('3', Character.Pirate, BodyPart.Head), 
          torso: new Card('4', Character.Pirate, BodyPart.Torso), 
          legs: undefined 
        }),
        canAcceptCard: () => true,
        getCardsFromPile: () => []
      } as any;
      
      const hand = [universalWild];
      const evaluations = evaluator.evaluateAllPlays(hand, mockGameAnalysis, [ownStack], [opponentStack], mockHand);
      const bestPlay = evaluator.selectBestPlay(evaluations);
      
      expect(isWildCardPlayOption(bestPlay!)).toBe(true);
      if (isWildCardPlayOption(bestPlay!)) {
        // Should choose Head position for strong disruption value, nominating as different character
        expect(bestPlay.placement.targetPile).toBe(BodyPart.Head);
        expect(bestPlay.nomination.character).not.toBe(Character.Pirate); // Disrupts by using different character
        expect(bestPlay.nomination.bodyPart).toBe(BodyPart.Head);
        expect(bestPlay.combinedValue).toBeGreaterThan(800); // Strong combined value from disruption
        expect(bestPlay.reasoning).toContain('Disrupts critical opponent pirate head');
      }
    });
  });
});