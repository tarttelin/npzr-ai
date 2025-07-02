import { render, screen, fireEvent } from '@testing-library/react';
import { GameControls } from './GameControls';

const mockProps = {
  onNewGame: jest.fn(),
  onPause: jest.fn(),
};

describe('GameControls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<GameControls onNewGame={mockProps.onNewGame} />);
    expect(screen.getByTestId('game-controls')).toBeInTheDocument();
  });

  it('displays new game button', () => {
    render(<GameControls onNewGame={mockProps.onNewGame} />);
    expect(screen.getByTestId('new-game-button')).toBeInTheDocument();
    expect(screen.getByText('New Game')).toBeInTheDocument();
  });

  it('calls onNewGame when new game button is clicked', () => {
    render(<GameControls onNewGame={mockProps.onNewGame} />);
    
    const button = screen.getByTestId('new-game-button');
    fireEvent.click(button);
    
    expect(mockProps.onNewGame).toHaveBeenCalledTimes(1);
  });

  it('displays pause button when onPause is provided', () => {
    render(<GameControls {...mockProps} />);
    
    expect(screen.getByTestId('pause-button')).toBeInTheDocument();
    expect(screen.getByText('Pause')).toBeInTheDocument();
  });

  it('calls onPause when pause button is clicked', () => {
    render(<GameControls {...mockProps} />);
    
    const button = screen.getByTestId('pause-button');
    fireEvent.click(button);
    
    expect(mockProps.onPause).toHaveBeenCalledTimes(1);
  });

  it('does not display pause button when onPause is not provided', () => {
    render(<GameControls onNewGame={mockProps.onNewGame} />);
    expect(screen.queryByTestId('pause-button')).not.toBeInTheDocument();
  });

  it('disables buttons when disabled prop is true', () => {
    render(<GameControls {...mockProps} disabled={true} />);
    
    expect(screen.getByTestId('new-game-button')).toBeDisabled();
    expect(screen.getByTestId('pause-button')).toBeDisabled();
  });

  it('enables buttons when disabled prop is false', () => {
    render(<GameControls {...mockProps} disabled={false} />);
    
    expect(screen.getByTestId('new-game-button')).not.toBeDisabled();
    expect(screen.getByTestId('pause-button')).not.toBeDisabled();
  });

  it('enables buttons by default when disabled prop is not provided', () => {
    render(<GameControls {...mockProps} />);
    
    expect(screen.getByTestId('new-game-button')).not.toBeDisabled();
    expect(screen.getByTestId('pause-button')).not.toBeDisabled();
  });

  it('does not call onNewGame when button is disabled', () => {
    render(<GameControls {...mockProps} disabled={true} />);
    
    const button = screen.getByTestId('new-game-button');
    fireEvent.click(button);
    
    expect(mockProps.onNewGame).not.toHaveBeenCalled();
  });

  it('does not call onPause when button is disabled', () => {
    render(<GameControls {...mockProps} disabled={true} />);
    
    const button = screen.getByTestId('pause-button');
    fireEvent.click(button);
    
    expect(mockProps.onPause).not.toHaveBeenCalled();
  });

  it('has correct accessibility attributes', () => {
    render(<GameControls {...mockProps} />);
    
    const newGameButton = screen.getByTestId('new-game-button');
    const pauseButton = screen.getByTestId('pause-button');
    
    expect(newGameButton).toHaveAttribute('aria-label', 'Start a new game');
    expect(pauseButton).toHaveAttribute('aria-label', 'Pause the current game');
  });

  it('handles keyboard navigation correctly', () => {
    render(<GameControls {...mockProps} />);
    
    const newGameButton = screen.getByTestId('new-game-button');
    
    // Focus should work
    newGameButton.focus();
    expect(document.activeElement).toBe(newGameButton);
    
    // Tab navigation should work
    fireEvent.keyDown(newGameButton, { key: 'Tab' });
    // Note: actual tab behavior would need more complex testing setup
  });
});