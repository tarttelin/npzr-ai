import { render, screen, fireEvent } from '@testing-library/react';
import { GameControls } from './GameControls';

const mockProps = {
  onNewGame: jest.fn(),
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

  it('only displays new game button', () => {
    render(<GameControls {...mockProps} />);
    
    expect(screen.getByTestId('new-game-button')).toBeInTheDocument();
    expect(screen.queryByTestId('pause-button')).not.toBeInTheDocument();
  });

  it('calls onNewGame when new game button is clicked again', () => {
    render(<GameControls {...mockProps} />);
    
    const button = screen.getByTestId('new-game-button');
    fireEvent.click(button);
    fireEvent.click(button);
    
    expect(mockProps.onNewGame).toHaveBeenCalledTimes(2);
  });

  it('works with minimal props', () => {
    render(<GameControls onNewGame={mockProps.onNewGame} />);
    expect(screen.getByTestId('game-controls')).toBeInTheDocument();
    expect(screen.queryByTestId('pause-button')).not.toBeInTheDocument();
  });

  it('disables new game button when disabled prop is true', () => {
    render(<GameControls {...mockProps} disabled={true} />);
    
    expect(screen.getByTestId('new-game-button')).toBeDisabled();
  });

  it('enables new game button when disabled prop is false', () => {
    render(<GameControls {...mockProps} disabled={false} />);
    
    expect(screen.getByTestId('new-game-button')).not.toBeDisabled();
  });

  it('enables new game button by default when disabled prop is not provided', () => {
    render(<GameControls {...mockProps} />);
    
    expect(screen.getByTestId('new-game-button')).not.toBeDisabled();
  });

  it('does not call onNewGame when button is disabled', () => {
    render(<GameControls {...mockProps} disabled={true} />);
    
    const button = screen.getByTestId('new-game-button');
    fireEvent.click(button);
    
    expect(mockProps.onNewGame).not.toHaveBeenCalled();
  });

  it('does not call onNewGame when new game button is disabled', () => {
    render(<GameControls {...mockProps} disabled={true} />);
    
    const button = screen.getByTestId('new-game-button');
    fireEvent.click(button);
    
    expect(mockProps.onNewGame).not.toHaveBeenCalled();
  });

  it('has correct accessibility attributes', () => {
    render(<GameControls {...mockProps} />);
    
    const newGameButton = screen.getByTestId('new-game-button');
    
    expect(newGameButton).toHaveAttribute('aria-label', 'Start a new game');
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