import * as PIXI from 'pixi.js';
import { Card } from '@npzr/core';
import { CardSprite } from './CardSprite';

export interface HandContainerOptions {
  x?: number;
  y?: number;
  playerName?: string;
  spriteSheet?: PIXI.Texture;
  makeCardsDraggable?: boolean;
}

export interface PlayerHandData {
  name: string;
  handSize: number;
  handCards?: Card[];
}

/**
 * Reusable hand container sprite for displaying player hands
 */
export class HandContainerSprite extends PIXI.Container {
  private options: HandContainerOptions;
  private handLabel!: PIXI.Text;
  private cardsContainer!: PIXI.Container;
  private cardDragHandler?: (cardContainer: PIXI.Container, card: Card) => void;

  constructor(options: HandContainerOptions = {}) {
    super();
    this.options = options;
    
    this.createHandContainer();
    
    if (options.x !== undefined) this.x = options.x;
    if (options.y !== undefined) this.y = options.y;
  }

  /**
   * Set up the card dragging handler
   */
  setCardDragHandler(handler: (cardContainer: PIXI.Container, card: Card) => void): void {
    this.cardDragHandler = handler;
  }

  /**
   * Create the visual hand container
   */
  private createHandContainer(): void {
    // Clear any existing content
    this.removeChildren();

    // Create hand label
    this.handLabel = new PIXI.Text({
      text: this.options.playerName ? `${this.options.playerName}'s Hand:` : 'Your Hand:',
      style: {
        fontFamily: 'Arial',
        fontSize: 16,
        fill: 0xFFFFFF,
        fontWeight: 'bold'
      }
    });
    this.handLabel.x = 0;
    this.handLabel.y = -30; // Above the cards
    this.addChild(this.handLabel);

    // Create container for the actual cards
    this.cardsContainer = new PIXI.Container();
    this.cardsContainer.x = 0;
    this.cardsContainer.y = 0;
    this.addChild(this.cardsContainer);
  }

  /**
   * Update the hand display with new player data
   */
  updateHand(playerData: PlayerHandData): void {
    // Clear existing cards
    this.cardsContainer.removeChildren();
    
    // Use actual card data if available
    if (playerData.handCards && playerData.handCards.length > 0) {
      playerData.handCards.forEach((card: Card, index: number) => {
        // Create CardSprite for normal-sized cards in the hand
        const cardSprite = new CardSprite(card, {
          size: 'normal',
          spriteSheet: this.options.spriteSheet,
          makeInteractive: this.options.makeCardsDraggable || false
        });
        
        // Position the card with spacing
        cardSprite.x = index * 90; // 80px card + 10px spacing
        
        // Apply drag handler if provided
        if (this.cardDragHandler && this.options.makeCardsDraggable) {
          this.cardDragHandler(cardSprite, card);
        }
        
        this.cardsContainer.addChild(cardSprite);
      });
    }
  }

  /**
   * Update the hand label
   */
  updateLabel(playerName: string): void {
    this.handLabel.text = `${playerName}'s Hand:`;
  }

  /**
   * Get the number of cards currently displayed
   */
  getCardCount(): number {
    return this.cardsContainer.children.length;
  }

  /**
   * Clear all cards from the hand
   */
  clearHand(): void {
    this.cardsContainer.removeChildren();
  }

  /**
   * Update sprite sheet for future card rendering
   */
  updateSpriteSheet(spriteSheet: PIXI.Texture | undefined): void {
    this.options.spriteSheet = spriteSheet;
  }
}