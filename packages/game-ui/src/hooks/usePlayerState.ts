import { useMemo, useCallback, useEffect, useState } from 'react';
import { Player, PlayerStateType, Card, Character, Stack } from '@npzr/core';
import { CharacterType } from '../types/GameUI.types';

export interface PlayerStateInfo {
  id: string;
  name: string;
  score: CharacterType[];
  handCount: number;
  hand: Card[];
  stacks: Stack[];
  state: PlayerStateType;
  stateMessage: string;
  isMyTurn: boolean;
  canDraw: boolean;
  canPlay: boolean;
  canMove: boolean;
  canNominate: boolean;
}

export interface UsePlayerStateReturn {
  player1: PlayerStateInfo | null;
  player2: PlayerStateInfo | null;
  currentPlayer: PlayerStateInfo | null;
  gamePhase: 'setup' | 'playing' | 'finished';
  winner: PlayerStateInfo | null;
  // Action methods
  drawCard: () => void;
  playCard: (card: Card, options?: { targetStackId?: string; targetPile?: any }) => void;
  moveCard: (options: { cardId: string; fromStackId: string; fromPile: any; toStackId?: string; toPile: any }) => void;
  nominateWild: (card: Card, nomination: { character: Character; bodyPart: any }) => void;
  error: string | null;
}

/**
 * Hook for transforming Player objects into UI-friendly state
 * Bridges the core engine Player interface with React component needs
 */
export function usePlayerState(
  players: [Player | null, Player | null], 
  currentPlayer: Player | null,
  isGameComplete: boolean,
  winner: Player | null
): UsePlayerStateReturn {
  const [error, setError] = useState<string | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0);

  /**
   * Convert core Character enum to UI CharacterType
   */
  const convertCharacterToUI = useCallback((character: Character): CharacterType => {
    switch (character) {
      case Character.Ninja:
        return 'ninja';
      case Character.Pirate:
        return 'pirate';
      case Character.Zombie:
        return 'zombie';
      case Character.Robot:
        return 'robot';
      default:
        return 'ninja'; // fallback
    }
  }, []);

  /**
   * Transform Player object to PlayerStateInfo
   */
  const transformPlayer = useCallback((player: Player | null): PlayerStateInfo | null => {
    if (!player) return null;

    try {
      const playerState = player.getState();
      const hand = player.getHand();
      const score = player.getMyScore();
      
      // Convert score (Set<Character>) to CharacterType array
      const scoreArray: CharacterType[] = Array.from(score.getCompletedCharacters())
        .map(convertCharacterToUI);

      return {
        id: player.getId(),
        name: player.getName(),
        score: scoreArray,
        handCount: hand.size(),
        hand: hand.getCards(),
        stacks: player.getMyStacks(),
        state: playerState.getState(),
        stateMessage: playerState.getMessage(),
        isMyTurn: player.isMyTurn(),
        canDraw: playerState.canDrawCard(),
        canPlay: playerState.canPlayCard(),
        canMove: playerState.canMoveCard(),
        canNominate: playerState.canNominate()
      };
    } catch (err) {
      console.error('Error transforming player state:', err);
      setError(err instanceof Error ? err.message : 'Player state transformation failed');
      return null;
    }
  }, [convertCharacterToUI]);

  /**
   * Transform players to UI state
   */
  const { player1, player2 } = useMemo(() => {
    return {
      player1: transformPlayer(players[0]),
      player2: transformPlayer(players[1])
    };
  }, [players, transformPlayer, forceUpdate]);

  /**
   * Current player state
   */
  const currentPlayerState = useMemo(() => {
    return transformPlayer(currentPlayer);
  }, [currentPlayer, transformPlayer, forceUpdate]);

  /**
   * Game phase determination
   */
  const gamePhase = useMemo(() => {
    if (isGameComplete) return 'finished';
    if (!player1 || !player2) return 'setup';
    return 'playing';
  }, [isGameComplete, player1, player2]);

  /**
   * Winner state
   */
  const winnerState = useMemo(() => {
    return transformPlayer(winner);
  }, [winner, transformPlayer]);

  /**
   * Action: Draw card
   */
  const drawCard = useCallback(() => {
    if (!currentPlayer) {
      setError('No current player to draw card');
      return;
    }

    try {
      setError(null);
      currentPlayer.drawCard();
      
      // Force UI update after state change
      setForceUpdate(prev => prev + 1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to draw card';
      setError(errorMessage);
      console.error('Draw card error:', err);
    }
  }, [currentPlayer]);

  /**
   * Action: Play card
   */
  const playCard = useCallback((card: Card, options: { targetStackId?: string; targetPile?: any } = {}) => {
    if (!currentPlayer) {
      setError('No current player to play card');
      return;
    }

    try {
      setError(null);
      currentPlayer.playCard(card, options);
      
      // Force UI update after state change
      setForceUpdate(prev => prev + 1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to play card';
      setError(errorMessage);
      console.error('Play card error:', err);
    }
  }, [currentPlayer]);

  /**
   * Action: Move card
   */
  const moveCard = useCallback((options: { 
    cardId: string; 
    fromStackId: string; 
    fromPile: any; 
    toStackId?: string; 
    toPile: any 
  }) => {
    if (!currentPlayer) {
      setError('No current player to move card');
      return;
    }

    try {
      setError(null);
      currentPlayer.moveCard(options);
      
      // Force UI update after state change
      setForceUpdate(prev => prev + 1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to move card';
      setError(errorMessage);
      console.error('Move card error:', err);
    }
  }, [currentPlayer]);

  /**
   * Action: Nominate wild card
   */
  const nominateWild = useCallback((card: Card, nomination: { character: Character; bodyPart: any }) => {
    if (!currentPlayer) {
      setError('No current player to nominate wild card');
      return;
    }

    try {
      setError(null);
      currentPlayer.nominateWildCard(card, nomination);
      
      // Force UI update after state change
      setForceUpdate(prev => prev + 1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to nominate wild card';
      setError(errorMessage);
      console.error('Nominate wild card error:', err);
    }
  }, [currentPlayer]);

  /**
   * Clear errors when players change
   */
  useEffect(() => {
    setError(null);
  }, [players, currentPlayer]);

  return {
    player1,
    player2,
    currentPlayer: currentPlayerState,
    gamePhase,
    winner: winnerState,
    drawCard,
    playCard,
    moveCard,
    nominateWild,
    error
  };
}