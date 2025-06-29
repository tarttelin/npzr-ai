import { GameStateAnalyzer, CompletionOpportunity, DisruptionOpportunity } from './GameStateAnalyzer.js';
import { GameEngine } from './GameEngine.js';
import { Player } from './Player.js';
import { Card, Character, BodyPart } from './Card.js';
import { Stack } from './Stack.js';
import { Hand } from './Hand.js';
import { Score } from './Score.js';

describe('GameStateAnalyzer', () => {
  let analyzer: GameStateAnalyzer;
  let gameEngine: GameEngine;
  let player1: Player;
  let player2: Player;

  beforeEach(() => {
    analyzer = new GameStateAnalyzer();
    gameEngine = new GameEngine();
    gameEngine.createGame();
    player1 = gameEngine.addPlayer('Player1');
    player2 = gameEngine.addPlayer('Player2');
    
    // Use the players to avoid unused variable warnings
    void player1;
    void player2;
  });

  describe('analyzeStacks', () => {
    test('should analyze empty stacks correctly', () => {
      const emptyScore = new Score();
      const result = analyzer.analyzeStacks([], emptyScore);
      
      expect(result.size).toBe(4);
      expect(result.get(Character.Ninja)).toEqual({
        character: Character.Ninja,
        hasHead: false,
        hasTorso: false,
        hasLegs: false,
        completionLevel: 0,
        isComplete: false,
        missingPieces: [BodyPart.Head, BodyPart.Torso, BodyPart.Legs]
      });
    });

    test('should analyze single character stack progress', () => {
      // Create a stack with ninja head and torso
      const stack = new Stack('stack1', 'player1');
      const ninjaHead = new Card('card1', Character.Ninja, BodyPart.Head);
      const ninjaTorso = new Card('card2', Character.Ninja, BodyPart.Torso);
      
      stack.addCard(ninjaHead, BodyPart.Head);
      stack.addCard(ninjaTorso, BodyPart.Torso);

      const emptyScore = new Score();
      const result = analyzer.analyzeStacks([stack], emptyScore);
      const ninjaProgress = result.get(Character.Ninja);

      expect(ninjaProgress).toEqual({
        character: Character.Ninja,
        hasHead: true,
        hasTorso: true,
        hasLegs: false,
        completionLevel: 2,
        isComplete: false,
        missingPieces: [BodyPart.Legs]
      });
    });

    test('should identify completed stack', () => {
      const stack = new Stack('stack1', 'player1');
      const ninjaHead = new Card('card1', Character.Ninja, BodyPart.Head);
      const ninjaTorso = new Card('card2', Character.Ninja, BodyPart.Torso);
      const ninjaLegs = new Card('card3', Character.Ninja, BodyPart.Legs);
      
      stack.addCard(ninjaHead, BodyPart.Head);
      stack.addCard(ninjaTorso, BodyPart.Torso);
      stack.addCard(ninjaLegs, BodyPart.Legs);

      const emptyScore = new Score();
      const result = analyzer.analyzeStacks([stack], emptyScore);
      const ninjaProgress = result.get(Character.Ninja);

      expect(ninjaProgress).toEqual({
        character: Character.Ninja,
        hasHead: true,
        hasTorso: true,
        hasLegs: true,
        completionLevel: 3,
        isComplete: true,
        missingPieces: []
      });
    });

    test('should handle multiple character stacks', () => {
      const ninjaStack = new Stack('stack1', 'player1');
      const pirateStack = new Stack('stack2', 'player1');
      
      ninjaStack.addCard(new Card('card1', Character.Ninja, BodyPart.Head), BodyPart.Head);
      pirateStack.addCard(new Card('card2', Character.Pirate, BodyPart.Torso), BodyPart.Torso);
      pirateStack.addCard(new Card('card3', Character.Pirate, BodyPart.Legs), BodyPart.Legs);

      const emptyScore = new Score();
      const result = analyzer.analyzeStacks([ninjaStack, pirateStack], emptyScore);
      
      expect(result.get(Character.Ninja)?.completionLevel).toBe(1);
      expect(result.get(Character.Pirate)?.completionLevel).toBe(2);
      expect(result.get(Character.Zombie)?.completionLevel).toBe(0);
      expect(result.get(Character.Robot)?.completionLevel).toBe(0);
    });

    test('should handle wild cards in stacks', () => {
      const stack = new Stack('stack1', 'player1');
      const wildCard = new Card('card1', Character.Wild, BodyPart.Head);
      wildCard.nominate(Character.Ninja, BodyPart.Head);
      stack.addCard(wildCard, BodyPart.Head);

      const emptyScore = new Score();
      const result = analyzer.analyzeStacks([stack], emptyScore);
      const ninjaProgress = result.get(Character.Ninja);

      expect(ninjaProgress?.hasHead).toBe(true);
      expect(ninjaProgress?.completionLevel).toBe(1);
    });

    test('should include already scored characters as complete', () => {
      const score = new Score();
      score.addCharacter(Character.Ninja);
      score.addCharacter(Character.Pirate);

      // Create an incomplete stack for zombie
      const zombieStack = new Stack('stack1', 'player1');
      zombieStack.addCard(new Card('card1', Character.Zombie, BodyPart.Head), BodyPart.Head);

      const result = analyzer.analyzeStacks([zombieStack], score);

      // Ninja and Pirate should be marked as complete from score
      expect(result.get(Character.Ninja)).toEqual({
        character: Character.Ninja,
        hasHead: true,
        hasTorso: true,
        hasLegs: true,
        completionLevel: 3,
        isComplete: true,
        missingPieces: []
      });

      expect(result.get(Character.Pirate)).toEqual({
        character: Character.Pirate,
        hasHead: true,
        hasTorso: true,
        hasLegs: true,
        completionLevel: 3,
        isComplete: true,
        missingPieces: []
      });

      // Zombie should show stack progress
      expect(result.get(Character.Zombie)?.completionLevel).toBe(1);
      expect(result.get(Character.Zombie)?.isComplete).toBe(false);

      // Robot should be empty
      expect(result.get(Character.Robot)?.completionLevel).toBe(0);
    });
  });

  describe('analyzeHand', () => {
    test('should separate regular cards from wild cards', () => {
      const hand = new Hand();
      hand.add(new Card('card1', Character.Ninja, BodyPart.Head));
      hand.add(new Card('card2', Character.Wild, BodyPart.Wild));
      hand.add(new Card('card3', Character.Pirate, BodyPart.Torso));
      hand.add(new Card('card4', Character.Wild, BodyPart.Head));

      const result = analyzer.analyzeHand(hand);

      expect(result.regularCards).toHaveLength(2);
      expect(result.wildCards).toHaveLength(2);
      expect(result.regularCards[0].character).toBe(Character.Ninja);
      expect(result.regularCards[1].character).toBe(Character.Pirate);
      expect(result.wildCards[0].isWild()).toBe(true);
      expect(result.wildCards[1].isWild()).toBe(true);
    });

    test('should handle hand with only regular cards', () => {
      const hand = new Hand();
      hand.add(new Card('card1', Character.Ninja, BodyPart.Head));
      hand.add(new Card('card2', Character.Pirate, BodyPart.Torso));

      const result = analyzer.analyzeHand(hand);

      expect(result.regularCards).toHaveLength(2);
      expect(result.wildCards).toHaveLength(0);
    });

    test('should handle hand with only wild cards', () => {
      const hand = new Hand();
      hand.add(new Card('card1', Character.Wild, BodyPart.Wild));
      hand.add(new Card('card2', Character.Wild, BodyPart.Head));

      const result = analyzer.analyzeHand(hand);

      expect(result.regularCards).toHaveLength(0);
      expect(result.wildCards).toHaveLength(2);
    });

    test('should handle empty hand', () => {
      const hand = new Hand();

      const result = analyzer.analyzeHand(hand);

      expect(result.regularCards).toHaveLength(0);
      expect(result.wildCards).toHaveLength(0);
    });
  });

  describe('assessThreatLevel', () => {
    test('should return low threat for no progress', () => {
      const progress = new Map([
        [Character.Ninja, { character: Character.Ninja, hasHead: false, hasTorso: false, hasLegs: false, completionLevel: 0, isComplete: false, missingPieces: [BodyPart.Head, BodyPart.Torso, BodyPart.Legs] }],
        [Character.Pirate, { character: Character.Pirate, hasHead: false, hasTorso: false, hasLegs: false, completionLevel: 0, isComplete: false, missingPieces: [BodyPart.Head, BodyPart.Torso, BodyPart.Legs] }],
        [Character.Zombie, { character: Character.Zombie, hasHead: false, hasTorso: false, hasLegs: false, completionLevel: 0, isComplete: false, missingPieces: [BodyPart.Head, BodyPart.Torso, BodyPart.Legs] }],
        [Character.Robot, { character: Character.Robot, hasHead: false, hasTorso: false, hasLegs: false, completionLevel: 0, isComplete: false, missingPieces: [BodyPart.Head, BodyPart.Torso, BodyPart.Legs] }]
      ]);

      const result = analyzer.assessThreatLevel(progress);
      expect(result).toBe('low');
    });

    test('should return medium threat for 1 character with 2/3 pieces', () => {
      const progress = new Map([
        [Character.Ninja, { character: Character.Ninja, hasHead: true, hasTorso: true, hasLegs: false, completionLevel: 2, isComplete: false, missingPieces: [BodyPart.Legs] }],
        [Character.Pirate, { character: Character.Pirate, hasHead: false, hasTorso: false, hasLegs: false, completionLevel: 0, isComplete: false, missingPieces: [BodyPart.Head, BodyPart.Torso, BodyPart.Legs] }],
        [Character.Zombie, { character: Character.Zombie, hasHead: false, hasTorso: false, hasLegs: false, completionLevel: 0, isComplete: false, missingPieces: [BodyPart.Head, BodyPart.Torso, BodyPart.Legs] }],
        [Character.Robot, { character: Character.Robot, hasHead: false, hasTorso: false, hasLegs: false, completionLevel: 0, isComplete: false, missingPieces: [BodyPart.Head, BodyPart.Torso, BodyPart.Legs] }]
      ]);

      const result = analyzer.assessThreatLevel(progress);
      expect(result).toBe('medium');
    });

    test('should return high threat for 2+ characters with 2/3 pieces', () => {
      const progress = new Map([
        [Character.Ninja, { character: Character.Ninja, hasHead: true, hasTorso: true, hasLegs: false, completionLevel: 2, isComplete: false, missingPieces: [BodyPart.Legs] }],
        [Character.Pirate, { character: Character.Pirate, hasHead: true, hasTorso: true, hasLegs: false, completionLevel: 2, isComplete: false, missingPieces: [BodyPart.Legs] }],
        [Character.Zombie, { character: Character.Zombie, hasHead: false, hasTorso: false, hasLegs: false, completionLevel: 0, isComplete: false, missingPieces: [BodyPart.Head, BodyPart.Torso, BodyPart.Legs] }],
        [Character.Robot, { character: Character.Robot, hasHead: false, hasTorso: false, hasLegs: false, completionLevel: 0, isComplete: false, missingPieces: [BodyPart.Head, BodyPart.Torso, BodyPart.Legs] }]
      ]);

      const result = analyzer.assessThreatLevel(progress);
      expect(result).toBe('high');
    });

    test('should return high threat for 3+ completed characters', () => {
      const progress = new Map([
        [Character.Ninja, { character: Character.Ninja, hasHead: true, hasTorso: true, hasLegs: true, completionLevel: 3, isComplete: true, missingPieces: [] }],
        [Character.Pirate, { character: Character.Pirate, hasHead: true, hasTorso: true, hasLegs: true, completionLevel: 3, isComplete: true, missingPieces: [] }],
        [Character.Zombie, { character: Character.Zombie, hasHead: true, hasTorso: true, hasLegs: true, completionLevel: 3, isComplete: true, missingPieces: [] }],
        [Character.Robot, { character: Character.Robot, hasHead: false, hasTorso: false, hasLegs: false, completionLevel: 0, isComplete: false, missingPieces: [BodyPart.Head, BodyPart.Torso, BodyPart.Legs] }]
      ]);

      const result = analyzer.assessThreatLevel(progress);
      expect(result).toBe('high');
    });
  });

  describe('determineGamePhase', () => {
    test('should return early phase for total completions < 2', () => {
      const ownScore = new Score();
      const opponentScore = new Score();
      
      const result = analyzer.determineGamePhase(ownScore, opponentScore);
      expect(result).toBe('early');
    });

    test('should return mid phase for total completions 2-4', () => {
      const ownScore = new Score();
      const opponentScore = new Score();
      ownScore.addCharacter(Character.Ninja);
      ownScore.addCharacter(Character.Pirate);
      opponentScore.addCharacter(Character.Zombie);
      
      const result = analyzer.determineGamePhase(ownScore, opponentScore);
      expect(result).toBe('mid');
    });

    test('should return late phase for total completions > 4', () => {
      const ownScore = new Score();
      const opponentScore = new Score();
      ownScore.addCharacter(Character.Ninja);
      ownScore.addCharacter(Character.Pirate);
      ownScore.addCharacter(Character.Zombie);
      opponentScore.addCharacter(Character.Robot);
      opponentScore.addCharacter(Character.Ninja);
      
      const result = analyzer.determineGamePhase(ownScore, opponentScore);
      expect(result).toBe('late');
    });
  });

  describe('findCompletionOpportunities', () => {
    test('should find opportunities with matching cards', () => {
      const stack = new Stack('stack1', 'player1');
      stack.addCard(new Card('card1', Character.Ninja, BodyPart.Head), BodyPart.Head);
      stack.addCard(new Card('card2', Character.Ninja, BodyPart.Torso), BodyPart.Torso);

      const hand = [
        new Card('card3', Character.Ninja, BodyPart.Legs),
        new Card('card4', Character.Pirate, BodyPart.Head)
      ];

      const emptyScore = new Score();
      const result = analyzer.findCompletionOpportunities(hand, [stack], emptyScore);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        character: Character.Ninja,
        stackId: 'stack1',
        neededCard: BodyPart.Legs,
        priority: 'high'
      });
    });

    test('should find opportunities with wild cards', () => {
      const stack = new Stack('stack1', 'player1');
      stack.addCard(new Card('card1', Character.Pirate, BodyPart.Head), BodyPart.Head);
      stack.addCard(new Card('card2', Character.Pirate, BodyPart.Torso), BodyPart.Torso);

      const hand = [
        new Card('card3', Character.Wild, BodyPart.Wild),
        new Card('card4', Character.Ninja, BodyPart.Head)
      ];

      const emptyScore = new Score();
      const result = analyzer.findCompletionOpportunities(hand, [stack], emptyScore);

      expect(result).toHaveLength(1);
      expect(result[0].character).toBe(Character.Pirate);
      expect(result[0].priority).toBe('high');
    });

    test('should return empty array when no opportunities exist', () => {
      const stack = new Stack('stack1', 'player1');
      stack.addCard(new Card('card1', Character.Ninja, BodyPart.Head), BodyPart.Head);

      const hand = [
        new Card('card2', Character.Pirate, BodyPart.Head)
      ];

      const emptyScore = new Score();
      const result = analyzer.findCompletionOpportunities(hand, [stack], emptyScore);
      expect(result).toHaveLength(0);
    });

    test('should prioritize high priority opportunities', () => {
      const stack1 = new Stack('stack1', 'player1');
      const stack2 = new Stack('stack2', 'player1');
      
      // Stack 1: 2/3 complete (high priority)
      stack1.addCard(new Card('card1', Character.Ninja, BodyPart.Head), BodyPart.Head);
      stack1.addCard(new Card('card2', Character.Ninja, BodyPart.Torso), BodyPart.Torso);
      
      // Stack 2: 1/3 complete (medium priority) 
      stack2.addCard(new Card('card3', Character.Pirate, BodyPart.Head), BodyPart.Head);

      const hand = [
        new Card('card4', Character.Ninja, BodyPart.Legs),
        new Card('card5', Character.Pirate, BodyPart.Torso)
      ];

      const emptyScore = new Score();
      const result = analyzer.findCompletionOpportunities(hand, [stack1, stack2], emptyScore);

      expect(result).toHaveLength(1); // Only high priority one found
      expect(result[0].priority).toBe('high');
      expect(result[0].character).toBe(Character.Ninja);
    });

    test('should not suggest completing already scored characters', () => {
      const stack = new Stack('stack1', 'player1');
      stack.addCard(new Card('card1', Character.Ninja, BodyPart.Head), BodyPart.Head);
      stack.addCard(new Card('card2', Character.Ninja, BodyPart.Torso), BodyPart.Torso);

      const hand = [
        new Card('card3', Character.Ninja, BodyPart.Legs)
      ];

      // Ninja is already scored
      const score = new Score();
      score.addCharacter(Character.Ninja);

      const result = analyzer.findCompletionOpportunities(hand, [stack], score);

      // Should not suggest completing ninja since it's already scored
      expect(result).toHaveLength(0);
    });
  });

  describe('findBlockingOpportunities', () => {
    test('should find critical blocking opportunities by disrupting existing pieces', () => {
      const stack = new Stack('stack1', 'opponent');
      stack.addCard(new Card('card1', Character.Ninja, BodyPart.Head), BodyPart.Head);
      stack.addCard(new Card('card2', Character.Ninja, BodyPart.Torso), BodyPart.Torso);

      const hand = [
        new Card('card3', Character.Pirate, BodyPart.Head), // Can disrupt ninja head
        new Card('card4', Character.Zombie, BodyPart.Torso)  // Can disrupt ninja torso
      ];

      const emptyScore = new Score();
      const result = analyzer.findDisruptionOpportunities(hand, [stack], emptyScore);

      expect(result).toHaveLength(2);
      expect(result).toEqual(expect.arrayContaining([
        {
          character: Character.Ninja,
          stackId: 'stack1',
          targetPile: BodyPart.Head,
          urgency: 'critical'
        },
        {
          character: Character.Ninja,
          stackId: 'stack1',
          targetPile: BodyPart.Torso,
          urgency: 'critical'
        }
      ]));
    });

    test('should find blocking opportunities with wild cards', () => {
      const stack = new Stack('stack1', 'opponent');
      stack.addCard(new Card('card1', Character.Pirate, BodyPart.Head), BodyPart.Head);
      stack.addCard(new Card('card2', Character.Pirate, BodyPart.Torso), BodyPart.Torso);

      const hand = [
        new Card('card3', Character.Wild, BodyPart.Head)  // Can disrupt pirate head only
      ];

      const emptyScore = new Score();
      const result = analyzer.findDisruptionOpportunities(hand, [stack], emptyScore);

      // Wild card can disrupt both head and torso since it's universal
      expect(result).toHaveLength(2);
      expect(result).toEqual(expect.arrayContaining([
        {
          character: Character.Pirate,
          stackId: 'stack1',
          targetPile: BodyPart.Head,
          urgency: 'critical'
        },
        {
          character: Character.Pirate,
          stackId: 'stack1',
          targetPile: BodyPart.Torso,
          urgency: 'critical'
        }
      ]));
    });

    test('should return empty array when no blocking opportunities exist', () => {
      const stack = new Stack('stack1', 'opponent');
      stack.addCard(new Card('card1', Character.Ninja, BodyPart.Head), BodyPart.Head);

      const hand = [
        new Card('card2', Character.Pirate, BodyPart.Torso)  // Can't disrupt ninja head with pirate torso
      ];

      const emptyScore = new Score();
      const result = analyzer.findDisruptionOpportunities(hand, [stack], emptyScore);
      expect(result).toHaveLength(0);
    });
  });

  describe('analyzeGameState', () => {
    test('should provide comprehensive game analysis', () => {
      // Setup game state
      const ownStack = new Stack('stack1', 'player1');
      ownStack.addCard(new Card('card1', Character.Ninja, BodyPart.Head), BodyPart.Head);
      ownStack.addCard(new Card('card2', Character.Ninja, BodyPart.Torso), BodyPart.Torso);

      const opponentStack = new Stack('stack2', 'player2');
      opponentStack.addCard(new Card('card3', Character.Pirate, BodyPart.Head), BodyPart.Head);

      const hand = new Hand();
      hand.add(new Card('card4', Character.Ninja, BodyPart.Legs));
      hand.add(new Card('card5', Character.Wild, BodyPart.Wild));

      const ownScore = new Score();
      const opponentScore = new Score();

      const result = analyzer.analyzeGameState(
        [ownStack], 
        [opponentStack], 
        hand, 
        ownScore, 
        opponentScore
      );

      expect(result.ownProgress.size).toBe(4);
      expect(result.opponentProgress.size).toBe(4);
      expect(result.ownWildCards).toHaveLength(1);
      expect(result.totalWildCards).toBe(1);
      expect(result.gamePhase).toBe('early');
      expect(result.threatLevel).toBe('low');
      expect(result.completionOpportunities).toHaveLength(1);
      expect(result.disruptionOpportunities).toHaveLength(1); // Wild card can disrupt opponent's pirate head
    });
  });

  describe('getAnalysisSummary', () => {
    test('should generate meaningful summary string', () => {
      const analysis = {
        ownProgress: new Map([
          [Character.Ninja, { character: Character.Ninja, hasHead: true, hasTorso: true, hasLegs: true, completionLevel: 3, isComplete: true, missingPieces: [] }],
          [Character.Pirate, { character: Character.Pirate, hasHead: false, hasTorso: false, hasLegs: false, completionLevel: 0, isComplete: false, missingPieces: [BodyPart.Head, BodyPart.Torso, BodyPart.Legs] }],
          [Character.Zombie, { character: Character.Zombie, hasHead: false, hasTorso: false, hasLegs: false, completionLevel: 0, isComplete: false, missingPieces: [BodyPart.Head, BodyPart.Torso, BodyPart.Legs] }],
          [Character.Robot, { character: Character.Robot, hasHead: false, hasTorso: false, hasLegs: false, completionLevel: 0, isComplete: false, missingPieces: [BodyPart.Head, BodyPart.Torso, BodyPart.Legs] }]
        ]),
        opponentProgress: new Map([
          [Character.Ninja, { character: Character.Ninja, hasHead: false, hasTorso: false, hasLegs: false, completionLevel: 0, isComplete: false, missingPieces: [BodyPart.Head, BodyPart.Torso, BodyPart.Legs] }],
          [Character.Pirate, { character: Character.Pirate, hasHead: true, hasTorso: true, hasLegs: false, completionLevel: 2, isComplete: false, missingPieces: [BodyPart.Legs] }],
          [Character.Zombie, { character: Character.Zombie, hasHead: false, hasTorso: false, hasLegs: false, completionLevel: 0, isComplete: false, missingPieces: [BodyPart.Head, BodyPart.Torso, BodyPart.Legs] }],
          [Character.Robot, { character: Character.Robot, hasHead: false, hasTorso: false, hasLegs: false, completionLevel: 0, isComplete: false, missingPieces: [BodyPart.Head, BodyPart.Torso, BodyPart.Legs] }]
        ]),
        ownWildCards: [],
        totalWildCards: 2,
        gamePhase: 'mid' as const,
        threatLevel: 'medium' as const,
        completionOpportunities: [{} as CompletionOpportunity, {} as CompletionOpportunity],
        disruptionOpportunities: []
      };

      const result = analyzer.getAnalysisSummary(analysis);

      expect(result).toContain('Phase=mid');
      expect(result).toContain('Threat=medium');
      expect(result).toContain('Own=1/4');
      expect(result).toContain('Opponent=0/4');
      expect(result).toContain('Wilds=2');
      expect(result).toContain('Opportunities=2');
    });
  });

  describe('Performance tests', () => {
    test('should complete analysis in under 50ms', () => {
      // Create large game state
      const ownStacks: Stack[] = [];
      const opponentStacks: Stack[] = [];
      
      for (let i = 0; i < 10; i++) {
        const stack = new Stack(`own-stack-${i}`, 'player1');
        stack.addCard(new Card(`card-${i}-1`, Character.Ninja, BodyPart.Head), BodyPart.Head);
        ownStacks.push(stack);
        
        const oppStack = new Stack(`opp-stack-${i}`, 'player2');
        oppStack.addCard(new Card(`opp-card-${i}-1`, Character.Pirate, BodyPart.Torso), BodyPart.Torso);
        opponentStacks.push(oppStack);
      }

      const hand = new Hand();
      for (let i = 0; i < 10; i++) {
        hand.add(new Card(`hand-card-${i}`, Character.Zombie, BodyPart.Legs));
      }

      const ownScore = new Score();
      const opponentScore = new Score();

      const startTime = performance.now();
      
      const result = analyzer.analyzeGameState(
        ownStacks, 
        opponentStacks, 
        hand, 
        ownScore, 
        opponentScore
      );
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(50);
      expect(result).toBeDefined();
    });
  });
});