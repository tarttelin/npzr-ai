import { Card, BodyPart, CardNomination } from './Card.js';
import { Deck } from './Deck.js';
import { Player, PlayCardOptions, MoveOptions } from './Player.js';
import { Stack } from './Stack.js';
import { Score } from './Score.js';
import { PlayerState } from './PlayerState.js';

export class GameEngine {
  private deck = new Deck();
  private players: Player[] = [];
  private stacks: Stack[] = [];
  private currentPlayerIndex = 0;
  private gameComplete = false;
  private winner: Player | null = null;
  private stackIdCounter = 1;
  private lastPlayedCard: Card | null = null;

  createGame(): void {
    this.deck = new Deck();
    this.players = [];
    this.stacks = [];
    this.currentPlayerIndex = 0;
    this.gameComplete = false;
    this.winner = null;
    this.stackIdCounter = 1;
    this.lastPlayedCard = null;
  }

  addPlayer(playerName: string): Player {
    if (this.players.length >= 2) {
      throw new Error('Game already has 2 players');
    }

    const playerId = `player${this.players.length + 1}`;
    const player = new Player(playerId, playerName, this);
    this.players.push(player);

    // Deal initial hand of 5 cards
    for (let i = 0; i < 5; i++) {
      const card = this.deck.drawCard();
      if (card) {
        player.addCardToHand(card);
      }
    }

    // Start the game when both players have joined
    if (this.players.length === 2) {
      this.startGame();
    }

    return player;
  }

  private startGame(): void {
    // Set first player to draw
    this.players[0].setState(PlayerState.drawCard());
    this.players[1].setState(PlayerState.waitingForOpponent());
  }

  isGameComplete(): boolean {
    return this.gameComplete;
  }

  getWinner(): Player | null {
    return this.winner;
  }

  // Methods called by Player objects
  getStacksForPlayer(playerId: string): Stack[] {
    return this.stacks.filter(stack => stack.getOwnerId() === playerId);
  }

  getStacksForOpponent(playerId: string): Stack[] {
    return this.stacks.filter(stack => stack.getOwnerId() !== playerId);
  }

  getOpponentScore(playerId: string): Score {
    const opponent = this.players.find(p => p.getId() !== playerId);
    if (!opponent) {
      throw new Error('Opponent not found');
    }
    return opponent.getMyScore();
  }

  playerDrawCard(playerId: string): void {
    const player = this.getPlayer(playerId);
    const card = this.deck.drawCard();
    
    if (!card) {
      // Reshuffle deck if empty
      this.reshuffleDeck();
      const newCard = this.deck.drawCard();
      if (newCard) {
        player.addCardToHand(newCard);
      }
    } else {
      player.addCardToHand(card);
    }

    // Transition to play card state
    player.setState(PlayerState.playCard());
  }

  playerPlayCard(playerId: string, card: Card, options: PlayCardOptions): void {
    const player = this.getPlayer(playerId);
    player.removeCardFromHand(card);

    // Store the last played card
    this.lastPlayedCard = card;

    // Determine target stack
    let targetStack: Stack;
    if (options.targetStackId) {
      targetStack = this.getStack(options.targetStackId);
    } else {
      // Create new stack
      targetStack = this.createNewStack(playerId);
    }

    // Determine target pile
    const targetPile = options.targetPile || this.inferTargetPile(card);

    // Place card on stack
    targetStack.addCard(card, targetPile);

    // Handle wild card nomination
    if (card.isWild()) {
      player.setState(PlayerState.nominateWild());
      return;
    }

    // Check for stack completion
    const completedStacks = this.checkAndProcessCompletions();
    
    if (completedStacks.length > 0) {
      // Player earned moves
      player.setState(PlayerState.moveCard());
    } else if (card.canContinueTurn()) {
      // Wild card allows continuation
      player.setState(PlayerState.playCard());
    } else {
      // End turn
      this.endPlayerTurn(playerId);
    }
  }

  playerNominateWild(playerId: string, card: Card, nomination: CardNomination): void {
    const player = this.getPlayer(playerId);
    card.nominate(nomination.character, nomination.bodyPart);

    // Check for stack completion after nomination
    const completedStacks = this.checkAndProcessCompletions();
    
    if (completedStacks.length > 0) {
      // Player earned moves
      player.setState(PlayerState.moveCard());
    } else if (card.canContinueTurn()) {
      // Can continue playing
      player.setState(PlayerState.playCard());
    } else {
      // End turn
      this.endPlayerTurn(playerId);
    }
  }

  playerMoveCard(playerId: string, options: MoveOptions): void {
    const fromStack = this.getStack(options.fromStackId);
    
    if (!fromStack.hasCardInPile(options.cardId, options.fromPile)) {
      throw new Error('Card not found in specified pile');
    }

    const cardToMove = fromStack.getCardsFromPile(options.fromPile).find(c => c.id === options.cardId);
    if (!cardToMove) {
      throw new Error('Card not found');
    }

    // Determine target stack - create new one if toStackId not provided
    let toStack: Stack;
    if (options.toStackId) {
      toStack = this.getStack(options.toStackId);
      if (!toStack.canAcceptCard(cardToMove, options.toPile)) {
        throw new Error('Cannot place card in target pile');
      }
    } else {
      // Create new stack for the player who owns the fromStack or the current player
      const targetPlayerId = fromStack.getOwnerId();
      toStack = this.createNewStack(targetPlayerId);
    }

    // Move the card
    const card = fromStack.removeCard(options.fromPile);
    if (card && card.id === options.cardId) {
      // Clear nomination when moving
      card.clearNomination();
      toStack.addCard(card, options.toPile);
    }

    // Check for cascade completions
    const completedStacks = this.checkAndProcessCompletions();
    
    if (completedStacks.length > 0) {
      // More moves earned - stay in MOVE_CARD state
      const player = this.getPlayer(playerId);
      player.setState(PlayerState.moveCard());
    } else {
      // No more moves - check if can continue playing
      this.continueOrEndTurn(playerId);
    }
  }

  canMoveCard(from: { stackId: string, pile: BodyPart }, to: { stackId: string, pile: BodyPart }): boolean {
    try {
      const fromStack = this.getStack(from.stackId);
      const toStack = this.getStack(to.stackId);
      const topCard = fromStack.removeCard(from.pile);
      
      if (!topCard) return false;
      
      const canPlace = toStack.canAcceptCard(topCard, to.pile);
      
      // Put card back
      fromStack.addCard(topCard, from.pile);
      
      return canPlace;
    } catch {
      return false;
    }
  }

  private getPlayer(playerId: string): Player {
    const player = this.players.find(p => p.getId() === playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }
    return player;
  }

  private getStack(stackId: string): Stack {
    const stack = this.stacks.find(s => s.getId() === stackId);
    if (!stack) {
      throw new Error(`Stack ${stackId} not found`);
    }
    return stack;
  }

  private createNewStack(ownerId: string): Stack {
    const stack = new Stack(`stack${this.stackIdCounter++}`, ownerId);
    this.stacks.push(stack);
    return stack;
  }

  private inferTargetPile(card: Card): BodyPart {
    // For now, use the card's body part (or first valid pile for wilds)
    if (card.bodyPart !== BodyPart.Wild) {
      return card.bodyPart;
    }
    return BodyPart.Head; // Default for wild cards
  }

  private checkAndProcessCompletions(): Stack[] {
    const completedStacks: Stack[] = [];
    
    for (const stack of this.stacks) {
      if (stack.isComplete()) {
        const character = stack.getCompletedCharacter();
        if (character) {
          const owner = this.getPlayer(stack.getOwnerId());
          owner.addToScore(character);
          completedStacks.push(stack);
          
          // Check for win condition
          if (owner.hasWon()) {
            this.endGame(owner);
            break;
          }
        }
      }
    }

    // Remove completed stacks
    this.stacks = this.stacks.filter(stack => !completedStacks.includes(stack));
    
    return completedStacks;
  }

  private continueOrEndTurn(playerId: string): void {
    const player = this.getPlayer(playerId);
    
    // If the last played card was wild, player can continue playing
    if (this.lastPlayedCard && this.lastPlayedCard.canContinueTurn()) {
      player.setState(PlayerState.playCard());
    } else {
      // End turn
      this.endPlayerTurn(playerId);
    }
  }

  private endPlayerTurn(playerId: string): void {
    const currentPlayer = this.getPlayer(playerId);
    const nextPlayerIndex = (this.currentPlayerIndex + 1) % 2;
    const nextPlayer = this.players[nextPlayerIndex];

    currentPlayer.setState(PlayerState.waitingForOpponent());
    nextPlayer.setState(PlayerState.drawCard());
    
    this.currentPlayerIndex = nextPlayerIndex;
    
    // Clear the last played card when turn ends
    this.lastPlayedCard = null;
  }

  private endGame(winner: Player): void {
    this.gameComplete = true;
    this.winner = winner;
    
    for (const player of this.players) {
      if (player === winner) {
        player.setState(PlayerState.gameOver(`${player.getName()} wins!`));
      } else {
        player.setState(PlayerState.gameOver(`${winner.getName()} wins!`));
      }
    }
  }

  private reshuffleDeck(): void {
    // In a real implementation, we might reshuffle scored cards
    // For now, just create a new deck
    this.deck = new Deck();
  }
}