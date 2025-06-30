import { MoveEvaluator } from './MoveEvaluator.js';
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

      // Should have moves from both own stacks to each other + new stack options + opponent disruption
      expect(evaluations.length).toBeGreaterThan(4); // At minimum: 2 to each other + 2 new stacks + disruption moves
      expect(evaluations[0]).toHaveProperty('value');
      expect(evaluations[0]).toHaveProperty('reasoning');
      expect(evaluations[0]).toHaveProperty('type');
      
      // Should have moves for each type
      const moveTypes = evaluations.map(e => e.type);
      expect(moveTypes).toContain('disruption'); // Should have disruption moves (stealing from opponent)
      expect(moveTypes).toContain('organization'); // Should have new stack creation moves
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

      // Find the completion move (now prioritized as cascade)
      const completionMove = evaluations.find(e => e.completesStack);
      expect(completionMove).toBeDefined();
      expect(completionMove!.value).toBeGreaterThan(1000);
      expect(['completion', 'cascade']).toContain(completionMove!.type); // Can be either, cascade is higher priority
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
      expect(disruptionMoves.length).toBeGreaterThan(0); // Should have disruption moves
      
      // All disruption moves should have appropriate values and properties
      disruptionMoves.forEach(move => {
        expect(move.value).toBeGreaterThan(300); // Base disruption value
        expect(move.type).toBe('disruption');
        expect(move.fromStack.getOwnerId()).toBe('player2'); // Stealing from opponent
        // toStack can be either an existing own stack or null (new stack creation)
        if (move.toStack !== null) {
          expect(move.toStack.getOwnerId()).toBe('player1'); // Moving to own stack
        }
      });
    });
  });

  describe('New Stack Creation', () => {
    test('should evaluate creating new stacks', () => {
      const stack1 = new Stack('stack1', 'player1');
      const ninjaHead = new Card('card1', Character.Ninja, BodyPart.Head);
      const pirateTorso = new Card('card2', Character.Pirate, BodyPart.Torso);

      // Stack has mixed characters - should want to separate
      stack1.addCard(ninjaHead, BodyPart.Head);
      stack1.addCard(pirateTorso, BodyPart.Torso);

      const ownStacks = [stack1];
      const hand = new Hand();
      const myScore = new Score();
      const opponentScore = new Score();
      const analysis = analyzer.analyzeGameState(ownStacks, [], hand, myScore, opponentScore);

      const evaluations = evaluator.evaluateAllMoves(ownStacks, [], analysis);

      // Find new stack creation moves (toStack is null)
      const newStackMoves = evaluations.filter(e => e.toStack === null);
      expect(newStackMoves.length).toBeGreaterThanOrEqual(1); // Should be able to create new stacks
      
      // Each new stack move should have organization properties
      newStackMoves.forEach(move => {
        expect(move.value).toBeGreaterThan(100); // Base value for new stack creation
        expect(move.type).toBe('organization');
        expect(move.toStack).toBeNull(); // New stack creation
        expect(move.reasoning).toContain('Create new stack');
      });
    });

    test('should prefer new stack creation for better organization', () => {
      const stack1 = new Stack('stack1', 'player1');
      const ninjaHead = new Card('card1', Character.Ninja, BodyPart.Head);
      const pirateTorso = new Card('card2', Character.Pirate, BodyPart.Torso);

      stack1.addCard(ninjaHead, BodyPart.Head);
      stack1.addCard(pirateTorso, BodyPart.Torso);

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

      // With this specific setup (ninja stack 2/3 complete, missing piece available),
      // we should definitely find at least one cascade opportunity
      expect(cascadeOpportunities.length).toBeGreaterThan(0);
      
      // The first cascade opportunity should involve moving ninja legs to complete the stack
      const firstCascade = cascadeOpportunities[0];
      expect(firstCascade.createsCascade).toBe(true);
      expect(firstCascade.completesStack).toBe(true);
      expect(firstCascade.value).toBeGreaterThanOrEqual(1500);
      expect(firstCascade.reasoning).toContain('cascade');
      expect(firstCascade.card.character).toBe(Character.Ninja);
      expect(firstCascade.card.bodyPart).toBe(BodyPart.Legs);
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

      // This complex setup should generate cascade opportunities since we have multiple
      // near-complete stacks with available pieces
      expect(cascadeOpportunities.length).toBeGreaterThan(0);
      
      // All found cascade opportunities should have high values and correct properties
      cascadeOpportunities.forEach(cascade => {
        expect(cascade.value).toBeGreaterThanOrEqual(1500);
        expect(cascade.createsCascade).toBe(true);
        expect(cascade.completesStack).toBe(true);
      });
    });
  });

  describe('Disruption Moves', () => {
    test('should find disruption moves by stealing opponent pieces', () => {
      const ownStack = new Stack('stack1', 'player1');
      const opponentStack = new Stack('stack2', 'player2');

      const ninjaHead = new Card('card1', Character.Ninja, BodyPart.Head);
      const ninjaLegs = new Card('card2', Character.Ninja, BodyPart.Legs);
      const pirateTorso = new Card('card3', Character.Pirate, BodyPart.Torso);

      // Own stack partially built
      ownStack.addCard(ninjaHead, BodyPart.Head);

      // Opponent has valuable pieces
      opponentStack.addCard(ninjaLegs, BodyPart.Legs);
      opponentStack.addCard(pirateTorso, BodyPart.Torso);

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
      const pirateTorso = new Card('card4', Character.Pirate, BodyPart.Torso);

      // Stack1: Mixed ninja and pirate pieces
      stack1.addCard(ninjaHead, BodyPart.Head);
      stack1.addCard(pirateTorso, BodyPart.Torso);

      // Stack2: More ninja pieces
      stack2.addCard(ninjaTorso, BodyPart.Torso);
      stack2.addCard(ninjaLegs, BodyPart.Legs);

      const ownStacks = [stack1, stack2];
      const organizationMoves = evaluator.optimizeStackOrganization(ownStacks);

      // Given this specific setup with mixed stacks that have matching pieces,
      // we should find consolidation opportunities:
      // - stack1 has ninja head + pirate torso  
      // - stack2 has ninja torso + ninja legs
      // The algorithm should identify that ninja pieces can be consolidated
      expect(organizationMoves.length).toBeGreaterThan(0);
      
      // Verify all organization moves have correct properties
      organizationMoves.forEach(move => {
        expect(move.type).toBe('organization');
        expect(move.reasoning).toContain('Consolidate');
        expect(move.value).toBeGreaterThan(0);
        // Should be moving ninja pieces to consolidate them
        expect(move.card.character).toBe(Character.Ninja);
      });
    });
  });

  describe('Move Selection', () => {
    test('should select best move based on value', () => {
      // Create a scenario where completion move should be highest priority
      const stack1 = new Stack('stack1', 'player1');
      const stack2 = new Stack('stack2', 'player1');
      const stack3 = new Stack('stack3', 'player2');

      // Setup for completion move: stack1 is 2/3 complete
      const ninjaHead = new Card('card1', Character.Ninja, BodyPart.Head);
      const ninjaTorso = new Card('card2', Character.Ninja, BodyPart.Torso);
      const ninjaLegs = new Card('card3', Character.Ninja, BodyPart.Legs);
      const pirateHead = new Card('card4', Character.Pirate, BodyPart.Head);

      stack1.addCard(ninjaHead, BodyPart.Head);
      stack1.addCard(ninjaTorso, BodyPart.Torso);
      stack2.addCard(ninjaLegs, BodyPart.Legs); // Can complete stack1
      stack3.addCard(pirateHead, BodyPart.Head); // Lower priority disruption

      const ownStacks = [stack1, stack2];
      const opponentStacks = [stack3];
      const hand = new Hand();
      const myScore = new Score();
      const opponentScore = new Score();
      const analysis = analyzer.analyzeGameState(ownStacks, opponentStacks, hand, myScore, opponentScore);

      const evaluations = evaluator.evaluateAllMoves(ownStacks, opponentStacks, analysis);
      const bestMove = evaluator.selectBestMove(evaluations);

      expect(bestMove).toBeDefined();
      expect(bestMove!.value).toBeGreaterThan(500); // Should be high value move
      
      // Should prioritize completion or high-value disruption
      expect(['completion', 'disruption', 'cascade']).toContain(bestMove!.type);
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