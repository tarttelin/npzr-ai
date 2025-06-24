import { GameState, Stack, Card, Character, BodyPart, PlayerId } from './types.js';
import { createStack, findStackById } from './game.js';
import { getCardEffectiveProperties, canCardFitPile } from './deck.js';

export function addCardToStack(stack: Stack, card: Card, pile: BodyPart): boolean {
  const targetPile = stack.piles[pile];
  
  if (!targetPile) {
    return false;
  }

  targetPile.cards.push(card);
  return true;
}

export function playCard(
  gameState: GameState,
  card: Card,
  targetStackId?: string,
  targetPile?: BodyPart,
  createNewStack: boolean = false
): boolean {
  let targetStack: Stack;

  if (createNewStack || !targetStackId) {
    // Create new stack
    const currentPlayerId = gameState.currentPlayer;
    targetStack = createStack(gameState, currentPlayerId);
  } else {
    // Use existing stack
    const stack = findStackById(gameState, targetStackId);
    if (!stack) {
      return false;
    }
    targetStack = stack;
  }

  // Determine which pile to place the card in
  let finalPile: BodyPart;
  
  if (targetPile) {
    finalPile = targetPile;
  } else {
    // Auto-determine pile based on card
    const cardProperties = getCardEffectiveProperties(card);
    if (!cardProperties.bodyPart) {
      return false; // Cannot auto-determine pile for unnominated wild cards
    }
    finalPile = cardProperties.bodyPart;
  }

  return addCardToStack(targetStack, card, finalPile);
}

export function checkStackCompletion(stack: Stack): Character | null {
  const headPile = stack.piles[BodyPart.Head];
  const torsoPile = stack.piles[BodyPart.Torso];
  const legsPile = stack.piles[BodyPart.Legs];

  // All piles must have at least one card
  if (headPile.cards.length === 0 || torsoPile.cards.length === 0 || legsPile.cards.length === 0) {
    return null;
  }

  // Get the top card from each pile
  const topHead = headPile.cards[headPile.cards.length - 1];
  const topTorso = torsoPile.cards[torsoPile.cards.length - 1];
  const topLegs = legsPile.cards[legsPile.cards.length - 1];

  // Get effective character for each top card
  const headProperties = getCardEffectiveProperties(topHead);
  const torsoProperties = getCardEffectiveProperties(topTorso);
  const legsProperties = getCardEffectiveProperties(topLegs);

  // Check if all cards represent the same character
  const character = headProperties.character;
  if (!character) {
    return null;
  }

  if (torsoProperties.character === character && legsProperties.character === character) {
    return character;
  }

  return null;
}

export function completeStack(gameState: GameState, stackId: string): Character | null {
  const stack = findStackById(gameState, stackId);
  if (!stack) {
    return null;
  }

  const completedCharacter = checkStackCompletion(stack);
  if (!completedCharacter) {
    return null;
  }

  // Find the stack owner and score the character
  const owner = gameState.players.find(p => p.id === stack.owner);
  if (owner) {
    owner.scoredCharacters.add(completedCharacter);
  }

  // Remove the completed stack from the game
  gameState.stacks = gameState.stacks.filter(s => s.id !== stackId);

  // Award a move
  gameState.pendingMoves++;

  return completedCharacter;
}

export function getStacksForPlayer(gameState: GameState, playerId: PlayerId): Stack[] {
  return gameState.stacks.filter(stack => stack.owner === playerId);
}

export function getAllCompletableStacks(gameState: GameState): Stack[] {
  return gameState.stacks.filter(stack => checkStackCompletion(stack) !== null);
}

export function getTopCardFromPile(stack: Stack, pile: BodyPart): Card | null {
  const targetPile = stack.piles[pile];
  if (targetPile.cards.length === 0) {
    return null;
  }
  return targetPile.cards[targetPile.cards.length - 1];
}

export function removeCardFromPile(stack: Stack, pile: BodyPart, cardId: string): Card | null {
  const targetPile = stack.piles[pile];
  const cardIndex = targetPile.cards.findIndex(card => card.id === cardId);
  
  if (cardIndex === -1) {
    return null;
  }

  const [removedCard] = targetPile.cards.splice(cardIndex, 1);
  return removedCard;
}

export function canPlaceCardOnPile(stack: Stack, card: Card, pile: BodyPart): boolean {
  // Cards can always be placed on piles - this represents the defensive play mechanic
  // where players can place cards on opponent stacks to prevent completion
  return true;
}

export function getStackSummary(stack: Stack): { 
  id: string; 
  owner: PlayerId; 
  headCount: number; 
  torsoCount: number; 
  legsCount: number;
  isCompletable: boolean;
} {
  return {
    id: stack.id,
    owner: stack.owner,
    headCount: stack.piles[BodyPart.Head].cards.length,
    torsoCount: stack.piles[BodyPart.Torso].cards.length,
    legsCount: stack.piles[BodyPart.Legs].cards.length,
    isCompletable: checkStackCompletion(stack) !== null
  };
}