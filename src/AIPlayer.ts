import { Player, PlayCardOptions, MoveOptions } from './Player.js';
import { PlayerStateType } from './PlayerState.js';
import { Card, Character, BodyPart } from './Card.js';
import { Stack } from './Stack.js';
import { GameStateAnalyzer, GameAnalysis } from './GameStateAnalyzer.js';
import { CardSelector, CardEvaluation } from './CardSelector.js';
import { WildCardNominator, NominationOption } from './WildCardNominator.js';

export type Difficulty = 'easy' | 'medium' | 'hard';

export class AIPlayer {
  private lastPlayedCard: Card | null = null;
  private analyzer: GameStateAnalyzer;
  private cardSelector: CardSelector;
  private wildCardNominator: WildCardNominator;

  constructor(
    private readonly player: Player,
    private readonly difficulty: Difficulty
  ) {
    this.analyzer = new GameStateAnalyzer();
    this.cardSelector = new CardSelector();
    this.wildCardNominator = new WildCardNominator();
  }

  /**
   * Main decision-making method - handles the current player state
   */
  makeMove(): void {
    if (!this.player.isMyTurn()) {
      return;
    }

    const currentState = this.getCurrentState();

    try {
      switch (currentState) {
        case PlayerStateType.DRAW_CARD:
          this.handleDrawCard();
          break;
        case PlayerStateType.PLAY_CARD:
          this.handlePlayCard();
          break;
        case PlayerStateType.NOMINATE_WILD:
          this.handleNominateWild();
          break;
        case PlayerStateType.MOVE_CARD:
          this.handleMoveCard();
          break;
        case PlayerStateType.WAITING_FOR_OPPONENT:
          // Do nothing - wait for opponent
          break;
        case PlayerStateType.GAME_OVER:
          this.logGameResult();
          break;
        default:
          console.warn(`AIPlayer: Unknown state ${currentState}`);
      }
    } catch (error) {
      console.error(`AIPlayer error in state ${currentState}:`, error);
    }
  }

  /**
   * Check if it's the AI's turn and act accordingly
   */
  takeTurnIfReady(): void {
    if (this.player.isMyTurn()) {
      this.makeMove();
    }
  }

  /**
   * Get current player state info
   */
  getCurrentState(): PlayerStateType {
    return this.player.getState().getState();
  }

  /**
   * Get comprehensive game state analysis
   */
  getGameAnalysis(): GameAnalysis {
    return this.analyzer.analyzeGameState(
      this.player.getMyStacks(),
      this.player.getOpponentStacks(),
      this.player.getHand(),
      this.player.getMyScore(),
      this.player.getOpponentScore()
    );
  }

  /**
   * Enhanced strategy information using game state analysis
   */
  getStrategy(): string {
    const analysis = this.getGameAnalysis();
    return this.analyzer.getAnalysisSummary(analysis);
  }

  /**
   * Handle DRAW_CARD state - always draw when required
   */
  private handleDrawCard(): void {
    console.log('AI: Drawing card');
    this.player.drawCard();
  }

  /**
   * Handle PLAY_CARD state - intelligently place card using enhanced card selector
   */
  private handlePlayCard(): void {
    const hand = this.player.getHand();
    const cards = hand.getCards();
    
    if (cards.length === 0) {
      console.warn('AI: No cards in hand to play');
      return;
    }

    const analysis = this.getGameAnalysis();
    const myStacks = this.player.getMyStacks();
    const opponentStacks = this.player.getOpponentStacks();
    
    // Use CardSelector to evaluate all possible moves
    const evaluations = this.cardSelector.evaluateAllMoves(cards, analysis, myStacks, opponentStacks);
    const bestMove = this.cardSelector.selectBestMove(evaluations);
    
    if (!bestMove) {
      console.warn('AI: No valid moves found');
      return;
    }
    
    this.lastPlayedCard = bestMove.card;
    
    console.log(`AI: Playing ${bestMove.card.toString()} - ${bestMove.reasoning} (value: ${bestMove.value}, type: ${bestMove.type})`);
    this.player.playCard(bestMove.card, bestMove.placement);
  }

  /**
   * Get detailed move evaluation for debugging
   */
  getMoveEvaluations(): CardEvaluation[] {
    const hand = this.player.getHand();
    const cards = hand.getCards();
    const analysis = this.getGameAnalysis();
    const myStacks = this.player.getMyStacks();
    const opponentStacks = this.player.getOpponentStacks();
    
    return this.cardSelector.evaluateAllMoves(cards, analysis, myStacks, opponentStacks);
  }


  /**
   * Determine the character type of a stack based on its top cards
   */
  private getStackCharacter(topCards: { head?: Card; torso?: Card; legs?: Card }): Character | null {
    // Check head card first
    if (topCards.head) {
      const effectiveChar = topCards.head.getEffectiveCharacter();
      if (effectiveChar !== Character.Wild) {
        return effectiveChar;
      }
    }
    
    // Check torso card
    if (topCards.torso) {
      const effectiveChar = topCards.torso.getEffectiveCharacter();
      if (effectiveChar !== Character.Wild) {
        return effectiveChar;
      }
    }
    
    // Check legs card
    if (topCards.legs) {
      const effectiveChar = topCards.legs.getEffectiveCharacter();
      if (effectiveChar !== Character.Wild) {
        return effectiveChar;
      }
    }

    return null; // No clear character type
  }

  /**
   * Handle NOMINATE_WILD state - intelligently nominate wild cards using advanced strategy
   */
  private handleNominateWild(): void {
    if (!this.lastPlayedCard || !this.lastPlayedCard.isWild()) {
      console.warn('AI: Expected to nominate wild card but no wild card found');
      return;
    }

    const analysis = this.getGameAnalysis();
    const hand = this.player.getHand();
    const myStacks = this.player.getMyStacks();
    
    // Find the stack where the wild card was played (if any)
    const targetStack = this.findStackWithWildCard(this.lastPlayedCard, myStacks);
    
    // Evaluate all nomination options
    const nominations = this.wildCardNominator.evaluateNominations(
      this.lastPlayedCard, 
      targetStack, 
      analysis, 
      hand, 
      myStacks
    );
    
    const bestNomination = this.wildCardNominator.selectBestNomination(nominations);

    console.log(`AI: Nominating wild card as ${bestNomination.character} ${bestNomination.bodyPart} - ${bestNomination.reasoning} (value: ${bestNomination.value})`);
    this.player.nominateWildCard(this.lastPlayedCard, {
      character: bestNomination.character,
      bodyPart: bestNomination.bodyPart
    });
  }

  /**
   * Handle MOVE_CARD state - strategically move cards to optimize position
   */
  private handleMoveCard(): void {
    const analysis = this.getGameAnalysis();
    const move = this.selectBestMove(analysis);
    
    if (move) {
      console.log(`AI: Moving card ${move.cardId} strategically`);
      this.player.moveCard(move);
    } else {
      console.warn('AI: No strategic moves found');
    }
  }

  /**
   * Find the stack where a wild card was played
   */
  private findStackWithWildCard(wildCard: Card, stacks: Stack[]): Stack | null {
    // Look for the wild card in each stack's top cards
    for (const stack of stacks) {
      const topCards = stack.getTopCards();
      const allCards = [topCards.head, topCards.torso, topCards.legs].filter(Boolean) as Card[];
      
      if (allCards.find(card => card.id === wildCard.id)) {
        return stack;
      }
    }
    return null;
  }

  /**
   * Get detailed nomination evaluations for debugging
   */
  getNominationEvaluations(): NominationOption[] {
    if (!this.lastPlayedCard || !this.lastPlayedCard.isWild()) {
      return [];
    }

    const analysis = this.getGameAnalysis();
    const hand = this.player.getHand();
    const myStacks = this.player.getMyStacks();
    const targetStack = this.findStackWithWildCard(this.lastPlayedCard, myStacks);
    
    return this.wildCardNominator.evaluateNominations(
      this.lastPlayedCard, 
      targetStack, 
      analysis, 
      hand, 
      myStacks
    );
  }

  /**
   * Select the best strategic move from available options
   */
  private selectBestMove(analysis: GameAnalysis): MoveOptions | null {
    const myStacks = this.player.getMyStacks();
    const opponentStacks = this.player.getOpponentStacks();
    const allStacks = [...myStacks, ...opponentStacks];
    
    // Priority 1: Moves that complete own characters
    for (const opportunity of analysis.completionOpportunities) {
      const move = this.findMoveForCompletion(opportunity, allStacks);
      if (move) return move;
    }

    // Priority 2: Moves that block critical opponent completions
    for (const block of analysis.blockingOpportunities) {
      if (block.urgency === 'critical') {
        const move = this.findMoveForBlocking(block, allStacks);
        if (move) return move;
      }
    }

    // Priority 3: Any valid move that improves position
    return this.findFirstValidMove(allStacks[0], allStacks);
  }

  /**
   * Find a move that can complete a character
   */
  private findMoveForCompletion(opportunity: any, allStacks: Stack[]): MoveOptions | null {
    // Look for cards that can be moved to complete the stack
    for (const fromStack of allStacks) {
      const cards = fromStack.getCardsFromPile(opportunity.neededCard);
      if (cards.length > 0) {
        const card = cards[cards.length - 1]; // Top card
        if (card.character === opportunity.character || card.isWild()) {
          const targetStack = allStacks.find(s => s.getId() === opportunity.stackId);
          if (targetStack && targetStack.canAcceptCard(card, opportunity.neededCard)) {
            return {
              cardId: card.id,
              fromStackId: fromStack.getId(),
              fromPile: opportunity.neededCard,
              toStackId: opportunity.stackId,
              toPile: opportunity.neededCard
            };
          }
        }
      }
    }
    return null;
  }

  /**
   * Find a move that can block opponent completion
   */
  private findMoveForBlocking(block: any, allStacks: Stack[]): MoveOptions | null {
    // Look for cards that can be moved to block the opponent
    for (const fromStack of allStacks) {
      const cards = fromStack.getCardsFromPile(block.targetPile);
      if (cards.length > 0) {
        const card = cards[cards.length - 1]; // Top card
        const targetStack = allStacks.find(s => s.getId() === block.stackId);
        if (targetStack && targetStack.canAcceptCard(card, block.targetPile)) {
          return {
            cardId: card.id,
            fromStackId: fromStack.getId(),
            fromPile: block.targetPile,
            toStackId: block.stackId,
            toPile: block.targetPile
          };
        }
      }
    }
    return null;
  }

  /**
   * Find the first valid move from a given stack
   */
  private findFirstValidMove(fromStack: Stack, allStacks: Stack[]): MoveOptions | null {
    const piles = [BodyPart.Head, BodyPart.Torso, BodyPart.Legs];
    
    for (const fromPile of piles) {
      const cards = fromStack.getCardsFromPile(fromPile);
      if (cards.length === 0) continue;

      const topCard = cards[cards.length - 1];
      
      for (const toStack of allStacks) {
        if (toStack.getId() === fromStack.getId()) continue;
        
        for (const toPile of piles) {
          if (toStack.canAcceptCard(topCard, toPile)) {
            return {
              cardId: topCard.id,
              fromStackId: fromStack.getId(),
              fromPile: fromPile,
              toStackId: toStack.getId(),
              toPile: toPile
            };
          }
        }
      }
    }

    return null;
  }

  /**
   * Get missing body parts for a stack's top cards
   */
  private getMissingBodyParts(topCards: { head?: Card; torso?: Card; legs?: Card }): BodyPart[] {
    const missing: BodyPart[] = [];
    if (!topCards.head) missing.push(BodyPart.Head);
    if (!topCards.torso) missing.push(BodyPart.Torso);
    if (!topCards.legs) missing.push(BodyPart.Legs);
    return missing;
  }

  /**
   * Log game result when game is over
   */
  private logGameResult(): void {
    const state = this.player.getState();
    console.log(`AI: Game over - ${state.getMessage()}`);
  }
}