import { render, screen, fireEvent } from '@testing-library/react';
import { GameHUD } from './GameHUD';
import { PlayerStateInfo, CharacterType } from '../../types/GameUI.types';
import { PlayerStateType } from '@npzr/core';

const mockPlayer1: PlayerStateInfo = {
  id: 'player-1',
  name: 'Player 1',
  score: ['robot', 'pirate'] as CharacterType[],
  handCount: 5,
  hand: [],
  stacks: [],
  state: PlayerStateType.DRAW_CARD,
  stateMessage: 'Draw a card from the deck to start your turn',
  isMyTurn: true,
  canDraw: true,
  canPlay: false,
  canMove: false,
  canNominate: false,
};

const mockPlayer2: PlayerStateInfo = {
  id: 'player-2',
  name: 'Player 2',
  score: ['ninja'] as CharacterType[],
  handCount: 7,
  hand: [],
  stacks: [],
  state: PlayerStateType.WAITING_FOR_OPPONENT,
  stateMessage: 'Waiting for turn',
  isMyTurn: false,
  canDraw: false,
  canPlay: false,
  canMove: false,
  canNominate: false,
};

const mockGameActions = {
  playCard: jest.fn(),
  moveCard: jest.fn(),
  nominateWild: jest.fn(),
};

const mockProps = {
  player1: mockPlayer1,
  player2: mockPlayer2,
  currentPlayer: mockPlayer1,
  gamePhase: 'playing' as const,
  winner: null,
  onNewGame: jest.fn(),
  onDrawCard: jest.fn(),
  gameActions: mockGameActions,
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
    
    expect(screen.getByText('Player 1')).toBeInTheDocument();
    expect(screen.getByText('Player 2')).toBeInTheDocument();
  });

  it('displays player scores correctly', () => {
    render(<GameHUD {...mockProps} />);
    
    expect(screen.getByTestId('completed-characters')).toHaveTextContent('RP');
    expect(screen.getByTestId('completed-characters')).toHaveTextContent('N');
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
    render(<GameHUD {...mockProps} />);
    
    const drawButton = screen.getByTestId('draw-card-button');
    fireEvent.click(drawButton);
    
    expect(mockProps.onDrawCard).toHaveBeenCalledTimes(1);
  });

  it('disables controls when game is finished', () => {
    const finishedProps = {
      ...mockProps,
      gamePhase: 'finished' as const,
    };

    render(<GameHUD {...finishedProps} />);
    
    const newGameButton = screen.getByTestId('new-game-button');
    expect(newGameButton).not.toBeDisabled();
  });

  it('works without draw card functionality when not available', () => {
    const propsWithoutDraw = {
      ...mockProps,
      currentPlayer: {
        ...mockPlayer1,
        canDraw: false,
      },
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
    const player2TurnProps = {
      ...mockProps,
      currentPlayer: mockPlayer2,
      player1: {
        ...mockPlayer1,
        isMyTurn: false,
      },
      player2: {
        ...mockPlayer2,
        isMyTurn: true,
      },
    };

    render(<GameHUD {...player2TurnProps} />);
    
    const leftPanel = screen.getByTestId('player-panel-left');
    const rightPanel = screen.getByTestId('player-panel-right');
    
    expect(leftPanel).toHaveClass('player-panel--inactive');
    expect(rightPanel).toHaveClass('player-panel--active');
  });
});