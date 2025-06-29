import { Card, Character, BodyPart } from './Card.js';
import { Stack, TopCards } from './Stack.js';
import { Hand } from './Hand.js';
import { Score } from './Score.js';

export interface StackProgress {
  character: Character;
  hasHead: boolean;
  hasTorso: boolean;
  hasLegs: boolean;
  completionLevel: number; // 0-3 (number of pieces)
  isComplete: boolean;
  missingPieces: BodyPart[];
}

export interface HandAnalysis {
  regularCards: Card[];
  wildCards: Card[];
}

export interface CompletionOpportunity {
  character: Character;
  stackId: string;
  neededCard: BodyPart;
  priority: 'high' | 'medium' | 'low';
}

export interface BlockingOpportunity {
  character: Character;
  stackId: string;
  targetPile: BodyPart;
  urgency: 'critical' | 'important' | 'optional';
}

export interface GameAnalysis {
  ownProgress: Map<Character, StackProgress>;
  opponentProgress: Map<Character, StackProgress>;
  ownWildCards: Card[];
  totalWildCards: number;
  gamePhase: 'early' | 'mid' | 'late';
  threatLevel: 'low' | 'medium' | 'high';
  completionOpportunities: CompletionOpportunity[];
  blockingOpportunities: BlockingOpportunity[];
}

export type ThreatLevel = 'low' | 'medium' | 'high';
export type GamePhase = 'early' | 'mid' | 'late';

export class GameStateAnalyzer {
  /**
   * Analyze all stacks and scores to determine character progress
   */
  analyzeStacks(stacks: Stack[], score: Score): Map<Character, StackProgress> {
    const progressMap = new Map<Character, StackProgress>();
    
    // Initialize progress for all characters
    const characters = [Character.Ninja, Character.Pirate, Character.Zombie, Character.Robot];
    characters.forEach(char => {
      const isAlreadyScored = score.hasCharacter(char);
      progressMap.set(char, {
        character: char,
        hasHead: isAlreadyScored,
        hasTorso: isAlreadyScored,
        hasLegs: isAlreadyScored,
        completionLevel: isAlreadyScored ? 3 : 0,
        isComplete: isAlreadyScored,
        missingPieces: isAlreadyScored ? [] : [BodyPart.Head, BodyPart.Torso, BodyPart.Legs]
      });
    });

    // Analyze each stack (only for characters not already scored)
    stacks.forEach(stack => {
      const topCards = stack.getTopCards();
      const character = this.determineStackCharacter(topCards);
      
      if (character && character !== Character.Wild) {
        const progress = progressMap.get(character);
        if (progress && !progress.isComplete) {
          // Only update if character hasn't been scored yet
          // Update piece presence
          if (topCards.head) progress.hasHead = true;
          if (topCards.torso) progress.hasTorso = true;
          if (topCards.legs) progress.hasLegs = true;
          
          // Calculate completion level
          progress.completionLevel = 
            (progress.hasHead ? 1 : 0) +
            (progress.hasTorso ? 1 : 0) +
            (progress.hasLegs ? 1 : 0);
          
          // Check if complete
          progress.isComplete = stack.isComplete();
          
          // Update missing pieces
          progress.missingPieces = [];
          if (!progress.hasHead) progress.missingPieces.push(BodyPart.Head);
          if (!progress.hasTorso) progress.missingPieces.push(BodyPart.Torso);
          if (!progress.hasLegs) progress.missingPieces.push(BodyPart.Legs);
          
          progressMap.set(character, progress);
        }
      }
    });

    return progressMap;
  }

  /**
   * Analyze hand composition separating regular cards from wild cards
   */
  analyzeHand(hand: Hand): HandAnalysis {
    const cards = hand.getCards();
    const regularCards: Card[] = [];
    const wildCards: Card[] = [];

    cards.forEach(card => {
      if (card.isWild()) {
        wildCards.push(card);
      } else {
        regularCards.push(card);
      }
    });

    return { regularCards, wildCards };
  }

  /**
   * Assess threat level based on opponent progress
   */
  assessThreatLevel(opponentProgress: Map<Character, StackProgress>): ThreatLevel {
    let charactersCloseToCompletion = 0;
    let completedCharacters = 0;

    opponentProgress.forEach(progress => {
      if (progress.isComplete) {
        completedCharacters++;
      } else if (progress.completionLevel >= 2) {
        charactersCloseToCompletion++;
      }
    });

    // High threat: 2+ characters with 2/3 pieces OR 3+ completed
    if (charactersCloseToCompletion >= 2 || completedCharacters >= 3) {
      return 'high';
    }
    
    // Medium threat: 1 character with 2/3 pieces OR 2+ completed
    if (charactersCloseToCompletion >= 1 || completedCharacters >= 2) {
      return 'medium';
    }
    
    // Low threat: No characters close to completion
    return 'low';
  }

  /**
   * Determine current game phase based on total completions
   */
  determineGamePhase(ownScore: Score, opponentScore: Score): GamePhase {
    const totalCompletions = ownScore.size() + opponentScore.size();
    
    if (totalCompletions < 2) {
      return 'early';
    } else if (totalCompletions <= 4) {
      return 'mid';
    } else {
      return 'late';
    }
  }

  /**
   * Find opportunities to complete own stacks
   */
  findCompletionOpportunities(hand: Card[], ownStacks: Stack[], ownScore: Score): CompletionOpportunity[] {
    const opportunities: CompletionOpportunity[] = [];
    const ownProgress = this.analyzeStacks(ownStacks, ownScore);

    ownProgress.forEach(progress => {
      if (!progress.isComplete && progress.completionLevel >= 2) {
        // Character is close to completion, check if we have the missing piece
        progress.missingPieces.forEach(missingPiece => {
          const hasCard = hand.some(card => 
            (card.character === progress.character && card.bodyPart === missingPiece) ||
            card.isWild()
          );
          
          if (hasCard) {
            const stack = ownStacks.find(s => {
              const char = this.determineStackCharacter(s.getTopCards());
              return char === progress.character;
            });
            
            if (stack) {
              opportunities.push({
                character: progress.character,
                stackId: stack.getId(),
                neededCard: missingPiece,
                priority: progress.completionLevel === 2 ? 'high' : 'medium'
              });
            }
          }
        });
      }
    });

    return opportunities.sort((a, b) => {
      // Sort by priority: high first, then by character
      if (a.priority !== b.priority) {
        return a.priority === 'high' ? -1 : 1;
      }
      return a.character.localeCompare(b.character);
    });
  }

  /**
   * Find opportunities to block opponent completions
   */
  findBlockingOpportunities(hand: Card[], opponentStacks: Stack[], opponentScore: Score): BlockingOpportunity[] {
    const opportunities: BlockingOpportunity[] = [];
    const opponentProgress = this.analyzeStacks(opponentStacks, opponentScore);

    opponentStacks.forEach(stack => {
      const topCards = stack.getTopCards();
      const character = this.determineStackCharacter(topCards);
      
      if (character && character !== Character.Wild) {
        const progress = opponentProgress.get(character);
        
        if (progress && !progress.isComplete && progress.completionLevel >= 2) {
          // Opponent is close to completion, check if we can block
          progress.missingPieces.forEach(missingPiece => {
            const canBlock = hand.some(card => 
              card.bodyPart === missingPiece || card.isWild()
            );
            
            if (canBlock) {
              opportunities.push({
                character,
                stackId: stack.getId(),
                targetPile: missingPiece,
                urgency: progress.completionLevel === 2 ? 'critical' : 'important'
              });
            }
          });
        }
      }
    });

    return opportunities.sort((a, b) => {
      // Sort by urgency: critical first
      if (a.urgency !== b.urgency) {
        return a.urgency === 'critical' ? -1 : 1;
      }
      return a.character.localeCompare(b.character);
    });
  }

  /**
   * Perform comprehensive game state analysis
   */
  analyzeGameState(
    ownStacks: Stack[], 
    opponentStacks: Stack[], 
    ownHand: Hand, 
    ownScore: Score, 
    opponentScore: Score
  ): GameAnalysis {
    const ownProgress = this.analyzeStacks(ownStacks, ownScore);
    const opponentProgress = this.analyzeStacks(opponentStacks, opponentScore);
    const handAnalysis = this.analyzeHand(ownHand);
    const threatLevel = this.assessThreatLevel(opponentProgress);
    const gamePhase = this.determineGamePhase(ownScore, opponentScore);
    
    const completionOpportunities = this.findCompletionOpportunities(
      ownHand.getCards(), 
      ownStacks,
      ownScore
    );
    
    const blockingOpportunities = this.findBlockingOpportunities(
      ownHand.getCards(), 
      opponentStacks,
      opponentScore
    );

    return {
      ownProgress,
      opponentProgress,
      ownWildCards: handAnalysis.wildCards,
      totalWildCards: handAnalysis.wildCards.length,
      gamePhase,
      threatLevel,
      completionOpportunities,
      blockingOpportunities
    };
  }

  /**
   * Determine the primary character of a stack based on its top cards
   */
  private determineStackCharacter(topCards: TopCards): Character | null {
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
   * Get a summary string of the current game analysis
   */
  getAnalysisSummary(analysis: GameAnalysis): string {
    const ownCompletions = Array.from(analysis.ownProgress.values())
      .filter(p => p.isComplete).length;
    const opponentCompletions = Array.from(analysis.opponentProgress.values())
      .filter(p => p.isComplete).length;
    
    return `Game Analysis: Phase=${analysis.gamePhase}, Threat=${analysis.threatLevel}, ` +
           `Own=${ownCompletions}/4, Opponent=${opponentCompletions}/4, ` +
           `Wilds=${analysis.totalWildCards}, Opportunities=${analysis.completionOpportunities.length}`;
  }
}