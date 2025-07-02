# Canvas Architecture

This directory contains the PixiJS-based canvas architecture for the NPZR game UI. The architecture is designed to be scalable, maintainable, and provide clear separation of concerns between React components and canvas functionality.

## Architecture Overview

```
canvas/
├── core/           # Core application management
├── entities/       # Game objects and sprites
├── systems/        # Game systems (interaction, animation, etc.)
├── scenes/         # Game scenes/states
├── assets/         # Asset management
└── utils/          # Canvas-specific utilities
```

## Core Components

### Application (`core/Application.ts`)
- Main PixiJS application wrapper
- Manages canvas lifecycle and provides clean interface
- Handles initialization, resizing, and cleanup

### Entities (`entities/`)
Game objects that represent visual elements:
- **DeckSprite**: The deck of cards with interaction
- **CardSprite**: Individual cards (future)
- **StackSprite**: Card stacks (future)
- **PlayerAreaSprite**: Player areas (future)

### Systems (`systems/`)
Game systems that manage functionality:
- **InteractionSystem**: Mouse/touch interaction handling
- **AnimationSystem**: Animation management (future)
- **SoundSystem**: Audio management (future)
- **LayoutSystem**: Responsive layout (future)

### Scenes (`scenes/`)
Game scenes that organize entities:
- **GameplayScene**: Main game scene with all game objects
- **MenuScene**: Menu/lobby scene (future)
- **TransitionScene**: Scene transitions (future)

## Event Communication

The canvas layer communicates with React components through the **EventBridge**:

```typescript
// Canvas to React
eventBridge.emitToReact('game:deckClick', { cardCount: 30 });

// React to Canvas
eventBridge.emitToCanvas('ui:updateDeck', { cardCount: 29 });
```

## Usage Examples

### Basic Setup
```typescript
import { CanvasApplication, GameplayScene } from '@/canvas';

const app = new CanvasApplication();
await app.init(container, 800, 600);

const scene = new GameplayScene(app);
app.addToStage(scene);
```

### Adding Interactions
```typescript
const interactionSystem = scene.getInteractionSystem();

// Enable dragging
interactionSystem.enableDrag(cardSprite);

// Add click handler
interactionSystem.addClickHandler(deckSprite, (event) => {
  console.log('Deck clicked!');
});
```

### Event Bridge Usage
```typescript
import { EventBridge } from '@/bridge/EventBridge';

const eventBridge = EventBridge.getInstance();

// Listen for canvas events in React
eventBridge.onCanvasEvent('game:deckClick', (data) => {
  console.log('Deck clicked with', data.cardCount, 'cards');
});

// Send commands to canvas from React
eventBridge.emitToCanvas('ui:updateDeck', { cardCount: 25 });
```

## Entity Development

### Creating New Entities
1. Extend PIXI.DisplayObject or appropriate base class
2. Implement the IEntity interface
3. Add to appropriate scene
4. Register interactions if needed

```typescript
export class CardSprite extends PIXI.Sprite implements IEntity {
  constructor(cardData: CardData) {
    super();
    this.setupVisual(cardData);
    this.setupInteractions();
  }

  update(deltaTime: number): void {
    // Update logic
  }

  destroy(): void {
    this.removeAllListeners();
    super.destroy();
  }
}
```

### System Development

Systems manage cross-cutting concerns:

```typescript
export class AnimationSystem implements ISystem {
  private tweens: Map<string, any> = new Map();

  update(deltaTime: number): void {
    // Update all active animations
  }

  createTween(target: any, properties: any, config: AnimationConfig): string {
    // Create and manage animations
  }

  destroy(): void {
    // Cleanup
  }
}
```

## Migration from Old Architecture

The old `pixiUtils.ts` functions are deprecated but maintained for backward compatibility:

- `createPixiApp()` → `CanvasApplication`
- `createDeckPlaceholder()` → `DeckSprite`
- `calculateCanvasSize()` → `canvas/utils/Math`

## Performance Considerations

- Use object pooling for frequently created/destroyed entities
- Batch graphics operations where possible
- Use sprites for static content, Graphics for dynamic shapes
- Implement efficient update loops with delta time
- Consider using `eventMode: 'passive'` for non-interactive objects

## Future Extensions

The architecture is designed to easily support:
- Card animations and tweening
- Particle effects
- Sound integration
- Advanced interaction patterns
- Scene management and transitions
- Asset loading and management
- Mobile touch optimizations

## Best Practices

1. **Entity Encapsulation**: Keep entity logic self-contained
2. **Event-Driven**: Use events for loose coupling
3. **Resource Management**: Always clean up resources in destroy()
4. **Performance**: Profile and optimize rendering bottlenecks
5. **Type Safety**: Use TypeScript interfaces for all interactions
6. **Testing**: Mock PixiJS objects for unit testing