# Browser Debug Logging

The NPZR Game Engine includes a comprehensive browser-based debug logging system designed for in-browser game development and debugging.

## Features

### 🎛️ **Interactive Debug Console**
- **Toggle Visibility**: Show/hide with `Ctrl+Shift+L` or programmatically
- **Resizable Window**: Fixed position in top-right corner
- **Real-time Updates**: See logs as they happen

### 🔍 **Log Level Filtering**
- **Debug**: Detailed development information
- **Info**: General game events and state changes  
- **Warn**: Potential issues and warnings
- **Error**: Critical errors and exceptions

### 📜 **Advanced Controls**
- **Auto-scroll**: Automatically scroll to newest logs
- **Clear Logs**: Remove all logged messages
- **Visual Indicators**: Color-coded log levels with emoji icons
- **Metadata Display**: Structured data alongside log messages

## Quick Start

### 1. Initialize the Debug Logger

```typescript
import { initializeBrowserDebugLogger, logger } from 'npzr-game-engine';

// Initialize once when your game starts
const debugLogger = initializeBrowserDebugLogger();

// The debug logger is now ready to use
logger.info('Game initialized', { players: 2, mode: 'classic' });
```

### 2. Use Throughout Your Game

```typescript
// Game events
logger.info('Player joined', { playerId: 'player1', name: 'Alice' });
logger.info('Game started', { gameId: '12345', difficulty: 'hard' });

// AI decisions
logger.info('AI (🔥 Hard): Playing card Ninja Head', {
  action: 'play_card',
  difficulty: 'hard',
  cardType: 'regular',
  reasoning: 'Complete stack',
  value: 1200
});

// Warnings
logger.warn('Player taking too long', { 
  timeRemaining: 10, 
  action: 'play_card' 
});

// Errors
logger.error('Invalid move attempted', { 
  move: 'play_invalid_card', 
  reason: 'Card not in hand',
  cardId: 'invalid123' 
});

// Debug information
logger.debug('Game state analysis', {
  myStacks: 3,
  opponentStacks: 2,
  handSize: 5,
  phase: 'playing'
});
```

### 3. Player Controls

Players can control the debug logger in several ways:

**Keyboard Shortcut:**
- `Ctrl+Shift+L` - Toggle debug logger visibility

**Programmatic Control:**
```typescript
debugLogger.show();    // Show debug console
debugLogger.hide();    // Hide debug console  
debugLogger.toggle();  // Toggle visibility
```

## Debug Console Interface

### Header Controls

| Control | Function | Description |
|---------|----------|-------------|
| **Level Selector** | Filter logs | Choose minimum log level to display |
| **📜 Auto-scroll** | Toggle auto-scroll | Automatically scroll to newest logs |
| **🗑️ Clear** | Clear logs | Remove all logged messages |
| **✕ Close** | Hide console | Close the debug console |

### Log Display

Each log entry shows:
- **Timestamp**: When the log was created
- **Level Icon**: Visual indicator (🔴 Error, 🟡 Warn, 🔵 Info, 🟣 Debug)
- **Level Text**: Log level in uppercase
- **Message**: The main log message
- **Metadata**: Additional structured data (if provided)

Example log entry:
```
[2025-07-01 10:30:45] 🔵 INFO: AI (🔥 Hard): Playing card Ninja Head {"action":"play_card","difficulty":"hard","value":1200}
```

## Log Level Guidelines

### When to Use Each Level

**🟣 Debug (`logger.debug`)**
- Internal game state
- Algorithm decisions
- Performance metrics
- Development-only information

```typescript
logger.debug('Stack analysis complete', {
  stackCount: 3,
  completionOpportunities: 2,
  disruptionThreats: 1,
  analysisTime: '12ms'
});
```

**🔵 Info (`logger.info`)**
- Game events
- Player actions
- AI moves
- State transitions

```typescript
logger.info('Player completed stack', {
  player: 'human',
  character: 'Ninja',
  score: 1,
  totalScore: 2
});
```

**🟡 Warn (`logger.warn`)**
- Potential issues
- Performance warnings
- Unusual but valid states

```typescript
logger.warn('Player taking too long', {
  timeRemaining: 5,
  maxTime: 30,
  action: 'move_card'
});
```

**🔴 Error (`logger.error`)**
- Invalid operations
- System errors
- Critical failures

```typescript
logger.error('Failed to validate move', {
  move: 'invalid_move',
  reason: 'Card not in hand',
  cardId: 'card123',
  playerId: 'player1'
});
```

## Best Practices

### 1. Structured Logging

Always include relevant metadata:

```typescript
// Good
logger.info('AI move executed', {
  action: 'play_card',
  difficulty: 'hard',
  cardId: 'ninja_head_1',
  targetStack: 'stack_2',
  value: 850,
  reasoning: 'Complete opponent disruption'
});

// Avoid
logger.info('AI played a card');
```

### 2. Consistent Naming

Use consistent action names and metadata keys:

```typescript
// Consistent action names
logger.info('Card played', { action: 'play_card', ... });
logger.info('Card moved', { action: 'move_card', ... });
logger.info('Wild nominated', { action: 'nominate_wild', ... });

// Consistent metadata keys
{ playerId: 'player1', difficulty: 'hard', cardId: 'ninja_head_1' }
```

### 3. Performance Considerations

The debug logger is optimized for browser use:
- Logs are stored in memory (max 1000 entries)
- Automatic cleanup of old logs
- Minimal performance impact when hidden
- Only processes logs at current filter level

### 4. Production Deployment

In production builds:
- Debug logs are automatically filtered out
- Only warnings and errors are captured
- Console remains available for critical debugging
- No visual debug console in production

## Integration Examples

### React Integration

```typescript
import { useEffect } from 'react';
import { initializeBrowserDebugLogger, logger } from 'npzr-game-engine';

function GameComponent() {
  useEffect(() => {
    // Initialize debug logger
    const debugLogger = initializeBrowserDebugLogger();
    
    // Log component mount
    logger.info('Game component mounted', { 
      timestamp: Date.now(),
      component: 'GameComponent' 
    });

    return () => {
      logger.debug('Game component unmounting');
    };
  }, []);

  const handlePlayerMove = (move) => {
    logger.info('Player move attempted', { 
      move: move.type,
      player: 'human',
      valid: validateMove(move)
    });
  };

  // ... rest of component
}
```

### Vue Integration

```typescript
import { onMounted, onUnmounted } from 'vue';
import { initializeBrowserDebugLogger, logger } from 'npzr-game-engine';

export default {
  setup() {
    onMounted(() => {
      const debugLogger = initializeBrowserDebugLogger();
      logger.info('Vue game component ready');
    });

    onUnmounted(() => {
      logger.debug('Vue game component destroyed');
    });

    const playCard = (card) => {
      logger.info('Card play initiated', {
        cardId: card.id,
        player: 'human',
        timestamp: Date.now()
      });
    };

    return { playCard };
  }
};
```

## Demo

See the complete demo at `examples/browser-debug-demo.html` for a working example of all features.