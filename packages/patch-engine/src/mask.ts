import type { WebExpMask } from './types.js';
import { safeResolve } from './resolver.js';

const MASK_CLASS = 'webexp-mask';
const MASK_STYLE_ID = 'webexp-mask-style';

let maskTimeout: ReturnType<typeof setTimeout> | null = null;
let maskedElements = new Set<Element>();

/**
 * Apply anti-flicker mask to specified selectors
 */
export function applyMask(mask: WebExpMask): void {
  const { selectors, timeoutMs = 800 } = mask;
  
  // Clear any existing mask
  removeMask();
  
  // Inject mask styles
  injectMaskStyles();
  
  // Apply mask to elements
  selectors.forEach(selector => {
    const elements = safeResolve(selector);
    elements.forEach(element => {
      element.classList.add(MASK_CLASS);
      maskedElements.add(element);
    });
  });
  
  // Set timeout to remove mask
  if (timeoutMs > 0) {
    maskTimeout = setTimeout(() => {
      removeMask();
    }, timeoutMs);
  }
  
  console.info(`[WebExp] Applied mask to ${maskedElements.size} elements with ${timeoutMs}ms timeout`);
}

/**
 * Remove anti-flicker mask
 */
export function removeMask(): void {
  // Clear timeout
  if (maskTimeout) {
    clearTimeout(maskTimeout);
    maskTimeout = null;
  }
  
  // Remove mask class from elements
  maskedElements.forEach(element => {
    if (element.isConnected) {
      element.classList.remove(MASK_CLASS);
    }
  });
  maskedElements.clear();
  
  // Remove mask styles
  removeMaskStyles();
  
  console.info('[WebExp] Mask removed');
}

/**
 * Check if mask is currently active
 */
export function isMaskActive(): boolean {
  return maskedElements.size > 0;
}

/**
 * Get currently masked elements
 */
export function getMaskedElements(): Element[] {
  return Array.from(maskedElements).filter(element => element.isConnected);
}

/**
 * Inject CSS styles for the mask
 */
function injectMaskStyles(): void {
  // Remove existing styles if any
  removeMaskStyles();
  
  const style = document.createElement('style');
  style.id = MASK_STYLE_ID;
  style.textContent = `
    .${MASK_CLASS} {
      visibility: hidden !important;
      opacity: 0 !important;
      transition: none !important;
    }
    
    .${MASK_CLASS}-transition {
      transition: opacity 0.15s ease-in-out !important;
    }
  `;
  
  document.head.appendChild(style);
}

/**
 * Remove mask styles
 */
function removeMaskStyles(): void {
  const existingStyle = document.getElementById(MASK_STYLE_ID);
  if (existingStyle) {
    existingStyle.remove();
  }
}

/**
 * Apply mask with smooth reveal animation
 */
export function applyMaskWithReveal(mask: WebExpMask, revealDelay = 100): void {
  applyMask(mask);
  
  // After a short delay, add transition class and reveal
  setTimeout(() => {
    maskedElements.forEach(element => {
      if (element.isConnected) {
        element.classList.add(`${MASK_CLASS}-transition`);
        element.classList.remove(MASK_CLASS);
      }
    });
    
    // Clean up transition class after animation
    setTimeout(() => {
      maskedElements.forEach(element => {
        if (element.isConnected) {
          element.classList.remove(`${MASK_CLASS}-transition`);
        }
      });
      maskedElements.clear();
    }, 200);
    
  }, revealDelay);
}
