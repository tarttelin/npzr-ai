import { MoveEvaluator, MoveEvaluation } from './MoveEvaluator.js';
import { Card, Character, BodyPart } from './Card.js';
import { Stack } from './Stack.js';
import { GameStateAnalyzer } from './GameStateAnalyzer.js';
import { Score } from './Score.js';
import { Hand } from './Hand.js';

describe('MoveEvaluator', () => {
  let evaluator: MoveEvaluator;
  let analyzer: GameStateAnalyzer;

  beforeEach(() => {
    evaluator = new MoveEvaluator();
    analyzer = new GameStateAnalyzer();
  });

  describe('Basic Move Evaluation', () => {
    test('should evaluate basic moves between stacks', () => {
      // Create test stacks
      const stack1 = new Stack('stack1', 'player1');
      const stack2 = new Stack('stack2', 'player1');
      const stack3 = new Stack('stack3', 'player2');

      const ninjaHead = new Card('card1', Character.Ninja, BodyPart.Head);
      const ninjaTorso = new Card('card2', Character.Ninja, BodyPart.Torso);
      const ninjaLegs = new Card('card3', Character.Ninja, BodyPart.Legs);

      stack1.addCard(ninjaHead, BodyPart.Head);
      stack2.addCard(ninjaTorso, BodyPart.Torso);
      stack3.addCard(ninjaLegs, BodyPart.Legs);

      const ownStacks = [stack1, stack2];
      const opponentStacks = [stack3];
      const hand = new Hand();
      const myScore = new Score();
      const opponentScore = new Score();
      const analysis = analyzer.analyzeGameState(ownStacks, opponentStacks, hand, myScore, opponentScore);

      const evaluations = evaluator.evaluateAllMoves(ownStacks, opponentStacks, analysis);

      expect(evaluations).toHaveLength(12); // 2 own stacks × 2 target stacks × 3 piles
      expect(evaluations[0]).toHaveProperty('value');
      expect(evaluations[0]).toHaveProperty('reasoning');
      expect(evaluations[0]).toHaveProperty('type');
    });

    test('should prioritize completion moves', () => {
      const stack1 = new Stack('stack1', 'player1');
      const stack2 = new Stack('stack2', 'player1');

      const ninjaHead = new Card('card1', Character.Ninja, BodyPart.Head);
      const ninjaTorso = new Card('card2', Character.Ninja, BodyPart.Torso);
      const ninjaLegs = new Card('card3', Character.Ninja, BodyPart.Legs);

      // Stack1 has head and torso (needs legs)
      stack1.addCard(ninjaHead, BodyPart.Head);
      stack1.addCard(ninjaTorso, BodyPart.Torso);

      // Stack2 has legs that can complete stack1
      stack2.addCard(ninjaLegs, BodyPart.Legs);

      const ownStacks = [stack1, stack2];
      const hand = new Hand();
      const myScore = new Score();
      const opponentScore = new Score();
      const analysis = analyzer.analyzeGameState(ownStacks, [], hand, myScore, opponentScore);

      const evaluations = evaluator.evaluateAllMoves(ownStacks, [], analysis);

      // Find the completion move
      const completionMove = evaluations.find(e => e.completesStack);
      expect(completionMove).toBeDefined();
      expect(completionMove!.value).toBeGreaterThan(1000);
      expect(completionMove!.type).toBe('completion');
    });

    test('should evaluate disruption moves (stealing opponent pieces)', () => {
      const ownStack = new Stack('stack1', 'player1');
      const opponentStack = new Stack('stack2', 'player2');

      const ninjaHead = new Card('card1', Character.Ninja, BodyPart.Head);
      const pirateHead = new Card('card2', Character.Pirate, BodyPart.Head);

      ownStack.addCard(ninjaHead, BodyPart.Head);
      opponentStack.addCard(pirateHead, BodyPart.Head);

      const ownStacks = [ownStack];
      const opponentStacks = [opponentStack];
      const hand = new Hand();
      const myScore = new Score();
      const opponentScore = new Score();
      const analysis = analyzer.analyzeGameState(ownStacks, opponentStacks, hand, myScore, opponentScore);

      const evaluations = evaluator.evaluateAllMoves(ownStacks, opponentStacks, analysis);

      // Find disruption moves (stealing from opponent)
      const disruptionMoves = evaluations.filter(e => e.disruptsOpponent);
      expect(disruptionMoves).toHaveLength(9); // 3 piles × 3 possible targets
      expect(disruptionMoves[0].value).toBeGreaterThan(300);
      expect(disruptionMoves[0].type).toBe('disruption');
    });
  });

  describe('New Stack Creation', () => {
    test('should evaluate creating new stacks', () => {
      const stack1 = new Stack('stack1', 'player1');
      const ninjaHead = new Card('card1', Character.Ninja, BodyPart.Head);
      const pirateHead = new Card('card2', Character.Pirate, BodyPart.Head);

      // Stack has mixed characters - should want to separate
      stack1.addCard(ninjaHead, BodyPart.Head);
      stack1.addCard(pirateHead, BodyPart.Torso);

      const ownStacks = [stack1];
      const hand = new Hand();
      const myScore = new Score();
      const opponentScore = new Score();
      const analysis = analyzer.analyzeGameState(ownStacks, [], hand, myScore, opponentScore);

      const evaluations = evaluator.evaluateAllMoves(ownStacks, [], analysis);

      // Find new stack creation moves (toStack is null)
      const newStackMoves = evaluations.filter(e => e.toStack === null);
      expect(newStackMoves).toHaveLength(2); // 2 cards can create new stacks
      expect(newStackMoves[0].value).toBeGreaterThan(100);
      expect(newStackMoves[0].type).toBe('organization');
    });

    test('should prefer new stack creation for better organization', () => {
      const stack1 = new Stack('stack1', 'player1');
      const ninjaHead = new Card('card1', Character.Ninja, BodyPart.Head);
      const pirateHead = new Card('card2', Character.Pirate, BodyPart.Head);

      stack1.addCard(ninjaHead, BodyPart.Head);
      stack1.addCard(pirateHead, BodyPart.Torso);

      const ownStacks = [stack1];
      const hand = new Hand();
      const myScore = new Score();
      const opponentScore = new Score();
      const analysis = analyzer.analyzeGameState(ownStacks, [], hand, myScore, opponentScore);

      const evaluations = evaluator.evaluateAllMoves(ownStacks, [], analysis);

      // New stack creation should be valued for organization
      const newStackMove = evaluations.find(e => e.toStack === null);
      expect(newStackMove).toBeDefined();
      expect(newStackMove!.reasoning).toContain('organization');
    });
  });

  describe('Cascade Opportunities', () => {
    test('should identify cascade opportunities', () => {
      const stack1 = new Stack('stack1', 'player1');
      const stack2 = new Stack('stack2', 'player1');

      const ninjaHead = new Card('card1', Character.Ninja, BodyPart.Head);
      const ninjaTorso = new Card('card2', Character.Ninja, BodyPart.Torso);
      const ninjaLegs = new Card('card3', Character.Ninja, BodyPart.Legs);

      // Stack1 is almost complete (missing legs)
      stack1.addCard(ninjaHead, BodyPart.Head);
      stack1.addCard(ninjaTorso, BodyPart.Torso);

      // Stack2 has the needed legs
      stack2.addCard(ninjaLegs, BodyPart.Legs);

      const ownStacks = [stack1, stack2];
      const hand = new Hand();
      const myScore = new Score();
      const opponentScore = new Score();
      const analysis = analyzer.analyzeGameState(ownStacks, [], hand, myScore, opponentScore);

      const cascadeOpportunities = evaluator.findCascadeOpportunities(ownStacks, analysis);

      expect(cascadeOpportunities).toHaveLength(1);
      expect(cascadeOpportunities[0].createsCascade).toBe(true);
      expect(cascadeOpportunities[0].completesStack).toBe(true);
      expect(cascadeOpportunities[0].value).toBeGreaterThanOrEqual(1500);
    });

    test('should calculate cascade potential correctly', () => {
      const stack1 = new Stack('stack1', 'player1');
      const stack2 = new Stack('stack2', 'player1');
      const stack3 = new Stack('stack3', 'player1');

      // Create a scenario with multiple near-complete stacks
      const ninjaHead1 = new Card('card1', Character.Ninja, BodyPart.Head);
      const ninjaTorso1 = new Card('card2', Character.Ninja, BodyPart.Torso);
      const ninjaLegs1 = new Card('card3', Character.Ninja, BodyPart.Legs);

      const pirateHead = new Card('card4', Character.Pirate, BodyPart.Head);
      const pirateTorso = new Card('card5', Character.Pirate, BodyPart.Torso);

      // Stack1: Complete Ninja stack ready to complete
      stack1.addCard(ninjaHead1, BodyPart.Head);
      stack1.addCard(ninjaTorso1, BodyPart.Torso);

      // Stack2: Has needed legs + partial Pirate
      stack2.addCard(ninjaLegs1, BodyPart.Legs);
      stack2.addCard(pirateHead, BodyPart.Head);

      // Stack3: More Pirate pieces
      stack3.addCard(pirateTorso, BodyPart.Torso);

      const ownStacks = [stack1, stack2, stack3];
      const hand = new Hand();
      const myScore = new Score();
      const opponentScore = new Score();
      const analysis = analyzer.analyzeGameState(ownStacks, [], hand, myScore, opponentScore);

      const cascadeOpportunities = evaluator.findCascadeOpportunities(ownStacks, analysis);

      expect(cascadeOpportunities.length).toBeGreaterThan(0);
      
      // Should have high value due to cascade potential
      const bestCascade = cascadeOpportunities[0];
      expect(bestCascade.value).toBeGreaterThanOrEqual(1500);
    });
  });

  describe('Disruption Moves', () => {
    test('should find disruption moves by stealing opponent pieces', () => {
      const ownStack = new Stack('stack1', 'player1');
      const opponentStack = new Stack('stack2', 'player2');

      const ninjaHead = new Card('card1', Character.Ninja, BodyPart.Head);
      const ninjaLegs = new Card('card2', Character.Ninja, BodyPart.Legs);
      const pirateHead = new Card('card3', Character.Pirate, BodyPart.Head);

      // Own stack partially built
      ownStack.addCard(ninjaHead, BodyPart.Head);

      // Opponent has valuable pieces
      opponentStack.addCard(ninjaLegs, BodyPart.Legs);
      opponentStack.addCard(pirateHead, BodyPart.Torso);

      const ownStacks = [ownStack];
      const opponentStacks = [opponentStack];
      const hand = new Hand();
      const myScore = new Score();
      const opponentScore = new Score();
      const analysis = analyzer.analyzeGameState(ownStacks, opponentStacks, hand, myScore, opponentScore);

      const disruptionMoves = evaluator.findDisruptionMoves(ownStacks, opponentStacks, analysis);

      expect(disruptionMoves.length).toBeGreaterThan(0);
      expect(disruptionMoves[0].disruptsOpponent).toBe(true);
      expect(disruptionMoves[0].type).toBe('disruption');

      // Should prefer moves that help own completion
      const helpfulDisruption = disruptionMoves.find(m => 
        m.card.character === Character.Ninja && m.card.bodyPart === BodyPart.Legs
      );
      expect(helpfulDisruption).toBeDefined();
    });

    test('should value disruption moves based on opponent progress', () => {
      const ownStack = new Stack('stack1', 'player1');
      const opponentStack = new Stack('stack2', 'player2');

      const ninjaHead = new Card('card1', Character.Ninja, BodyPart.Head);
      const ninjaTorso = new Card('card2', Character.Ninja, BodyPart.Torso);
      const ninjaLegs = new Card('card3', Character.Ninja, BodyPart.Legs);

      // Opponent stack almost complete (2/3)
      opponentStack.addCard(ninjaHead, BodyPart.Head);
      opponentStack.addCard(ninjaTorso, BodyPart.Torso);
      opponentStack.addCard(ninjaLegs, BodyPart.Legs);

      const ownStacks = [ownStack];
      const opponentStacks = [opponentStack];
      const hand = new Hand();
      const myScore = new Score();
      const opponentScore = new Score();
      const analysis = analyzer.analyzeGameState(ownStacks, opponentStacks, hand, myScore, opponentScore);

      const disruptionMoves = evaluator.findDisruptionMoves(ownStacks, opponentStacks, analysis);

      // Should have high value due to opponent's high progress
      expect(disruptionMoves[0].value).toBeGreaterThan(600);
    });
  });

  describe('Stack Organization', () => {
    test('should find consolidation opportunities', () => {
      const stack1 = new Stack('stack1', 'player1');
      const stack2 = new Stack('stack2', 'player1');

      const ninjaHead = new Card('card1', Character.Ninja, BodyPart.Head);
      const ninjaTorso = new Card('card2', Character.Ninja, BodyPart.Torso);
      const ninjaLegs = new Card('card3', Character.Ninja, BodyPart.Legs);
      const pirateHead = new Card('card4', Character.Pirate, BodyPart.Head);

      // Stack1: Mixed ninja pieces
      stack1.addCard(ninjaHead, BodyPart.Head);
      stack1.addCard(pirateHead, BodyPart.Torso);

      // Stack2: More ninja pieces
      stack2.addCard(ninjaTorso, BodyPart.Torso);
      stack2.addCard(ninjaLegs, BodyPart.Legs);

      const ownStacks = [stack1, stack2];
      const organizationMoves = evaluator.optimizeStackOrganization(ownStacks);

      expect(organizationMoves.length).toBeGreaterThan(0);
      expect(organizationMoves[0].type).toBe('organization');
      expect(organizationMoves[0].reasoning).toContain('Consolidate');
    });
  });

  describe('Move Selection', () => {
    test('should select best move based on value', () => {
      const evaluations: MoveEvaluation[] = [
        {
          fromStack: new Stack('s1', 'p1'),
          fromPile: BodyPart.Head,
          toStack: new Stack('s2', 'p1'),
          toPile: BodyPart.Head,
          cardId: 'card1',
          card: new Card('card1', Character.Ninja, BodyPart.Head),
          value: 100,
          reasoning: 'Low value move',
          createsCascade: false,
          completesStack: false,
          disruptsOpponent: false,
          type: 'neutral'
        },
        {
          fromStack: new Stack('s1', 'p1'),
          fromPile: BodyPart.Torso,
          toStack: new Stack('s2', 'p1'),
          toPile: BodyPart.Torso,
          cardId: 'card2',
          card: new Card('card2', Character.Ninja, BodyPart.Torso),
          value: 1500,
          reasoning: 'High value move',
          createsCascade: true,
          completesStack: true,
          disruptsOpponent: false,
          type: 'completion'
        }
      ];

      const bestMove = evaluator.selectBestMove(evaluations);

      expect(bestMove).toBeDefined();
      expect(bestMove!.value).toBe(1500);
      expect(bestMove!.type).toBe('completion');
    });

    test('should return null when no moves available', () => {
      const bestMove = evaluator.selectBestMove([]);
      expect(bestMove).toBeNull();
    });
  });

  describe('Wild Card Handling', () => {
    test('should handle wild cards in move evaluation', () => {
      const stack1 = new Stack('stack1', 'player1');
      const stack2 = new Stack('stack2', 'player1');

      const ninjaHead = new Card('card1', Character.Ninja, BodyPart.Head);
      const wildCard = new Card('card2', Character.Wild, BodyPart.Wild);
      wildCard.nominate(Character.Ninja, BodyPart.Torso);

      stack1.addCard(ninjaHead, BodyPart.Head);
      stack2.addCard(wildCard, BodyPart.Torso);

      const ownStacks = [stack1, stack2];
      const hand = new Hand();
      const myScore = new Score();
      const opponentScore = new Score();
      const analysis = analyzer.analyzeGameState(ownStacks, [], hand, myScore, opponentScore);

      const evaluations = evaluator.evaluateAllMoves(ownStacks, [], analysis);

      // Should find moves involving the wild card
      const wildCardMoves = evaluations.filter(e => e.card.isWild());
      expect(wildCardMoves.length).toBeGreaterThan(0);
    });

    test('should clear nominations when moving wild cards', () => {
      const stack1 = new Stack('stack1', 'player1');
      const wildCard = new Card('card1', Character.Wild, BodyPart.Wild);
      wildCard.nominate(Character.Ninja, BodyPart.Head);

      stack1.addCard(wildCard, BodyPart.Head);

      const ownStacks = [stack1];
      const hand = new Hand();
      const myScore = new Score();
      const opponentScore = new Score();
      const analysis = analyzer.analyzeGameState(ownStacks, [], hand, myScore, opponentScore);

      const evaluations = evaluator.evaluateAllMoves(ownStacks, [], analysis);

      // Wild card should be available for moves
      const wildCardMove = evaluations.find(e => e.card.isWild());
      expect(wildCardMove).toBeDefined();
    });
  });

  describe('Performance', () => {
    test('should complete evaluation in reasonable time', () => {
      // Create multiple stacks with cards for performance testing
      const ownStacks: Stack[] = [];
      const opponentStacks: Stack[] = [];

      for (let i = 0; i < 5; i++) {
        const ownStack = new Stack(`own${i}`, 'player1');
        const oppStack = new Stack(`opp${i}`, 'player2');

        const characters = [Character.Ninja, Character.Pirate, Character.Zombie, Character.Robot];
        const bodyParts = [BodyPart.Head, BodyPart.Torso, BodyPart.Legs];

        for (let j = 0; j < 3; j++) {
          const char = characters[Math.floor(Math.random() * characters.length)];
          const part = bodyParts[j];
          
          const ownCard = new Card(`own${i}_${j}`, char, part);
          const oppCard = new Card(`opp${i}_${j}`, char, part);

          ownStack.addCard(ownCard, part);
          oppStack.addCard(oppCard, part);
        }

        ownStacks.push(ownStack);
        opponentStacks.push(oppStack);
      }

      const hand = new Hand();
      const myScore = new Score();
      const opponentScore = new Score();
      const analysis = analyzer.analyzeGameState(ownStacks, opponentStacks, hand, myScore, opponentScore);

      const startTime = performance.now();
      const evaluations = evaluator.evaluateAllMoves(ownStacks, opponentStacks, analysis);
      const endTime = performance.now();

      const executionTime = endTime - startTime;

      expect(evaluations.length).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(100); // Should complete in under 100ms
    });
  });
});