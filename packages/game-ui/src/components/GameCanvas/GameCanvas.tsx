import React, { useState, useEffect } from 'react';
import { GameCanvasProps } from '../../types/GameUI.types';
import { usePixiApp } from './hooks/usePixiApp';
import './GameCanvas.css';

/**
 * GameCanvas component - Renders the game area using PixiJS
 * 
 * Features:
 * - Green baize casino-style background
 * - Deck placeholder on the left side
 * - Responsive canvas sizing
 * - Proper PixiJS lifecycle management
 */
export const GameCanvas: React.FC<GameCanvasProps> = ({ 
  width = 800, 
  height = 600, 
  gameState 
}) => {
  const [canvasSize, setCanvasSize] = useState({ width, height });

  const { containerRef } = usePixiApp({
    width: canvasSize.width,
    height: canvasSize.height,
    onResize: (newWidth, newHeight) => {
      setCanvasSize({ width: newWidth, height: newHeight });
    },
  });

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({ 
          width: rect.width || width, 
          height: rect.height || height 
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [width, height, containerRef]);

  return (
    <div className="game-canvas" data-testid="game-canvas">
      <div 
        ref={containerRef} 
        className="canvas-container"
        style={{ width: '100%', height: '100%' }}
      />
      
      {/* Debug info - will be removed in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="canvas-debug-info">
          <small>
            Canvas: {canvasSize.width}×{canvasSize.height} | 
            Phase: {gameState.gamePhase} | 
            Turn: {gameState.currentTurn}
          </small>
        </div>
      )}
    </div>
  );
};