# NPZR Game Engine & UI

A complete TypeScript implementation of the **Ninja Pirate Zombie Robot (NPZR)** card game with both a pure game logic engine and a modern React-based user interface with PixiJS canvas integration. This monorepo provides everything needed to play NPZR digitally with sophisticated AI opponents and rich visual gameplay.

## About NPZR

NPZR is a tactical two-player card game where players compete to be the first to build one each of a ninja, pirate, zombie, and robot by collecting matching head, torso, and leg cards for each character.

### Game Features
- **44-card deck** (36 regular + 8 wild cards)
- **Strategic gameplay** with defensive moves and opponent disruption
- **Wild card mechanics** with nomination system
- **Move cascading** system for dynamic gameplay
- **Strategic move system** with new stack creation for optimal organization
- **AI-driven gameplay** with sophisticated decision-making algorithms
- **Modern UI** with React components and PixiJS canvas rendering
- **Character-themed fonts** with unique styling for each warrior type
- **Responsive design** supporting desktop and mobile devices
- **Real-time debugging** with integrated logging system

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+ (comes with Node.js)
- **Modern browser** with WebGL support (for PixiJS canvas rendering)
- **Git** for version control

## Quick Start

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd npzr-ai

# Install dependencies for all packages
npm install

# Build all packages
npm run build

# Run all tests
npm test

# Start the development UI
npm run dev --workspace=@npzr/game-ui
```

### Development Server

The game UI runs on Vite for fast development:

```bash
# Start the UI development server
npm run dev --workspace=@npzr/game-ui

# Open http://localhost:3000 in your browser
# The server will auto-reload on file changes
```

### Basic Usage

```typescript
import { GameEngine, Character, BodyPart } from './src';

// Create a new game
const game = new GameEngine();
game.createGame();

// Get players
const player1 = game.getPlayer('player1');
const player2 = game.getPlayer('player2');

// Play a card to a stack
player1.playCard(card, {
  targetStackId: 'stack1',
  targetPile: BodyPart.Head
});

// Move cards between stacks (two options)

// 1. Move to existing stack
player1.moveCard({
  cardId: 'card-id',
  fromStackId: 'stack1',
  fromPile: BodyPart.Head,
  toStackId: 'stack2',      // Move to existing stack
  toPile: BodyPart.Head
});

// 2. Create new stack (strategic AI feature)
player1.moveCard({
  cardId: 'card-id', 
  fromStackId: 'stack1',
  fromPile: BodyPart.Torso,
  // toStackId omitted - creates new stack automatically
  toPile: BodyPart.Torso
});

// Check game state
console.log(`Game finished: ${game.isGameFinished()}`);
```

## Project Structure

This is a **npm workspaces** monorepo with clean separation of concerns:

```
packages/
├── core/              # Pure game logic and mechanics (@npzr/core)
│   │                  # Game engine, rules, card mechanics, win conditions
│   ├── src/           # Core game implementation
│   └── __tests__/     # Comprehensive test suite
│
├── ai/                # AI intelligence and strategy (@npzr/ai)
│   │                  # Strategic decision-making, difficulty levels, game analysis
│   ├── src/           # AI implementation
│   └── __tests__/     # AI behavior tests
│
├── logging/           # Environment-aware logging system (@npzr/logging)
│   │                  # Winston-free logging that works in browsers and Node.js
│   ├── src/           # Logging implementation
│   └── __tests__/     # Logging tests
│
├── ui-react/          # React components and hooks (@npzr/ui-react)
│   │                  # Reusable React components for logging and debugging
│   ├── src/           # React components and hooks
│   └── __tests__/     # React component tests
│
└── game-ui/           # Complete game application (@npzr/game-ui)
    │                  # Full game interface with React UI and PixiJS canvas
    ├── src/
    │   ├── components/    # React UI components (HUD, controls, layout)
    │   ├── canvas/        # PixiJS application layer (entities, systems, scenes)
    │   ├── bridge/        # React ↔ Canvas communication layer
    │   ├── hooks/         # React hooks for game state and PixiJS
    │   ├── pages/         # Application pages (home, game, rules)
    │   ├── styles/        # CSS and character-themed fonts
    │   ├── types/         # TypeScript definitions
    │   └── utils/         # Utility functions
    └── __tests__/         # UI component tests
```

## API Reference

### NPZRGameEngine

The main class providing the game engine interface.

#### Core Methods

```typescript
// Game state
getGameState(): Readonly<GameState>
getCurrentPlayer(): PlayerId
isGameFinished(): boolean
getWinner(): PlayerId | undefined

// Player information
getPlayerHand(playerId: PlayerId): Card[]
getPlayerScore(playerId: PlayerId): Set<Character>
getDeckSize(): number

// Game actions
playTurn(regularCard: PlayCardAction, wildCards?: PlayCardAction[]): boolean
drawCard(): Card | null
executeMove(moveAction: MoveAction): boolean

// Wild card management
nominateWildCard(card: Card, nomination: CardNomination): boolean

// Utilities
validateGameState(): { valid: boolean; errors: string[] }
clone(): NPZRGameEngine
reset(): void
```

### Core Types

```typescript
enum Character { Ninja, Pirate, Zombie, Robot }
enum BodyPart { Head, Torso, Legs }
enum CardType { Regular, WildCharacter, WildPosition, WildUniversal }

interface Card {
  id: string;
  type: CardType;
  character?: Character;
  bodyPart?: BodyPart;
  nomination?: CardNomination;
  isFastCard: boolean;
}

interface GameState {
  players: [Player, Player];
  currentPlayer: PlayerId;
  deck: Card[];
  stacks: Stack[];
  pendingMoves: number;
  gamePhase: 'setup' | 'playing' | 'finished';
  winner?: PlayerId;
}
```

## Game Rules Summary

### Objective
Be the first player to collect one each of: Ninja, Pirate, Zombie, and Robot.

### Turn Structure
1. **Draw** one card from the deck
2. **Play** one regular card (required)
3. **Play** any number of wild cards (optional, "fast cards")
4. **Execute** any pending moves earned from completions

### Stack Completion
- A stack is completed when head, torso, and legs all match the same character
- Completing any stack earns a **move**
- Moves allow relocating any card between stacks
- Multiple completions can cascade

### Wild Cards
- **Character Wild**: Can be any body part for a specific character
- **Position Wild**: Can be any character for a specific body part  
- **Universal Wild**: Can be any character and any body part
- All wild cards are "fast cards" and must be nominated when played

## Development

### Scripts

```bash
# Root-level commands (all packages)
npm install              # Install dependencies for all packages
npm run build            # Build all packages in dependency order
npm test                 # Run all test suites
npm run typecheck        # Type check all packages
npm run lint             # Lint all packages

# Package-specific commands
npm run build --workspace=@npzr/core          # Build specific package
npm run test --workspace=@npzr/ai             # Test specific package
npm run dev --workspace=@npzr/game-ui         # Start UI dev server

# Development workflows
npm run test:watch --workspace=@npzr/ai       # Watch mode for AI tests
npm run lint:fix --workspaces                 # Auto-fix linting issues
```

### Running Tests

The project includes comprehensive test coverage across all packages:

```bash
# Run all tests
npm test

# Run tests for specific packages
npm test --workspace=@npzr/core    # Core game logic
npm test --workspace=@npzr/ai      # AI behavior
npm test --workspace=@npzr/logging # Logging system
npm test --workspace=@npzr/game-ui # UI components

# Coverage reports
npm run test:coverage --workspace=@npzr/core
```

### Test Coverage

The test suite covers:

#### @npzr/core
- ✅ Deck creation and card management
- ✅ Game initialization and state management  
- ✅ Stack and pile operations
- ✅ Wild card mechanics
- ✅ Move system and cascading
- ✅ Turn management and validation
- ✅ Win conditions and game completion

#### @npzr/ai
- ✅ AI decision-making algorithms
- ✅ Game state analysis and threat detection
- ✅ Card play evaluation and wild card strategies
- ✅ Difficulty level implementation
- ✅ Strategic disruption tactics

#### @npzr/game-ui
- ✅ React component rendering and interactions
- ✅ Game state management with useReducer
- ✅ PixiJS canvas integration (with mocks)
- ✅ Character font utilities and theming
- ✅ Responsive design and keyboard shortcuts

#### @npzr/logging
- ✅ Browser log storage functionality
- ✅ Winston-free logger compatibility

### Architecture Highlights

#### Canvas Architecture (game-ui)
The UI features a scalable **dual-layer architecture**:

- **React Layer**: Components, state management, user interactions
- **Canvas Layer**: PixiJS entities, systems, scenes for rich gameplay
- **Bridge Layer**: Event-driven communication between React and Canvas

```typescript
// Canvas to React communication
eventBridge.emitToReact('game:deckClick', { cardCount: 30 });

// React to Canvas communication  
eventBridge.emitToCanvas('ui:updateDeck', { cardCount: 29 });
```

#### Character Theming System
Each NPZR character has unique visual styling:

- **Ninja**: Impact font (bold, sharp)
- **Pirate**: Dancing Script (cursive)
- **Zombie**: Creepster (horror)
- **Robot**: DS-Digital (7-segment LCD)

#### AI Intelligence
Sophisticated AI with multiple difficulty levels:
- **Easy**: 30% strategic randomization
- **Medium**: 15% strategic randomization  
- **Hard**: 5% strategic randomization
- **Unified wild card evaluation** prevents coordination blindness

### Code Quality

- **TypeScript**: Strict mode with comprehensive type safety
- **ESLint**: Code quality and consistency enforcement
- **Jest + React Testing Library**: Comprehensive testing framework
- **PixiJS v8**: Latest canvas rendering with proper lifecycle management
- **High test coverage** across all critical functionality

## Useful Development Information

### Project Philosophy
This project demonstrates **AI-assisted development** with clean architecture:
- **Domain-driven design** with clear package boundaries
- **Test-driven development** with comprehensive coverage
- **Type-safe development** with strict TypeScript
- **Component-based UI** with React and PixiJS integration

### Key Design Decisions

#### Monorepo Architecture
- **Independent packages** that can be developed separately
- **Clear dependencies** with @npzr/core as the foundation
- **Shared tooling** for consistent development experience

#### Canvas vs DOM
- **React components** handle UI state and user interactions
- **PixiJS canvas** handles game rendering and animations
- **Event bridge** maintains loose coupling between layers

#### Character-Based Scoring
NPZR uses **character completion tracking** (N/P/Z/R letters) rather than numerical points, which is reflected throughout the UI system.

### Extending the Application

#### Adding New Canvas Entities
```typescript
// 1. Create entity class
export class CardSprite extends PIXI.Sprite implements IEntity {
  // Implementation
}

// 2. Add to scene
scene.addCard(cardSprite);

// 3. Register interactions
interactionSystem.enableDrag(cardSprite);
```

#### Adding New UI Components
```typescript
// 1. Create component with character theming
const NewComponent: React.FC = () => {
  const characterClass = getCharacterFontClass('ninja');
  return <div className={characterClass}>Content</div>;
};

// 2. Add comprehensive tests
describe('NewComponent', () => {
  it('renders correctly', () => {
    render(<NewComponent />);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});
```

### Debugging Tips

#### Canvas Layer
- Enable **development mode** to see debug information
- Use **browser dev tools** to inspect PixiJS objects
- Check **event bridge communications** in console

#### React Layer  
- Use **React DevTools** to inspect component state
- Enable **LoggerOutput** component for real-time debugging
- Check **useGameState** for game logic issues

### Performance Considerations
- **PixiJS objects** are pooled where possible
- **Event listeners** are properly cleaned up
- **Canvas updates** use requestAnimationFrame
- **React renders** are optimized with useCallback/useMemo

## Contributing

This project was built as an AI-assisted implementation. To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with comprehensive tests
4. Ensure all tests pass: `npm test`
5. Ensure code quality: `npm run lint` and `npm run typecheck`
6. Update documentation if needed
7. Submit a pull request with clear description

### Pull Request Guidelines
- **Describe the change** and its motivation
- **Include test coverage** for new functionality
- **Follow existing patterns** and architecture
- **Update README** if adding new features or changing workflows

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- Original NPZR game design by Zen Zombie Games (2010)
- Implementation built with Claude AI assistance
- TypeScript and modern development tooling
