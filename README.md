# NPZR Game Engine

A complete TypeScript implementation of the **Ninja Pirate Zombie Robot (NPZR)** card game rules engine, built with AI assistance. This project provides a pure game logic implementation with comprehensive testing and no UI dependencies.

## About NPZR

NPZR is a tactical two-player card game where players compete to be the first to build one each of a ninja, pirate, zombie, and robot by collecting matching head, torso, and leg cards for each character.

### Game Features
- **44-card deck** (36 regular + 8 wild cards)
- **Strategic gameplay** with defensive moves
- **Wild card mechanics** with nomination system
- **Move cascading** system for dynamic gameplay
- **Fast cards** allowing additional plays per turn

## Quick Start

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd npzr-ai

# Install dependencies
npm install

# Run tests
npm test

# Build the project
npm run build
```

### Basic Usage

```typescript
import { NPZRGameEngine, Character, BodyPart } from './src';

// Create a new game
const game = new NPZRGameEngine();

// Get current player's hand
const hand = game.getPlayerHand('player1');
console.log(`Player 1 has ${hand.length} cards`);

// Play a turn (example)
const regularCard = hand[0];
const success = game.playTurn({
  card: regularCard,
  targetStackId: undefined // Creates new stack
});

// Check game state
console.log(`Current player: ${game.getCurrentPlayer()}`);
console.log(`Pending moves: ${game.getPendingMoves()}`);
console.log(`Game finished: ${game.isGameFinished()}`);
```

## Project Structure

```
src/
├── types.ts          # Core type definitions and interfaces
├── deck.ts           # Deck creation and card utilities
├── game.ts           # Game initialization and state management
├── stacks.ts         # Stack and pile operations
├── turns.ts          # Turn management and card playing
├── moves.ts          # Move system and cascading logic
├── wildcards.ts      # Wild card nomination mechanics
├── engine.ts         # Main game engine API
├── index.ts          # Public exports
└── __tests__/        # Comprehensive test suite
    ├── deck.test.ts
    ├── game.test.ts
    └── engine.test.ts
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
npm run build        # Compile TypeScript
npm run test         # Run test suite
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run typecheck    # Run TypeScript type checking
```

### Testing

The project includes comprehensive tests covering:
- ✅ Deck creation and card management
- ✅ Game initialization and state management
- ✅ Stack and pile operations
- ✅ Wild card mechanics
- ✅ Move system and cascading
- ✅ Turn management and validation
- ✅ Win conditions and game completion

Run tests with: `npm test`

### Code Quality

- **TypeScript**: Strict mode with comprehensive type safety
- **ESLint**: Code quality and consistency enforcement
- **Jest**: Test framework with coverage reporting
- **40%+ test coverage** across all modules

## Contributing

This project was built as an AI-assisted implementation. To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Ensure all tests pass: `npm test`
5. Ensure code quality: `npm run lint`
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- Original NPZR game design by Zen Zombie Games (2010)
- Implementation built with Claude AI assistance
- TypeScript and modern development tooling
