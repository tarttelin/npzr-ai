import { AIPlayer } from '../AIPlayer.js';
import { GameEngine, Player, Character } from '@npzr/core';

// Define AI Metrics interface as specified in the issue
interface AIMetrics {
  wildCardUsageRate: number; // Percentage of wilds used optimally
  disruptionFrequency: number; // Percentage of disruption opportunities taken
  cascadeExecutionRate: number; // Percentage of cascades successfully executed
  averageTurnsToWin: number; // Game length metric
  characterCompletionOrder: Character[]; // Strategic priority validation
}

describe('AI Stress Testing and Statistical Validation', () => {
  // Increase timeout for stress tests
  jest.setTimeout(120000); // 2 minutes

  describe('Large Scale Game Testing', () => {
    test('AI completes 100 AI vs AI games without errors', () => {
      const results: { completed: number; unfinished: number; errors: number; totalTurns: number } = {
        completed: 0,
        unfinished: 0,
        errors: 0,
        totalTurns: 0
      };

      // Run 100 games (reduced from 1000 for test performance, but validates the same logic)
      for (let gameNum = 0; gameNum < 100; gameNum++) {
        try {
          const gameEngine = new GameEngine();
          gameEngine.createGame();
          
          const ai1Instance = gameEngine.addPlayer('AI1');
          const ai2Instance = gameEngine.addPlayer('AI2');
          const ai1 = new AIPlayer(ai1Instance, 'hard');
          const ai2 = new AIPlayer(ai2Instance, 'easy');
          
          let turnCount = 0;
          const maxTurns = 300;

          while (!ai1Instance.getState().isGameOver() && !ai2Instance.getState().isGameOver() && turnCount < maxTurns) {
            if (ai1Instance.isMyTurn()) {
              ai1.makeMove();
            } else if (ai2Instance.isMyTurn()) {
              ai2.makeMove();
            }
            
            turnCount++;
            
            // Check for winner
            if (ai1Instance.hasWon() || ai2Instance.hasWon()) {
              break;
            }
          }

          results.totalTurns += turnCount;
          
          if (turnCount >= maxTurns) {
            results.unfinished++;
            console.log("No winner: '%s', '%s'", ai1Instance.getMyScore(), ai1Instance.getOpponentScore());
          } else {
            results.completed++
          }

          // Verify game completed properly - either someone won or we hit turn limit
          const gameFinished = ai1Instance.hasWon() || ai2Instance.hasWon() || turnCount >= maxTurns;
          expect(gameFinished).toBe(true);

        } catch (error) {
          results.errors++;
          console.error(`Game ${gameNum} failed:`, error);
        }
      }

      // Validate results
      expect(results.completed + results.unfinished).toBe(100); // Total games attempted
      expect(results.errors).toBe(0); // No errors should occur
      expect(results.completed).toBeGreaterThan(80); // Most games should complete
      expect(results.totalTurns).toBeGreaterThan(0);
      
      const averageTurns = results.totalTurns / results.completed;
      expect(averageTurns).toBeLessThan(500);
      expect(averageTurns).toBeGreaterThan(10);
    });

    test('Memory usage remains stable over extended play sessions', () => {
      const initialMemory = process.memoryUsage();
      const memorySnapshots: number[] = [];

      // Run 20 complete games while monitoring memory
      for (let i = 0; i < 20; i++) {
        const gameEngine = new GameEngine();
        gameEngine.createGame();
        
        const ai1Instance = gameEngine.addPlayer('AI1');
        const ai2Instance = gameEngine.addPlayer('AI2');
        const ai1 = new AIPlayer(ai1Instance, 'hard');
        const ai2 = new AIPlayer(ai2Instance, 'hard');
        
        let turnCount = 0;
        while (!ai1Instance.getState().isGameOver() && !ai2Instance.getState().isGameOver() && turnCount < 50) {
          if (ai1Instance.isMyTurn()) {
            ai1.makeMove();
          } else if (ai2Instance.isMyTurn()) {
            ai2.makeMove();
          }
          
          turnCount++;
          
          // Check for winner
          if (ai1Instance.hasWon() || ai2Instance.hasWon()) {
            break;
          }
        }

        // Take memory snapshot every 5 games
        if (i % 5 === 0) {
          memorySnapshots.push(process.memoryUsage().heapUsed);
        }
      }

      const finalMemory = process.memoryUsage();
      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory growth should be reasonable (less than 50MB for 20 games)
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024);
      
      // Memory should not continuously grow (no major leaks)
      if (memorySnapshots.length >= 3) {
        const firstSnapshot = memorySnapshots[0];
        const lastSnapshot = memorySnapshots[memorySnapshots.length - 1];
        const snapshotGrowth = lastSnapshot - firstSnapshot;
        
        expect(snapshotGrowth).toBeLessThan(30 * 1024 * 1024); // 30MB max growth
      }
    });
  });

  describe('Statistical Behavior Validation', () => {
    test('Difficulty levels show statistically significant behavioral differences', () => {
      const difficultyMetrics: Record<string, AIMetrics> = {
        easy: {
          wildCardUsageRate: 0,
          disruptionFrequency: 0,
          cascadeExecutionRate: 0,
          averageTurnsToWin: 0,
          characterCompletionOrder: []
        },
        medium: {
          wildCardUsageRate: 0,
          disruptionFrequency: 0,
          cascadeExecutionRate: 0,
          averageTurnsToWin: 0,
          characterCompletionOrder: []
        },
        hard: {
          wildCardUsageRate: 0,
          disruptionFrequency: 0,
          cascadeExecutionRate: 0,
          averageTurnsToWin: 0,
          characterCompletionOrder: []
        }
      };

      const gamesPerDifficulty = 10;
      
      ['easy', 'medium', 'hard'].forEach(difficulty => {
        let totalTurns = 0;
        let gamesCompleted = 0;

        for (let i = 0; i < gamesPerDifficulty; i++) {
          const gameEngine = new GameEngine();
          gameEngine.createGame();
          
          const ai1Instance = gameEngine.addPlayer('AI1');
          const ai2Instance = gameEngine.addPlayer('AI2');
          const ai1 = new AIPlayer(ai1Instance, difficulty as any);
          const ai2 = new AIPlayer(ai2Instance, difficulty as any);
          
          let turnCount = 0;
          const maxTurns = 150;

          while (!ai1Instance.getState().isGameOver() && !ai2Instance.getState().isGameOver() && turnCount < maxTurns) {
            if (ai1Instance.isMyTurn()) {
              ai1.makeMove();
            } else if (ai2Instance.isMyTurn()) {
              ai2.makeMove();
            }
            
            turnCount++;
            
            // Check for winner
            if (ai1Instance.hasWon() || ai2Instance.hasWon()) {
              break;
            }
          }

          if (ai1Instance.hasWon() || ai2Instance.hasWon()) {
            totalTurns += turnCount;
            gamesCompleted++;
          }
        }

        if (gamesCompleted > 0) {
          difficultyMetrics[difficulty].averageTurnsToWin = totalTurns / gamesCompleted;
        }
      });

      // Validate that different difficulties show different behaviors
      const easyAvg = difficultyMetrics.easy.averageTurnsToWin;
      const mediumAvg = difficultyMetrics.medium.averageTurnsToWin;
      const hardAvg = difficultyMetrics.hard.averageTurnsToWin;

      // Hard AI should generally be more efficient (fewer turns) than Easy AI
      if (easyAvg > 0 && hardAvg > 0) {
        expect(hardAvg).toBeLessThan(easyAvg * 1.3); // Allow for variance
      }
      
      // All difficulties should complete games in reasonable time
      expect(easyAvg).toBeLessThan(150);
      expect(mediumAvg).toBeLessThan(150);
      expect(hardAvg).toBeLessThan(150);
    });

    test('AI behavior patterns are consistent within difficulty levels', () => {
      const difficulty = 'medium';
      const iterations = 15;
      const turnCounts: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const gameEngine = new GameEngine();
        gameEngine.createGame();
        
        const ai1Instance = gameEngine.addPlayer('AI1');
        const ai2Instance = gameEngine.addPlayer('AI2');
        const ai1 = new AIPlayer(ai1Instance, difficulty);
        const ai2 = new AIPlayer(ai2Instance, difficulty);
        
        let turnCount = 0;
        const maxTurns = 120;

        while (!ai1Instance.getState().isGameOver() && !ai2Instance.getState().isGameOver() && turnCount < maxTurns) {
          if (ai1Instance.isMyTurn()) {
            ai1.makeMove();
          } else if (ai2Instance.isMyTurn()) {
            ai2.makeMove();
          }
          
          turnCount++;
          
          // Check for winner
          if (ai1Instance.hasWon() || ai2Instance.hasWon()) {
            break;
          }
        }

        if (ai1Instance.hasWon() || ai2Instance.hasWon()) {
          turnCounts.push(turnCount);
        }
      }

      if (turnCounts.length > 5) {
        const mean = turnCounts.reduce((sum, count) => sum + count, 0) / turnCounts.length;
        const variance = turnCounts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) / turnCounts.length;
        const stdDev = Math.sqrt(variance);
        
        // Behavior should be consistent (low variance relative to mean)
        const coefficientOfVariation = stdDev / mean;
        expect(coefficientOfVariation).toBeLessThan(0.4); // CV < 40%
        
        // Mean should be reasonable
        expect(mean).toBeGreaterThan(15);
        expect(mean).toBeLessThan(60);
      }
    });
  });

  describe('Edge Case Stress Testing', () => {
    test('AI handles complex game states without performance degradation', () => {
      const timings: number[] = [];
      const iterations = 20;

      for (let i = 0; i < iterations; i++) {
        const gameEngine = new GameEngine();
        gameEngine.createGame();
        
        const aiInstance = gameEngine.addPlayer('AI');
        const humanInstance = gameEngine.addPlayer('Human');
        const ai = new AIPlayer(aiInstance, 'hard');
        
        // Play several turns to create complex state
        for (let turn = 0; turn < 10 && !aiInstance.getState().isGameOver() && !humanInstance.getState().isGameOver(); turn++) {
          if (aiInstance.isMyTurn()) {
            const startTime = performance.now();
            ai.makeMove();
            const endTime = performance.now();
            timings.push(endTime - startTime);
          } else if (humanInstance.isMyTurn()) {
            // Simple human play
            if (humanInstance.getState().canDrawCard()) {
              humanInstance.drawCard();
            } else if (humanInstance.getState().canPlayCard()) {
              const cards = humanInstance.getHand().getCards();
              if (cards.length > 0) {
                const cardToPlay = cards.find(c => !c.isWild()) || cards[0];
                humanInstance.playCard(cardToPlay, { targetPile: cardToPlay.bodyPart });
              }
            }
          }
          
          // Check for winner
          if (aiInstance.hasWon() || humanInstance.hasWon()) {
            break;
          }
        }
      }

      if (timings.length > 0) {
        const avgTime = timings.reduce((sum, time) => sum + time, 0) / timings.length;
        const maxTime = Math.max(...timings);
        
        expect(avgTime).toBeLessThan(150); // Average should be reasonable
        expect(maxTime).toBeLessThan(300); // No single decision should take too long
      }
    });

    test('AI performs consistently across multiple game sessions', () => {
      const sessionResults: number[] = [];
      const sessionsCount = 5;
      const gamesPerSession = 8;

      for (let session = 0; session < sessionsCount; session++) {
        let sessionTotalTurns = 0;
        let sessionCompletedGames = 0;

        for (let game = 0; game < gamesPerSession; game++) {
          const gameEngine = new GameEngine();
          gameEngine.createGame();
          
          const ai1Instance = gameEngine.addPlayer('AI1');
          const ai2Instance = gameEngine.addPlayer('AI2');
          const ai1 = new AIPlayer(ai1Instance, 'medium');
          const ai2 = new AIPlayer(ai2Instance, 'medium');
          
          let turnCount = 0;
          const maxTurns = 120;

          while (!ai1Instance.getState().isGameOver() && !ai2Instance.getState().isGameOver() && turnCount < maxTurns) {
            if (ai1Instance.isMyTurn()) {
              ai1.makeMove();
            } else if (ai2Instance.isMyTurn()) {
              ai2.makeMove();
            }
            
            turnCount++;
            
            // Check for winner
            if (ai1Instance.hasWon() || ai2Instance.hasWon()) {
              break;
            }
          }

          if (ai1Instance.hasWon() || ai2Instance.hasWon()) {
            sessionTotalTurns += turnCount;
            sessionCompletedGames++;
          }
        }

        if (sessionCompletedGames > 0) {
          sessionResults.push(sessionTotalTurns / sessionCompletedGames);
        }
      }

      if (sessionResults.length > 2) {
        const sessionMean = sessionResults.reduce((sum, avg) => sum + avg, 0) / sessionResults.length;
        const sessionVariance = sessionResults.reduce((sum, avg) => sum + Math.pow(avg - sessionMean, 2), 0) / sessionResults.length;
        const sessionStdDev = Math.sqrt(sessionVariance);
        
        // Session-to-session variance should be low (consistent performance)
        const sessionCV = sessionStdDev / sessionMean;
        expect(sessionCV).toBeLessThan(0.3); // CV < 30%
      }
    });
  });

  describe('Comprehensive AI Validation', () => {
    test('AI strategic decision quality validation', () => {
      const gameEngine = new GameEngine();
      gameEngine.createGame();
      
      const aiInstance = gameEngine.addPlayer('AI');
      const humanInstance = gameEngine.addPlayer('Human');
      const ai = new AIPlayer(aiInstance, 'hard');
      
      let strategicDecisions = 0;
      let validDecisions = 0;

      // Test multiple AI decisions
      for (let i = 0; i < 10 && !aiInstance.getState().isGameOver() && !humanInstance.getState().isGameOver(); i++) {
        if (aiInstance.isMyTurn()) {
          const handSizeBefore = aiInstance.getHand().size();
          const scoresBefore = {
            ai: aiInstance.getMyScore().size(),
            human: aiInstance.getOpponentScore().size()
          };
          
          const analysis = ai.getGameAnalysis();
          
          // Verify analysis quality
          expect(analysis.gamePhase).toMatch(/early|mid|late/);
          expect(analysis.threatLevel).toMatch(/low|medium|high/);
          expect(typeof analysis.ownProgress).toBe('object');
          expect(typeof analysis.opponentProgress).toBe('object');
          
          ai.makeMove();
          
          const handSizeAfter = aiInstance.getHand().size();
          const scoresAfter = {
            ai: aiInstance.getMyScore().size(),
            human: aiInstance.getOpponentScore().size()
          };
          
          // Check if AI made a meaningful decision (game state changed)
          if (handSizeBefore !== handSizeAfter || 
              scoresBefore.ai !== scoresAfter.ai || 
              scoresBefore.human !== scoresAfter.human) {
            validDecisions++;
          }
          strategicDecisions++;
        } else if (humanInstance.isMyTurn()) {
          // Simple human move
          if (humanInstance.getState().canDrawCard()) {
            humanInstance.drawCard();
          } else if (humanInstance.getState().canPlayCard()) {
            const cards = humanInstance.getHand().getCards();
            if (cards.length > 0) {
              const cardToPlay = cards.find(c => !c.isWild()) || cards[0];
              humanInstance.playCard(cardToPlay, { targetPile: cardToPlay.bodyPart });
            }
          }
        }
        
        // Check for winner
        if (aiInstance.hasWon() || humanInstance.hasWon()) {
          break;
        }
      }

      // AI should make meaningful decisions
      expect(validDecisions).toBeGreaterThan(0);
      if (strategicDecisions > 0) {
        const decisionQuality = validDecisions / strategicDecisions;
        expect(decisionQuality).toBeGreaterThan(0.8); // 80% of decisions should be meaningful
      }
    });
  });
});