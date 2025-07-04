import { render, screen, act } from '@testing-library/react';
import { GameCanvas } from './GameCanvas';

// Mock PixiJS
jest.mock('pixi.js', () => ({
  Application: jest.fn().mockImplementation(() => ({
    init: jest.fn().mockResolvedValue(undefined),
    canvas: document.createElement('canvas'),
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
    rect: jest.fn().mockReturnThis(),
    fill: jest.fn().mockReturnThis(),
    stroke: jest.fn().mockReturnThis(),
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

const mockGameEngine = {
  players: [null, null],
  currentPlayerId: 'player1',
  gamePhase: 'setup',
};

const mockGameActions = {
  drawCard: jest.fn(),
  playCard: jest.fn(),
  moveCard: jest.fn(),
  nominateWild: jest.fn(),
};

const mockProps = {
  gameEngine: mockGameEngine,
  players: [null, null] as [null, null],
  currentPlayer: null,
  gamePhase: 'setup' as const,
  gameActions: mockGameActions,
};

describe('GameCanvas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<GameCanvas {...mockProps} />);
    expect(screen.getByTestId('game-canvas')).toBeInTheDocument();
  });

  it('renders canvas container', () => {
    render(<GameCanvas {...mockProps} />);
    const container = screen.getByTestId('game-canvas');
    expect(container.querySelector('.canvas-container')).toBeInTheDocument();
  });

  it('shows debug info in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(<GameCanvas {...mockProps} />);
    
    expect(screen.getByText(/Canvas:/)).toBeInTheDocument();
    expect(screen.getByText(/Phase: setup/)).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('hides debug info in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    render(<GameCanvas {...mockProps} />);
    
    expect(screen.queryByText(/Canvas:/)).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('accepts custom width and height props', () => {
    render(
      <GameCanvas 
        {...mockProps}
        width={1000} 
        height={800} 
      />
    );
    
    expect(screen.getByTestId('game-canvas')).toBeInTheDocument();
  });

  it('handles window resize events', () => {
    const { unmount } = render(<GameCanvas {...mockProps} />);
    
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