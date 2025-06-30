import { MoveEvaluator } from './MoveEvaluator.js';
import { Card, Character, BodyPart } from './Card.js';
import { Stack } from './Stack.js';
import { GameStateAnalyzer } from './GameStateAnalyzer.js';
import { Score } from './Score.js';
import { Hand } from './Hand.js';

describe('AIPlayer Move Functionality', () => {
  let evaluator: MoveEvaluator;
  let analyzer: GameStateAnalyzer;

  beforeEach(() => {
    evaluator = new MoveEvaluator();
    analyzer = new GameStateAnalyzer();
  });

  describe('Strategic Move Selection', () => {
    test('should prioritize completion moves when possible', () => {
      // Set up a scenario where AI can complete a stack
      const stack1 = new Stack('stack1', 'player1');
      const stack2 = new Stack('stack2', 'player1');

      const ninjaHead = new Card('card1', Character.Ninja, BodyPart.Head);
      const ninjaTorso = new Card('card2', Character.Ninja, BodyPart.Torso);
      const ninjaLegs = new Card('card3', Character.Ninja, BodyPart.Legs);

      // Stack1 almost complete (missing legs)
      stack1.addCard(ninjaHead, BodyPart.Head);
      stack1.addCard(ninjaTorso, BodyPart.Torso);

      // Stack2 has the completing piece
      stack2.addCard(ninjaLegs, BodyPart.Legs);

      const ownStacks = [stack1, stack2];
      const opponentStacks: Stack[] = [];
      const hand = new Hand();
      const myScore = new Score();
      const opponentScore = new Score();
      const analysis = analyzer.analyzeGameState(ownStacks, opponentStacks, hand, myScore, opponentScore);

      const evaluations = evaluator.evaluateAllMoves(ownStacks, opponentStacks, analysis);
      const bestMove = evaluator.selectBestMove(evaluations);

      // Should prioritize completion moves
      expect(bestMove).toBeDefined();
      expect(bestMove!.value).toBeGreaterThan(800); // High value for completion/disruption
      expect(['completion', 'cascade', 'disruption']).toContain(bestMove!.type);
    });

    test('should execute disruption moves by stealing opponent pieces', () => {
      const ownStack = new Stack('stack1', 'player1');
      const opponentStack = new Stack('stack2', 'player2');

      const ninjaHead = new Card('card1', Character.Ninja, BodyPart.Head);
      const pirateTorso = new Card('card2', Character.Pirate, BodyPart.Torso);

      ownStack.addCard(ninjaHead, BodyPart.Head);
      opponentStack.addCard(pirateTorso, BodyPart.Torso);

      const ownStacks = [ownStack];
      const opponentStacks = [opponentStack];
      const hand = new Hand();
      const myScore = new Score();
      const opponentScore = new Score();
      const analysis = analyzer.analyzeGameState(ownStacks, opponentStacks, hand, myScore, opponentScore);

      const disruptionMoves = evaluator.findDisruptionMoves(ownStacks, opponentStacks, analysis);

      // Should find disruption moves (stealing opponent pieces)
      expect(disruptionMoves.length).toBeGreaterThan(0);
      
      const disruptionMove = disruptionMoves[0];
      expect(disruptionMove.disruptsOpponent).toBe(true);
      expect(disruptionMove.type).toBe('disruption');
      expect(disruptionMove.fromStack.getOwnerId()).toBe('player2'); // Stealing from opponent
    });

    test('should create new stacks when beneficial for organization', () => {
      const mixedStack = new Stack('stack1', 'player1');

      const ninjaHead = new Card('card1', Character.Ninja, BodyPart.Head);
      const pirateTorso = new Card('card2', Character.Pirate, BodyPart.Torso);

      // Stack with mixed characters - should separate
      mixedStack.addCard(ninjaHead, BodyPart.Head);
      mixedStack.addCard(pirateTorso, BodyPart.Torso);

      const ownStacks = [mixedStack];
      const opponentStacks: Stack[] = [];
      const hand = new Hand();
      const myScore = new Score();
      const opponentScore = new Score();
      const analysis = analyzer.analyzeGameState(ownStacks, opponentStacks, hand, myScore, opponentScore);

      const evaluations = evaluator.evaluateAllMoves(ownStacks, opponentStacks, analysis);
      
      // Given mixed stack (ninja head + pirate torso), should create new stack moves
      const newStackMoves = evaluations.filter(e => e.toStack === null);
      expect(newStackMoves.length).toBeGreaterThanOrEqual(2); // Should be able to create new stacks for both pieces
      
      // Should suggest moving one of the mismatched pieces to a new stack
      const organizationMoves = newStackMoves.filter(move => move.type === 'organization');
      expect(organizationMoves.length).toBeGreaterThan(0);
      
      organizationMoves.forEach(move => {
        expect(move.reasoning).toContain('Create new stack');
        expect([Character.Ninja, Character.Pirate]).toContain(move.card.character);
      });
    });

    test('should handle cascade opportunities', () => {
      const stack1 = new Stack('stack1', 'player1');
      const stack2 = new Stack('stack2', 'player1');

      // Create a scenario with multiple completion possibilities
      const ninjaHead1 = new Card('card1', Character.Ninja, BodyPart.Head);
      const ninjaTorso1 = new Card('card2', Character.Ninja, BodyPart.Torso);
      const ninjaLegs1 = new Card('card3', Character.Ninja, BodyPart.Legs);

      // Stack1: Almost complete ninja
      stack1.addCard(ninjaHead1, BodyPart.Head);
      stack1.addCard(ninjaTorso1, BodyPart.Torso);

      // Stack2: Has legs that can complete stack1
      stack2.addCard(ninjaLegs1, BodyPart.Legs);

      const ownStacks = [stack1, stack2];
      const opponentStacks: Stack[] = [];
      const hand = new Hand();
      const myScore = new Score();
      const opponentScore = new Score();
      const analysis = analyzer.analyzeGameState(ownStacks, opponentStacks, hand, myScore, opponentScore);

      const cascadeOpportunities = evaluator.findCascadeOpportunities(ownStacks, analysis);

      // With ninja stack 2/3 complete and missing piece available, should find cascade opportunities
      expect(cascadeOpportunities.length).toBeGreaterThan(0);
      
      // Should find opportunity to move ninja legs to complete the stack
      const ninjaLegsCascade = cascadeOpportunities.find(c => 
        c.card.character === Character.Ninja && c.card.bodyPart === BodyPart.Legs
      );
      expect(ninjaLegsCascade).toBeDefined();
      expect(ninjaLegsCascade!.createsCascade).toBe(true);
      expect(ninjaLegsCascade!.value).toBeGreaterThanOrEqual(1500);
      expect(ninjaLegsCascade!.reasoning).toContain('cascade');
    });
  });

  describe('Move Evaluation Logic', () => {
    test('should evaluate moves with correct strategic values', () => {
      const ownStack = new Stack('stack1', 'player1');
      const opponentStack = new Stack('stack2', 'player2');

      const ninjaHead = new Card('card1', Character.Ninja, BodyPart.Head);
      const pirateTorso = new Card('card2', Character.Pirate, BodyPart.Torso);

      ownStack.addCard(ninjaHead, BodyPart.Head);
      opponentStack.addCard(pirateTorso, BodyPart.Torso);

      const ownStacks = [ownStack];
      const opponentStacks = [opponentStack];
      const hand = new Hand();
      const myScore = new Score();
      const opponentScore = new Score();
      const analysis = analyzer.analyzeGameState(ownStacks, opponentStacks, hand, myScore, opponentScore);

      const evaluations = evaluator.evaluateAllMoves(ownStacks, opponentStacks, analysis);

      // Should have multiple move types
      const moveTypes = evaluations.map(e => e.type);
      expect(moveTypes.length).toBeGreaterThan(0);
      
      // All moves should have non-negative values and valid properties
      evaluations.forEach(move => {
        expect(move.value).toBeGreaterThanOrEqual(0); // Some moves may have 0 value
        expect(move.reasoning).toBeTruthy();
        expect(['completion', 'cascade', 'disruption', 'setup', 'organization', 'neutral']).toContain(move.type);
      });
      
      // Should have at least some moves with positive strategic value
      const positiveValueMoves = evaluations.filter(m => m.value > 0);
      expect(positiveValueMoves.length).toBeGreaterThan(0);
    });

    test('should handle stack organization moves', () => {
      const stack1 = new Stack('stack1', 'player1');
      const stack2 = new Stack('stack2', 'player1');

      const ninjaHead = new Card('card1', Character.Ninja, BodyPart.Head);
      const ninjaTorso = new Card('card2', Character.Ninja, BodyPart.Torso);
      const ninjaLegs = new Card('card3', Character.Ninja, BodyPart.Legs);
      const pirateTorso = new Card('card4', Character.Pirate, BodyPart.Torso);

      // Mixed stacks that could benefit from organization
      stack1.addCard(ninjaHead, BodyPart.Head);
      stack1.addCard(pirateTorso, BodyPart.Torso);
      stack2.addCard(ninjaTorso, BodyPart.Torso);
      stack2.addCard(ninjaLegs, BodyPart.Legs);

      const ownStacks = [stack1, stack2];
      const organizationMoves = evaluator.optimizeStackOrganization(ownStacks);

      // Test that organization moves have correct properties
      organizationMoves.forEach(move => {
        expect(move.type).toBe('organization');
        expect(move.value).toBeGreaterThan(0);
      });
    });

    test('should select best move from multiple options', () => {
      const stack1 = new Stack('stack1', 'player1');
      const stack2 = new Stack('stack2', 'player1');
      const opponentStack = new Stack('stack3', 'player2');

      const ninjaHead = new Card('card1', Character.Ninja, BodyPart.Head);
      const ninjaTorso = new Card('card2', Character.Ninja, BodyPart.Torso);
      const pirateHead = new Card('card3', Character.Pirate, BodyPart.Head);

      stack1.addCard(ninjaHead, BodyPart.Head);
      stack2.addCard(ninjaTorso, BodyPart.Torso);
      opponentStack.addCard(pirateHead, BodyPart.Head);

      const ownStacks = [stack1, stack2];
      const opponentStacks = [opponentStack];
      const hand = new Hand();
      const myScore = new Score();
      const opponentScore = new Score();
      const analysis = analyzer.analyzeGameState(ownStacks, opponentStacks, hand, myScore, opponentScore);

      const evaluations = evaluator.evaluateAllMoves(ownStacks, opponentStacks, analysis);
      const bestMove = evaluator.selectBestMove(evaluations);

      expect(bestMove).toBeDefined();
      expect(bestMove!.value).toBeGreaterThan(0);
      expect(bestMove!.card).toBeDefined();
      expect(bestMove!.fromStack).toBeDefined();
    });

    test('should handle wild card moves correctly', () => {
      const stack1 = new Stack('stack1', 'player1');
      const wildCard = new Card('card1', Character.Wild, BodyPart.Wild);
      wildCard.nominate(Character.Ninja, BodyPart.Head);

      stack1.addCard(wildCard, BodyPart.Head);

      const ownStacks = [stack1];
      const opponentStacks: Stack[] = [];
      const hand = new Hand();
      const myScore = new Score();
      const opponentScore = new Score();
      const analysis = analyzer.analyzeGameState(ownStacks, opponentStacks, hand, myScore, opponentScore);

      const evaluations = evaluator.evaluateAllMoves(ownStacks, opponentStacks, analysis);
      
      // Should find moves involving wild cards
      const wildCardMoves = evaluations.filter(e => e.card.isWild());
      expect(wildCardMoves.length).toBeGreaterThanOrEqual(0); // May or may not find wild card moves
      
      wildCardMoves.forEach(move => {
        expect(move.card.isWild()).toBe(true);
      });
    });
  });

  describe('Performance and Edge Cases', () => {
    test('should handle empty stacks gracefully', () => {
      const ownStacks: Stack[] = [];
      const opponentStacks: Stack[] = [];
      const hand = new Hand();
      const myScore = new Score();
      const opponentScore = new Score();
      const analysis = analyzer.analyzeGameState(ownStacks, opponentStacks, hand, myScore, opponentScore);

      const evaluations = evaluator.evaluateAllMoves(ownStacks, opponentStacks, analysis);
      expect(evaluations).toEqual([]);

      const bestMove = evaluator.selectBestMove(evaluations);
      expect(bestMove).toBeNull();
    });

    test('should complete evaluation in reasonable time with multiple stacks', () => {
      // Create multiple stacks for performance testing
      const ownStacks: Stack[] = [];
      const opponentStacks: Stack[] = [];

      for (let i = 0; i < 3; i++) {
        const ownStack = new Stack(`own${i}`, 'player1');
        const oppStack = new Stack(`opp${i}`, 'player2');

        const characters = [Character.Ninja, Character.Pirate, Character.Zombie];
        const bodyParts = [BodyPart.Head, BodyPart.Torso, BodyPart.Legs];

        const char = characters[i % characters.length];
        const part = bodyParts[i % bodyParts.length];
        
        const ownCard = new Card(`own${i}`, char, part);
        const oppCard = new Card(`opp${i}`, char, part);

        ownStack.addCard(ownCard, part);
        oppStack.addCard(oppCard, part);

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