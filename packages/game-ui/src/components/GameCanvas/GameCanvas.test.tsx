import { render, screen, act } from '@testing-library/react';
import { GameCanvas } from './GameCanvas';
import { GameState } from '../../types/GameUI.types';

// Mock PixiJS
jest.mock('pixi.js', () => ({
  Application: jest.fn().mockImplementation(() => ({
    view: document.createElement('canvas'),
    stage: {
      addChild: jest.fn(),
    },
    renderer: {
      resize: jest.fn(),
    },
    destroy: jest.fn(),
    destroyed: false,
  })),
  Graphics: jest.fn().mockImplementation(() => ({
    beginFill: jest.fn().mockReturnThis(),
    lineStyle: jest.fn().mockReturnThis(),
    drawRoundedRect: jest.fn().mockReturnThis(),
    endFill: jest.fn().mockReturnThis(),
    x: 0,
    y: 0,
  })),
}));

// Mock usePixiApp hook
jest.mock('./hooks/usePixiApp', () => ({
  usePixiApp: jest.fn(() => ({
    containerRef: { current: null },
    app: null,
    resize: jest.fn(),
    cleanup: jest.fn(),
  })),
}));

const mockGameState: GameState = {
  players: {
    player1: {
      name: 'Player 1',
      score: 0,
      handCount: 5,
      isActive: true,
    },
    player2: {
      name: 'Player 2',
      score: 0,
      handCount: 5,
      isActive: false,
    },
  },
  currentTurn: 'player1',
  gamePhase: 'setup',
};

describe('GameCanvas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<GameCanvas gameState={mockGameState} />);
    expect(screen.getByTestId('game-canvas')).toBeInTheDocument();
  });

  it('renders canvas container', () => {
    render(<GameCanvas gameState={mockGameState} />);
    const container = screen.getByTestId('game-canvas');
    expect(container.querySelector('.canvas-container')).toBeInTheDocument();
  });

  it('shows debug info in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(<GameCanvas gameState={mockGameState} />);
    
    expect(screen.getByText(/Canvas:/)).toBeInTheDocument();
    expect(screen.getByText(/Phase: setup/)).toBeInTheDocument();
    expect(screen.getByText(/Turn: player1/)).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('hides debug info in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    render(<GameCanvas gameState={mockGameState} />);
    
    expect(screen.queryByText(/Canvas:/)).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('accepts custom width and height props', () => {
    render(
      <GameCanvas 
        gameState={mockGameState} 
        width={1000} 
        height={800} 
      />
    );
    
    expect(screen.getByTestId('game-canvas')).toBeInTheDocument();
  });

  it('handles window resize events', () => {
    const { unmount } = render(<GameCanvas gameState={mockGameState} />);
    
    // Simulate window resize
    act(() => {
      const resizeEvent = new Event('resize');
      window.dispatchEvent(resizeEvent);
    });
    
    // Should not throw errors
    expect(screen.getByTestId('game-canvas')).toBeInTheDocument();
    
    unmount();
  });
});