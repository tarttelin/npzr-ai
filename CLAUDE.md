# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **NPZR Game Engine** - a TypeScript implementation of the Ninja Pirate Zombie Robot card game. The project provides pure game logic with no UI dependencies, featuring a 44-card tactical game system with wild cards, stack management, and AI-driven opponent disruption mechanics.

## Communication style

When responding to prompts, instead of using terms such as "You're absolutely right", use a more valley girl tone of voice.

## Development Commands

### Essential Commands
```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript to dist/
npm test             # Run full test suite (68 tests)
npm run typecheck    # Type checking without compilation
npm run lint         # ESLint code quality checks (TypeScript-aware)
```

### Testing Commands
```bash
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage report
jest src/AIPlayer.test.ts  # Run specific test file
jest --testNamePattern="disruption"  # Run tests matching pattern
```

### Code Quality
```bash
npm run lint:fix    # Auto-fix ESLint issues
npm run dev         # Run with ts-node for development
```

## Architecture Overview

### Core Design Pattern
The engine follows a **layered architecture** with clear separation of concerns:

**`GameEngine`** - Main game coordinator and state management  
**AI Layer** - Intelligent card play with disruption strategy  
**Game State Analysis** - Strategic evaluation and opportunity detection  
**Core Game Logic** - Card, Stack, Player, and Deck mechanics  
**Type System** - Comprehensive TypeScript interfaces ensuring type safety

### Key Architectural Components

#### 1. Game State Management (`GameEngine.ts`, `Player.ts`)
- **GameEngine**: Central coordinator managing players, deck, and game flow
- **Player**: Individual player state with hands, stacks, and scores
- **Game phases**: Setup → playing → finished with turn-based mechanics

#### 2. Card and Deck System (`Card.ts`, `Deck.ts`)
- **44-card deck**: 36 regular cards (4 characters × 3 body parts × 3 copies) + 8 wild cards
- **Wild card types**: Character-specific, position-specific, and universal wilds
- **Nomination system**: Wild cards must be nominated when played (specify character/body part)

#### 3. Stack and Pile Management (`Stack.ts`)
- **Stacks**: Player-owned areas for building characters (contain 3 piles each)
- **Piles**: Collections of cards for specific body parts (head/torso/legs)
- **Defensive play**: Players can place cards on opponent stacks to disrupt completion

#### 4. AI Intelligence System (`AIPlayer.ts`, `CardPlayEvaluator.ts`, `GameStateAnalyzer.ts`)
- **AIPlayer**: Main AI controller handling all game states and decision-making
- **CardPlayEvaluator**: Unified wild card placement+nomination evaluation (eliminates coordination blindness)
- **GameStateAnalyzer**: Strategic analysis of game state, opportunities, and threats
- **Disruption Strategy**: AI actively disrupts opponent progress instead of helping completion

#### 5. Wild Card Mechanics (`Card.ts`, `CardPlayEvaluator.ts`)
- **Nomination constraints**: Character wilds limited to specific character, position wilds to specific body parts
- **Nomination reset**: Cards become wild again when moved
- **Unified evaluation**: Placement and nomination decisions made together for optimal strategy

### Game Flow Architecture

```
GameEngine → Player Management → AIPlayer → CardPlayEvaluator → GameStateAnalyzer
                ↓                    ↓              ↓                    ↓
         Turn Management → Card Playing → Wild Card Evaluation → Disruption Detection
```

**Critical AI Flow**: AI evaluates all placement+nomination combinations simultaneously to avoid coordination blindness, prioritizing opponent disruption over defensive play.

## Testing Architecture

### Test Organization (68 tests, ~90%+ coverage)
- **Unit tests**: Individual module testing (`Card.ts`, `Stack.ts`, `GameStateAnalyzer.test.ts`, etc.)
- **Integration tests**: End-to-end game scenarios (`integration.test.ts`)
- **AI tests**: Strategic decision-making and evaluation logic (`AIPlayer.test.ts`, `CardPlayEvaluator.test.ts`)
- **Edge case coverage**: Error handling, boundary conditions, invalid states

### Test Suites
- **4 test suites**: All passing
- **68 total tests**: Comprehensive coverage of core functionality
- **AI behavior verification**: Console output validates strategic decisions

## Recent Major Improvements

### Unified Wild Card System (Issue #12)
**Problem**: Separation of card selection and wild card nomination caused "coordination blindness"  
**Solution**: Created unified `CardPlayEvaluator` system that evaluates all placement+nomination combinations together  
**Result**: Optimal wild card usage with coordinated strategic decisions

### Corrected Disruption Strategy
**Problem**: AI was helping opponents complete characters instead of disrupting them  
**Solution**: Fixed `findDisruptionOpportunities()` to target existing pieces for disruption, not missing pieces for completion  
**Result**: AI now properly disrupts opponents by placing different characters on existing pieces

### Improved Terminology
**Change**: Replaced "blocking" terminology with "disruption" throughout codebase  
**Reason**: "Disruption" more accurately describes placing different characters on existing opponent pieces  
**Files affected**: `GameStateAnalyzer.ts`, `CardPlayEvaluator.ts`, all test files

### ESLint TypeScript Configuration
**Problem**: 34 false positive lint errors due to improper TypeScript ESLint setup  
**Solution**: Added `@typescript-eslint` plugin and TypeScript-aware rules  
**Result**: Clean linting with proper enum, constructor parameter, and import detection

## Important Game Logic Concepts

### Stack Completion Detection
A stack is complete when head, torso, and legs all match the same character (considering wild card nominations). This is checked by examining the **top card** of each pile using `getEffectiveCharacter()`.

### AI Disruption Strategy
The AI's core strategy prioritizes:
1. **Completing own stacks** (1000+ points)
2. **Disrupting opponent progress** (400-800 points based on urgency)
3. **Building toward completion** (100-500 points based on progress)
4. **Creating new stacks** (100-150 points)

**Disruption mechanism**: Place cards with different characters on opponent's existing pieces to force them to rebuild.

### Wild Card Coordination
The unified evaluation system prevents coordination blindness by:
- Evaluating all valid placement positions for wild cards
- For each position, evaluating all valid nomination combinations
- Selecting the combination with highest combined strategic value
- Executing placement + nomination in a single coordinated decision

### Game State Consistency
The engine maintains consistency through:
- Total card count validation (always 44 cards)
- Player hand limits and turn state management
- Strategic analysis with threat level assessment
- Comprehensive game state validation

## Working with the Codebase

### Adding New Features
1. Add types to relevant interfaces (`Card.ts`, `Player.ts`, etc.)
2. Implement core logic in appropriate module
3. Update `GameStateAnalyzer` if strategic analysis needed
4. Update `CardPlayEvaluator` if AI decision-making affected
5. Write comprehensive tests including AI behavior verification
6. Run `npm test` and `npm run lint` to ensure quality

### Debugging AI Issues
- Check `AIPlayer` console output for decision reasoning
- Use `GameStateAnalyzer.analyzeGameState()` to inspect strategic evaluation
- Verify disruption opportunities with `findDisruptionOpportunities()`
- Test wild card coordination with `CardPlayEvaluator.evaluateAllPlays()`

### Performance Considerations
- Game state analysis is performed each turn (optimized for <50ms)
- Wild card evaluation explores all valid combinations (typically <100ms)
- Strategic decision-making prioritizes high-value moves first
- Test performance with large hands using existing performance tests

## Recent Git History
```
5568e95 Remove unused methods from AIPlayer class
d88e6bd Refactor ESLint configuration for proper TypeScript support  
43a29f3 Merge pull request #19 from feature/wild-card-nomination-strategy-issue-12
c0fcd56 Improve terminology: Replace 'blocking' with 'disruption' throughout codebase
eaf06b2 Fix critical blocking logic: AI now properly disrupts opponent pieces
```

## Current Status
- **Main branch**: Stable with unified wild card system and correct disruption strategy
- **Active PR #20**: ESLint TypeScript refactor (ready for review)
- **Test status**: All 68 tests passing
- **Code quality**: ESLint clean, TypeScript compilation successful
- **AI behavior**: Properly disrupts opponents, console output shows strategic reasoning