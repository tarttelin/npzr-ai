# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **NPZR Game Engine** - a TypeScript implementation of the Ninja Pirate Zombie Robot card game. The project provides pure game logic with no UI dependencies, featuring a 44-card tactical game system with wild cards, stack management, and move cascading mechanics.

## Development Commands

### Essential Commands
```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript to dist/
npm test             # Run full test suite (195 tests)
npm run typecheck    # Type checking without compilation
npm run lint         # ESLint code quality checks
```

### Testing Commands
```bash
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage report (91% coverage)
jest src/__tests__/deck.test.ts  # Run specific test file
jest --testNamePattern="wild card"  # Run tests matching pattern
```

### Code Quality
```bash
npm run lint:fix    # Auto-fix ESLint issues
npm run dev         # Run with ts-node for development
```

## Architecture Overview

### Core Design Pattern
The engine follows a **layered architecture** with clear separation of concerns:

**`NPZRGameEngine` (engine.ts)** - Main API facade providing clean interface to game functionality
**Game State Layer** - Immutable state management with validation
**Domain Logic Modules** - Specialized modules for game mechanics
**Type System** - Comprehensive TypeScript interfaces ensuring type safety

### Key Architectural Components

#### 1. Game State Management (`types.ts`, `game.ts`)
- **GameState**: Central state container with players, stacks, deck, and game phase
- **Immutable Operations**: All state changes go through validated functions
- **State Validation**: Built-in consistency checking and error detection

#### 2. Card and Deck System (`deck.ts`)
- **44-card deck**: 36 regular cards (4 characters × 3 body parts × 3 copies) + 8 wild cards
- **Wild card types**: Character-specific, position-specific, and universal wilds
- **Card properties**: All wild cards are "fast cards" allowing additional plays

#### 3. Stack and Pile Management (`stacks.ts`)
- **Stacks**: Player-owned areas for building characters (contain 3 piles each)
- **Piles**: Collections of cards for specific body parts (head/torso/legs)
- **Defensive play**: Players can place cards on opponent stacks to block completion

#### 4. Turn and Move Systems (`turns.ts`, `moves.ts`)
- **Turn structure**: Draw → Play regular card → Play wild cards → Execute moves
- **Move cascading**: Completing stacks earns moves, which can trigger more completions
- **Move validation**: Comprehensive checking before execution with rollback on failure

#### 5. Wild Card Mechanics (`wildcards.ts`)
- **Nomination system**: Wild cards must be nominated when played (specify character/body part)
- **Nomination reset**: Cards become wild again when moved
- **Constraint validation**: Character wilds limited to specific character, etc.

### Game Flow Architecture

```
NPZRGameEngine → Turn Management → Card Playing → Stack Operations → Move Processing → Win Detection
```

**Critical flow**: Move completions can cascade (completing one stack earns a move, which might complete another stack, earning another move, etc.)

## Testing Architecture

### Test Organization (91% coverage)
- **Unit tests**: Individual module testing (`deck.test.ts`, `stacks.test.ts`, etc.)
- **Integration tests**: End-to-end game scenarios (`integration.test.ts`)
- **Edge case coverage**: Error handling, boundary conditions, invalid states

### Coverage Targets
- Statements: 90%+ (currently 91%)
- Functions: 95%+ (currently 96%)
- Lines: 90%+ (currently 90%)
- Branches: 80%+ (currently 81%)

## Custom Commands

### `/project:fix-gh-issue <issue-number>`
Automated GitHub issue resolution workflow:
1. Analyzes issue with `gh issue view`
2. Creates feature branch
3. Implements changes with tests
4. Validates with linting/type checking
5. Creates descriptive commit

## Important Game Logic Concepts

### Stack Completion Detection
A stack is complete when head, torso, and legs all match the same character (considering wild card nominations). This is checked by examining the **top card** of each pile.

### Move Cascading System
The most complex part of the engine - when a stack completes:
1. Award character to player
2. Remove stack from game
3. Award one move to current player
4. Process any pending moves (which might complete more stacks)
5. Continue until no more cascading occurs

### Wild Card State Management
Wild cards have **dual state**:
- **Unnominated**: Type-constrained (e.g., Character wild can only be that character)
- **Nominated**: Acts as the nominated character/body part until moved

### Game State Consistency
The engine maintains consistency through:
- Total card count validation (always 44 cards)
- Player hand limits
- Pending move tracking
- Game phase management (setup → playing → finished)

## Working with the Codebase

### Adding New Features
1. Define types in `types.ts` first
2. Add core logic to appropriate module
3. Expose through `NPZRGameEngine` if needed
4. Write comprehensive tests
5. Update API documentation

### Debugging Game Issues
- Use `engine.validateGameState()` to check consistency
- Use `engine.getGameStateForTesting()` to inspect internal state
- Check `engine.getPendingMoves()` for move system issues

### Performance Considerations
- Game state cloning is used for move simulation (expensive for large states)
- Set operations for player scored characters (ensure proper Set handling)
- Cascade detection has safety limits to prevent infinite loops