import { render, screen } from '@testing-library/react';
import { TurnIndicator } from './TurnIndicator';
import { PlayerInfo } from '../../../types/GameUI.types';

const mockPlayer: PlayerInfo = {
  name: 'Test Player',
  score: 2,
  handCount: 5,
  isActive: true,
};

describe('TurnIndicator', () => {
  it('renders without crashing', () => {
    render(
      <TurnIndicator 
        currentPlayer={mockPlayer} 
        gamePhase="setup" 
      />
    );
    expect(screen.getByTestId('turn-indicator')).toBeInTheDocument();
  });

  it('displays setup phase correctly', () => {
    render(
      <TurnIndicator 
        currentPlayer={mockPlayer} 
        gamePhase="setup" 
      />
    );
    expect(screen.getByText('Setting up...')).toBeInTheDocument();
  });

  it('displays playing phase correctly', () => {
    render(
      <TurnIndicator 
        currentPlayer={mockPlayer} 
        gamePhase="playing" 
      />
    );
    expect(screen.getByText('Playing')).toBeInTheDocument();
  });

  it('displays finished phase correctly', () => {
    render(
      <TurnIndicator 
        currentPlayer={mockPlayer} 
        gamePhase="finished" 
      />
    );
    expect(screen.getByText('Game Over')).toBeInTheDocument();
  });

  it('shows current player name when game is playing', () => {
    render(
      <TurnIndicator 
        currentPlayer={mockPlayer} 
        gamePhase="playing" 
      />
    );
    expect(screen.getByText('Test Player')).toBeInTheDocument();
    expect(screen.getByText('Turn:')).toBeInTheDocument();
  });

  it('hides current player name when game is not playing', () => {
    render(
      <TurnIndicator 
        currentPlayer={mockPlayer} 
        gamePhase="setup" 
      />
    );
    expect(screen.queryByText('Test Player')).not.toBeInTheDocument();
    expect(screen.queryByText('Turn:')).not.toBeInTheDocument();
  });

  it('shows game over indicator when game is finished', () => {
    render(
      <TurnIndicator 
        currentPlayer={mockPlayer} 
        gamePhase="finished" 
      />
    );
    expect(screen.getByTestId('game-over')).toBeInTheDocument();
  });

  it('applies active class when game is playing', () => {
    render(
      <TurnIndicator 
        currentPlayer={mockPlayer} 
        gamePhase="playing" 
      />
    );
    const indicator = screen.getByTestId('turn-indicator');
    expect(indicator).toHaveClass('turn-indicator--active');
  });

  it('does not apply active class when game is not playing', () => {
    render(
      <TurnIndicator 
        currentPlayer={mockPlayer} 
        gamePhase="setup" 
      />
    );
    const indicator = screen.getByTestId('turn-indicator');
    expect(indicator).not.toHaveClass('turn-indicator--active');
  });

  it('has correct accessibility attributes', () => {
    render(
      <TurnIndicator 
        currentPlayer={mockPlayer} 
        gamePhase="playing" 
      />
    );
    
    const indicator = screen.getByTestId('turn-indicator');
    expect(indicator).toHaveAttribute('role', 'status');
    expect(indicator).toHaveAttribute('aria-live', 'polite');
    expect(indicator).toHaveAttribute(
      'aria-label', 
      'Current turn: Test Player, Game phase: Playing'
    );
  });

  it('updates aria-label for different phases', () => {
    const { rerender } = render(
      <TurnIndicator 
        currentPlayer={mockPlayer} 
        gamePhase="setup" 
      />
    );
    
    let indicator = screen.getByTestId('turn-indicator');
    expect(indicator).toHaveAttribute(
      'aria-label', 
      'Current turn: Test Player, Game phase: Setting up...'
    );

    rerender(
      <TurnIndicator 
        currentPlayer={mockPlayer} 
        gamePhase="finished" 
      />
    );
    
    indicator = screen.getByTestId('turn-indicator');
    expect(indicator).toHaveAttribute(
      'aria-label', 
      'Current turn: Test Player, Game phase: Game Over'
    );
  });

  it('handles different player names correctly', () => {
    const differentPlayer = { ...mockPlayer, name: 'AI Player' };
    
    render(
      <TurnIndicator 
        currentPlayer={differentPlayer} 
        gamePhase="playing" 
      />
    );
    
    expect(screen.getByText('AI Player')).toBeInTheDocument();
  });
});