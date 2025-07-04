import * as PIXI from 'pixi.js';
import { Hand, Card } from '@npzr/core';
import { CardSprite } from '../Card/CardSprite';
import { Z_LAYERS } from '../../utils/Constants';

/**
 * Hand configuration
 */
export const HAND_CONFIG = {
  CARD_SPACING: 110, // Space between cards in hand
  CARD_OVERLAP: 20, // Overlap when hand has many cards
  MAX_WIDTH: 600, // Maximum width before cards start overlapping
  HOVER_LIFT: 20, // How much cards lift on hover
  ANIMATION_DURATION: 300,
} as const;

/**
 * HandSprite represents a player's hand of cards
 */
export class HandSprite extends PIXI.Container {
  private hand: Hand;
  private cardSprites: Map<string, CardSprite> = new Map();
  private spriteSheet?: PIXI.Texture;
  private hoveredCard: CardSprite | null = null;
  private maxWidth: number;

  constructor(hand: Hand, maxWidth = HAND_CONFIG.MAX_WIDTH, spriteSheet?: PIXI.Texture) {
    super();
    
    this.hand = hand;
    this.maxWidth = maxWidth;
    this.spriteSheet = spriteSheet;
    this.zIndex = Z_LAYERS.HAND;
    
    this.updateVisual();
  }

  /**
   * Update visual representation based on hand state
   */
  updateVisual(): void {
    // Clear existing card sprites
    this.cardSprites.forEach(sprite => {
      sprite.destroy();
    });
    this.cardSprites.clear();

    const cards = this.hand.getCards();
    if (cards.length === 0) return;

    // Calculate card spacing based on hand size and available width
    const spacing = this.calculateCardSpacing(cards.length);
    const totalWidth = (cards.length - 1) * spacing;
    const startX = -totalWidth / 2; // Center the hand

    // Create and position card sprites
    cards.forEach((card, index) => {
      const cardSprite = new CardSprite(card, this.spriteSheet);
      
      // Position card
      cardSprite.x = startX + (index * spacing);
      cardSprite.y = 0;
      
      // Set up card interactions
      this.setupCardInteractions(cardSprite);
      
      this.addChild(cardSprite);
      this.cardSprites.set(card.id, cardSprite);
    });
  }

  /**
   * Calculate optimal card spacing
   */
  private calculateCardSpacing(cardCount: number): number {
    if (cardCount <= 1) return 0;
    
    const idealSpacing = HAND_CONFIG.CARD_SPACING;
    const maxSpacing = this.maxWidth / (cardCount - 1);
    
    // Use ideal spacing unless it would exceed max width
    return Math.min(idealSpacing, maxSpacing);
  }

  /**
   * Setup interactions for a card sprite
   */
  private setupCardInteractions(cardSprite: CardSprite): void {
    cardSprite.on('pointerover', () => {
      this.onCardHover(cardSprite);
    });
    
    cardSprite.on('pointerout', () => {
      this.onCardHoverEnd(cardSprite);
    });
    
    cardSprite.on('card:dragStart', (data) => {
      this.onCardDragStart(cardSprite, data);
    });
    
    cardSprite.on('card:dragMove', (data) => {
      this.emit('card:dragMove', data);
    });
    
    cardSprite.on('card:dragEnd', (data) => {
      this.onCardDragEnd(cardSprite, data);
    });
  }

  /**
   * Handle card hover
   */
  private onCardHover(cardSprite: CardSprite): void {
    if (this.hoveredCard && this.hoveredCard !== cardSprite) {
      this.resetCardPosition(this.hoveredCard);
    }
    
    this.hoveredCard = cardSprite;
    
    // Lift card on hover
    cardSprite.y = -HAND_CONFIG.HOVER_LIFT;
    cardSprite.zIndex = Z_LAYERS.HAND + 1;
    
    this.emit('hand:cardHover', { card: cardSprite.getCard(), handSprite: this });
  }

  /**
   * Handle card hover end
   */
  private onCardHoverEnd(cardSprite: CardSprite): void {
    if (this.hoveredCard === cardSprite) {
      this.hoveredCard = null;
    }
    
    this.resetCardPosition(cardSprite);
    
    this.emit('hand:cardHoverEnd', { card: cardSprite.getCard(), handSprite: this });
  }

  /**
   * Reset card to original position
   */
  private resetCardPosition(cardSprite: CardSprite): void {
    cardSprite.y = 0;
    cardSprite.zIndex = Z_LAYERS.HAND;
  }

  /**
   * Handle card drag start
   */
  private onCardDragStart(cardSprite: CardSprite, data: any): void {
    // Reset hover state
    if (this.hoveredCard === cardSprite) {
      this.hoveredCard = null;
    }
    
    // Emit hand-specific drag start event
    this.emit('hand:cardDragStart', {
      ...data,
      fromHand: this.hand,
      handSprite: this
    });
  }

  /**
   * Handle card drag end
   */
  private onCardDragEnd(cardSprite: CardSprite, data: any): void {
    // Reset card position if drag was unsuccessful
    this.resetCardPosition(cardSprite);
    
    // Emit hand-specific drag end event
    this.emit('hand:cardDragEnd', {
      ...data,
      fromHand: this.hand,
      handSprite: this
    });
  }

  /**
   * Add new card to hand with animation
   */
  async addCard(card: Card): Promise<void> {
    // Add card to hand data
    this.hand.add(card);
    
    // Create card sprite
    const cardSprite = new CardSprite(card, this.spriteSheet);
    
    // Position card off-screen initially
    cardSprite.x = this.maxWidth;
    cardSprite.y = 0;
    cardSprite.alpha = 0;
    
    this.setupCardInteractions(cardSprite);
    this.addChild(cardSprite);
    this.cardSprites.set(card.id, cardSprite);
    
    // Re-layout all cards
    await this.animateLayout();
  }

  /**
   * Remove card from hand with animation
   */
  async removeCard(card: Card): Promise<void> {
    const cardSprite = this.cardSprites.get(card.id);
    if (!cardSprite) return;
    
    // Animate card out
    await cardSprite.animateToPosition(this.maxWidth, cardSprite.y);
    cardSprite.alpha = 0;
    
    // Remove card
    this.removeChild(cardSprite);
    cardSprite.destroy();
    this.cardSprites.delete(card.id);
    
    // Remove from hand data
    this.hand.remove(card);
    
    // Re-layout remaining cards
    await this.animateLayout();
  }

  /**
   * Animate layout of all cards
   */
  private async animateLayout(): Promise<void> {
    const cards = this.hand.getCards();
    if (cards.length === 0) return;

    const spacing = this.calculateCardSpacing(cards.length);
    const totalWidth = (cards.length - 1) * spacing;
    const startX = -totalWidth / 2;

    // Animate all cards to new positions
    const animations = cards.map(async (card, index) => {
      const cardSprite = this.cardSprites.get(card.id);
      if (cardSprite) {
        const targetX = startX + (index * spacing);
        await cardSprite.animateToPosition(targetX, 0);
        cardSprite.alpha = 1;
      }
    });

    await Promise.all(animations);
  }

  /**
   * Highlight cards that can be played
   */
  setPlayableHighlight(playableCardIds: string[]): void {
    this.cardSprites.forEach((cardSprite, cardId) => {
      const isPlayable = playableCardIds.includes(cardId);
      cardSprite.setHighlight(isPlayable);
    });
  }

  /**
   * Get hand data
   */
  getHand(): Hand {
    return this.hand;
  }

  /**
   * Get card sprite by card ID
   */
  getCardSprite(cardId: string): CardSprite | undefined {
    return this.cardSprites.get(cardId);
  }

  /**
   * Get all card sprites
   */
  getCardSprites(): CardSprite[] {
    return Array.from(this.cardSprites.values());
  }

  /**
   * Check if point is over any card
   */
  getCardAtPoint(globalPoint: PIXI.Point): CardSprite | null {
    for (const cardSprite of this.cardSprites.values()) {
      const localPoint = cardSprite.toLocal(globalPoint);
      
      if (localPoint.x >= 0 && localPoint.x <= 100 && // Card width
          localPoint.y >= -HAND_CONFIG.HOVER_LIFT && localPoint.y <= 140) { // Card height + hover lift
        return cardSprite;
      }
    }
    return null;
  }

  /**
   * Set maximum width for hand layout
   */
  setMaxWidth(width: number): void {
    this.maxWidth = width;
    this.updateVisual();
  }

  /**
   * Update sprite sheet for re-rendering
   */
  updateSpriteSheet(spriteSheet: PIXI.Texture): void {
    this.spriteSheet = spriteSheet;
    
    // Update all card sprites
    this.cardSprites.forEach(cardSprite => {
      cardSprite.updateVisual(spriteSheet);
    });
  }

  /**
   * Shuffle cards visually (for effect)
   */
  async shuffleAnimation(): Promise<void> {
    const animations = Array.from(this.cardSprites.values()).map(async (cardSprite) => {
      // Random wiggle animation
      const originalX = cardSprite.x;
      const originalY = cardSprite.y;
      
      // Move to random position
      const randomX = originalX + (Math.random() - 0.5) * 40;
      const randomY = originalY + (Math.random() - 0.5) * 20;
      
      await cardSprite.animateToPosition(randomX, randomY, 150);
      await cardSprite.animateToPosition(originalX, originalY, 150);
    });
    
    await Promise.all(animations);
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.cardSprites.forEach(sprite => sprite.destroy());
    this.cardSprites.clear();
    this.hoveredCard = null;
    this.removeAllListeners();
    super.destroy();
  }
}