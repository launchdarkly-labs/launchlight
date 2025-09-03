import type { WebExpOp, OpResult } from './types.js';
import { safeResolve, resolveOne, validateMove, elementExists } from './resolver.js';
import { sanitizeHTML } from './sanitizer.js';

/**
 * Apply a single operation to the DOM
 */
export function applyOperation(op: WebExpOp): OpResult {
  try {
    switch (op.op) {
      case 'textReplace':
        return applyTextReplace(op);
      case 'attrSet':
        return applyAttrSet(op);
      case 'classAdd':
        return applyClassAdd(op);
      case 'classRemove':
        return applyClassRemove(op);
      case 'classToggle':
        return applyClassToggle(op);
      case 'styleSet':
        return applyStyleSet(op);
      case 'imgSwap':
        return applyImgSwap(op);
      case 'remove':
        return applyRemove(op);
      case 'insertHTML':
        return applyInsertHTML(op);
      case 'moveBefore':
        return applyMoveBefore(op);
      case 'moveAfter':
        return applyMoveAfter(op);
      case 'appendTo':
        return applyAppendTo(op);
      case 'duplicate':
        return applyDuplicate(op);
      default:
        return {
          success: false,
          error: `Unknown operation: ${(op as any).op}`
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Operation failed'
    };
  }
}

// Standard operations
function applyTextReplace(op: { selector: string; value: string }): OpResult {
  const elements = safeResolve(op.selector);
  if (elements.length === 0) {
    return { success: false, error: 'No elements found', matchCount: 0 };
  }

  let modified = false;
  elements.forEach(element => {
    if (element.textContent !== op.value) {
      element.textContent = op.value;
      modified = true;
    }
  });

  return { success: true, matchCount: elements.length, modified };
}

function applyAttrSet(op: { selector: string; name: string; value: string }): OpResult {
  const elements = safeResolve(op.selector);
  if (elements.length === 0) {
    return { success: false, error: 'No elements found', matchCount: 0 };
  }

  let modified = false;
  elements.forEach(element => {
    const currentValue = element.getAttribute(op.name);
    if (currentValue !== op.value) {
      element.setAttribute(op.name, op.value);
      modified = true;
    }
  });

  return { success: true, matchCount: elements.length, modified };
}

function applyClassAdd(op: { selector: string; value: string }): OpResult {
  const elements = safeResolve(op.selector);
  if (elements.length === 0) {
    return { success: false, error: 'No elements found', matchCount: 0 };
  }

  let modified = false;
  elements.forEach(element => {
    if (!element.classList.contains(op.value)) {
      element.classList.add(op.value);
      modified = true;
    }
  });

  return { success: true, matchCount: elements.length, modified };
}

function applyClassRemove(op: { selector: string; value: string }): OpResult {
  const elements = safeResolve(op.selector);
  if (elements.length === 0) {
    return { success: false, error: 'No elements found', matchCount: 0 };
  }

  let modified = false;
  elements.forEach(element => {
    if (element.classList.contains(op.value)) {
      element.classList.remove(op.value);
      modified = true;
    }
  });

  return { success: true, matchCount: elements.length, modified };
}

function applyClassToggle(op: { selector: string; value: string }): OpResult {
  const elements = safeResolve(op.selector);
  if (elements.length === 0) {
    return { success: false, error: 'No elements found', matchCount: 0 };
  }

  elements.forEach(element => {
    element.classList.toggle(op.value);
  });

  return { success: true, matchCount: elements.length, modified: true };
}

function applyStyleSet(op: { selector: string; name: string; value: string }): OpResult {
  const elements = safeResolve(op.selector);
  if (elements.length === 0) {
    return { success: false, error: 'No elements found', matchCount: 0 };
  }

  let modified = false;
  elements.forEach(element => {
    const htmlElement = element as HTMLElement;
    const currentValue = htmlElement.style.getPropertyValue(op.name);
    if (currentValue !== op.value) {
      htmlElement.style.setProperty(op.name, op.value);
      modified = true;
    }
  });

  return { success: true, matchCount: elements.length, modified };
}

function applyImgSwap(op: { selector: string; src: string; alt?: string }): OpResult {
  const elements = safeResolve(op.selector);
  if (elements.length === 0) {
    return { success: false, error: 'No elements found', matchCount: 0 };
  }

  let modified = false;
  elements.forEach(element => {
    if (element.tagName.toLowerCase() === 'img') {
      const img = element as HTMLImageElement;
      if (img.src !== op.src) {
        img.src = op.src;
        modified = true;
      }
      if (op.alt !== undefined && img.alt !== op.alt) {
        img.alt = op.alt;
        modified = true;
      }
    }
  });

  return { success: true, matchCount: elements.length, modified };
}

function applyRemove(op: { selector: string }): OpResult {
  const elements = safeResolve(op.selector);
  if (elements.length === 0) {
    return { success: false, error: 'No elements found', matchCount: 0 };
  }

  // Mark elements for removal to avoid live NodeList issues
  const elementsToRemove = [...elements];
  elementsToRemove.forEach(element => {
    if (elementExists(element)) {
      element.remove();
    }
  });

  return { success: true, matchCount: elements.length, modified: true };
}

function applyInsertHTML(op: { selector: string; html: string }): OpResult {
  const elements = safeResolve(op.selector);
  if (elements.length === 0) {
    return { success: false, error: 'No elements found', matchCount: 0 };
  }

  const sanitizedHTML = sanitizeHTML(op.html);
  if (!sanitizedHTML.trim()) {
    return { success: false, error: 'HTML content is empty after sanitization' };
  }

  elements.forEach(element => {
    element.innerHTML = sanitizedHTML;
  });

  return { success: true, matchCount: elements.length, modified: true };
}

// Reorder operations
function applyMoveBefore(op: { selector: string; targetSelector: string }): OpResult {
  const sourceElements = safeResolve(op.selector);
  const targetElement = resolveOne(op.targetSelector);

  if (sourceElements.length === 0) {
    return { success: false, error: 'Source element not found', matchCount: 0 };
  }

  if (!targetElement) {
    return { success: false, error: 'Target element not found' };
  }

  const targetParent = targetElement.parentElement;
  if (!targetParent) {
    return { success: false, error: 'Target element has no parent' };
  }

  let modified = false;
  sourceElements.forEach(sourceElement => {
    // Validate the move
    const validation = validateMove(sourceElement, targetParent);
    if (!validation.valid) {
      console.warn(`[WebExp] Move validation failed: ${validation.reason}`);
      return;
    }

    // Check if already in correct position (idempotency)
    if (sourceElement.nextElementSibling === targetElement) {
      return; // Already in correct position
    }

    targetParent.insertBefore(sourceElement, targetElement);
    modified = true;
  });

  return { success: true, matchCount: sourceElements.length, modified };
}

function applyMoveAfter(op: { selector: string; targetSelector: string }): OpResult {
  const sourceElements = safeResolve(op.selector);
  const targetElement = resolveOne(op.targetSelector);

  if (sourceElements.length === 0) {
    return { success: false, error: 'Source element not found', matchCount: 0 };
  }

  if (!targetElement) {
    return { success: false, error: 'Target element not found' };
  }

  const targetParent = targetElement.parentElement;
  if (!targetParent) {
    return { success: false, error: 'Target element has no parent' };
  }

  let modified = false;
  sourceElements.forEach(sourceElement => {
    // Validate the move
    const validation = validateMove(sourceElement, targetParent);
    if (!validation.valid) {
      console.warn(`[WebExp] Move validation failed: ${validation.reason}`);
      return;
    }

    // Check if already in correct position (idempotency)
    if (sourceElement.previousElementSibling === targetElement) {
      return; // Already in correct position
    }

    targetParent.insertBefore(sourceElement, targetElement.nextElementSibling);
    modified = true;
  });

  return { success: true, matchCount: sourceElements.length, modified };
}

function applyAppendTo(op: { selector: string; containerSelector: string }): OpResult {
  const sourceElements = safeResolve(op.selector);
  const containerElement = resolveOne(op.containerSelector);

  if (sourceElements.length === 0) {
    return { success: false, error: 'Source element not found', matchCount: 0 };
  }

  if (!containerElement) {
    return { success: false, error: 'Container element not found' };
  }

  let modified = false;
  sourceElements.forEach(sourceElement => {
    // Validate the move
    const validation = validateMove(sourceElement, containerElement);
    if (!validation.valid) {
      console.warn(`[WebExp] Move validation failed: ${validation.reason}`);
      return;
    }

    // Check if already in correct position (idempotency)
    if (sourceElement.parentElement === containerElement && 
        sourceElement === containerElement.lastElementChild) {
      return; // Already at the end of container
    }

    containerElement.appendChild(sourceElement);
    modified = true;
  });

  return { success: true, matchCount: sourceElements.length, modified };
}

function applyDuplicate(op: { selector: string; mode?: 'deep' | 'shallow' }): OpResult {
  // Only operate on non-duplicate originals for idempotence
  const all = safeResolve(op.selector);
  const elements = all.filter(el => el.getAttribute('data-webexp-duplicate') !== 'true' && el.getAttribute('data-webexp-duplicated') !== 'true');
  if (elements.length === 0) {
    // No-op is a success for idempotence
    return { success: true, matchCount: 0, modified: false };
  }

  const mode = op.mode || 'deep';
  let duplicatedCount = 0;

  elements.forEach(element => {
    const parent = element.parentElement;
    if (!parent) {
      console.warn('[WebExp] Cannot duplicate element without parent');
      return;
    }

    // Idempotency: if any sibling already marked as webexp duplicate exists for this element, skip
    const next = element.nextElementSibling;
    if (next && next instanceof Element && next.getAttribute('data-webexp-duplicate') === 'true') {
      return;
    }

    // Clone the element
    const clone = element.cloneNode(mode === 'deep') as Element;

    // Remove any IDs from the clone to avoid duplicates
    removeIds(clone);

    // Mark as WebExp duplicate for idempotence
    clone.setAttribute('data-webexp-duplicate', 'true');
    // Mark original as having been duplicated to prevent repeated action on reapply
    (element as Element).setAttribute('data-webexp-duplicated', 'true');

    // Insert the clone after the original
    parent.insertBefore(clone, element.nextElementSibling);
    duplicatedCount++;
  });

  return { 
    success: true, 
    matchCount: elements.length, 
    modified: duplicatedCount > 0 
  };
}

function removeIds(element: Element): void {
  // Remove ID from the element itself
  if ((element as HTMLElement).id) {
    element.removeAttribute('id');
  }
  
  // Remove IDs from all descendants
  const descendants = element.querySelectorAll('[id]');
  descendants.forEach(descendant => {
    descendant.removeAttribute('id');
  });
}
