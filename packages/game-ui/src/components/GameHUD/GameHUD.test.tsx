import { render, screen, fireEvent } from '@testing-library/react';
import { GameHUD } from './GameHUD';
import { GameState } from '../../types/GameUI.types';

const mockGameState: GameState = {
  players: {
    player1: {
      name: 'Player 1',
      score: 2,
      handCount: 5,
      isActive: true,
    },
    player2: {
      name: 'Player 2',
      score: 1,
      handCount: 7,
      isActive: false,
    },
  },
  currentTurn: 'player1',
  gamePhase: 'playing',
};

const mockProps = {
  gameState: mockGameState,
  onNewGame: jest.fn(),
  onPause: jest.fn(),
};

describe('GameHUD', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<GameHUD {...mockProps} />);
    expect(screen.getByTestId('game-hud')).toBeInTheDocument();
  });

  it('displays both player panels', () => {
    render(<GameHUD {...mockProps} />);
    
    expect(screen.getByTestId('player-panel-left')).toBeInTheDocument();
    expect(screen.getByTestId('player-panel-right')).toBeInTheDocument();
  });

  it('displays player names correctly', () => {
    render(<GameHUD {...mockProps} />);
    
    expect(screen.getAllByText('Player 1')).toHaveLength(2); // In PlayerPanel and TurnIndicator
    expect(screen.getByText('Player 2')).toBeInTheDocument();
  });

  it('displays player scores correctly', () => {
    render(<GameHUD {...mockProps} />);
    
    expect(screen.getByTestId('left-score')).toHaveTextContent('2');
    expect(screen.getByTestId('right-score')).toHaveTextContent('1');
  });

  it('displays player hand counts correctly', () => {
    render(<GameHUD {...mockProps} />);
    
    expect(screen.getByTestId('left-hand-count')).toHaveTextContent('5');
    expect(screen.getByTestId('right-hand-count')).toHaveTextContent('7');
  });

  it('shows turn indicator', () => {
    render(<GameHUD {...mockProps} />);
    expect(screen.getByTestId('turn-indicator')).toBeInTheDocument();
  });

  it('shows game controls', () => {
    render(<GameHUD {...mockProps} />);
    expect(screen.getByTestId('game-controls')).toBeInTheDocument();
  });

  it('calls onNewGame when new game button is clicked', () => {
    render(<GameHUD {...mockProps} />);
    
    const newGameButton = screen.getByTestId('new-game-button');
    fireEvent.click(newGameButton);
    
    expect(mockProps.onNewGame).toHaveBeenCalledTimes(1);
  });

  it('calls onPause when pause button is clicked', () => {
    render(<GameHUD {...mockProps} />);
    
    const pauseButton = screen.getByTestId('pause-button');
    fireEvent.click(pauseButton);
    
    expect(mockProps.onPause).toHaveBeenCalledTimes(1);
  });

  it('disables controls when game is finished', () => {
    const finishedGameState = {
      ...mockGameState,
      gamePhase: 'finished' as const,
    };

    render(
      <GameHUD 
        {...mockProps} 
        gameState={finishedGameState} 
      />
    );
    
    const newGameButton = screen.getByTestId('new-game-button');
    expect(newGameButton).toBeDisabled();
  });

  it('works without onPause prop', () => {
    const { onPause, ...propsWithoutPause } = mockProps;
    
    render(<GameHUD {...propsWithoutPause} />);
    
    expect(screen.getByTestId('game-hud')).toBeInTheDocument();
    expect(screen.queryByTestId('pause-button')).not.toBeInTheDocument();
  });

  it('highlights active player correctly', () => {
    render(<GameHUD {...mockProps} />);
    
    const leftPanel = screen.getByTestId('player-panel-left');
    const rightPanel = screen.getByTestId('player-panel-right');
    
    expect(leftPanel).toHaveClass('player-panel--active');
    expect(rightPanel).toHaveClass('player-panel--inactive');
  });

  it('switches active player when turn changes', () => {
    const player2TurnState = {
      ...mockGameState,
      currentTurn: 'player2' as const,
      players: {
        ...mockGameState.players,
        player1: { ...mockGameState.players.player1, isActive: false },
        player2: { ...mockGameState.players.player2, isActive: true },
      },
    };

    render(<GameHUD {...mockProps} gameState={player2TurnState} />);
    
    const leftPanel = screen.getByTestId('player-panel-left');
    const rightPanel = screen.getByTestId('player-panel-right');
    
    expect(leftPanel).toHaveClass('player-panel--inactive');
    expect(rightPanel).toHaveClass('player-panel--active');
  });
});