import { GameState, Player, PlayerId, Character, BodyPart, Stack, Pile } from './types.js';
import { createDeck, shuffleDeck } from './deck.js';

export function createGameState(): GameState {
  const deck = createDeck();
  shuffleDeck(deck);

  const player1: Player = {
    id: 'player1',
    hand: [],
    scoredCharacters: new Set()
  };

  const player2: Player = {
    id: 'player2',
    hand: [],
    scoredCharacters: new Set()
  };

  const gameState: GameState = {
    players: [player1, player2],
    currentPlayer: 'player1',
    deck,
    stacks: [],
    pendingMoves: 0,
    gamePhase: 'setup'
  };

  dealInitialHands(gameState);
  gameState.gamePhase = 'playing';

  return gameState;
}

export function dealInitialHands(gameState: GameState): void {
  const cardsPerPlayer = 5;
  
  for (let i = 0; i < cardsPerPlayer; i++) {
    for (const player of gameState.players) {
      const card = gameState.deck.pop();
      if (card) {
        player.hand.push(card);
      }
    }
  }
}

export function getCurrentPlayer(gameState: GameState): Player {
  return gameState.players.find(p => p.id === gameState.currentPlayer)!;
}

export function getOpponentPlayer(gameState: GameState): Player {
  return gameState.players.find(p => p.id !== gameState.currentPlayer)!;
}

export function switchTurn(gameState: GameState): void {
  gameState.currentPlayer = gameState.currentPlayer === 'player1' ? 'player2' : 'player1';
}

export function createStack(gameState: GameState, owner: PlayerId): Stack {
  const stackId = `stack_${gameState.stacks.length + 1}`;
  
  const stack: Stack = {
    id: stackId,
    owner,
    piles: {
      [BodyPart.Head]: { bodyPart: BodyPart.Head, cards: [] },
      [BodyPart.Torso]: { bodyPart: BodyPart.Torso, cards: [] },
      [BodyPart.Legs]: { bodyPart: BodyPart.Legs, cards: [] }
    }
  };

  gameState.stacks.push(stack);
  return stack;
}

export function findStackById(gameState: GameState, stackId: string): Stack | undefined {
  return gameState.stacks.find(stack => stack.id === stackId);
}

export function refreshDeck(gameState: GameState): void {
  if (gameState.deck.length > 0) {
    return;
  }

  const scoredCards: any[] = [];
  
  for (const player of gameState.players) {
    // In a real implementation, we'd need to track scored cards
    // For now, we'll just shuffle the remaining cards
  }

  // Reset all wild card nominations when shuffling back into deck
  scoredCards.forEach(card => {
    if (card.nomination) {
      delete card.nomination;
    }
  });

  gameState.deck = scoredCards;
  shuffleDeck(gameState.deck);
}

export function checkWinCondition(player: Player): boolean {
  const requiredCharacters = [Character.Ninja, Character.Pirate, Character.Zombie, Character.Robot];
  return requiredCharacters.every(character => player.scoredCharacters.has(character));
}

export function checkGameWinner(gameState: GameState): PlayerId | undefined {
  for (const player of gameState.players) {
    if (checkWinCondition(player)) {
      return player.id;
    }
  }
  return undefined;
}