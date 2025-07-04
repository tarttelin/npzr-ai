import { render, screen, fireEvent } from '@testing-library/react';
import { GameHUD } from './GameHUD';
import { PlayerStateInfo, CharacterType } from '../../types/GameUI.types';
import { PlayerStateType } from '@npzr/core';
import { createPlayerStateInfo } from '../../test-fixtures';

const mockPlayer1: PlayerStateInfo = createPlayerStateInfo({
  name: 'Player 1',
  score: ['robot', 'pirate'] as CharacterType[],
  handCount: 5,
  state: PlayerStateType.DRAW_CARD,
  isMyTurn: true,
  canDraw: true,
  canPlay: false,
  canMove: false,
  canNominate: false,
});

const mockPlayer2: PlayerStateInfo = createPlayerStateInfo({
  name: 'Player 2',
  score: ['ninja'] as CharacterType[],
  handCount: 7,
  state: PlayerStateType.WAITING_FOR_OPPONENT,
  isMyTurn: false,
  canDraw: false,
  canPlay: false,
  canMove: false,
  canNominate: false,
});

const mockProps = {
  player1: mockPlayer1,
  player2: mockPlayer2,
  currentPlayer: mockPlayer1,
  gamePhase: 'playing' as const,
  winner: null,
  onNewGame: jest.fn(),
  onDrawCard: jest.fn(),
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
    
    const scoreElements = screen.getAllByTestId('completed-characters');
    expect(scoreElements[0]).toHaveTextContent('RP'); // Player 1 (left)
    expect(scoreElements[1]).toHaveTextContent('N');  // Player 2 (right)
  });

  it('displays player hand counts correctly', () => {
    render(<GameHUD {...mockProps} />);
    
    expect(screen.getAllByTestId('hand-count')[0]).toHaveTextContent('5');
    expect(screen.getAllByTestId('hand-count')[1]).toHaveTextContent('7');
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

  it('calls onDrawCard when draw card button is clicked', () => {
    const humanPlayer = createPlayerStateInfo({
      name: 'Human Player',
      canDraw: true,
    });
    
    const propsWithHumanPlayer = {
      ...mockProps,
      currentPlayer: humanPlayer,
    };
    
    render(<GameHUD {...propsWithHumanPlayer} onDrawCard={mockProps.onDrawCard} />);
    
    const drawButton = screen.getByTestId('draw-card-btn');
    fireEvent.click(drawButton);
    
    expect(mockProps.onDrawCard).toHaveBeenCalledTimes(1);
  });

  it('keeps controls enabled when game is finished', () => {
    const finishedProps = {
      ...mockProps,
      gamePhase: 'finished' as const,
    };

    render(<GameHUD {...finishedProps} />);
    
    const newGameButton = screen.getByTestId('new-game-button');
    expect(newGameButton).not.toBeDisabled();
  });

  it('works without draw card functionality when not available', () => {
    const playerWithoutDraw = createPlayerStateInfo({
      canDraw: false,
    });
    
    const propsWithoutDraw = {
      ...mockProps,
      currentPlayer: playerWithoutDraw,
    };
    
    render(<GameHUD {...propsWithoutDraw} />);
    
    expect(screen.getByTestId('game-hud')).toBeInTheDocument();
  });

  it('highlights active player correctly', () => {
    render(<GameHUD {...mockProps} />);
    
    const leftPanel = screen.getByTestId('player-panel-left');
    const rightPanel = screen.getByTestId('player-panel-right');
    
    expect(leftPanel).toHaveClass('player-panel--active');
    expect(rightPanel).toHaveClass('player-panel--inactive');
  });

  it('switches active player when turn changes', () => {
    const player1Inactive = createPlayerStateInfo({
      name: 'Player 1',
      isMyTurn: false,
    });
    const player2Active = createPlayerStateInfo({
      name: 'Player 2',
      isMyTurn: true,
    });

    const player2TurnProps = {
      ...mockProps,
      currentPlayer: player2Active,
      player1: player1Inactive,
      player2: player2Active,
    };

    render(<GameHUD {...player2TurnProps} />);
    
    const leftPanel = screen.getByTestId('player-panel-left');
    const rightPanel = screen.getByTestId('player-panel-right');
    
    expect(leftPanel).toHaveClass('player-panel--inactive');
    expect(rightPanel).toHaveClass('player-panel--active');
  });
});