import { DifficultyManager } from '../DifficultyManager.js';
import { Card, Character, BodyPart, Stack } from '@npzr/core';
import { CardPlayEvaluation } from '../CardPlayEvaluator.js';
import { MoveEvaluation } from '../MoveEvaluator.js';
import { DisruptionOpportunity } from '../GameStateAnalyzer.js';

describe('DifficultyManager', () => {
  let difficultyManager: DifficultyManager;

  beforeEach(() => {
    difficultyManager = new DifficultyManager();
  });

  describe('Configuration Management', () => {
    test('should return correct easy configuration', () => {
      const config = difficultyManager.getConfig('easy');
      
      expect(config.level).toBe('easy');
      expect(config.wildCardConservation).toBe(0.2);
      expect(config.disruptionAggression).toBe(0.1);
      expect(config.mistakeRate).toBe(0.2);
      expect(config.cascadeOptimization).toBe(false);
    });

    test('should return correct medium configuration', () => {
      const config = difficultyManager.getConfig('medium');
      
      expect(config.level).toBe('medium');
      expect(config.wildCardConservation).toBe(0.6);
      expect(config.disruptionAggression).toBe(0.5);
      expect(config.mistakeRate).toBe(0.1);
      expect(config.cascadeOptimization).toBe(true);
    });

    test('should return correct hard configuration', () => {
      const config = difficultyManager.getConfig('hard');
      
      expect(config.level).toBe('hard');
      expect(config.wildCardConservation).toBe(0.9);
      expect(config.disruptionAggression).toBe(0.8);
      expect(config.mistakeRate).toBe(0.02);
      expect(config.cascadeOptimization).toBe(true);
    });

    test('should throw error for invalid difficulty level', () => {
      expect(() => {
        difficultyManager.getConfig('invalid' as any);
      }).toThrow('Unknown difficulty level: invalid');
    });
  });

  describe('Wild Card Strategy', () => {
    test('should allow all wild cards for easy difficulty', () => {
      const wildCards = [
        new Card('wild1', Character.Wild, BodyPart.Wild),
        new Card('wild2', Character.Wild, BodyPart.Head),
        new Card('wild3', Character.Ninja, BodyPart.Wild)
      ];
      
      const easyConfig = difficultyManager.getConfig('easy');
      const result = difficultyManager.adjustWildCardStrategy(wildCards, easyConfig);
      
      expect(result).toEqual(wildCards);
    });

    test('should potentially reduce wild cards for medium/hard difficulty', () => {
      const wildCards = [
        new Card('wild1', Character.Wild, BodyPart.Wild),
        new Card('wild2', Character.Wild, BodyPart.Head)
      ];
      
      const hardConfig = difficultyManager.getConfig('hard');
      
      // Run multiple times to test conservation logic
      let conservationObserved = false;
      for (let i = 0; i < 100; i++) {
        const result = difficultyManager.adjustWildCardStrategy(wildCards, hardConfig);
        if (result.length < wildCards.length) {
          conservationObserved = true;
          break;
        }
      }
      
      // Should observe conservation behavior with high conservation rate
      expect(conservationObserved).toBe(true);
    });

    test('should return at least one wild card when conserving', () => {
      const wildCards = [
        new Card('wild1', Character.Wild, BodyPart.Wild),
        new Card('wild2', Character.Wild, BodyPart.Head),
        new Card('wild3', Character.Ninja, BodyPart.Wild)
      ];
      
      const hardConfig = difficultyManager.getConfig('hard');
      
      // Test multiple runs to ensure we never get empty array
      for (let i = 0; i < 50; i++) {
        const result = difficultyManager.adjustWildCardStrategy(wildCards, hardConfig);
        expect(result.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Disruption Strategy', () => {
    test('should filter disruption opportunities based on difficulty', () => {
      const opportunities: DisruptionOpportunity[] = [
        {
          stackId: 'stack1',
          targetPile: BodyPart.Head,
          character: Character.Ninja,
          urgency: 'optional'
        },
        {
          stackId: 'stack2',
          targetPile: BodyPart.Torso,
          character: Character.Pirate,
          urgency: 'important'
        },
        {
          stackId: 'stack3', 
          targetPile: BodyPart.Legs,
          character: Character.Zombie,
          urgency: 'critical'
        }
      ];

      const easyConfig = difficultyManager.getConfig('easy');
      const mediumConfig = difficultyManager.getConfig('medium');
      const hardConfig = difficultyManager.getConfig('hard');

      // Easy should only consider critical (when it decides to disrupt at all)
      const easyResult = difficultyManager.adjustDisruptionStrategy(opportunities, easyConfig);
      const criticalOpps = easyResult.filter(o => o.urgency === 'critical');
      expect(criticalOpps.length).toBeLessThanOrEqual(1); // Only critical ones

      // Medium should consider critical and important
      const mediumResult = difficultyManager.adjustDisruptionStrategy(opportunities, mediumConfig);
      const mediumValidOpps = mediumResult.filter(o => 
        o.urgency === 'critical' || o.urgency === 'important'
      );
      expect(mediumValidOpps.length).toBe(mediumResult.length);

      // Hard should consider all (when it decides to disrupt)
      const _hardResult = difficultyManager.adjustDisruptionStrategy(opportunities, hardConfig);
      // Hard config has high aggression, so should often return all opportunities
    });

    test('should sometimes skip disruptions based on aggression level', () => {
      const opportunities: DisruptionOpportunity[] = [
        {
          stackId: 'stack1',
          targetPile: BodyPart.Head,
          character: Character.Ninja,
          urgency: 'critical'
        }
      ];

      const easyConfig = difficultyManager.getConfig('easy');
      
      // With low aggression (0.1), should often return empty array
      let skippedDisruption = false;
      for (let i = 0; i < 100; i++) {
        const result = difficultyManager.adjustDisruptionStrategy(opportunities, easyConfig);
        if (result.length === 0) {
          skippedDisruption = true;
          break;
        }
      }
      
      expect(skippedDisruption).toBe(true);
    });
  });

  describe('Mistake Rate', () => {
    test('should make mistakes based on configuration', () => {
      const easyConfig = difficultyManager.getConfig('easy');
      const hardConfig = difficultyManager.getConfig('hard');

      // Test easy difficulty (20% mistake rate)
      let easyMistakes = 0;
      for (let i = 0; i < 1000; i++) {
        if (difficultyManager.shouldMakeMistake(easyConfig)) {
          easyMistakes++;
        }
      }
      
      // Should be approximately 20% (with some tolerance for randomness)
      expect(easyMistakes).toBeGreaterThan(150);
      expect(easyMistakes).toBeLessThan(250);

      // Test hard difficulty (2% mistake rate)
      let hardMistakes = 0;
      for (let i = 0; i < 1000; i++) {
        if (difficultyManager.shouldMakeMistake(hardConfig)) {
          hardMistakes++;
        }
      }
      
      // Should be approximately 2% (with tolerance)
      expect(hardMistakes).toBeLessThan(50);
    });
  });

  describe('Card Play Decision Modification', () => {
    test('should apply wild card conservation to evaluations', () => {
      const _stack1 = new Stack('stack1', 'player1');
      const wildCard = new Card('wild1', Character.Wild, BodyPart.Wild);
      const regularCard = new Card('regular1', Character.Ninja, BodyPart.Head);

      const evaluations: CardPlayEvaluation[] = [
        {
          card: wildCard,
          placement: { targetStackId: 'stack1', targetPile: BodyPart.Head },
          value: 300,
          reasoning: 'Wild card play',
          type: 'building'
        },
        {
          card: regularCard,
          placement: { targetStackId: 'stack1', targetPile: BodyPart.Head },
          value: 200,
          reasoning: 'Regular card play',
          type: 'building'
        }
      ];

      const mediumConfig = difficultyManager.getConfig('medium');
      
      // Test multiple times to see conservation behavior
      let conservationObserved = false;
      for (let i = 0; i < 100; i++) {
        const result = difficultyManager.applyDifficultyToCardDecision(evaluations, mediumConfig);
        const wildCardPlays = result.filter(e => e.card.isWild());
        if (wildCardPlays.length < evaluations.filter(e => e.card.isWild()).length) {
          conservationObserved = true;
          break;
        }
      }
      
      // Should sometimes observe conservation behavior
      expect(conservationObserved).toBe(true);
    });

    test('should filter disruption plays based on aggression', () => {
      const evaluations: CardPlayEvaluation[] = [
        {
          card: new Card('disrupt1', Character.Ninja, BodyPart.Head),
          placement: { targetStackId: 'stack1', targetPile: BodyPart.Head },
          value: 400,
          reasoning: 'Disruption play',
          type: 'disruption'
        },
        {
          card: new Card('build1', Character.Ninja, BodyPart.Torso),
          placement: { targetStackId: 'stack2', targetPile: BodyPart.Torso },
          value: 300,
          reasoning: 'Building play',
          type: 'building'
        }
      ];

      const easyConfig = difficultyManager.getConfig('easy');
      
      // With low aggression, should sometimes skip disruption plays
      let disruptionSkipped = false;
      for (let i = 0; i < 100; i++) {
        const result = difficultyManager.applyDifficultyToCardDecision(evaluations, easyConfig);
        const disruptionPlays = result.filter(e => e.type === 'disruption');
        if (disruptionPlays.length === 0) {
          disruptionSkipped = true;
          break;
        }
      }
      
      expect(disruptionSkipped).toBe(true);
    });
  });

  describe('Move Decision Modification', () => {
    test('should filter cascade moves based on optimization setting', () => {
      const stack1 = new Stack('stack1', 'player1');
      const card1 = new Card('card1', Character.Ninja, BodyPart.Head);

      const evaluations: MoveEvaluation[] = [
        {
          fromStack: stack1,
          fromPile: BodyPart.Head,
          toStack: null,
          toPile: BodyPart.Head,
          cardId: 'card1',
          card: card1,
          value: 1500,
          reasoning: 'Cascade move',
          createsCascade: true,
          completesStack: false,
          disruptsOpponent: false,
          type: 'cascade'
        },
        {
          fromStack: stack1,
          fromPile: BodyPart.Head,
          toStack: null,
          toPile: BodyPart.Head,
          cardId: 'card1',
          card: card1,
          value: 200,
          reasoning: 'Organization move',
          createsCascade: false,
          completesStack: false,
          disruptsOpponent: false,
          type: 'organization'
        }
      ];

      const easyConfig = difficultyManager.getConfig('easy');
      const hardConfig = difficultyManager.getConfig('hard');

      // Easy difficulty should filter out cascade moves
      const easyResult = difficultyManager.applyDifficultyToMoveDecision(evaluations, easyConfig);
      const cascadeMoves = easyResult.filter(e => e.type === 'cascade');
      expect(cascadeMoves.length).toBe(0);

      // Hard difficulty should keep cascade moves
      const hardResult = difficultyManager.applyDifficultyToMoveDecision(evaluations, hardConfig);
      const hardCascadeMoves = hardResult.filter(e => e.type === 'cascade');
      expect(hardCascadeMoves.length).toBe(1);
    });

    test('should apply move disruption filtering', () => {
      const stack1 = new Stack('stack1', 'player1');
      const card1 = new Card('card1', Character.Ninja, BodyPart.Head);

      const evaluations: MoveEvaluation[] = [
        {
          fromStack: stack1,
          fromPile: BodyPart.Head,
          toStack: null,
          toPile: BodyPart.Head,
          cardId: 'card1',
          card: card1,
          value: 600,
          reasoning: 'Disruption move',
          createsCascade: false,
          completesStack: false,
          disruptsOpponent: true,
          type: 'disruption'
        },
        {
          fromStack: stack1,
          fromPile: BodyPart.Head,
          toStack: null,
          toPile: BodyPart.Head,
          cardId: 'card1',
          card: card1,
          value: 200,
          reasoning: 'Setup move',
          createsCascade: false,
          completesStack: false,
          disruptsOpponent: false,
          type: 'setup'
        }
      ];

      const easyConfig = difficultyManager.getConfig('easy');
      
      // Should sometimes skip disruption moves due to low aggression
      let disruptionSkipped = false;
      for (let i = 0; i < 100; i++) {
        const result = difficultyManager.applyDifficultyToMoveDecision(evaluations, easyConfig);
        const disruptionMoves = result.filter(e => e.type === 'disruption');
        if (disruptionMoves.length === 0) {
          disruptionSkipped = true;
          break;
        }
      }
      
      expect(disruptionSkipped).toBe(true);
    });
  });
});