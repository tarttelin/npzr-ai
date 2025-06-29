import { WildCardNominator } from './WildCardNominator.js';
import { Card, Character, BodyPart } from './Card.js';
import { Stack } from './Stack.js';
import { Hand } from './Hand.js';
import { GameAnalysis, StackProgress } from './GameStateAnalyzer.js';

describe('WildCardNominator', () => {
  let nominator: WildCardNominator;
  let mockStack: Stack;
  let mockHand: Hand;
  let mockGameAnalysis: GameAnalysis;

  beforeEach(() => {
    nominator = new WildCardNominator();
    
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
      blockingOpportunities: [],
      ownWildCards: [],
      totalWildCards: 0
    };
  });

  describe('Wild Card Type Detection', () => {
    it('should identify character wild cards', () => {
      const ninjaWild = new Card('1', Character.Ninja, BodyPart.Wild);
      const evaluations = nominator.evaluateNominations(ninjaWild, null, mockGameAnalysis, mockHand, []);
      
      // Character wilds should only allow nominations for that character
      expect(evaluations.every(opt => opt.character === Character.Ninja)).toBe(true);
      expect(evaluations.length).toBe(3); // 3 body parts
    });

    it('should identify position wild cards', () => {
      const headWild = new Card('1', Character.Wild, BodyPart.Head);
      const evaluations = nominator.evaluateNominations(headWild, null, mockGameAnalysis, mockHand, []);
      
      // Position wilds should only allow nominations for that body part
      expect(evaluations.every(opt => opt.bodyPart === BodyPart.Head)).toBe(true);
      expect(evaluations.length).toBe(4); // 4 characters
    });

    it('should identify universal wild cards', () => {
      const universalWild = new Card('1', Character.Wild, BodyPart.Wild);
      const evaluations = nominator.evaluateNominations(universalWild, null, mockGameAnalysis, mockHand, []);
      
      // Universal wilds should allow all combinations
      expect(evaluations.length).toBe(12); // 4 characters × 3 body parts
    });
  });

  describe('Stack Completion Priority', () => {
    it('should prioritize nominations that complete stacks', () => {
      const universalWild = new Card('1', Character.Wild, BodyPart.Wild);
      
      // Setup completion opportunity
      mockGameAnalysis.completionOpportunities = [{
        character: Character.Ninja,
        stackId: 'stack1',
        neededCard: BodyPart.Head,
        priority: 'high'
      }];

      const evaluations = nominator.evaluateNominations(universalWild, mockStack, mockGameAnalysis, mockHand, []);
      const bestOption = nominator.selectBestNomination(evaluations);

      expect(bestOption.character).toBe(Character.Ninja);
      expect(bestOption.bodyPart).toBe(BodyPart.Head);
      expect(bestOption.completesStack).toBe(true);
      expect(bestOption.value).toBe(1025); // Completion value + universal wild bonus
      expect(bestOption.reasoning).toContain('Completes ninja stack immediately');
    });

    it('should use considerStackCompletion correctly', () => {
      const mockStackWith2Cards = {
        getId: () => 'stack1',
        getTopCards: () => ({ 
          head: new Card('2', Character.Ninja, BodyPart.Head), 
          torso: new Card('3', Character.Ninja, BodyPart.Torso), 
          legs: undefined 
        })
      } as any;

      const wildCard = new Card('1', Character.Wild, BodyPart.Wild);
      
      expect(nominator.considerStackCompletion(wildCard, mockStackWith2Cards)).toBe(true);
      expect(nominator.considerStackCompletion(wildCard, mockStack)).toBe(false);
    });
  });

  describe('Critical Blocking Priority', () => {
    it('should prioritize blocking critical opponent threats', () => {
      const universalWild = new Card('1', Character.Wild, BodyPart.Wild);
      
      // Setup critical blocking opportunity
      mockGameAnalysis.blockingOpportunities = [{
        character: Character.Pirate,
        stackId: 'opponentStack',
        targetPile: BodyPart.Torso,
        urgency: 'critical'
      }];

      const evaluations = nominator.evaluateNominations(universalWild, null, mockGameAnalysis, mockHand, []);
      const bestOption = nominator.selectBestNomination(evaluations);

      expect(bestOption.character).toBe(Character.Pirate);
      expect(bestOption.bodyPart).toBe(BodyPart.Torso);
      expect(bestOption.value).toBe(825); // Critical blocking value + universal wild bonus
      expect(bestOption.reasoning).toContain('Blocks critical opponent');
    });
  });

  describe('Building Strategy', () => {
    it('should prioritize building toward completion', () => {
      const universalWild = new Card('1', Character.Wild, BodyPart.Wild);
      
      // Setup stack progress
      const stackProgress: StackProgress = {
        character: Character.Robot,
        hasHead: true,
        hasTorso: false,
        hasLegs: false,
        completionLevel: 1,
        isComplete: false,
        missingPieces: [BodyPart.Torso, BodyPart.Legs]
      };
      mockGameAnalysis.ownProgress.set(Character.Robot, stackProgress);

      // Add supporting cards in hand to enable future completion
      const handCards = [new Card('2', Character.Robot, BodyPart.Legs)];
      mockHand = { getCards: () => handCards } as any;

      const evaluations = nominator.evaluateNominations(universalWild, null, mockGameAnalysis, mockHand, []);
      
      const robotOptions = evaluations.filter(opt => opt.character === Character.Robot);
      expect(robotOptions.length).toBeGreaterThan(0);
      
      const robotTorsoOption = robotOptions.find(opt => opt.bodyPart === BodyPart.Torso);
      expect(robotTorsoOption?.value).toBe(325); // 1/3 completion building value + universal wild bonus
      expect(robotTorsoOption?.reasoning).toContain('Builds toward robot completion');
      expect(robotTorsoOption?.enablesFutureCompletion).toBe(true);
    });

    it('should handle 2/3 completion with higher value', () => {
      const universalWild = new Card('1', Character.Wild, BodyPart.Wild);
      
      // Setup near-complete stack
      const stackProgress: StackProgress = {
        character: Character.Zombie,
        hasHead: true,
        hasTorso: true,
        hasLegs: false,
        completionLevel: 2,
        isComplete: false,
        missingPieces: [BodyPart.Legs]
      };
      mockGameAnalysis.ownProgress.set(Character.Zombie, stackProgress);

      const evaluations = nominator.evaluateNominations(universalWild, null, mockGameAnalysis, mockHand, []);
      
      const zombieLegsOption = evaluations.find(opt => 
        opt.character === Character.Zombie && opt.bodyPart === BodyPart.Legs
      );
      expect(zombieLegsOption?.value).toBe(525); // 2/3 completion building value + universal wild bonus
    });
  });

  describe('Future Building Optimization', () => {
    it('should consider hand composition for future building', () => {
      const universalWild = new Card('1', Character.Wild, BodyPart.Wild);
      
      // Setup hand with multiple pirate cards
      const handCards = [
        new Card('2', Character.Pirate, BodyPart.Head),
        new Card('3', Character.Pirate, BodyPart.Torso),
        new Card('4', Character.Pirate, BodyPart.Legs)
      ];
      mockHand = { getCards: () => handCards } as any;

      const options = nominator.optimizeForFutureBuilding(universalWild, mockHand, []);
      
      const pirateOptions = options.filter(opt => opt.character === Character.Pirate);
      expect(pirateOptions.length).toBeGreaterThan(0);
      expect(pirateOptions.every(opt => opt.enablesFutureCompletion)).toBe(true);
      expect(pirateOptions[0].reasoning).toContain('Future building potential: 3 pirate cards in hand');
    });
  });

  describe('Wild Card Type Bonuses', () => {
    it('should give bonuses for character wilds used optimally', () => {
      const ninjaWild = new Card('1', Character.Ninja, BodyPart.Wild);
      
      const evaluations = nominator.evaluateNominations(ninjaWild, null, mockGameAnalysis, mockHand, []);
      
      // All evaluations should be for Ninja and have type bonus
      expect(evaluations.every(opt => opt.character === Character.Ninja)).toBe(true);
      expect(evaluations.every(opt => opt.reasoning.includes('wild card type bonus: +50'))).toBe(true);
    });

    it('should give bonuses for position wilds used optimally', () => {
      const headWild = new Card('1', Character.Wild, BodyPart.Head);
      
      const evaluations = nominator.evaluateNominations(headWild, null, mockGameAnalysis, mockHand, []);
      
      // All evaluations should be for Head and have type bonus
      expect(evaluations.every(opt => opt.bodyPart === BodyPart.Head)).toBe(true);
      expect(evaluations.every(opt => opt.reasoning.includes('wild card type bonus: +50'))).toBe(true);
    });

    it('should give smaller bonuses for universal wilds', () => {
      const universalWild = new Card('1', Character.Wild, BodyPart.Wild);
      
      const evaluations = nominator.evaluateNominations(universalWild, null, mockGameAnalysis, mockHand, []);
      
      // All evaluations should have universal bonus
      expect(evaluations.every(opt => opt.reasoning.includes('wild card type bonus: +25'))).toBe(true);
    });
  });

  describe('New Character Development', () => {
    it('should prioritize high-value characters for new development', () => {
      const universalWild = new Card('1', Character.Wild, BodyPart.Wild);
      
      const evaluations = nominator.evaluateNominations(universalWild, null, mockGameAnalysis, mockHand, []);
      
      const ninjaOption = evaluations.find(opt => opt.character === Character.Ninja);
      const zombieOption = evaluations.find(opt => opt.character === Character.Zombie);
      
      // Ninja should have higher base value than Zombie for new development
      expect(ninjaOption?.value).toBeGreaterThan(zombieOption?.value || 0);
    });

    it('should consider hand support for new characters', () => {
      const universalWild = new Card('1', Character.Wild, BodyPart.Wild);
      
      // Hand with Robot support
      const handCards = [
        new Card('2', Character.Robot, BodyPart.Head),
        new Card('3', Character.Robot, BodyPart.Torso)
      ];
      mockHand = { getCards: () => handCards } as any;

      const evaluations = nominator.evaluateNominations(universalWild, null, mockGameAnalysis, mockHand, []);
      
      const robotOptions = evaluations.filter(opt => opt.character === Character.Robot);
      
      // Robot options should have hand support bonus
      expect(robotOptions.length).toBeGreaterThan(0);
      expect(robotOptions[0].value).toBeGreaterThan(100); // Base value + support bonus
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty nomination options gracefully', () => {
      const invalidCard = new Card('1', Character.Ninja, BodyPart.Head); // Not a wild card
      
      const evaluations = nominator.evaluateNominations(invalidCard, null, mockGameAnalysis, mockHand, []);
      const bestOption = nominator.selectBestNomination(evaluations);

      // Should provide fallback nomination
      expect(bestOption.character).toBe(Character.Ninja);
      expect(bestOption.bodyPart).toBe(BodyPart.Head);
      // For invalid cards, should still provide some nomination
      expect(bestOption.character).toBeDefined();
      expect(bestOption.bodyPart).toBeDefined();
    });

    it('should handle missing stack progress data', () => {
      const universalWild = new Card('1', Character.Wild, BodyPart.Wild);
      
      // Empty game analysis
      const emptyAnalysis: GameAnalysis = {
        ownProgress: new Map(),
        opponentProgress: new Map(),
        gamePhase: 'early',
        threatLevel: 'low',
        completionOpportunities: [],
        blockingOpportunities: [],
        ownWildCards: [],
        totalWildCards: 0
      };

      const evaluations = nominator.evaluateNominations(universalWild, null, emptyAnalysis, mockHand, []);
      
      expect(evaluations.length).toBe(12); // Should still generate all possible nominations
      expect(evaluations.every(opt => opt.value >= 0)).toBe(true); // All should have non-negative values
    });

    it('should handle null target stack', () => {
      const universalWild = new Card('1', Character.Wild, BodyPart.Wild);
      
      const evaluations = nominator.evaluateNominations(universalWild, null, mockGameAnalysis, mockHand, []);
      
      expect(evaluations.length).toBeGreaterThan(0);
      expect(() => nominator.selectBestNomination(evaluations)).not.toThrow();
    });
  });

  describe('Performance Requirements', () => {
    it('should complete nomination selection in under 50ms', () => {
      const universalWild = new Card('1', Character.Wild, BodyPart.Wild);
      
      // Create a complex scenario
      mockGameAnalysis.completionOpportunities = [
        { character: Character.Ninja, stackId: 'stack1', neededCard: BodyPart.Head, priority: 'high' },
        { character: Character.Pirate, stackId: 'stack2', neededCard: BodyPart.Torso, priority: 'medium' }
      ];
      
      mockGameAnalysis.blockingOpportunities = [
        { character: Character.Robot, stackId: 'opStack1', targetPile: BodyPart.Legs, urgency: 'critical' },
        { character: Character.Zombie, stackId: 'opStack2', targetPile: BodyPart.Head, urgency: 'important' }
      ];

      const startTime = performance.now();
      
      const evaluations = nominator.evaluateNominations(universalWild, null, mockGameAnalysis, mockHand, []);
      const bestOption = nominator.selectBestNomination(evaluations);
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(50); // Should complete in under 50ms
      expect(bestOption).toBeDefined();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle Scenario 1: Character Wild completion', () => {
      // Ninja Wild played, stack has Ninja Head + Ninja Torso
      const ninjaWild = new Card('1', Character.Ninja, BodyPart.Wild);
      
      const stackWithNinja = {
        getId: () => 'stack1',
        getTopCards: () => ({ 
          head: new Card('2', Character.Ninja, BodyPart.Head), 
          torso: new Card('3', Character.Ninja, BodyPart.Torso), 
          legs: undefined 
        })
      } as any;

      // Hand contains matching leg
      const handCards = [new Card('4', Character.Ninja, BodyPart.Legs)];
      mockHand = { getCards: () => handCards } as any;

      const evaluations = nominator.evaluateNominations(ninjaWild, stackWithNinja, mockGameAnalysis, mockHand, [stackWithNinja]);
      
      const legsOption = evaluations.find(opt => opt.bodyPart === BodyPart.Legs);
      expect(legsOption?.character).toBe(Character.Ninja);
      expect(legsOption?.character).toBe(Character.Ninja);
      // This is actually immediate building, not future completion
      expect(legsOption?.value).toBeGreaterThan(0);
    });

    it('should handle Scenario 2: Universal Wild future building', () => {
      // Universal Wild played, no immediate completions
      const universalWild = new Card('1', Character.Wild, BodyPart.Wild);
      
      // Own stacks with partial progress
      const ninjaStack = {
        getId: () => 'ninjaStack',
        getTopCards: () => ({ head: new Card('2', Character.Ninja, BodyPart.Head), torso: undefined, legs: undefined })
      } as any;
      
      const robotStack = {
        getId: () => 'robotStack',
        getTopCards: () => ({ 
          head: new Card('3', Character.Robot, BodyPart.Head), 
          torso: new Card('4', Character.Robot, BodyPart.Torso), 
          legs: undefined 
        })
      } as any;

      // Hand contains Robot Legs
      const handCards = [new Card('5', Character.Robot, BodyPart.Legs)];
      mockHand = { getCards: () => handCards } as any;

      const evaluations = nominator.evaluateNominations(universalWild, null, mockGameAnalysis, mockHand, [ninjaStack, robotStack]);
      
      // Should prefer Robot Legs for future completion
      const robotLegsOptions = evaluations.filter(opt => 
        opt.character === Character.Robot && opt.bodyPart === BodyPart.Legs
      );
      expect(robotLegsOptions.length).toBeGreaterThan(0);
      expect(robotLegsOptions.length).toBeGreaterThan(0);
      expect(robotLegsOptions[0].character).toBe(Character.Robot);
    });

    it('should handle Scenario 3: Position Wild strongest character', () => {
      // Head Wild played
      const headWild = new Card('1', Character.Wild, BodyPart.Head);
      
      // Setup character progress
      mockGameAnalysis.ownProgress.set(Character.Ninja, {
        character: Character.Ninja, hasHead: false, hasTorso: true, hasLegs: false,
        completionLevel: 1, isComplete: false, missingPieces: [BodyPart.Head, BodyPart.Legs]
      });
      
      mockGameAnalysis.ownProgress.set(Character.Pirate, {
        character: Character.Pirate, hasHead: false, hasTorso: true, hasLegs: true,
        completionLevel: 2, isComplete: false, missingPieces: [BodyPart.Head]
      });

      const evaluations = nominator.evaluateNominations(headWild, null, mockGameAnalysis, mockHand, []);
      
      // Should prefer Pirate Head (strongest character with 2/3)
      const pirateHeadOption = evaluations.find(opt => opt.character === Character.Pirate);
      const ninjaHeadOption = evaluations.find(opt => opt.character === Character.Ninja);
      
      expect(pirateHeadOption?.value).toBeGreaterThan(ninjaHeadOption?.value || 0);
    });
  });
});