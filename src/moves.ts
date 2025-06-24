import { GameState, MoveAction, Card, BodyPart, Stack } from './types.js';
import { findStackById, createStack, checkGameWinner } from './game.js';
import { removeCardFromPile, addCardToStack, checkStackCompletion, completeStack, getAllCompletableStacks } from './stacks.js';
import { isWildCard } from './deck.js';

export function executeMove(gameState: GameState, moveAction: MoveAction): boolean {
  const { cardId, fromStackId, fromPile, toStackId, toPile } = moveAction;

  // Find source stack
  const fromStack = findStackById(gameState, fromStackId);
  if (!fromStack) {
    return false;
  }

  // Remove card from source pile
  const card = removeCardFromPile(fromStack, fromPile, cardId);
  if (!card) {
    return false;
  }

  // Reset wild card nomination when moved
  if (isWildCard(card)) {
    delete card.nomination;
  }

  // Find or create target stack
  let toStack: Stack;
  if (toStackId === 'new') {
    toStack = createStack(gameState, gameState.currentPlayer);
  } else {
    const existingStack = findStackById(gameState, toStackId);
    if (!existingStack) {
      // Return card to original position if target stack doesn't exist
      addCardToStack(fromStack, card, fromPile);
      return false;
    }
    toStack = existingStack;
  }

  // Add card to target pile
  const success = addCardToStack(toStack, card, toPile);
  if (!success) {
    // Return card to original position if move failed
    addCardToStack(fromStack, card, fromPile);
    return false;
  }

  // Remove empty stacks
  cleanupEmptyStacks(gameState);

  return true;
}

export function cleanupEmptyStacks(gameState: GameState): void {
  gameState.stacks = gameState.stacks.filter(stack => {
    const hasCards = Object.values(stack.piles).some(pile => pile.cards.length > 0);
    return hasCards;
  });
}

export function processStackCompletions(gameState: GameState): void {
  let completedAny = false;
  
  do {
    completedAny = false;
    const completableStacks = getAllCompletableStacks(gameState);
    
    for (const stack of completableStacks) {
      const character = completeStack(gameState, stack.id);
      if (character) {
        completedAny = true;
        // Note: completeStack already increments pendingMoves
      }
    }
  } while (completedAny);

  // Check for game winner after completions
  const winner = checkGameWinner(gameState);
  if (winner) {
    gameState.gamePhase = 'finished';
    gameState.winner = winner;
  }
}

export function processPendingMoves(gameState: GameState): void {
  // This function would be called by the game interface to handle pending moves
  // The actual move execution would be handled by the UI/game controller
  // Here we just ensure the count is accurate
}

export function canExecuteMove(gameState: GameState, moveAction: MoveAction): boolean {
  const { cardId, fromStackId, fromPile, toStackId, toPile } = moveAction;

  // Check if player has pending moves
  if (gameState.pendingMoves <= 0) {
    return false;
  }

  // Find source stack
  const fromStack = findStackById(gameState, fromStackId);
  if (!fromStack) {
    return false;
  }

  // Check if card exists in source pile
  const pile = fromStack.piles[fromPile];
  const cardExists = pile.cards.some(card => card.id === cardId);
  if (!cardExists) {
    return false;
  }

  // Check if target stack exists (or if creating new)
  if (toStackId !== 'new') {
    const toStack = findStackById(gameState, toStackId);
    if (!toStack) {
      return false;
    }
  }

  return true;
}

export function usePendingMove(gameState: GameState): boolean {
  if (gameState.pendingMoves <= 0) {
    return false;
  }
  
  gameState.pendingMoves--;
  return true;
}

export function getAvailableMoves(gameState: GameState): MoveAction[] {
  if (gameState.pendingMoves <= 0) {
    return [];
  }

  const moves: MoveAction[] = [];

  // Generate all possible moves
  for (const stack of gameState.stacks) {
    for (const pileType of Object.values(BodyPart)) {
      const pile = stack.piles[pileType];
      
      for (const card of pile.cards) {
        // Can move to any other stack and pile
        for (const targetStack of gameState.stacks) {
          if (targetStack.id === stack.id) continue;
          
          for (const targetPileType of Object.values(BodyPart)) {
            moves.push({
              cardId: card.id,
              fromStackId: stack.id,
              fromPile: pileType,
              toStackId: targetStack.id,
              toPile: targetPileType
            });
          }
        }
        
        // Can also move to a new stack
        for (const targetPileType of Object.values(BodyPart)) {
          moves.push({
            cardId: card.id,
            fromStackId: stack.id,
            fromPile: pileType,
            toStackId: 'new',
            toPile: targetPileType
          });
        }
      }
    }
  }

  return moves;
}

export function executeOptimalMove(gameState: GameState): boolean {
  const availableMoves = getAvailableMoves(gameState);
  
  if (availableMoves.length === 0) {
    return false;
  }

  // Simple heuristic: prioritize moves that complete stacks
  for (const move of availableMoves) {
    // Simulate the move
    const originalState = JSON.parse(JSON.stringify(gameState));
    
    if (executeMove(gameState, move)) {
      processStackCompletions(gameState);
      
      // Check if this move resulted in completions
      const completedStacks = getAllCompletableStacks(gameState);
      if (completedStacks.length > 0) {
        usePendingMove(gameState);
        return true;
      }
    }
    
    // Restore state if move didn't help
    Object.assign(gameState, originalState);
  }

  // If no optimal move found, execute the first available move
  const firstMove = availableMoves[0];
  if (executeMove(gameState, firstMove)) {
    usePendingMove(gameState);
    return true;
  }

  return false;
}

export function cascadeCompletions(gameState: GameState): number {
  let totalCompletions = 0;
  
  while (gameState.pendingMoves > 0) {
    const beforeMoves = gameState.pendingMoves;
    
    // Try to execute an optimal move
    if (!executeOptimalMove(gameState)) {
      break;
    }
    
    // Process any new completions
    processStackCompletions(gameState);
    
    // Count completions (moves that resulted in new pending moves)
    const newCompletions = gameState.pendingMoves - beforeMoves + 1;
    totalCompletions += Math.max(0, newCompletions);
    
    // Safety check to prevent infinite loops
    if (totalCompletions > 50) {
      break;
    }
  }
  
  return totalCompletions;
}