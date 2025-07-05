# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **NPZR Game Engine** - a complete TypeScript implementation of the Ninja Pirate Zombie Robot card game. NPZR is a tactical card game where players build characters (Ninja, Pirate, Zombie, Robot) by collecting body parts (head, torso, legs) while strategically disrupting opponents.

### What NPZR Is
- **44-card tactical game**: 36 character cards + 8 wild cards
- **Character building**: Collect matching head/torso/legs to complete characters
- **Strategic disruption**: Place different characters on opponent stacks to disrupt their progress
- **Wild card mechanics**: Flexible cards that can be nominated as any character/body part
- **AI opponent**: Intelligent computer player with difficulty levels and sophisticated strategy

### Project Scope
The monorepo provides a complete game ecosystem:
- **Pure game logic** (@npzr/core) - Rules, mechanics, game state management
- **AI intelligence** (@npzr/ai) - Strategic opponent with disruption tactics
- **React UI components** (@npzr/ui-react) - Reusable game interface components  
- **Browser debugging** (@npzr/logging) - Development and debugging tools
- **Complete game app** (@npzr/game-ui) - Playable game interface

## Development Commands

### Essential Commands
```bash
npm install          # Install dependencies for all packages
npm run build        # Build all packages in dependency order
npm test             # Run full test suite (117 tests across all packages)
npm run typecheck    # Type checking for all packages
npm run lint         # ESLint code quality checks (TypeScript-aware)
```

### Package-Specific Commands
```bash
npm run build --workspace=@npzr/core     # Build specific package
npm run test --workspace=@npzr/ai        # Test specific package
npm run dev --workspace=@npzr/game-ui    # Start dev server for UI
```

### Testing Commands
```bash
npm run test:watch --workspace=@npzr/ai   # Run tests in watch mode
npm run test:coverage --workspace=@npzr/core  # Run tests with coverage
jest src/AIPlayer.test.ts --workspace=@npzr/ai  # Run specific test file
```

### Code Quality
```bash
npm run lint:fix --workspaces     # Auto-fix ESLint issues across all packages
npm run typecheck --workspaces    # Type check all packages
```

## Game Rules & Mechanics

### NPZR Game Overview
Players compete to complete character sets while disrupting opponents. Each character needs matching head, torso, and legs to score points.

### Core Game Mechanics
- **Characters**: Ninja, Pirate, Zombie, Robot (4 types)
- **Body Parts**: Head, Torso, Legs (3 per character)
- **Deck Composition**: 36 regular cards (3 copies × 4 characters × 3 body parts) + 8 wild cards
- **Stacks**: Each player has multiple stacks (areas) to build characters
- **Defensive Play**: Players can place cards on opponent stacks to disrupt completion

### Wild Card System
- **Character Wilds**: Can be any body part for a specific character
- **Position Wilds**: Can be any character for a specific body part  
- **Universal Wilds**: Can be any character and any body part
- **Nomination**: Wild cards must be nominated when played (specify character/part)
- **Re-nomination**: Cards become wild again when moved to different stacks

### Winning Strategy
- **Complete Characters**: Get matching head/torso/legs for same character
- **Disrupt Opponents**: Place different characters on their existing pieces
- **Stack Management**: Build multiple stacks simultaneously for flexibility
- **Wild Card Optimization**: Use wilds strategically for maximum advantage

## Architecture Overview

### Monorepo Structure
The project uses **npm workspaces** for package management with clear separation of concerns:

```
packages/
├── core/          # Pure game logic and mechanics
├── ai/            # AI intelligence and strategy  
├── logging/       # Environment-aware logging system
├── ui-react/      # React components and hooks
└── game-ui/       # Complete game application
```

### Core Design Pattern
The engine follows a **layered monorepo architecture** with domain-driven design:

**@npzr/core** - Pure game logic: GameEngine, Card, Stack, Player mechanics  
**@npzr/ai** - AI intelligence: Strategic evaluation and opponent disruption  
**@npzr/logging** - Cross-platform logging: Console + browser debug UI  
**@npzr/ui-react** - React components: LoggerProvider, DebugLogger  
**@npzr/game-ui** - Complete application: Game interface with debug tools

### Key Architectural Components

#### 1. Core Game Engine (@npzr/core)
- **GameEngine**: Central coordinator managing players, deck, and game flow
- **Player**: Individual player state with hands, stacks, and scores
- **Card & Deck System**: 44-card deck with wild card nomination mechanics
- **Stack Management**: Player-owned character building areas with defensive play
- **Game phases**: Setup → playing → finished with turn-based mechanics

#### 2. AI Intelligence System (@npzr/ai)
- **AIPlayer**: Main AI controller implementing sophisticated game strategy
- **Strategic Decision Making**: Evaluates all possible moves and selects optimal plays
- **Disruption Strategy**: Actively disrupts opponent progress by targeting existing pieces
- **Wild Card Mastery**: Unified evaluation of placement + nomination for optimal advantage
- **Difficulty Levels**: Easy/Medium/Hard with appropriate strategic randomization
- **GameStateAnalyzer**: Comprehensive analysis of threats, opportunities, and game state
- **CardPlayEvaluator**: Eliminates coordination blindness in wild card decisions

#### 3. Game Logic Implementation
- **Turn Management**: Player turns, card drawing, win condition checking
- **Stack Completion**: Detects when head/torso/legs match for scoring
- **Wild Card Nomination**: Tracks nominations and handles re-nomination when moved
- **Defensive Mechanics**: Allows placement on opponent stacks for disruption
- **Game State Validation**: Ensures consistent state and valid moves
- **Card Management**: Deck shuffling, hand limits, card distribution

#### 4. Development & UI Support (@npzr/ui-react, @npzr/logging, @npzr/game-ui)
- **React Components**: Reusable UI components for game interfaces
- **Debug Tools**: Browser-based logging with real-time updates
- **Development Environment**: Hot reloading, TypeScript support, testing framework
- **Game Application**: Complete playable interface with debug integration

### Package Dependency Flow

```
@npzr/game-ui
    ├── @npzr/ui-react (LoggerProvider, LoggerOutput)
    ├── @npzr/ai (AIPlayer, strategy)
    ├── @npzr/core (GameEngine, game logic)
    └── @npzr/logging (BrowserLogStore, logger)

@npzr/ui-react
    └── @npzr/logging (BrowserLogStore integration)

@npzr/ai  
    ├── @npzr/core (GameEngine, Player interfaces)
    └── @npzr/logging (AI decision logging)

@npzr/core
    └── @npzr/logging (Game event logging)
```

**Critical AI Flow**: AI evaluates all placement+nomination combinations simultaneously to avoid coordination blindness, prioritizing opponent disruption over defensive play.

## Testing Architecture

### Test Organization (130+ tests, ~90%+ coverage)
- **@npzr/core**: 13 integration tests covering end-to-end game scenarios
- **@npzr/ai**: 102 comprehensive tests for AI intelligence, strategy, and difficulty levels
- **@npzr/logging**: 2 tests for winston-free logger functionality
- **@npzr/ui-react**: React component testing (expandable)
- **@npzr/game-ui**: 13 tests with real component integration and test fixtures

### Test Distribution
- **5 packages**: All with independent test suites
- **130+ total tests**: Comprehensive coverage of core functionality
- **AI behavior verification**: Console output validates strategic decisions
- **UI integration testing**: Real component testing with minimal mocking
- **Cross-package integration**: Tests verify workspace dependency resolution

### Test Fixtures and Integration Testing (@npzr/game-ui)

The game-ui package uses **minimal mocking** and **real component integration** for better test reliability. Test fixtures provide clean, realistic test data while avoiding heavy mocking.

#### Test Fixtures Architecture
```
src/test-fixtures/
├── index.ts           # Exports test fixture functions
└── playerFixtures.ts  # createPlayerStateInfo() builder
```

#### Key Testing Patterns

**1. Using Test Fixtures for Real Data**
```typescript
import { createPlayerStateInfo } from '../../test-fixtures';

// Create realistic PlayerStateInfo with overrides for specific test needs
const mockPlayer = createPlayerStateInfo({
  name: 'Test Player',
  score: ['robot', 'pirate'] as CharacterType[],
  state: PlayerStateType.DRAW_CARD,
  isMyTurn: true,
  canDraw: true
});
```

**2. Testing Real Game State Changes with EventBridge**
```typescript
import * as useGameEngine from '../../hooks/useGameEngine';
import { EventBridge } from '../../bridge/EventBridge';

it('triggers game state changes via EventBridge', () => {
  const useGameEngineSpy = jest.spyOn(useGameEngine, 'useGameEngine');
  render(<GamePage />);
  
  // Trigger real game action via EventBridge
  const eventBridge = EventBridge.getInstance();
  act(() => {
    eventBridge.emitToReact('game:deckClick', {cardCount: 44});
  });
  
  // Access real game engine return values
  const gameEngineReturn = useGameEngineSpy.mock.results[useGameEngineSpy.mock.results.length - 1].value;
  expect(gameEngineReturn.currentPlayer?.getName()).toEqual("Human Player");
  expect(gameEngineReturn.currentPlayer?.getState()?.getState()).toEqual(PlayerStateType.PLAY_CARD);
  
  // Verify UI reflects real game state
  const playerStatus = screen.getByTestId('player-status');
  expect(playerStatus).toHaveTextContent(gameEngineReturn.currentPlayer?.getState().getMessage());
});
```

**3. Testing State Transitions to Verify Functionality**
```typescript
it('proves new game functionality works', () => {
  // Start with known state
  expect(playerStatus).toHaveTextContent(/Draw a card from the deck/);
  
  // Trigger state change to prove game is working
  fireEvent.click(drawButton);
  expect(playerStatus).not.toHaveTextContent(/Draw a card from the deck/);
  
  // Trigger reset and verify it actually resets
  fireEvent.click(newGameButton);
  expect(playerStatus).toHaveTextContent(/Draw a card from the deck/);
});
```

**4. Targeting Specific UI Elements in Multi-Player Interface**
```typescript
// Handle multiple player panels by scoping to specific panel
const leftPanel = screen.getByTestId('player-panel-left');
const playerStatus = leftPanel.querySelector('[data-testid="player-status"]');
expect(playerStatus).toHaveTextContent(/expected text/);
```

#### Testing Philosophy
- **Real components over mocks** - Test actual React components with real game state
- **Integration over isolation** - Verify components work together correctly
- **Meaningful assertions** - Test actual functionality, not just presence of elements
- **EventBridge integration** - Use real event system to trigger game state changes
- **Spy on hooks** - Access real hook return values to verify game logic integration

## Recent Major Improvements

### Unified Wild Card System (Issue #12)
**Problem**: Separation of card selection and wild card nomination caused "coordination blindness"  
**Solution**: Created unified `CardPlayEvaluator` system that evaluates all placement+nomination combinations together  
**Result**: Optimal wild card usage with coordinated strategic decisions - AI now makes sophisticated wild card plays

### AI Difficulty Levels (Issue #14)
**Problem**: AI was too predictable and always played optimally  
**Solution**: Implemented DifficultyManager with strategic randomization and skill scaling  
**Result**: Easy/Medium/Hard difficulty levels providing appropriate challenge for different skill levels

### Corrected Disruption Strategy
**Problem**: AI was inadvertently helping opponents complete characters instead of disrupting them  
**Solution**: Fixed `findDisruptionOpportunities()` to target existing pieces for disruption  
**Result**: AI now properly disrupts opponents by placing different characters on their existing pieces

### Monorepo Architecture Migration
**Problem**: Monolithic codebase made it difficult to separate concerns and enable independent development  
**Solution**: Migrated to npm workspaces with clear package boundaries (@npzr/core, @npzr/ai, etc.)  
**Result**: Clean separation enabling independent development of game logic, AI strategy, and UI components

### Enhanced Testing Coverage
**Problem**: Limited test coverage made refactoring risky  
**Solution**: Expanded test suites across all packages with comprehensive AI behavior testing  
**Result**: 117 tests providing confidence in game logic, AI decisions, and cross-package integration

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

## Sprite Sheet Reference

### Character Sprite Coordinates
The sprite sheet (`public/img/sprite-sheet-padded.png`) contains 4 characters × 3 body parts in a uniform grid. Head tiles are trimmed to **max 150px wide × 90px tall** (solid content only, excluding transparent padding).

**Head Tiles (trimmed to match torso/legs height):**
- **Ninja Head**: (x: 20, y: 10, width: 280, height: 190)
- **Pirate Head**: (x: 340, y: 10, width: 280, height: 190)  
- **Zombie Head**: (x: 660, y: 10, width: 280, height: 190)
- **Robot Head**: (x: 980, y: 10, width: 280, height: 190)

**Torso Tiles:**
- **Ninja Torso**: (x: 20, y: 260, width: 280, height: 190)
- **Pirate Torso**: (x: 340, y: 260, width: 280, height: 190)
- **Zombie Torso**: (x: 660, y: 260, width: 280, height: 190)
- **Robot Torso**: (x: 980, y: 260, width: 280, height: 190)

**Legs Tiles:**
- **Ninja Legs**: (x: 20, y: 510, width: 280, height: 190)
- **Pirate Legs**: (x: 340, y: 510, width: 280, height: 190)
- **Zombie Legs**: (x: 660, y: 510, width: 280, height: 190)
- **Robot Legs**: (x: 980, y: 510, width: 280, height: 190)


## Working with the Codebase

### Adding New Features
1. **Choose the right package**: Core logic → @npzr/core, AI behavior → @npzr/ai, UI → @npzr/ui-react
2. **Add types**: Update interfaces in appropriate package  
3. **Implement logic**: Follow existing patterns and architectural boundaries
4. **Update dependencies**: Add cross-package imports as needed  
5. **Write tests**: Comprehensive testing including AI behavior verification
6. **Quality checks**: Run `npm test`, `npm run lint`, and `npm run typecheck`

### Monorepo Development Workflow
1. **Install dependencies**: `npm install` (installs for all packages)
2. **Build order**: Dependencies build automatically in correct order
3. **Package isolation**: Each package has independent scripts and dependencies
4. **Cross-package changes**: Update imports when moving code between packages
5. **Testing**: Tests run independently per package with workspace resolution

### Debugging Across Packages
- **Game logic**: Check @npzr/core for GameEngine and Player state issues
- **AI decisions**: Use @npzr/ai console output and GameStateAnalyzer  
- **UI integration**: Use LoggerProvider in @npzr/ui-react for real-time debugging
- **Logging issues**: Check BrowserLogStore in @npzr/logging
- **Build problems**: Verify package.json dependencies and TypeScript references

### Performance Considerations
- **Workspace builds**: Incremental compilation only rebuilds changed packages
- **Bundle optimization**: Vite tree-shaking eliminates unused cross-package code
- **AI performance**: Game state analysis optimized for <50ms per turn
- **Browser logging**: In-memory log storage with configurable limits

## Recent Git History
```
c6db53c Refactor logger architecture to React-based system
3350682 Implement monorepo architecture with winston-free logging system  
e154284 Implement browser-based debug logging with interactive textarea
5568e95 Remove unused methods from AIPlayer class
d88e6bd Refactor ESLint configuration for proper TypeScript support
43a29f3 Merge pull request #19 from feature/wild-card-nomination-strategy-issue-12
```

## Current Status
- **Main branch**: Stable monorepo with React-based logging architecture
- **Active PR #24**: Logger architecture refactoring (ready for review)  
- **Test status**: All 117 tests passing across 5 packages
- **Code quality**: ESLint clean, TypeScript compilation successful
- **Build system**: Monorepo with workspace dependencies and optimized builds
- **UI integration**: React components with real-time debug logging
- **Browser compatibility**: Winston-free logging works in all environments