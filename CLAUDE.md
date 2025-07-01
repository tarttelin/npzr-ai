# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **NPZR Game Engine** - a TypeScript monorepo implementation of the Ninja Pirate Zombie Robot card game. The project provides a complete ecosystem including pure game logic, AI intelligence, React UI components, and browser-based debugging tools, featuring a 44-card tactical game system with wild cards, stack management, and AI-driven opponent disruption mechanics.

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
- **AIPlayer**: Main AI controller with difficulty levels and strategic decision-making
- **CardPlayEvaluator**: Unified wild card placement+nomination evaluation (eliminates coordination blindness)
- **GameStateAnalyzer**: Strategic analysis of game state, opportunities, and threats
- **DifficultyManager**: Configurable AI skill levels with strategic randomization
- **Disruption Strategy**: AI actively disrupts opponent progress instead of helping completion

#### 3. Logging System (@npzr/logging)
- **Environment-aware logger**: Console output for Node.js, browser debugging for web
- **BrowserLogStore**: In-memory log storage with React integration
- **Simple architecture**: No external dependencies, winston-free implementation
- **Cross-platform**: Works in Node.js tests, browser applications, and React components

#### 4. React UI Components (@npzr/ui-react)
- **LoggerProvider**: React Context for managing logging state across components
- **LoggerOutput**: Toggleable textarea component with filtering and auto-scroll
- **DebugLogger**: Backward-compatible wrapper component
- **useLogger hook**: Context hook for accessing logging functionality
- **Browser integration**: Subscribes to BrowserLogStore for real-time log updates

#### 5. Game Application (@npzr/game-ui)
- **Complete game interface**: React-based UI for playing NPZR
- **Debug integration**: Built-in logger with Ctrl+Shift+L toggle
- **Vite-powered**: Fast development and optimized production builds
- **Skeleton implementation**: Ready for game UI expansion

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

### Test Organization (117 tests, ~90%+ coverage)
- **@npzr/core**: 13 integration tests covering end-to-end game scenarios
- **@npzr/ai**: 102 comprehensive tests for AI intelligence, strategy, and difficulty levels
- **@npzr/logging**: 2 tests for winston-free logger functionality
- **@npzr/ui-react**: React component testing (expandable)
- **@npzr/game-ui**: No tests yet (skeleton application)

### Test Distribution
- **5 packages**: All with independent test suites
- **117 total tests**: Comprehensive coverage of core functionality
- **AI behavior verification**: Console output validates strategic decisions
- **Cross-package integration**: Tests verify workspace dependency resolution

## Recent Major Improvements

### Monorepo Architecture Migration
**Problem**: Monolithic codebase made it difficult to separate UI from game logic  
**Solution**: Migrated to npm workspaces with clear package boundaries  
**Result**: Clean separation allowing independent development of game logic, AI, UI, and logging

### React-Based Logging System
**Problem**: DOM manipulation logging system was hard to integrate with React  
**Solution**: Created LoggerProvider context with React components for debugging  
**Result**: Seamless React integration with real-time log updates and toggleable UI

### Winston-Free Logging Implementation
**Problem**: Winston dependency caused browser compatibility issues  
**Solution**: Replaced with simple console-based logger and BrowserLogStore  
**Result**: Zero external dependencies, works in Node.js and browser environments

### Unified Wild Card System (Issue #12)
**Problem**: Separation of card selection and wild card nomination caused "coordination blindness"  
**Solution**: Created unified `CardPlayEvaluator` system that evaluates all placement+nomination combinations together  
**Result**: Optimal wild card usage with coordinated strategic decisions

### AI Difficulty Levels (Issue #14)
**Problem**: AI was too predictable and always played optimally  
**Solution**: Implemented DifficultyManager with strategic randomization  
**Result**: Easy/Medium/Hard difficulty levels with appropriate challenge scaling

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