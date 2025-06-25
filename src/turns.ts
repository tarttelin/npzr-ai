import { GameState, Card, PlayCardAction, CardNomination, TurnState, TurnPhase, TurnContinuation, MoveAction, BodyPart } from './types.js';
import { getCurrentPlayer, switchTurn, refreshDeck } from './game.js';
import { isWildCard } from './deck.js';
import { playCard } from './stacks.js';
import { processStackCompletions, executeMove, usePendingMove } from './moves.js';

export function drawCard(gameState: GameState): Card | null {
  if (gameState.deck.length === 0) {
    refreshDeck(gameState);
  }

  if (gameState.deck.length === 0) {
    return null; // Game continues without drawing if deck cannot be refreshed
  }

  const card = gameState.deck.pop();
  if (card) {
    const currentPlayer = getCurrentPlayer(gameState);
    currentPlayer.hand.push(card);
  }

  return card || null;
}

export function validateCardPlay(gameState: GameState, card: Card, targetStackId?: string): boolean {
  const currentPlayer = getCurrentPlayer(gameState);

  // Check if player has the card
  if (!currentPlayer.hand.find(c => c.id === card.id)) {
    return false;
  }

  // If no target stack specified, player must create a new stack (always valid)
  if (!targetStackId) {
    return true;
  }

  // Check if target stack exists
  const targetStack = gameState.stacks.find(s => s.id === targetStackId);
  if (!targetStack) {
    return false;
  }

  return true; // Further validation happens in playCard
}

export function executeCardPlay(
  gameState: GameState, 
  action: PlayCardAction,
  createNewStack: boolean = false
): boolean {
  const currentPlayer = getCurrentPlayer(gameState);
  const cardIndex = currentPlayer.hand.findIndex(c => c.id === action.card.id);

  if (cardIndex === -1) {
    return false;
  }

  // Remove card from hand
  const [card] = currentPlayer.hand.splice(cardIndex, 1);

  // Apply nomination for wild cards
  if (isWildCard(card) && action.nomination) {
    card.nomination = action.nomination;
  }

  // Play the card
  const success = playCard(gameState, card, action.targetStackId, action.targetPile, createNewStack);
  
  if (!success) {
    // Return card to hand if play failed
    currentPlayer.hand.push(card);
    return false;
  }

  // Process any stack completions
  processStackCompletions(gameState);

  return true;
}

export function executeTurn(
  gameState: GameState,
  regularCardAction: PlayCardAction,
  wildCardActions: PlayCardAction[] = []
): boolean {
  // Draw phase
  const drawnCard = drawCard(gameState);

  // Validate all card plays
  if (!validateCardPlay(gameState, regularCardAction.card, regularCardAction.targetStackId)) {
    return false;
  }

  for (const wildAction of wildCardActions) {
    if (!isWildCard(wildAction.card) || !validateCardPlay(gameState, wildAction.card, wildAction.targetStackId)) {
      return false;
    }
  }

  // Execute wild card plays first
  for (const wildAction of wildCardActions) {
    if (!executeCardPlay(gameState, wildAction)) {
      return false;
    }
  }

  // Execute regular card play
  if (!executeCardPlay(gameState, regularCardAction)) {
    return false;
  }

  // Switch turn
  switchTurn(gameState);

  return true;
}

export function canPlayCard(gameState: GameState, card: Card): boolean {
  const currentPlayer = getCurrentPlayer(gameState);
  return currentPlayer.hand.some(c => c.id === card.id);
}

export function mustNominateWildCard(card: Card): boolean {
  return isWildCard(card) && !card.nomination;
}

// Sequential Turn Management Functions

export function initializeTurnState(gameState: GameState): void {
  gameState.currentTurnState = {
    phase: TurnPhase.Draw,
    cardsPlayedThisTurn: [],
    lastCardWasWild: false,
    movesEarnedThisTurn: 0,
    canContinuePlaying: false,
    hasDrawnCard: false
  };
}

export function startSequentialTurn(gameState: GameState): TurnContinuation {
  // Initialize turn state if not present
  if (!gameState.currentTurnState) {
    initializeTurnState(gameState);
  }

  // Draw phase
  if (!gameState.currentTurnState!.hasDrawnCard) {
    const drawnCard = drawCard(gameState);
    gameState.currentTurnState!.hasDrawnCard = true;
    gameState.currentTurnState!.phase = TurnPhase.PlayCard;
  }

  return 'continue';
}

export function playNextCard(
  gameState: GameState,
  card: Card,
  targetStackId?: string,
  targetPile?: BodyPart,
  nomination?: CardNomination
): TurnContinuation {
  if (!gameState.currentTurnState) {
    initializeTurnState(gameState);
  }

  // Validate the card play
  if (!validateCardPlay(gameState, card, targetStackId)) {
    return 'continue'; // Allow retry
  }

  // Build the action
  const action: PlayCardAction = {
    card,
    targetStackId,
    targetPile,
    nomination
  };

  // Track moves before playing card
  const movesBefore = gameState.pendingMoves;

  // Execute the card play (this includes stack completion processing)
  const success = executeCardPlay(gameState, action);
  if (!success) {
    return 'continue'; // Allow retry
  }

  // Track the played card
  gameState.currentTurnState!.cardsPlayedThisTurn.push(card);
  gameState.currentTurnState!.lastCardWasWild = isWildCard(card);

  // Check if moves were earned from stack completions
  const movesEarned = gameState.pendingMoves - movesBefore;

  if (movesEarned > 0) {
    gameState.currentTurnState!.movesEarnedThisTurn += movesEarned;
    gameState.currentTurnState!.phase = TurnPhase.AwaitMove;
    return 'await_move';
  }

  // Determine if turn should continue
  if (isWildCard(card)) {
    gameState.currentTurnState!.canContinuePlaying = true;
    gameState.currentTurnState!.phase = TurnPhase.PlayCard;
    return 'continue';
  } else {
    // Regular card played, end turn
    return completeTurn(gameState);
  }
}

export function executeSequentialMove(gameState: GameState, moveAction: MoveAction): TurnContinuation {
  if (!gameState.currentTurnState || gameState.currentTurnState.phase !== TurnPhase.AwaitMove) {
    return 'continue';
  }

  if (gameState.pendingMoves <= 0) {
    return 'continue';
  }

  // Execute the move
  const success = executeMove(gameState, moveAction);
  
  if (success) {
    usePendingMove(gameState);
    gameState.currentTurnState!.movesEarnedThisTurn--;

    // Check for additional completions after the move
    const movesBefore = gameState.pendingMoves;
    processStackCompletions(gameState);
    const newMovesEarned = gameState.pendingMoves - movesBefore;
    
    if (newMovesEarned > 0) {
      gameState.currentTurnState!.movesEarnedThisTurn += newMovesEarned;
      return 'await_move';
    }
  }

  // After move execution, check if turn should continue
  if (gameState.currentTurnState!.lastCardWasWild && gameState.currentTurnState!.movesEarnedThisTurn === 0) {
    gameState.currentTurnState!.phase = TurnPhase.PlayCard;
    gameState.currentTurnState!.canContinuePlaying = true;
    return 'continue';
  } else if (gameState.currentTurnState!.movesEarnedThisTurn === 0) {
    return completeTurn(gameState);
  } else {
    return 'await_move';
  }
}

export function completeTurn(gameState: GameState): TurnContinuation {
  if (gameState.currentTurnState) {
    gameState.currentTurnState.phase = TurnPhase.Complete;
    gameState.currentTurnState.canContinuePlaying = false;
  }

  // Switch to next player
  switchTurn(gameState);

  // Clear turn state
  gameState.currentTurnState = undefined;

  return 'end_turn';
}

export function canPlayAnotherCard(gameState: GameState): boolean {
  if (!gameState.currentTurnState) {
    return false;
  }

  return gameState.currentTurnState.phase === TurnPhase.PlayCard && 
         gameState.currentTurnState.canContinuePlaying;
}

export function getCurrentTurnState(gameState: GameState): TurnState | undefined {
  return gameState.currentTurnState;
}

export function isAwaitingMove(gameState: GameState): boolean {
  return gameState.currentTurnState?.phase === TurnPhase.AwaitMove && 
         gameState.pendingMoves > 0;
}

export function skipMove(gameState: GameState): TurnContinuation {
  if (!isAwaitingMove(gameState)) {
    return 'continue';
  }

  // Player chooses not to use available move - check turn continuation
  if (gameState.currentTurnState!.lastCardWasWild) {
    gameState.currentTurnState!.phase = TurnPhase.PlayCard;
    gameState.currentTurnState!.canContinuePlaying = true;
    return 'continue';
  } else {
    return completeTurn(gameState);
  }
}