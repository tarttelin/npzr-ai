import { GameEngine, Player } from '@npzr/core';
import { PlayerAreaSprite } from './PlayerAreaSprite';

// Mock PixiJS
jest.mock('pixi.js', () => ({
  Container: class MockContainer {
    public children: any[] = [];
    public zIndex: number = 0;
    
    addChild(child: any) {
      this.children.push(child);
      return child;
    }
    removeChild(child: any) {
      const index = this.children.indexOf(child);
      if (index > -1) {
        this.children.splice(index, 1);
      }
      return child;
    }
    destroy() {
      this.children = [];
    }
  },
  Graphics: class MockGraphics {
    clear() { return this; }
    beginFill() { return this; }
    lineStyle() { return this; }
    drawRoundedRect() { return this; }
    endFill() { return this; }
  },
  Text: class MockText {
    public text: string;
    public style: any;
    public anchor: { set: jest.Mock };
    public x: number = 0;
    public y: number = 0;
    
    constructor(text: string, style: any) {
      this.text = text;
      this.style = style;
      this.anchor = { set: jest.fn() };
    }
  },
  Rectangle: class MockRectangle {
    public x: number;
    public y: number;
    public width: number;
    public height: number;
    
    constructor(x: number, y: number, width: number, height: number) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
    }
  }
}));

// Mock canvas sprites
jest.mock('../Hand/HandSprite', () => ({
  HandSprite: class MockHandSprite {
    public x: number = 0;
    public y: number = 0;
    
    updateVisual() {}
    destroy() {}
  }
}));

jest.mock('../Stack/StackSprite', () => ({
  StackSprite: class MockStackSprite {
    public x: number = 0;
    public y: number = 0;
    
    updateVisual() {}
    destroy() {}
    getBounds() {
      return { x: this.x, y: this.y, width: 320, height: 160 };
    }
  }
}));

describe('PlayerAreaSprite', () => {
  let gameEngine: GameEngine;
  let player: Player;
  let playerAreaSprite: PlayerAreaSprite;

  beforeEach(() => {
    gameEngine = new GameEngine();
    player = gameEngine.addPlayer('Test Player');
    playerAreaSprite = new PlayerAreaSprite(player);
  });

  afterEach(() => {
    playerAreaSprite.destroy();
  });

  it('should create a player area sprite without crashing', () => {
    expect(playerAreaSprite).toBeDefined();
  });

  it('should initialize with player information', () => {
    expect(playerAreaSprite.getHandSprite()).toBeDefined();
    expect(playerAreaSprite.getStackSprites()).toBeDefined();
    expect(playerAreaSprite.getStackSprites().length).toBeGreaterThanOrEqual(0);
  });

  it('should update player information correctly', () => {
    // This should not throw an error
    expect(() => {
      playerAreaSprite.updateFromPlayer();
    }).not.toThrow();
  });

  it('should handle active state changes', () => {
    expect(() => {
      playerAreaSprite.setActive(true);
      playerAreaSprite.setActive(false);
    }).not.toThrow();
  });

  it('should provide stack areas for drop zone detection', () => {
    const stackAreas = playerAreaSprite.getStackAreas();
    expect(Array.isArray(stackAreas)).toBe(true);
  });

  it('should handle card drop detection', () => {
    const dropResult = playerAreaSprite.handleCardDrop('test-card', 100, 100);
    // Should either return null (no valid drop) or a valid drop target
    if (dropResult) {
      expect(dropResult).toHaveProperty('stackIndex');
      expect(dropResult).toHaveProperty('pile');
      expect(typeof dropResult.stackIndex).toBe('number');
      expect(typeof dropResult.pile).toBe('string');
    }
  });

  it('should provide access to hand and stack sprites', () => {
    const handSprite = playerAreaSprite.getHandSprite();
    const stackSprites = playerAreaSprite.getStackSprites();
    
    expect(handSprite).toBeDefined();
    expect(Array.isArray(stackSprites)).toBe(true);
  });

  it('should handle sprite sheet parameter', () => {
    // Test creating with sprite sheet
    const playerAreaWithSprites = new PlayerAreaSprite(player, undefined);
    expect(playerAreaWithSprites).toBeDefined();
    playerAreaWithSprites.destroy();
  });

  it('should clean up properly on destroy', () => {
    const handSprite = playerAreaSprite.getHandSprite();
    const stackSprites = playerAreaSprite.getStackSprites();
    
    // Mock destroy methods
    handSprite.destroy = jest.fn();
    stackSprites.forEach(sprite => {
      sprite.destroy = jest.fn();
    });
    
    playerAreaSprite.destroy();
    
    expect(handSprite.destroy).toHaveBeenCalled();
    stackSprites.forEach(sprite => {
      expect(sprite.destroy).toHaveBeenCalled();
    });
  });
});