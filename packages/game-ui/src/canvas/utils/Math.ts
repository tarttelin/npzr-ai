import { CANVAS_CONFIG } from './Constants';

/**
 * Mathematical utilities for canvas operations
 */

/**
 * Calculate responsive canvas size based on container
 */
export function calculateCanvasSize(containerWidth: number, containerHeight: number): { width: number; height: number } {
  // Ensure minimum size
  const minWidth = Math.max(containerWidth, CANVAS_CONFIG.MIN_WIDTH);
  const minHeight = Math.max(containerHeight, CANVAS_CONFIG.MIN_HEIGHT);

  // Calculate size maintaining aspect ratio
  const aspectRatio = CANVAS_CONFIG.ASPECT_RATIO;
  let width = minWidth;
  let height = width / aspectRatio;

  // If height exceeds container, adjust based on height
  if (height > minHeight) {
    height = minHeight;
    width = height * aspectRatio;
  }

  return { width: Math.floor(width), height: Math.floor(height) };
}

/**
 * Linear interpolation between two values
 */
export function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Convert degrees to radians
 */
export function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 */
export function radiansToDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Calculate distance between two points
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Normalize an angle to be between 0 and 2π
 */
export function normalizeAngle(angle: number): number {
  while (angle < 0) angle += 2 * Math.PI;
  while (angle >= 2 * Math.PI) angle -= 2 * Math.PI;
  return angle;
}

/**
 * Check if a point is inside a rectangle
 */
export function pointInRect(
  px: number, 
  py: number, 
  rx: number, 
  ry: number, 
  rw: number, 
  rh: number
): boolean {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

/**
 * Generate a random number between min and max
 */
export function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Generate a random integer between min and max (inclusive)
 */
export function randomIntBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}