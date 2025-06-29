import { CardSelector, CardEvaluation } from './CardSelector.js';
import { Card, Character, BodyPart } from './Card.js';
import { GameAnalysis, StackProgress, BlockingOpportunity } from './GameStateAnalyzer.js';
import { Stack } from './Stack.js';

describe('CardSelector', () => {
  let selector: CardSelector;
  let mockStack: Stack;
  let mockGameAnalysis: GameAnalysis;

  beforeEach(() => {
    selector = new CardSelector();
    
    // Create mock stack
    mockStack = {
      getId: () => 'stack1',
      getTopCards: () => ({ head: undefined, torso: undefined, legs: undefined }),
      canAcceptCard: () => true,
      getCardsFromPile: () => []
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

  describe('evaluateAllMoves', () => {
    it('should return evaluations sorted by value (highest first)', () => {
      const ninjaHead = new Card('1', Character.Ninja, BodyPart.Head);
      const pirateHead = new Card('2', Character.Pirate, BodyPart.Head);
      const hand = [ninjaHead, pirateHead];

      // Mock completion opportunity for Ninja
      mockGameAnalysis.completionOpportunities = [{
        character: Character.Ninja,
        stackId: 'stack1',
        neededCard: BodyPart.Head,
        priority: 'high'
      }];

      const evaluations = selector.evaluateAllMoves(hand, mockGameAnalysis, [mockStack], []);

      expect(evaluations.length).toBeGreaterThan(0);
      expect(evaluations[0].value).toBeGreaterThanOrEqual(evaluations[evaluations.length - 1].value);
    });

    it('should apply wild card conservation penalty when appropriate', () => {
      const wildCard = new Card('1', Character.Wild, BodyPart.Wild);
      const hand = [wildCard];

      // Early game with no completion opportunities
      mockGameAnalysis.gamePhase = 'early';
      mockGameAnalysis.completionOpportunities = [];
      mockGameAnalysis.blockingOpportunities = [];
      mockGameAnalysis.ownWildCards = [wildCard]; // Only one wild card, should save it

      const evaluations = selector.evaluateAllMoves(hand, mockGameAnalysis, [mockStack], []);

      // Should have penalty applied
      expect(evaluations.length).toBeGreaterThan(0);
      const wildEvaluation = evaluations.find(e => e.card.isWild());
      expect(wildEvaluation).toBeDefined();
      expect(wildEvaluation?.reasoning).toContain('conservation penalty');
    });
  });

  describe('findCompletionMoves', () => {
    it('should identify completion opportunities', () => {
      const ninjaHead = new Card('1', Character.Ninja, BodyPart.Head);
      const hand = [ninjaHead];

      mockGameAnalysis.completionOpportunities = [{
        character: Character.Ninja,
        stackId: 'stack1',
        neededCard: BodyPart.Head,
        priority: 'high'
      }];

      const evaluations = selector.findCompletionMoves(hand, [mockStack], mockGameAnalysis);

      expect(evaluations).toHaveLength(1);
      expect(evaluations[0].type).toBe('completion');
      expect(evaluations[0].value).toBe(1000); // Completion value
      expect(evaluations[0].reasoning).toContain('Completes Ninja');
    });

    it('should identify wild cards as completion options', () => {
      const wildCard = new Card('1', Character.Wild, BodyPart.Wild);
      const hand = [wildCard];

      mockGameAnalysis.completionOpportunities = [{
        character: Character.Ninja,
        stackId: 'stack1',
        neededCard: BodyPart.Head,
        priority: 'high'
      }];

      const evaluations = selector.findCompletionMoves(hand, [mockStack], mockGameAnalysis);

      expect(evaluations).toHaveLength(1);
      expect(evaluations[0].card.isWild()).toBe(true);
      expect(evaluations[0].type).toBe('completion');
    });
  });

  describe('findBlockingMoves', () => {
    it('should identify critical blocking opportunities', () => {
      const ninjaHead = new Card('1', Character.Ninja, BodyPart.Head);
      const hand = [ninjaHead];

      mockGameAnalysis.blockingOpportunities = [{
        character: Character.Pirate,
        stackId: 'stack1', // Use same ID as mockStack
        targetPile: BodyPart.Head,
        urgency: 'critical'
      }];

      const evaluations = selector.findBlockingMoves(hand, [mockStack], mockGameAnalysis);

      expect(evaluations).toHaveLength(1);
      expect(evaluations[0].type).toBe('blocking');
      expect(evaluations[0].value).toBe(800); // Critical blocking value
      expect(evaluations[0].reasoning).toContain('Blocks Pirate');
    });

    it('should score blocking moves based on urgency', () => {
      const ninjaHead = new Card('1', Character.Ninja, BodyPart.Head);
      const hand = [ninjaHead];

      // Create different urgency levels
      const criticalBlock: BlockingOpportunity = {
        character: Character.Pirate,
        stackId: 'stack1',
        targetPile: BodyPart.Head,
        urgency: 'critical'
      };

      const importantBlock: BlockingOpportunity = {
        character: Character.Ninja,
        stackId: 'stack1',
        targetPile: BodyPart.Head,
        urgency: 'important'
      };

      // Test critical urgency
      mockGameAnalysis.blockingOpportunities = [criticalBlock];
      let evaluations = selector.findBlockingMoves(hand, [mockStack], mockGameAnalysis);
      expect(evaluations[0].value).toBe(800);

      // Test important urgency
      mockGameAnalysis.blockingOpportunities = [importantBlock];
      evaluations = selector.findBlockingMoves(hand, [mockStack], mockGameAnalysis);
      expect(evaluations[0].value).toBe(400);
    });
  });

  describe('findBuildingMoves', () => {
    it('should identify building opportunities on existing stacks', () => {
      const ninjaHead = new Card('1', Character.Ninja, BodyPart.Head);
      const hand = [ninjaHead];

      // Mock stack with Ninja character established
      const stackWithNinja = {
        getId: () => 'stack1',
        getTopCards: () => ({ 
          head: undefined, 
          torso: new Card('2', Character.Ninja, BodyPart.Torso), 
          legs: undefined 
        }),
        canAcceptCard: () => true,
        getCardsFromPile: () => []
      } as any;

      // Mock progress showing 1/3 completion
      const stackProgress: StackProgress = {
        character: Character.Ninja,
        hasHead: false,
        hasTorso: true,
        hasLegs: false,
        completionLevel: 1,
        isComplete: false,
        missingPieces: [BodyPart.Head, BodyPart.Legs]
      };
      mockGameAnalysis.ownProgress.set(Character.Ninja, stackProgress);

      const evaluations = selector.findBuildingMoves(hand, [stackWithNinja], mockGameAnalysis);

      expect(evaluations).toHaveLength(1);
      expect(evaluations[0].type).toBe('building');
      expect(evaluations[0].value).toBe(300); // 1/3 completion building value
      expect(evaluations[0].reasoning).toContain('Builds Ninja');
    });

    it('should score building moves based on completion level', () => {
      const ninjaHead = new Card('1', Character.Ninja, BodyPart.Head);
      const hand = [ninjaHead];

      const stackWithNinja = {
        getId: () => 'stack1',
        getTopCards: () => ({ 
          head: undefined, 
          torso: new Card('2', Character.Ninja, BodyPart.Torso), 
          legs: undefined 
        }),
        canAcceptCard: () => true,
        getCardsFromPile: () => []
      } as any;

      // Test 2/3 completion
      let stackProgress: StackProgress = {
        character: Character.Ninja,
        hasHead: false,
        hasTorso: true,
        hasLegs: true,
        completionLevel: 2,
        isComplete: false,
        missingPieces: [BodyPart.Head]
      };
      mockGameAnalysis.ownProgress.set(Character.Ninja, stackProgress);

      let evaluations = selector.findBuildingMoves(hand, [stackWithNinja], mockGameAnalysis);
      expect(evaluations[0].value).toBe(500); // 2/3 completion value

      // Test 1/3 completion
      stackProgress.completionLevel = 1;
      mockGameAnalysis.ownProgress.set(Character.Ninja, stackProgress);

      evaluations = selector.findBuildingMoves(hand, [stackWithNinja], mockGameAnalysis);
      expect(evaluations[0].value).toBe(300); // 1/3 completion value
    });
  });

  describe('findNeutralMoves', () => {
    it('should create new stack evaluations', () => {
      const ninjaHead = new Card('1', Character.Ninja, BodyPart.Head);
      const pirateHead = new Card('2', Character.Pirate, BodyPart.Head);
      const hand = [ninjaHead, pirateHead];

      const evaluations = selector.findNeutralMoves(hand, mockGameAnalysis);

      expect(evaluations).toHaveLength(2);
      expect(evaluations.every(e => e.type === 'neutral')).toBe(true);
      expect(evaluations.every(e => !e.placement.targetStackId)).toBe(true);
    });

    it('should prioritize high-value characters in early/mid game', () => {
      const ninjaHead = new Card('1', Character.Ninja, BodyPart.Head);
      const zombieHead = new Card('2', Character.Zombie, BodyPart.Head);
      const hand = [ninjaHead, zombieHead];

      mockGameAnalysis.gamePhase = 'early';

      const evaluations = selector.findNeutralMoves(hand, mockGameAnalysis);

      const ninjaEval = evaluations.find(e => e.card.character === Character.Ninja);
      const zombieEval = evaluations.find(e => e.card.character === Character.Zombie);

      expect(ninjaEval?.value).toBeGreaterThan(zombieEval?.value || 0);
    });
  });

  describe('shouldSaveWildCard', () => {
    it('should not save wild cards when completion opportunities exist', () => {
      const wildCard = new Card('1', Character.Wild, BodyPart.Wild);

      mockGameAnalysis.completionOpportunities = [{
        character: Character.Ninja,
        stackId: 'stack1',
        neededCard: BodyPart.Head,
        priority: 'high'
      }];

      const shouldSave = selector.shouldSaveWildCard(wildCard, mockGameAnalysis);
      expect(shouldSave).toBe(false);
    });

    it('should not save wild cards when critical threats exist', () => {
      const wildCard = new Card('1', Character.Wild, BodyPart.Wild);

      mockGameAnalysis.blockingOpportunities = [{
        character: Character.Pirate,
        stackId: 'stack1',
        targetPile: BodyPart.Head,
        urgency: 'critical'
      }];

      const shouldSave = selector.shouldSaveWildCard(wildCard, mockGameAnalysis);
      expect(shouldSave).toBe(false);
    });

    it('should save wild cards in early game when no immediate threats', () => {
      const wildCard = new Card('1', Character.Wild, BodyPart.Wild);

      mockGameAnalysis.gamePhase = 'early';
      mockGameAnalysis.completionOpportunities = [];
      mockGameAnalysis.blockingOpportunities = [];
      mockGameAnalysis.ownWildCards = [wildCard]; // Only one wild card

      const shouldSave = selector.shouldSaveWildCard(wildCard, mockGameAnalysis);
      expect(shouldSave).toBe(true);
    });

    it('should not save wild cards in late game', () => {
      const wildCard = new Card('1', Character.Wild, BodyPart.Wild);

      mockGameAnalysis.gamePhase = 'late';
      mockGameAnalysis.completionOpportunities = [];
      mockGameAnalysis.blockingOpportunities = [];

      const shouldSave = selector.shouldSaveWildCard(wildCard, mockGameAnalysis);
      expect(shouldSave).toBe(false);
    });
  });

  describe('selectBestMove', () => {
    it('should return the highest value move', () => {
      // Create unsorted evaluations to test sorting
      const evaluations: CardEvaluation[] = [
        {
          card: new Card('1', Character.Ninja, BodyPart.Head),
          placement: { targetPile: BodyPart.Head },
          value: 500,
          reasoning: 'Medium value',
          type: 'building'
        },
        {
          card: new Card('2', Character.Pirate, BodyPart.Head),
          placement: { targetPile: BodyPart.Head },
          value: 100,
          reasoning: 'Low value',
          type: 'neutral'
        },
        {
          card: new Card('3', Character.Zombie, BodyPart.Head),
          placement: { targetPile: BodyPart.Head },
          value: 1000,
          reasoning: 'High value',
          type: 'completion'
        }
      ];

      const bestMove = selector.selectBestMove(evaluations);
      expect(bestMove?.value).toBe(1000);
      expect(bestMove?.type).toBe('completion');
    });

    it('should return null for empty evaluations', () => {
      const bestMove = selector.selectBestMove([]);
      expect(bestMove).toBeNull();
    });
  });

  describe('integration tests', () => {
    it('should properly evaluate a complex game scenario', () => {
      // Create cards
      const ninjaHead = new Card('1', Character.Ninja, BodyPart.Head);
      const pirateHead = new Card('2', Character.Pirate, BodyPart.Head);
      const wildCard = new Card('3', Character.Wild, BodyPart.Wild);
      const hand = [ninjaHead, pirateHead, wildCard];

      // Create stacks
      const ownStack = {
        getId: () => 'ownStack1',
        getTopCards: () => ({ 
          head: undefined, 
          torso: new Card('4', Character.Ninja, BodyPart.Torso), 
          legs: new Card('5', Character.Ninja, BodyPart.Legs) 
        }),
        canAcceptCard: () => true,
        getCardsFromPile: () => []
      } as any;

      const opponentStack = {
        getId: () => 'opponentStack1',
        getTopCards: () => ({ 
          head: undefined, 
          torso: new Card('6', Character.Pirate, BodyPart.Torso), 
          legs: new Card('7', Character.Pirate, BodyPart.Legs) 
        }),
        canAcceptCard: () => true,
        getCardsFromPile: () => []
      } as any;

      // Setup game analysis with completion and blocking opportunities
      mockGameAnalysis.completionOpportunities = [{
        character: Character.Ninja,
        stackId: 'ownStack1',
        neededCard: BodyPart.Head,
        priority: 'high'
      }];

      mockGameAnalysis.blockingOpportunities = [{
        character: Character.Pirate,
        stackId: 'opponentStack1',
        targetPile: BodyPart.Head,
        urgency: 'critical'
      }];

      mockGameAnalysis.gamePhase = 'mid';

      const evaluations = selector.evaluateAllMoves(hand, mockGameAnalysis, [ownStack], [opponentStack]);

      // Should prioritize completion over blocking
      expect(evaluations.length).toBeGreaterThan(0);
      const bestMove = evaluations[0];
      expect(bestMove.type).toBe('completion');
      expect(bestMove.card.character).toBe(Character.Ninja);
      expect(bestMove.value).toBeGreaterThanOrEqual(1000);
    });
  });
});