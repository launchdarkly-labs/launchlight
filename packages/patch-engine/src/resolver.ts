import type { OpResult } from './types.js';

/**
 * Resolve elements by selector with diagnostics
 */
export function resolve(selector: string): {
  elements: Element[];
  diagnostics: {
    matchCount: number;
    selector: string;
    isValid: boolean;
    error?: string;
  };
} {
  try {
    const elements = Array.from(document.querySelectorAll(selector));
    return {
      elements,
      diagnostics: {
        matchCount: elements.length,
        selector,
        isValid: true
      }
    };
  } catch (error) {
    return {
      elements: [],
      diagnostics: {
        matchCount: 0,
        selector,
        isValid: false,
        error: error instanceof Error ? error.message : 'Invalid selector'
      }
    };
  }
}

/**
 * Safe element resolver that logs warnings
 */
export function safeResolve(selector: string): Element[] {
  const result = resolve(selector);
  
  if (!result.diagnostics.isValid) {
    console.warn(`[WebExp] Invalid selector: ${selector}`, result.diagnostics.error);
    return [];
  }
  
  if (result.diagnostics.matchCount === 0) {
    console.warn(`[WebExp] No elements found for selector: ${selector}`);
  } else if (result.diagnostics.matchCount > 1) {
    console.info(`[WebExp] Selector matches ${result.diagnostics.matchCount} elements: ${selector}`);
  }
  
  return result.elements;
}

/**
 * Resolve a single element (returns first match)
 */
export function resolveOne(selector: string): Element | null {
  const elements = safeResolve(selector);
  return elements.length > 0 ? elements[0] : null;
}

/**
 * Check if selector is valid and matches elements
 */
export function validateSelector(selector: string): OpResult {
  const result = resolve(selector);
  
  if (!result.diagnostics.isValid) {
    return {
      success: false,
      error: `Invalid selector: ${result.diagnostics.error}`,
      matchCount: 0
    };
  }
  
  return {
    success: true,
    matchCount: result.diagnostics.matchCount
  };
}

/**
 * Check if element exists in DOM
 */
export function elementExists(element: Element): boolean {
  return document.contains(element);
}

/**
 * Get element position relative to another element
 */
export function getElementPosition(element: Element, container: Element): {
  index: number;
  isChild: boolean;
  isDescendant: boolean;
} {
  const isChild = element.parentElement === container;
  const isDescendant = container.contains(element);
  
  let index = -1;
  if (isChild) {
    index = Array.from(container.children).indexOf(element);
  }
  
  return { index, isChild, isDescendant };
}

/**
 * Check if move operation would be valid
 */
export function validateMove(source: Element, target: Element): {
  valid: boolean;
  reason?: string;
} {
  // Check if source and target are the same
  if (source === target) {
    return { valid: false, reason: 'Source and target are the same element' };
  }
  
  // Check if source contains target (would create circular reference)
  if (source.contains(target)) {
    return { valid: false, reason: 'Cannot move element into its own descendant' };
  }
  
  // Check if target is document body or html
  if (target === document.body || target === document.documentElement) {
    return { valid: false, reason: 'Cannot move element to document body or html' };
  }
  
  // Check for form input/label relationships
  if (isFormControl(source) && target.tagName !== 'FORM') {
    const label = findAssociatedLabel(source);
    if (label && !target.contains(label)) {
      return { valid: false, reason: 'Moving form control would break label association' };
    }
  }
  
  // Check for ARIA relationships
  const ariaViolation = checkAriaViolation(source, target);
  if (ariaViolation) {
    return { valid: false, reason: ariaViolation };
  }
  
  return { valid: true };
}

function isFormControl(element: Element): boolean {
  const formTags = ['input', 'select', 'textarea', 'button'];
  return formTags.includes(element.tagName.toLowerCase());
}

function findAssociatedLabel(element: Element): Element | null {
  // Check for explicit label association
  const id = element.id;
  if (id) {
    const label = document.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (label) return label;
  }
  
  // Check for implicit label association (element inside label)
  let current = element.parentElement;
  while (current) {
    if (current.tagName.toLowerCase() === 'label') {
      return current;
    }
    current = current.parentElement;
  }
  
  return null;
}

function checkAriaViolation(source: Element, target: Element): string | null {
  // Check if moving would break aria-labelledby relationships
  const labelledBy = source.getAttribute('aria-labelledby');
  if (labelledBy) {
    const labelElement = document.getElementById(labelledBy);
    if (labelElement && !target.contains(labelElement)) {
      return 'Moving element would break aria-labelledby relationship';
    }
  }
  
  // Check if source is a label for another element
  const sourceId = source.id;
  if (sourceId) {
    const labeledElement = document.querySelector(`[aria-labelledby~="${CSS.escape(sourceId)}"]`);
    if (labeledElement && !target.contains(labeledElement)) {
      return 'Moving label would break aria-labelledby relationship';
    }
  }
  
  return null;
}
