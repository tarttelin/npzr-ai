# NPZR Game Engine Redesign - Product Requirements Document

## Executive Summary

This PRD outlines a complete redesign of the NPZR game engine to implement a player-centric API that provides better encapsulation, clearer state management, and more intuitive interaction patterns. The new design moves from a monolithic engine approach to a player-focused architecture where each player has their own interface and state management.

## Current State Analysis

### Problems with Current Engine Design

1. **Monolithic Interface**: The `NPZRGameEngine` class exposes too many internal details and requires clients to manage complex state transitions
2. **Poor Encapsulation**: Players can access and modify game state directly without proper validation
3. **Unclear State Management**: Turn state and player actions are mixed together, making it hard to understand what a player should do next
4. **Testing Complexity**: The current API makes it difficult to test individual player interactions naturally
5. **Confusing Responsibility**: The engine handles both game logic and player interaction, violating single responsibility principle

### What Works Well

1. **Game Rules Implementation**: The core game logic (stack completion, wild cards, moves) is well-implemented
2. **Type Safety**: Strong TypeScript typing provides good compile-time safety
3. **Documentation**: The `how-to-play.md` provides excellent rule documentation
4. **Card System**: The deck, wild card, and nomination systems work correctly

## New Design Vision

### Core Principles

1. **Player-Centric Design**: Each player gets their own interface object that encapsulates their view of the game
2. **State-Driven Interactions**: Player objects maintain clear state about what the player should do next
3. **Delegation Pattern**: Player objects delegate complex operations to the internal engine while maintaining clean interfaces
4. **Encapsulation**: Players can only access what they need to see and do
5. **Natural Testing**: The API should feel natural to use and test
6. **Classes with Behavior**: Favor rich classes with methods over plain data types

### Architecture Overview

```
┌─────────────────┐
│   GameEngine    │  ← Initializes deck, manages game state
│                 │
│ + createGame()  │
│ + addPlayer()   │  ← Returns Player object
│                 │
└─────────────────┘
         │
         │ creates
         ▼
┌─────────────────┐
│     Player      │  ← Player's interface to the game
│                 │
│ + getState()    │  ← Returns current player state
│ + getHand()     │
│ + getMyStacks() │
│ + getOpponentStacks() │
│ + playCard()    │
│ + moveCard()    │
│ + skipMove()    │
│ + drawCard()    │
│                 │
└─────────────────┘
```

## Detailed Requirements

### 1. Game Engine Class

**Purpose**: Initialize games and manage overall game state

```typescript
class GameEngine {
  // Game creation
  createGame(): void
  addPlayer(playerName: string): Player
  
  // Game state (read-only)
  isGameComplete(): boolean
  getWinner(): Player | null
  
  // Internal state management (not exposed)
  private deck: Deck
  private gameState: GameState
  private players: Player[]
}
```

**Requirements**:
- Initialize the 44-card deck as per game rules
- Support exactly 2 players
- Return Player objects when players join
- Manage internal game state without exposing it directly
- Handle deck reshuffling when empty

### 2. Player Class

**Purpose**: Provide each player's interface to the game

```typescript
class Player {
  // Player state
  getState(): PlayerState
  getName(): string
  
  // Game information
  getHand(): Hand
  getMyStacks(): Stack[]
  getOpponentStacks(): Stack[]
  getMyScore(): Score
  getOpponentScore(): Score
  
  // Actions
  drawCard(): DrawResult
  playCard(card: Card, options: PlayCardOptions): PlayResult
  moveCard(moveOptions: MoveOptions): MoveResult
  skipMove(): SkipResult
  nominateWildCard(card: Card, nomination: Nomination): NominationResult
  
  // Utility
  canPlayCard(card: Card): boolean
  canMoveCard(from: Position, to: Position): boolean
  isMyTurn(): boolean
}
```

### 3. Rich Classes for Game Components

**Hand Class**:
```typescript
class Hand {
  getCards(): Card[]
  size(): number
  hasCard(card: Card): boolean
  canPlay(card: Card): boolean
  remove(card: Card): Card
  add(card: Card): void
}
```

**Stack Class**:
```typescript
class Stack {
  getId(): string
  getOwner(): Player
  getHeads(): Card[]
  getTorsos(): Card[]
  getLegs(): Card[]
  isComplete(): boolean
  getTopCards(): TopCards
  addCard(card: Card, pile: BodyPart): void
  removeCard(pile: BodyPart): Card | null
  canAcceptCard(card: Card, pile: BodyPart): boolean
}
```

**Score Class**:
```typescript
class Score {
  getCompletedCharacters(): Set<Character>
  hasCharacter(character: Character): boolean
  addCharacter(character: Character): void
  isWinning(): boolean
  size(): number
}
```

**Deck Class**:
```typescript
class Deck {
  drawCard(): Card | null
  size(): number
  isEmpty(): boolean
  shuffle(): void
  reshuffle(cards: Card[]): void
}
```

### 4. Player State Management

**Player States**:
- `WAITING_FOR_OPPONENT`: Other player is taking their turn
- `DRAW_CARD`: Player must draw a card to start their turn
- `PLAY_CARD`: Player must play a card from their hand
- `NOMINATE_WILD`: Player must nominate a wild card they just played
- `MOVE_CARD`: Player has earned a move and must use it or skip it
- `GAME_OVER`: Game has ended

**PlayerState Class**:
```typescript
class PlayerState {
  getState(): StateType
  getMessage(): string
  canDrawCard(): boolean
  canPlayCard(): boolean
  canMoveCard(): boolean
  canNominate(): boolean
  canSkipMove(): boolean
  getValidActions(): Action[]
}
```

**State Transitions**:
```
WAITING_FOR_OPPONENT → DRAW_CARD (when turn starts)
DRAW_CARD → PLAY_CARD (after drawing)
PLAY_CARD → NOMINATE_WILD (if wild card played)
PLAY_CARD → MOVE_CARD (if stack completed)
PLAY_CARD → PLAY_CARD (if wild card allows continuation)
PLAY_CARD → WAITING_FOR_OPPONENT (if regular card ends turn)
NOMINATE_WILD → MOVE_CARD (if stack completed)
NOMINATE_WILD → PLAY_CARD (if can continue with wild)
NOMINATE_WILD → WAITING_FOR_OPPONENT (if turn ends)
MOVE_CARD → MOVE_CARD (if move creates another completion)
MOVE_CARD → PLAY_CARD (if still have wild continuation)
MOVE_CARD → WAITING_FOR_OPPONENT (if turn ends)
Any State → GAME_OVER (if game ends)
```

### 5. Stack Access and Manipulation

**Requirements**:
- Players can view all stacks (their own and opponent's)
- Players can play cards on any stack
- Players can move cards between any stacks (when they have moves)
- Stack ownership is clear but doesn't restrict placement
- Stack completion automatically triggers scoring

### 6. Action Results with Rich Classes

**Result Classes**:
```typescript
class ActionResult {
  wasSuccessful(): boolean
  getMessage(): string
  getNewState(): PlayerState
  getStacksCompleted(): Stack[]
  getMovesEarned(): number
  hasGameEnded(): boolean
}

class PlayResult extends ActionResult {
  getCardPlayed(): Card
  getTargetStack(): Stack
  canContinuePlaying(): boolean
}

class MoveResult extends ActionResult {
  getCardMoved(): Card
  getFromStack(): Stack
  getToStack(): Stack
  getCascadeCompletions(): Stack[]
}
```

**Requirements**:
- All player actions return rich result objects with behavior
- Clear feedback on what happened through methods
- Automatic state transitions
- Indication of cascading effects (completed stacks, earned moves)

### 7. Error Handling and Validation

**Requirements**:
- All actions validate before execution using class methods
- Clear error messages for invalid actions through result objects
- No state changes on invalid actions
- Defensive programming against invalid state transitions

### 8. Game Rules Implementation

**Requirements**:
- Maintain all current game rules from `how-to-play.md`
- Sequential single-card play system
- Wild card continuation rules
- Move earning and cascade system
- Winning condition (4 different characters)

## Implementation Strategy

### Phase 1: Core Architecture
1. Create new `GameEngine` class with minimal interface
2. Create `Player` class with basic state management
3. Create rich classes for `Hand`, `Stack`, `Score`, `Deck`
4. Implement player state classes and transitions
5. Set up delegation pattern between Player and internal engine

### Phase 2: Basic Game Flow
1. Implement deck initialization and shuffling with `Deck` class
2. Implement player joining and hand dealing with `Hand` class
3. Implement basic draw-play-wait cycle
4. Add turn management and state transitions with `PlayerState` class

### Phase 3: Advanced Features
1. Implement stack access and manipulation with `Stack` class
2. Add wild card nomination system
3. Implement move earning and execution
4. Add cascade completion handling with rich result classes

### Phase 4: Polish and Testing
1. Add comprehensive error handling through result classes
2. Implement action result system with rich classes
3. Add validation and defensive programming through class methods
4. Create integration tests with new API

## Success Criteria

### Functional Requirements
- [ ] Engine initializes 44-card deck correctly using `Deck` class
- [ ] Players can join game and receive `Player` objects
- [ ] Player state correctly reflects what they should do next via `PlayerState` class
- [ ] All game rules from `how-to-play.md` are implemented
- [ ] Players can access both their own and opponent's stacks via `Stack` classes
- [ ] Wild card continuation system works correctly
- [ ] Move earning and cascade system works correctly
- [ ] Game ends correctly when player gets 4 characters via `Score` class

### Non-Functional Requirements
- [ ] API feels natural and intuitive to use with rich classes
- [ ] Player objects properly encapsulate their view of the game
- [ ] State transitions are clear and predictable via `PlayerState`
- [ ] Error messages are clear and helpful through result classes
- [ ] Code is well-typed and type-safe
- [ ] Testing is straightforward and natural with behavioral classes

### User Experience Requirements
- [ ] Player always knows what they should do next via `getState().getMessage()`
- [ ] Invalid actions are caught early with clear messages via result classes
- [ ] Game state changes are reflected immediately in player view
- [ ] Stack access is intuitive and transparent via `Stack` methods
- [ ] Wild card nomination is clear and well-guided

## Migration Plan

### Complete Rewrite Approach
- Existing engine API will be completely replaced
- No backward compatibility needed
- Tests will be rebuilt from scratch with new API
- All existing code can be discarded once new implementation is complete

### Rollout Strategy
1. Implement new API in clean slate
2. Create simple integration tests to verify functionality
3. Replace all existing engine code
4. Remove old implementation entirely

## Conclusion

This redesign focuses on creating a more intuitive, player-centric API that better reflects how players actually interact with the game. By moving to a state-driven approach with rich behavioral classes and clear player objects, we can create a more testable, maintainable, and user-friendly game engine.

The new design separates concerns clearly: the GameEngine handles initialization and overall game management, while Player objects provide clean, encapsulated interfaces for player interaction. Rich classes like Hand, Stack, Score, and Deck provide behavior and encapsulation, making the system more object-oriented and easier to understand and test.