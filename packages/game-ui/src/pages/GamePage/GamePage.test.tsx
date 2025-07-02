import { render, screen, fireEvent } from '@testing-library/react';
import { GamePage } from './GamePage';
import { GameState } from '../../types/GameUI.types';

// Mock child components
jest.mock('../../components/GameHUD/GameHUD', () => ({
  GameHUD: jest.fn(({ gameState, onNewGame, onPause }) => (
    <div data-testid="mock-game-hud">
      <button onClick={onNewGame} data-testid="mock-new-game">New Game</button>
      <button onClick={onPause} data-testid="mock-pause">Pause</button>
      <span>{gameState.gamePhase}</span>
    </div>
  )),
}));

jest.mock('../../components/GameCanvas/GameCanvas', () => ({
  GameCanvas: jest.fn(({ gameState }) => (
    <div data-testid="mock-game-canvas">
      Canvas - {gameState.gamePhase}
    </div>
  )),
}));

// Mock useGameState hook
let mockGameState: GameState = {
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

const mockUseGameState = {
  gameState: mockGameState as GameState,
  startNewGame: jest.fn(),
  pauseGame: jest.fn(),
  switchTurn: jest.fn(),
  updateScore: jest.fn(),
  endGame: jest.fn(),
};

jest.mock('../../hooks/useGameState', () => ({
  useGameState: () => mockUseGameState,
}));

describe('GamePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock state to setup
    mockGameState = {
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
    mockUseGameState.gameState = mockGameState;
  });

  it('renders without crashing', () => {
    render(<GamePage />);
    expect(screen.getByTestId('game-page')).toBeInTheDocument();
  });

  it('renders GameHUD component', () => {
    render(<GamePage />);
    expect(screen.getByTestId('mock-game-hud')).toBeInTheDocument();
  });

  it('renders GameCanvas component', () => {
    render(<GamePage />);
    expect(screen.getByTestId('mock-game-canvas')).toBeInTheDocument();
  });

  it('passes game state to child components', () => {
    render(<GamePage />);
    
    expect(screen.getByText('setup')).toBeInTheDocument();
    expect(screen.getByText('Canvas - setup')).toBeInTheDocument();
  });

  it('calls startNewGame when new game button is clicked', () => {
    render(<GamePage />);
    
    const newGameButton = screen.getByTestId('mock-new-game');
    fireEvent.click(newGameButton);
    
    expect(mockUseGameState.startNewGame).toHaveBeenCalledTimes(1);
  });

  it('calls pauseGame when pause button is clicked', () => {
    render(<GamePage />);
    
    const pauseButton = screen.getByTestId('mock-pause');
    fireEvent.click(pauseButton);
    
    expect(mockUseGameState.pauseGame).toHaveBeenCalledTimes(1);
  });

  it('handles Escape key to pause game when playing', () => {
    const playingState = {
      ...mockGameState,
      gamePhase: 'playing' as const,
    };
    mockUseGameState.gameState = playingState;
    
    render(<GamePage />);
    
    fireEvent.keyDown(window, { key: 'Escape' });
    
    expect(mockUseGameState.pauseGame).toHaveBeenCalledTimes(1);
  });

  it('does not pause game on Escape when not playing', () => {
    render(<GamePage />);
    
    fireEvent.keyDown(window, { key: 'Escape' });
    
    expect(mockUseGameState.pauseGame).not.toHaveBeenCalled();
  });

  it('handles Ctrl+N to start new game', () => {
    render(<GamePage />);
    
    fireEvent.keyDown(window, { key: 'n', ctrlKey: true });
    
    expect(mockUseGameState.startNewGame).toHaveBeenCalledTimes(1);
  });

  it('handles Cmd+N to start new game (Mac)', () => {
    render(<GamePage />);
    
    fireEvent.keyDown(window, { key: 'N', metaKey: true });
    
    expect(mockUseGameState.startNewGame).toHaveBeenCalledTimes(1);
  });

  it('prevents default behavior for Ctrl+N', () => {
    render(<GamePage />);
    
    const event = new KeyboardEvent('keydown', { 
      key: 'n', 
      ctrlKey: true,
      bubbles: true 
    });
    
    const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
    window.dispatchEvent(event);
    
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('does not handle other key combinations', () => {
    render(<GamePage />);
    
    fireEvent.keyDown(window, { key: 'a', ctrlKey: true });
    fireEvent.keyDown(window, { key: 'n' }); // without ctrl/cmd
    
    expect(mockUseGameState.startNewGame).not.toHaveBeenCalled();
    expect(mockUseGameState.pauseGame).not.toHaveBeenCalled();
  });

  it('shows accessibility information', () => {
    render(<GamePage />);
    
    const accessibilityDiv = screen.getByText(/Current game phase: setup/);
    expect(accessibilityDiv).toHaveClass('sr-only');
    expect(accessibilityDiv).toHaveAttribute('aria-live', 'polite');
  });

  it('shows current turn in accessibility info when playing', () => {
    const playingState = {
      ...mockGameState,
      gamePhase: 'playing' as const,
    };
    mockUseGameState.gameState = playingState;
    
    render(<GamePage />);
    
    expect(screen.getByText(/Current turn: Player 1/)).toBeInTheDocument();
  });

  it('shows keyboard shortcuts in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    render(<GamePage />);
    
    expect(screen.getByText(/Shortcuts: Ctrl\+N \(New Game\), Esc \(Pause\)/)).toBeInTheDocument();
    
    process.env.NODE_ENV = originalEnv;
  });

  it('hides keyboard shortcuts in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    render(<GamePage />);
    
    expect(screen.queryByText(/Shortcuts:/)).not.toBeInTheDocument();
    
    process.env.NODE_ENV = originalEnv;
  });

  it('cleans up event listeners on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    
    const { unmount } = render(<GamePage />);
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    
    removeEventListenerSpy.mockRestore();
  });
});