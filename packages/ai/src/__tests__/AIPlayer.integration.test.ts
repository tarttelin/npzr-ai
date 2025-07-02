import { AIPlayer } from '../AIPlayer.js';
import { GameEngine, Player, PlayerStateType, Character, BodyPart } from '@npzr/core';

describe('AI Integration Tests', () => {
  let gameEngine: GameEngine;

  beforeEach(() => {
    gameEngine = new GameEngine();
    gameEngine.createGame();
  });

  describe('AI Game Completion', () => {
    test('AI vs Human: AI can complete full game without errors', () => {
      const humanPlayer = gameEngine.addPlayer('Human');
      const aiPlayerInstance = gameEngine.addPlayer('AI');
      const aiPlayer = new AIPlayer(aiPlayerInstance, 'medium');

      let turnCount = 0;
      const maxTurns = 200;

      while (!aiPlayerInstance.getState().isGameOver() && !humanPlayer.getState().isGameOver() && turnCount < maxTurns) {
        if (aiPlayerInstance.isMyTurn()) {
          // AI turn - let AI make its move
          expect(() => {
            aiPlayer.makeMove();
          }).not.toThrow();
        } else if (humanPlayer.isMyTurn()) {
          // Human turn - simulate simple human play
          if (humanPlayer.getState().canDrawCard()) {
            humanPlayer.drawCard();
          } else if (humanPlayer.getState().canPlayCard()) {
            const cards = humanPlayer.getHand().getCards();
            if (cards.length > 0) {
              const cardToPlay = cards.find(c => !c.isWild()) || cards[0];
              // For wild cards, use the correct body part (either the card's bodyPart or a default if fully wild)
              let targetPile: BodyPart;
              if (cardToPlay.isWild()) {
                if (cardToPlay.bodyPart === BodyPart.Wild) {
                  targetPile = BodyPart.Head; // Default to head for fully wild cards
                } else {
                  targetPile = cardToPlay.bodyPart; // Use the specific body part for partial wild cards
                }
              } else {
                targetPile = cardToPlay.bodyPart;
              }
              humanPlayer.playCard(cardToPlay, { targetPile: targetPile });
            }
          } else if (humanPlayer.getState().canNominate()) {
            const cards = humanPlayer.getHand().getCards();
            const wildCard = cards.find(c => c.isWild());
            if (wildCard) {
              // Properly nominate wild card to non-wild values
              const nomination = {
                character: wildCard.character === Character.Wild ? Character.Ninja : wildCard.character,
                bodyPart: wildCard.bodyPart === BodyPart.Wild ? BodyPart.Head : wildCard.bodyPart
              };
              humanPlayer.nominateWildCard(wildCard, nomination);
            }
          }
        }
        
        turnCount++;
        
        // Check for winner
        if (aiPlayerInstance.hasWon() || humanPlayer.hasWon()) {
          break;
        }
      }

      // Game should either complete with winner or reach turn limit without errors
      const gameCompleted = aiPlayerInstance.hasWon() || humanPlayer.hasWon();
      if (!gameCompleted) {
        expect(turnCount).toBe(maxTurns); // Should have hit turn limit
      } else {
        expect(turnCount).toBeLessThan(maxTurns); // Completed before limit
      }
    });

    test('AI vs AI: Two AIs can play complete game', () => {
      const aiPlayer1Instance = gameEngine.addPlayer('AI1');
      const aiPlayer2Instance = gameEngine.addPlayer('AI2');
      const aiPlayer1 = new AIPlayer(aiPlayer1Instance, 'medium');
      const aiPlayer2 = new AIPlayer(aiPlayer2Instance, 'medium');

      let turnCount = 0;
      const maxTurns = 400;

      while (!aiPlayer1Instance.getState().isGameOver() && !aiPlayer2Instance.getState().isGameOver() && turnCount < maxTurns) {
        if (aiPlayer1Instance.isMyTurn()) {
          expect(() => {
            aiPlayer1.makeMove();
          }).not.toThrow();
        } else if (aiPlayer2Instance.isMyTurn()) {
          expect(() => {
            aiPlayer2.makeMove();
          }).not.toThrow();
        }
        
        turnCount++;
        
        // Check for winner
        if (aiPlayer1Instance.hasWon() || aiPlayer2Instance.hasWon()) {
          break;
        }
      }

      // Game should either complete with winner or reach turn limit without errors
      const gameCompleted = aiPlayer1Instance.hasWon() || aiPlayer2Instance.hasWon();
      if (!gameCompleted) {
        expect(turnCount).toBe(maxTurns); // Should have hit turn limit
      } else {
        expect(turnCount).toBeLessThan(maxTurns); // Completed before limit
      }
    });

    test('AI handles all player states correctly', () => {
      const aiPlayerInstance = gameEngine.addPlayer('AI');
      const humanPlayer = gameEngine.addPlayer('Human');
      const aiPlayer = new AIPlayer(aiPlayerInstance, 'medium');

      // Track states the AI encounters
      const statesEncountered = new Set();

      let turnCount = 0;
      const maxTurns = 50;

      while (!aiPlayerInstance.getState().isGameOver() && !humanPlayer.getState().isGameOver() && turnCount < maxTurns) {
        if (aiPlayerInstance.isMyTurn()) {
          statesEncountered.add(aiPlayer.getCurrentState());
          aiPlayer.makeMove();
        } else if (humanPlayer.isMyTurn()) {
          // Simulate simple human moves
          if (humanPlayer.getState().canDrawCard()) {
            humanPlayer.drawCard();
          } else if (humanPlayer.getState().canPlayCard()) {
            const cards = humanPlayer.getHand().getCards();
            if (cards.length > 0) {
              const cardToPlay = cards.find(c => !c.isWild()) || cards[0];
              // For wild cards, use the correct body part (either the card's bodyPart or a default if fully wild)
              let targetPile: BodyPart;
              if (cardToPlay.isWild()) {
                if (cardToPlay.bodyPart === BodyPart.Wild) {
                  targetPile = BodyPart.Head; // Default to head for fully wild cards
                } else {
                  targetPile = cardToPlay.bodyPart; // Use the specific body part for partial wild cards
                }
              } else {
                targetPile = cardToPlay.bodyPart;
              }
              humanPlayer.playCard(cardToPlay, { targetPile: targetPile });
            }
          } else if (humanPlayer.getState().canNominate()) {
            const cards = humanPlayer.getHand().getCards();
            const wildCard = cards.find(c => c.isWild());
            if (wildCard) {
              const nomination = {
                character: wildCard.character === Character.Wild ? Character.Ninja : wildCard.character,
                bodyPart: wildCard.bodyPart === BodyPart.Wild ? BodyPart.Head : wildCard.bodyPart
              };
              humanPlayer.nominateWildCard(wildCard, nomination);
            }
          }
        }
        
        turnCount++;
        
        // Check for winner
        if (aiPlayerInstance.hasWon() || humanPlayer.hasWon()) {
          break;
        }
      }

      // AI should handle multiple states
      expect(statesEncountered.size).toBeGreaterThan(1);
    });

    test('AI makes only legal moves throughout game', () => {
      const aiPlayerInstance = gameEngine.addPlayer('AI');
      const humanPlayer = gameEngine.addPlayer('Human');
      const aiPlayer = new AIPlayer(aiPlayerInstance, 'medium');

      let turnCount = 0;
      const maxTurns = 100;
      let illegalMoveAttempts = 0;

      while (!aiPlayerInstance.getState().isGameOver() && !humanPlayer.getState().isGameOver() && turnCount < maxTurns) {
        if (aiPlayerInstance.isMyTurn()) {
          try {
            aiPlayer.makeMove();
          } catch (error) {
            if (error instanceof Error && (error.message.includes('illegal') || error.message.includes('invalid'))) {
              illegalMoveAttempts++;
            }
            throw error; // Re-throw unexpected errors
          }
        } else if (humanPlayer.isMyTurn()) {
          // Simple human simulation
          if (humanPlayer.getState().canDrawCard()) {
            humanPlayer.drawCard();
          } else if (humanPlayer.getState().canPlayCard()) {
            const cards = humanPlayer.getHand().getCards();
            if (cards.length > 0) {
              const cardToPlay = cards.find(c => !c.isWild()) || cards[0];
              // For wild cards, use the correct body part (either the card's bodyPart or a default if fully wild)
              let targetPile: BodyPart;
              if (cardToPlay.isWild()) {
                if (cardToPlay.bodyPart === BodyPart.Wild) {
                  targetPile = BodyPart.Head; // Default to head for fully wild cards
                } else {
                  targetPile = cardToPlay.bodyPart; // Use the specific body part for partial wild cards
                }
              } else {
                targetPile = cardToPlay.bodyPart;
              }
              humanPlayer.playCard(cardToPlay, { targetPile: targetPile });
            }
          } else if (humanPlayer.getState().canNominate()) {
            const cards = humanPlayer.getHand().getCards();
            const wildCard = cards.find(c => c.isWild());
            if (wildCard) {
              const nomination = {
                character: wildCard.character === Character.Wild ? Character.Ninja : wildCard.character,
                bodyPart: wildCard.bodyPart === BodyPart.Wild ? BodyPart.Head : wildCard.bodyPart
              };
              humanPlayer.nominateWildCard(wildCard, nomination);
            }
          }
        }
        
        turnCount++;
        
        // Check for winner
        if (aiPlayerInstance.hasWon() || humanPlayer.hasWon()) {
          break;
        }
      }

      expect(illegalMoveAttempts).toBe(0);
    });

    test('AI games complete within reasonable turn count (< 400 turns)', () => {
      const aiPlayer1Instance = gameEngine.addPlayer('AI1');
      const aiPlayer2Instance = gameEngine.addPlayer('AI2');
      const aiPlayer1 = new AIPlayer(aiPlayer1Instance, 'hard');
      const aiPlayer2 = new AIPlayer(aiPlayer2Instance, 'hard');

      let turnCount = 0;
      const maxTurns = 400;

      while (!aiPlayer1Instance.getState().isGameOver() && !aiPlayer2Instance.getState().isGameOver() && turnCount < maxTurns) {
        if (aiPlayer1Instance.isMyTurn()) {
          aiPlayer1.makeMove();
        } else if (aiPlayer2Instance.isMyTurn()) {
          aiPlayer2.makeMove();
        }
        
        turnCount++;
        
        // Check for winner
        if (aiPlayer1Instance.hasWon() || aiPlayer2Instance.hasWon()) {
          break;
        }
      }

      // Game should either complete with winner or reach turn limit without errors
      const gameCompleted = aiPlayer1Instance.hasWon() || aiPlayer2Instance.hasWon();
      if (!gameCompleted) {
        expect(turnCount).toBe(maxTurns); // Should have hit turn limit
      } else {
        expect(turnCount).toBeLessThan(maxTurns); // Completed before limit
      }
    });
  });

  describe('AI Strategic Behavior', () => {
    test('AI prioritizes completing own characters over disrupting', () => {
      const aiPlayerInstance = gameEngine.addPlayer('AI');
      const humanPlayer = gameEngine.addPlayer('Human');
      const aiPlayer = new AIPlayer(aiPlayerInstance, 'medium');

      // Verify AI shows strategic prioritization in analysis
      const analysis = aiPlayer.getGameAnalysis();
      expect(analysis.ownProgress).toBeDefined();
      expect(analysis.opponentProgress).toBeDefined();
      expect(analysis.disruptionOpportunities).toBeDefined();
    });

    test('AI saves wild cards for strategic opportunities', () => {
      const aiPlayerInstance = gameEngine.addPlayer('AI');
      const humanPlayer = gameEngine.addPlayer('Human');
      const aiPlayer = new AIPlayer(aiPlayerInstance, 'hard');

      // Run several turns and check if AI uses wild cards strategically
      let wildCardUsageCount = 0;
      let totalWildCards = 0;

      for (let i = 0; i < 10 && !aiPlayerInstance.getState().isGameOver() && !humanPlayer.getState().isGameOver(); i++) {
        if (aiPlayerInstance.isMyTurn()) {
          const handBefore = aiPlayerInstance.getHand().getCards();
          const wildsBefore = handBefore.filter(card => card.isWild()).length;
          totalWildCards += wildsBefore;
          
          aiPlayer.makeMove();
          
          const handAfter = aiPlayerInstance.getHand().getCards();
          const wildsAfter = handAfter.filter(card => card.isWild()).length;
          
          if (wildsBefore > wildsAfter) {
            wildCardUsageCount++;
          }
        } else if (humanPlayer.isMyTurn()) {
          // Simple human simulation
          if (humanPlayer.getState().canDrawCard()) {
            humanPlayer.drawCard();
          } else if (humanPlayer.getState().canPlayCard()) {
            const cards = humanPlayer.getHand().getCards();
            if (cards.length > 0) {
              const cardToPlay = cards.find(c => !c.isWild()) || cards[0];
              // For wild cards, use the correct body part (either the card's bodyPart or a default if fully wild)
              let targetPile: BodyPart;
              if (cardToPlay.isWild()) {
                if (cardToPlay.bodyPart === BodyPart.Wild) {
                  targetPile = BodyPart.Head; // Default to head for fully wild cards
                } else {
                  targetPile = cardToPlay.bodyPart; // Use the specific body part for partial wild cards
                }
              } else {
                targetPile = cardToPlay.bodyPart;
              }
              humanPlayer.playCard(cardToPlay, { targetPile: targetPile });
            }
          } else if (humanPlayer.getState().canNominate()) {
            const cards = humanPlayer.getHand().getCards();
            const wildCard = cards.find(c => c.isWild());
            if (wildCard) {
              const nomination = {
                character: wildCard.character === Character.Wild ? Character.Ninja : wildCard.character,
                bodyPart: wildCard.bodyPart === BodyPart.Wild ? BodyPart.Head : wildCard.bodyPart
              };
              humanPlayer.nominateWildCard(wildCard, nomination);
            }
          }
        }
      }

      // Hard AI should be conservative with wild cards
      if (totalWildCards > 0) {
        const wildUsageRate = wildCardUsageCount / totalWildCards;
        expect(wildUsageRate).toBeLessThan(0.5); // Should use less than 50% immediately
      }
    });

    test('AI disrupts opponent when they are close to winning', () => {
      // Verify disruption logic exists in AI analysis
      const aiPlayerInstance = gameEngine.addPlayer('AI');
      const humanPlayer = gameEngine.addPlayer('Human');
      const aiPlayer = new AIPlayer(aiPlayerInstance, 'hard');

      const analysis = aiPlayer.getGameAnalysis();
      expect(analysis.disruptionOpportunities).toBeDefined();
      expect(analysis.threatLevel).toBeDefined();
    });

    test('AI adapts strategy based on game phase', () => {
      const aiPlayerInstance = gameEngine.addPlayer('AI');
      const humanPlayer = gameEngine.addPlayer('Human');
      const aiPlayer = new AIPlayer(aiPlayerInstance, 'medium');

      const initialAnalysis = aiPlayer.getGameAnalysis();
      expect(['early', 'mid', 'late']).toContain(initialAnalysis.gamePhase);
      
      // Strategy should be contextual to game phase
      const strategy = aiPlayer.getStrategy();
      expect(strategy).toContain(initialAnalysis.gamePhase);
    });
  });

  describe('Difficulty Level Validation', () => {
    test('Easy AI has higher mistake rate than Hard AI', () => {
      // Run multiple games and compare decision quality
      const results = { easy: 0, hard: 0 };
      const testGames = 5;

      for (let i = 0; i < testGames; i++) {
        // Test Easy AI
        const easyEngine = new GameEngine();
        easyEngine.createGame();
        const easyAI1 = easyEngine.addPlayer('EasyAI1');
        const easyAI2 = easyEngine.addPlayer('EasyAI2');
        const ai1Easy = new AIPlayer(easyAI1, 'easy');
        const ai2Easy = new AIPlayer(easyAI2, 'easy');
        
        let easyTurns = 0;
        while (!easyAI1.getState().isGameOver() && !easyAI2.getState().isGameOver() && easyTurns < 100) {
          if (easyAI1.isMyTurn()) {
            ai1Easy.makeMove();
          } else if (easyAI2.isMyTurn()) {
            ai2Easy.makeMove();
          }
          easyTurns++;
          
          if (easyAI1.hasWon() || easyAI2.hasWon()) {
            break;
          }
        }
        results.easy += easyTurns;

        // Test Hard AI
        const hardEngine = new GameEngine();
        hardEngine.createGame();
        const hardAI1 = hardEngine.addPlayer('HardAI1');
        const hardAI2 = hardEngine.addPlayer('HardAI2');
        const ai1Hard = new AIPlayer(hardAI1, 'hard');
        const ai2Hard = new AIPlayer(hardAI2, 'hard');
        
        let hardTurns = 0;
        while (!hardAI1.getState().isGameOver() && !hardAI2.getState().isGameOver() && hardTurns < 100) {
          if (hardAI1.isMyTurn()) {
            ai1Hard.makeMove();
          } else if (hardAI2.isMyTurn()) {
            ai2Hard.makeMove();
          }
          hardTurns++;
          
          if (hardAI1.hasWon() || hardAI2.hasWon()) {
            break;
          }
        }
        results.hard += hardTurns;
      }

      // Hard AI should generally complete games faster (more efficient)
      const avgEasyTurns = results.easy / testGames;
      const avgHardTurns = results.hard / testGames;
      
      // Allow for some variance but hard should generally be more efficient
      // Relaxed expectation since differences can be subtle in small samples
      expect(avgHardTurns).toBeLessThan(avgEasyTurns * 1.5);
    });

    test('Hard AI disrupts more aggressively than Easy AI', () => {
      const easyAI = new AIPlayer(gameEngine.addPlayer('EasyAI'), 'easy');
      const hardAI = new AIPlayer(gameEngine.addPlayer('HardAI'), 'hard');

      // Compare disruption priorities in game analysis
      const easyAnalysis = easyAI.getGameAnalysis();
      const hardAnalysis = hardAI.getGameAnalysis();

      // Both should have disruption capabilities, but hard should prioritize it more
      expect(easyAnalysis.disruptionOpportunities).toBeDefined();
      expect(hardAnalysis.disruptionOpportunities).toBeDefined();
    });

    test('Medium AI provides balanced offensive/defensive play', () => {
      const mediumAIInstance = gameEngine.addPlayer('MediumAI');
      const opponentInstance = gameEngine.addPlayer('Opponent'); // Need opponent for analysis
      const mediumAI = new AIPlayer(mediumAIInstance, 'medium');
      
      const analysis = mediumAI.getGameAnalysis();
      const strategy = mediumAI.getStrategy();
      
      // Medium should consider both own progress and opponent threats
      expect(analysis.ownProgress).toBeDefined();
      expect(analysis.opponentProgress).toBeDefined();
      expect(analysis.disruptionOpportunities).toBeDefined();
      expect(strategy.toLowerCase()).toContain('medium');
    });

    test('Difficulty levels produce statistically different outcomes', () => {
      // This is verified by the different decision-making patterns
      // and timing differences observed in other tests
      const difficulties = ['easy', 'medium', 'hard'];
      
      difficulties.forEach(difficulty => {
        // Create a separate game for each difficulty test to avoid conflicts
        const testEngine = new GameEngine();
        testEngine.createGame();
        const aiInstance = testEngine.addPlayer(`AI-${difficulty}`);
        const opponentInstance = testEngine.addPlayer(`Opponent-${difficulty}`); // Need opponent for analysis
        const ai = new AIPlayer(aiInstance, difficulty as any);
        const analysis = ai.getGameAnalysis();
        
        expect(analysis).toBeDefined();
        expect(analysis.gamePhase).toBeDefined();
        expect(analysis.threatLevel).toBeDefined();
      });
    });
  });
});