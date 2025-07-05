import { render, screen } from '@testing-library/react';
import { PlayerPanel } from './PlayerPanel';
import { PlayerStateInfo, CharacterType } from '../../../types/GameUI.types';
import { PlayerStateType } from '@npzr/core';
import { createPlayerStateInfo } from '../../../test-fixtures';

const mockPlayer: PlayerStateInfo = createPlayerStateInfo({
  name: 'Test Player',
  score: ['robot', 'pirate', 'ninja'], // RPN
  handCount: 6,
  state: PlayerStateType.DRAW_CARD,
  isMyTurn: true,
  canDraw: true,
  canPlay: false,
  canMove: false,
  canNominate: false,
});

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
    expect(screen.getByTestId('completed-characters')).toHaveTextContent('RPN');
  });

  it('displays player hand count correctly', () => {
    render(
      <PlayerPanel 
        player={mockPlayer} 
        isCurrentPlayer={true} 
        position="left" 
      />
    );
    expect(screen.getByTestId('hand-count')).toHaveTextContent('6');
  });

  it('displays player state message', () => {
    render(
      <PlayerPanel 
        player={mockPlayer} 
        isCurrentPlayer={true} 
        position="left" 
      />
    );
    expect(screen.getByTestId('player-status')).toHaveTextContent(mockPlayer.stateMessage);
  });

  it('shows current player indicator when player is current', () => {
    render(
      <PlayerPanel 
        player={mockPlayer} 
        isCurrentPlayer={true} 
        position="left" 
      />
    );
    expect(screen.getByText('▶')).toBeInTheDocument();
  });

  it('hides current player indicator when player is not current', () => {
    render(
      <PlayerPanel 
        player={mockPlayer} 
        isCurrentPlayer={false} 
        position="left" 
      />
    );
    expect(screen.queryByText('▶')).not.toBeInTheDocument();
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

  it('handles empty score correctly', () => {
    const noScorePlayer = createPlayerStateInfo({ score: [] as CharacterType[] });
    render(
      <PlayerPanel 
        player={noScorePlayer} 
        isCurrentPlayer={true} 
        position="left" 
      />
    );
    expect(screen.getByTestId('completed-characters')).toHaveTextContent('—');
  });

  it('handles multiple same characters correctly', () => {
    const multipleScorePlayer = createPlayerStateInfo({ 
      score: ['robot', 'pirate', 'ninja', 'pirate'] as CharacterType[]
    }); // RPNP
    render(
      <PlayerPanel 
        player={multipleScorePlayer} 
        isCurrentPlayer={true} 
        position="left" 
      />
    );
    expect(screen.getByTestId('completed-characters')).toHaveTextContent('RPNP');
  });

  it('returns null when player is null', () => {
    const { container } = render(
      <PlayerPanel 
        player={null} 
        isCurrentPlayer={false} 
        position="left" 
      />
    );
    expect(container.firstChild).toBeNull();
  });
});