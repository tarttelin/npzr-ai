import React, { useState } from 'react';
import { useLogger } from '@npzr/ui-react';
import { logger } from '@npzr/logging';
import { GameEngine } from '@npzr/core';
import { AIPlayer } from '@npzr/ai';
import './GamePage.css';

export const GamePage: React.FC = () => {
  const [gameEngine] = useState(() => {
    const engine = new GameEngine();
    engine.createGame();
    return engine;
  });
  
  const { toggle: toggleDebug } = useLogger();

  const handleStartGame = () => {
    logger.info('Starting new NPZR game', { 
      timestamp: Date.now(),
      players: 2,
      mode: 'player-vs-ai'
    });

    // Add players
    const humanPlayer = gameEngine.addPlayer('Human Player');
    const aiPlayer = gameEngine.addPlayer('AI Player');
    
    // Create AI instance
    new AIPlayer(aiPlayer, 'medium');
    
    logger.info('Game initialized successfully', {
      humanPlayerId: humanPlayer.getId(),
      aiPlayerId: aiPlayer.getId(),
      aiDifficulty: 'medium'
    });
  };

  const handleTestLogs = () => {
    logger.debug('Debug message from game UI', { component: 'GamePage', action: 'test' });
    logger.info('Info message from game UI', { component: 'GamePage', action: 'test' });
    logger.warn('Warning message from game UI', { component: 'GamePage', action: 'test' });
    logger.error('Error message from game UI', { component: 'GamePage', action: 'test' });
  };

  return (
    <div className="game-page">
      <div className="container">
        <header className="game-header">
          <h1>🎮 NPZR Game</h1>
          <p>Ready to battle with ninjas, pirates, zombies, and robots?</p>
        </header>

        <div className="game-area">
          <h2>Game Area</h2>
          <p>This is a skeleton UI for the NPZR card game.</p>
          
          <div className="game-controls">
            <button onClick={handleStartGame} className="btn btn--primary">
              🚀 Start New Game
            </button>
            
            <button onClick={handleTestLogs} className="btn btn--secondary">
              📝 Test Logging
            </button>
            
            <button onClick={toggleDebug} className="btn btn--debug">
              🐛 Toggle Debug Logger
            </button>
          </div>

          <div className="game-info">
            <h3>Game Status</h3>
            <p>No game in progress</p>
            
            <h3>Instructions</h3>
            <ul>
              <li>Click "Start New Game" to initialize the game engine</li>
              <li>Click "Test Logging" to generate sample log messages</li>
              <li>Click "Toggle Debug Logger" or press <kbd>Ctrl+Shift+L</kbd> to show/hide debug console</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};