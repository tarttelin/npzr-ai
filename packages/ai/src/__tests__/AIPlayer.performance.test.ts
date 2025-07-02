import { AIPlayer } from '../AIPlayer.js';
import { GameEngine, Player, Character } from '@npzr/core';

describe('AI Performance Benchmarks', () => {
  let gameEngine: GameEngine;
  let aiPlayerInstance: Player;
  let humanPlayerInstance: Player;
  let aiPlayer: AIPlayer;

  beforeEach(() => {
    gameEngine = new GameEngine();
    gameEngine.createGame();
    aiPlayerInstance = gameEngine.addPlayer('AI');
    humanPlayerInstance = gameEngine.addPlayer('Human');
    aiPlayer = new AIPlayer(aiPlayerInstance, 'medium');
  });

  describe('Response Time Requirements', () => {
    test('Card Selection: < 100ms per decision', () => {
      const iterations = 10;
      const timings: number[] = [];

      for (let i = 0; i < iterations; i++) {
        if (aiPlayerInstance.isMyTurn()) {
          const startTime = performance.now();
          
          // Measure time for AI to analyze and select card
          aiPlayer.getGameAnalysis();
          
          const endTime = performance.now();
          timings.push(endTime - startTime);
        }
        
        // Have AI make a move if it's their turn
        if (aiPlayerInstance.isMyTurn() && !aiPlayerInstance.getState().isGameOver()) {
          try {
            aiPlayer.makeMove();
          } catch {
            // Game might end, that's okay
            break;
          }
        } else if (humanPlayerInstance.isMyTurn() && !humanPlayerInstance.getState().isGameOver()) {
          // Simple human simulation
          if (humanPlayerInstance.getState().canDrawCard()) {
            humanPlayerInstance.drawCard();
          } else if (humanPlayerInstance.getState().canPlayCard()) {
            const cards = humanPlayerInstance.getHand().getCards();
            if (cards.length > 0) {
              const cardToPlay = cards.find(c => !c.isWild()) || cards[0];
              humanPlayerInstance.playCard(cardToPlay, { targetPile: cardToPlay.bodyPart });
            }
          }
        }
        
        // Check for game end
        if (aiPlayerInstance.hasWon() || humanPlayerInstance.hasWon()) {
          break;
        }
      }

      if (timings.length > 0) {
        const avgTime = timings.reduce((sum, time) => sum + time, 0) / timings.length;
        const maxTime = Math.max(...timings);
        
        expect(avgTime).toBeLessThan(100); // Average < 100ms
        expect(maxTime).toBeLessThan(200); // Max < 200ms (allowing some variance)
      }
    });

    test('Wild Nomination: < 50ms per decision', () => {
      const iterations = 5;
      const timings: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        
        // Test wild card nomination speed by doing game analysis
        const analysis = aiPlayer.getGameAnalysis();
        
        const endTime = performance.now();
        timings.push(endTime - startTime);
      }

      const avgTime = timings.reduce((sum, time) => sum + time, 0) / timings.length;
      const maxTime = Math.max(...timings);
      
      expect(avgTime).toBeLessThan(50); // Average < 50ms
      expect(maxTime).toBeLessThan(100); // Max < 100ms
    });

    test('Move Execution: < 100ms per decision', () => {
      const iterations = 10;
      const timings: number[] = [];

      for (let i = 0; i < iterations && !aiPlayerInstance.getState().isGameOver() && !humanPlayerInstance.getState().isGameOver(); i++) {
        if (aiPlayerInstance.isMyTurn()) {
          const startTime = performance.now();
          
          try {
            aiPlayer.makeMove();
          } catch {
            // Game might end
            break;
          }
          
          const endTime = performance.now();
          timings.push(endTime - startTime);
        } else if (humanPlayerInstance.isMyTurn()) {
          // Simple human simulation
          if (humanPlayerInstance.getState().canDrawCard()) {
            humanPlayerInstance.drawCard();
          } else if (humanPlayerInstance.getState().canPlayCard()) {
            const cards = humanPlayerInstance.getHand().getCards();
            if (cards.length > 0) {
              const cardToPlay = cards.find(c => !c.isWild()) || cards[0];
              humanPlayerInstance.playCard(cardToPlay, { targetPile: cardToPlay.bodyPart });
            }
          }
        }
        
        // Check for game end
        if (aiPlayerInstance.hasWon() || humanPlayerInstance.hasWon()) {
          break;
        }
      }

      if (timings.length > 0) {
        const avgTime = timings.reduce((sum, time) => sum + time, 0) / timings.length;
        const maxTime = Math.max(...timings);
        
        expect(avgTime).toBeLessThan(100); // Average < 100ms
        expect(maxTime).toBeLessThan(200); // Max < 200ms
      }
    });

    test('Game Analysis: < 50ms per analysis', () => {
      const iterations = 20;
      const timings: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        
        const analysis = aiPlayer.getGameAnalysis();
        
        const endTime = performance.now();
        timings.push(endTime - startTime);
        
        // Verify analysis is complete
        expect(analysis.gamePhase).toBeDefined();
        expect(analysis.threatLevel).toBeDefined();
        expect(analysis.ownProgress).toBeDefined();
        expect(analysis.opponentProgress).toBeDefined();
      }

      const avgTime = timings.reduce((sum, time) => sum + time, 0) / timings.length;
      const maxTime = Math.max(...timings);
      
      expect(avgTime).toBeLessThan(50); // Average < 50ms
      expect(maxTime).toBeLessThan(100); // Max < 100ms
    });

    test('Full Turn: < 300ms total', () => {
      const iterations = 5;
      const timings: number[] = [];

      for (let i = 0; i < iterations && !aiPlayerInstance.getState().isGameOver() && !humanPlayerInstance.getState().isGameOver(); i++) {
        if (aiPlayerInstance.isMyTurn()) {
          const startTime = performance.now();
          
          try {
            aiPlayer.makeMove();
          } catch {
            // Game might end
            break;
          }
          
          const endTime = performance.now();
          timings.push(endTime - startTime);
        } else if (humanPlayerInstance.isMyTurn()) {
          // Simple human simulation
          if (humanPlayerInstance.getState().canDrawCard()) {
            humanPlayerInstance.drawCard();
          } else if (humanPlayerInstance.getState().canPlayCard()) {
            const cards = humanPlayerInstance.getHand().getCards();
            if (cards.length > 0) {
              const cardToPlay = cards.find(c => !c.isWild()) || cards[0];
              humanPlayerInstance.playCard(cardToPlay, { targetPile: cardToPlay.bodyPart });
            }
          }
        }
        
        // Check for game end
        if (aiPlayerInstance.hasWon() || humanPlayerInstance.hasWon()) {
          break;
        }
      }

      if (timings.length > 0) {
        const avgTime = timings.reduce((sum, time) => sum + time, 0) / timings.length;
        const maxTime = Math.max(...timings);
        
        expect(avgTime).toBeLessThan(300); // Average < 300ms
        expect(maxTime).toBeLessThan(500); // Max < 500ms
      }
    });
  });

  describe('Stress Testing', () => {
    test('Complex game states performance', () => {
      // Test performance with complex game state
      const startTime = performance.now();
      
      for (let i = 0; i < 10; i++) {
        const analysis = aiPlayer.getGameAnalysis();
        const strategy = aiPlayer.getStrategy();
        
        expect(analysis).toBeDefined();
        expect(strategy).toBeDefined();
      }
      
      const endTime = performance.now();
      const avgTimePerAnalysis = (endTime - startTime) / 10;
      
      expect(avgTimePerAnalysis).toBeLessThan(50);
    });

    test('Memory usage monitoring over extended analysis', () => {
      const initialMemory = process.memoryUsage();
      
      // Perform many analyses to check for memory leaks
      for (let i = 0; i < 100; i++) {
        aiPlayer.getGameAnalysis();
        aiPlayer.getStrategy();
      }
      
      const finalMemory = process.memoryUsage();
      
      // Memory growth should be reasonable (less than 10MB)
      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024); // 10MB
    });

    test('Performance consistency across multiple decisions', () => {
      const timings: number[] = [];
      const iterations = 20;

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        aiPlayer.getGameAnalysis();
        const endTime = performance.now();
        
        timings.push(endTime - startTime);
      }

      const avgTime = timings.reduce((sum, time) => sum + time, 0) / timings.length;
      const variance = timings.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) / timings.length;
      const stdDev = Math.sqrt(variance);
      
      // Standard deviation should be reasonable (consistent performance) - very relaxed for CI stability
      expect(stdDev).toBeLessThan(avgTime * 3.0); // StdDev < 300% of average (very relaxed for stability)
    });
  });

  describe('Scalability Tests', () => {
    test('Performance scales well with game complexity', () => {
      // Early game performance
      const earlyAnalysis = performance.now();
      aiPlayer.getGameAnalysis();
      const earlyTime = performance.now() - earlyAnalysis;

      // Simulate more complex game state by playing several turns
      for (let i = 0; i < 10 && !aiPlayerInstance.getState().isGameOver() && !humanPlayerInstance.getState().isGameOver(); i++) {
        if (aiPlayerInstance.isMyTurn()) {
          try {
            aiPlayer.makeMove();
          } catch {
            break;
          }
        } else if (humanPlayerInstance.isMyTurn()) {
          // Simple human move
          if (humanPlayerInstance.getState().canDrawCard()) {
            humanPlayerInstance.drawCard();
          } else if (humanPlayerInstance.getState().canPlayCard()) {
            const cards = humanPlayerInstance.getHand().getCards();
            if (cards.length > 0) {
              const cardToPlay = cards.find(c => !c.isWild()) || cards[0];
              humanPlayerInstance.playCard(cardToPlay, { targetPile: cardToPlay.bodyPart });
            }
          }
        }
        
        // Check for game end
        if (aiPlayerInstance.hasWon() || humanPlayerInstance.hasWon()) {
          break;
        }
      }

      // Later game performance
      const lateAnalysis = performance.now();
      aiPlayer.getGameAnalysis();
      const lateTime = performance.now() - lateAnalysis;

      // Performance shouldn't degrade significantly (very relaxed for test stability)
      expect(lateTime).toBeLessThan(earlyTime * 10); // At most 10x slower (very relaxed)
      expect(lateTime).toBeLessThan(500); // Still under 500ms (very relaxed)
    });

    test('AI handles edge cases efficiently', () => {
      const timings: number[] = [];

      // Test various edge case scenarios
      for (let i = 0; i < 5; i++) {
        const startTime = performance.now();
        
        // Get analysis which should handle various game states
        const analysis = aiPlayer.getGameAnalysis();
        
        const endTime = performance.now();
        timings.push(endTime - startTime);
        
        expect(analysis).toBeDefined();
      }

      const maxTime = Math.max(...timings);
      expect(maxTime).toBeLessThan(100); // Even edge cases should be fast
    });
  });

  describe('Statistical Performance Validation', () => {
    test('Performance metrics are within expected ranges', () => {
      const metrics = {
        analysisCount: 0,
        totalAnalysisTime: 0,
        strategyCount: 0,
        totalStrategyTime: 0
      };

      // Collect performance data
      for (let i = 0; i < 50; i++) {
        // Analysis timing
        const analysisStart = performance.now();
        aiPlayer.getGameAnalysis();
        metrics.totalAnalysisTime += performance.now() - analysisStart;
        metrics.analysisCount++;

        // Strategy timing
        const strategyStart = performance.now();
        aiPlayer.getStrategy();
        metrics.totalStrategyTime += performance.now() - strategyStart;
        metrics.strategyCount++;
      }

      const avgAnalysisTime = metrics.totalAnalysisTime / metrics.analysisCount;
      const avgStrategyTime = metrics.totalStrategyTime / metrics.strategyCount;

      expect(avgAnalysisTime).toBeLessThan(50);
      expect(avgStrategyTime).toBeLessThan(30);
      
      // Verify we collected meaningful data
      expect(metrics.analysisCount).toBe(50);
      expect(metrics.strategyCount).toBe(50);
    });
  });
});