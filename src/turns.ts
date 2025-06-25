import { GameState, Card, PlayCardAction, CardNomination } from './types.js';
import { getCurrentPlayer, switchTurn, refreshDeck } from './game.js';
import { isWildCard } from './deck.js';
import { playCard } from './stacks.js';
import { processStackCompletions } from './moves.js';

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