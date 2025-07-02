/**
 * Canvas configuration constants
 */
export const CANVAS_CONFIG = {
  MIN_WIDTH: 800,
  MIN_HEIGHT: 600,
  ASPECT_RATIO: 4 / 3,
  BACKGROUND_COLOR: 0x2E7D32, // Green baize color
} as const;

/**
 * Layout constants for responsive design
 */
export const LAYOUT_CONFIG = {
  PADDING: {
    SMALL: 8,
    MEDIUM: 16,
    LARGE: 24,
    XLARGE: 32,
  },
  CARD_SIZE: {
    WIDTH: 80,
    HEIGHT: 120,
  },
  STACK_SPACING: 100,
  PLAYER_AREA_HEIGHT: 200,
} as const;

/**
 * Animation constants
 */
export const ANIMATION_CONFIG = {
  DURATION: {
    FAST: 200,
    NORMAL: 400,
    SLOW: 800,
  },
  EASING: {
    EASE_OUT: 'easeOut',
    EASE_IN: 'easeIn',
    EASE_IN_OUT: 'easeInOut',
    BOUNCE: 'bounce',
  },
} as const;

/**
 * Z-index layers for display objects
 */
export const Z_LAYERS = {
  BACKGROUND: 0,
  PLAYER_AREAS: 10,
  STACKS: 20,
  CARDS: 30,
  DECK: 40,
  HAND: 50,
  DRAGGING: 60,
  UI_OVERLAY: 70,
  PARTICLES: 80,
} as const;