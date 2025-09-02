import type { Bounds, ElementMetadata, SerializedElement } from "@webexp/shared";
import type { InternalElementRef } from "./types-internal.js";

/**
 * Convert DOM element bounds to serializable Bounds object
 */
export function toBounds(el: Element): Bounds {
  const rect = el.getBoundingClientRect();
  const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
  const scrollY = window.pageYOffset || document.documentElement.scrollTop;
  const dpr = window.devicePixelRatio || 1;
  
  return {
    x: rect.left,
    y: rect.top,
    w: rect.width,
    h: rect.height,
    scrollX,
    scrollY,
    dpr
  };
}

/**
 * Compute element metadata for serialization
 */
export function computeMetadata(el: Element): ElementMetadata {
  const attributes: Record<string, string> = {};
  for (const attr of el.attributes) {
    attributes[attr.name] = attr.value;
  }
  
  return {
    tagName: el.tagName,
    id: el.id || undefined,
    classes: Array.from(el.classList),
    attributes,
    textContent: el.textContent?.trim() || undefined,
    role: el.getAttribute('role') || undefined
  };
}

/**
 * Generate a stable selector for an element
 * Prefers data-* attributes, then ID, then role, then path with index
 */
export function generateStableSelector(el: Element): string {
  // Try data-webexp-id first
  const webexpId = el.getAttribute('data-webexp-id');
  if (webexpId) {
    return `[data-webexp-id="${CSS.escape(webexpId)}"]`;
  }
  
  // Try other data attributes
  const dataAttrs = ['data-testid', 'data-test', 'data-cy'];
  for (const attr of dataAttrs) {
    const value = el.getAttribute(attr);
    if (value) {
      return `[${attr}="${CSS.escape(value)}"]`;
    }
  }
  
  // Try ID
  if (el.id) {
    return `#${CSS.escape(el.id)}`;
  }
  
  // Try role
  const role = el.getAttribute('role');
  if (role) {
    return `[role="${CSS.escape(role)}"]`;
  }
  
  // Fallback to tag + index path
  return generatePathSelector(el);
}

/**
 * Generate a path-based selector with index for uniqueness
 */
function generatePathSelector(el: Element): string {
  const path: string[] = [];
  let current = el;
  
  while (current && current !== document.body) {
    const tag = current.tagName.toLowerCase();
    const siblings = Array.from(current.parentElement?.children || []);
    const index = siblings.findIndex(child => child === current);
    
    if (index === 0) {
      path.unshift(tag);
    } else {
      path.unshift(`${tag}:nth-child(${index + 1})`);
    }
    
    current = current.parentElement!;
  }
  
  return path.join(' > ');
}

/**
 * Check if selector uniquely identifies an element
 */
export function isSelectorUnique(selector: string): boolean {
  try {
    const matches = document.querySelectorAll(selector);
    return matches.length === 1;
  } catch {
    return false;
  }
}

/**
 * Check if element is within a safe container
 */
export function isContainerSafe(el: Element): boolean {
  let current = el;
  while (current && current !== document.body) {
    if (current.hasAttribute('data-webexp-container')) {
      return true;
    }
    current = current.parentElement!;
  }
  return false;
}

/**
 * Find the nearest safe container selector
 */
export function findNearestContainerSelector(el: Element): string | undefined {
  let current = el;
  while (current && current !== document.body) {
    if (current.hasAttribute('data-webexp-container')) {
      return generateStableSelector(current);
    }
    current = current.parentElement!;
  }
  return undefined;
}

/**
 * Check if element can be dragged
 */
export function canElementDrag(el: Element): boolean {
  // Check for draggable attribute
  if (el.hasAttribute('draggable')) {
    return el.getAttribute('draggable') === 'true';
  }
  
  // Check for common draggable patterns
  const draggableClasses = ['draggable', 'sortable-item', 'list-item'];
  const hasDraggableClass = draggableClasses.some(cls => el.classList.contains(cls));
  
  return hasDraggableClass;
}

/**
 * Convert element to internal reference
 */
export function toInternalRef(el: Element): InternalElementRef {
  const selector = generateStableSelector(el);
  const bounds = toBounds(el);
  const meta = computeMetadata(el);
  const containerSafe = isContainerSafe(el);
  const selectorUnique = isSelectorUnique(selector);
  const canDrag = canElementDrag(el);
  const nearestContainerSelector = findNearestContainerSelector(el);
  
  return {
    el,
    selector,
    bounds,
    meta,
    containerSafe,
    selectorUnique,
    canDrag,
    nearestContainerSelector
  };
}

/**
 * Convert internal reference to serializable element
 */
export function toSerializedElement(ref: InternalElementRef): SerializedElement {
  return {
    selector: ref.selector,
    bounds: ref.bounds,
    metadata: ref.meta,
    containerSafe: ref.containerSafe,
    selectorUnique: ref.selectorUnique,
    canDrag: ref.canDrag,
    nearestContainerSelector: ref.nearestContainerSelector
  };
}
