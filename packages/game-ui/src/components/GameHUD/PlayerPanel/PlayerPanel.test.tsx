import { render, screen } from '@testing-library/react';
import { PlayerPanel } from './PlayerPanel';
import { PlayerInfo, CharacterType } from '../../../types/GameUI.types';

const mockPlayer: PlayerInfo = {
  name: 'Test Player',
  score: ['robot', 'pirate', 'ninja'], // RPN
  handCount: 6,
  isActive: true,
};

describe('PlayerPanel', () => {
  it('renders without crashing', () => {
    render(
      <PlayerPanel 
        player={mockPlayer} 
        isCurrentPlayer={true} 
        position="left" 
      />
    );
    expect(screen.getByTestId('player-panel-left')).toBeInTheDocument();
  });

  it('displays player name correctly', () => {
    render(
      <PlayerPanel 
        player={mockPlayer} 
        isCurrentPlayer={true} 
        position="left" 
      />
    );
    expect(screen.getByText('Test Player')).toBeInTheDocument();
  });

  it('displays player score correctly', () => {
    render(
      <PlayerPanel 
        player={mockPlayer} 
        isCurrentPlayer={true} 
        position="left" 
      />
    );
    expect(screen.getByTestId('left-score')).toHaveTextContent('RPN');
  });

  it('displays player hand count correctly', () => {
    render(
      <PlayerPanel 
        player={mockPlayer} 
        isCurrentPlayer={true} 
        position="left" 
      />
    );
    expect(screen.getByTestId('left-hand-count')).toHaveTextContent('6');
  });

  it('shows turn indicator when player is current', () => {
    render(
      <PlayerPanel 
        player={mockPlayer} 
        isCurrentPlayer={true} 
        position="left" 
      />
    );
    expect(screen.getByLabelText('Current turn')).toBeInTheDocument();
  });

  it('hides turn indicator when player is not current', () => {
    render(
      <PlayerPanel 
        player={mockPlayer} 
        isCurrentPlayer={false} 
        position="left" 
      />
    );
    expect(screen.queryByLabelText('Current turn')).not.toBeInTheDocument();
  });

  it('applies active class when player is current', () => {
    render(
      <PlayerPanel 
        player={mockPlayer} 
        isCurrentPlayer={true} 
        position="left" 
      />
    );
    const panel = screen.getByTestId('player-panel-left');
    expect(panel).toHaveClass('player-panel--active');
  });

  it('applies inactive class when player is not current', () => {
    render(
      <PlayerPanel 
        player={mockPlayer} 
        isCurrentPlayer={false} 
        position="left" 
      />
    );
    const panel = screen.getByTestId('player-panel-left');
    expect(panel).toHaveClass('player-panel--inactive');
  });

  it('applies left position class correctly', () => {
    render(
      <PlayerPanel 
        player={mockPlayer} 
        isCurrentPlayer={true} 
        position="left" 
      />
    );
    const panel = screen.getByTestId('player-panel-left');
    expect(panel).toHaveClass('player-panel--left');
  });

  it('applies right position class correctly', () => {
    render(
      <PlayerPanel 
        player={mockPlayer} 
        isCurrentPlayer={true} 
        position="right" 
      />
    );
    const panel = screen.getByTestId('player-panel-right');
    expect(panel).toHaveClass('player-panel--right');
  });

  it('renders score and hand count with correct test ids for right position', () => {
    render(
      <PlayerPanel 
        player={mockPlayer} 
        isCurrentPlayer={true} 
        position="right" 
      />
    );
    expect(screen.getByTestId('right-score')).toHaveTextContent('RPN');
    expect(screen.getByTestId('right-hand-count')).toHaveTextContent('6');
  });

  it('handles empty score correctly', () => {
    const noScorePlayer = { ...mockPlayer, score: [] };
    render(
      <PlayerPanel 
        player={noScorePlayer} 
        isCurrentPlayer={true} 
        position="left" 
      />
    );
    expect(screen.getByTestId('left-score')).toHaveTextContent('—');
  });

  it('handles multiple same characters correctly', () => {
    const multipleScorePlayer: PlayerInfo = { 
      ...mockPlayer, 
      score: ['robot', 'pirate', 'ninja', 'pirate'] as CharacterType[]
    }; // RPNP
    render(
      <PlayerPanel 
        player={multipleScorePlayer} 
        isCurrentPlayer={true} 
        position="left" 
      />
    );
    expect(screen.getByTestId('left-score')).toHaveTextContent('RPNP');
  });
});