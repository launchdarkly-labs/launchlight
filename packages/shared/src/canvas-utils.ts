/**
 * Canvas utilities for drag-and-drop visual editing
 */

export interface ElementBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  left: number;
  right: number;
  bottom: number;
}

export interface CanvasElement {
  element: Element;
  selector: string;
  bounds: ElementBounds;
  isContainer: boolean;
  isDropTarget: boolean;
  canDrag: boolean;
  constraints: string[];
  metadata: {
    tagName: string;
    classList: string[];
    textContent: string;
    attributes: Record<string, string>;
  };
}

export interface DropZone {
  container: Element;
  bounds: ElementBounds;
  position: 'before' | 'after' | 'inside';
  targetElement?: Element;
  isValid: boolean;
  reason?: string;
}

export interface DragOperation {
  sourceElement: Element;
  sourceSelector: string;
  targetContainer: Element;
  targetSelector: string;
  position: 'before' | 'after' | 'inside';
  operation: 'move' | 'duplicate' | 'invalid';
}

/**
 * Canvas interaction modes
 */
export type CanvasMode = 'select' | 'drag' | 'edit' | 'preview';

/**
 * Canvas event types
 */
export interface CanvasEvents {
  elementSelected: { element: CanvasElement };
  elementHovered: { element: CanvasElement | null };
  dragStarted: { element: CanvasElement };
  dragEnded: { operation: DragOperation | null };
  dropZoneChanged: { dropZone: DropZone | null };
  modeChanged: { mode: CanvasMode };
}

/**
 * Safe container detection utilities
 */
export class SafeContainerDetector {
  private static readonly SEMANTIC_CONTAINERS = [
    'header', 'nav', 'main', 'section', 'article', 
    'aside', 'footer', 'div', 'ul', 'ol', 'dl'
  ];

  private static readonly LAYOUT_DISPLAYS = [
    'flex', 'grid', 'inline-flex', 'inline-grid'
  ];

  /**
   * Check if element is a safe container
   */
  static isContainer(element: Element): boolean {
    // Explicitly marked containers
    if (element.hasAttribute('data-webexp-container')) {
      return element.getAttribute('data-webexp-container') === 'true';
    }

    // Semantic containers
    if (this.SEMANTIC_CONTAINERS.includes(element.tagName.toLowerCase())) {
      return true;
    }

    // Layout containers
    const computedStyle = window.getComputedStyle(element);
    if (this.LAYOUT_DISPLAYS.some(display => computedStyle.display.includes(display))) {
      return true;
    }

    return false;
  }

  /**
   * Get all safe containers in the document
   */
  static findContainers(root: Document | Element = document): CanvasElement[] {
    const containers: CanvasElement[] = [];
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          const element = node as Element;
          return this.isContainer(element) ? 
            NodeFilter.FILTER_ACCEPT : 
            NodeFilter.FILTER_SKIP;
        }
      }
    );

    let node = walker.nextNode();
    while (node) {
      const element = node as Element;
      const canvasElement = this.createCanvasElement(element);
      if (canvasElement) {
        containers.push(canvasElement);
      }
      node = walker.nextNode();
    }

    return containers;
  }

  /**
   * Create canvas element from DOM element
   */
  static createCanvasElement(element: Element): CanvasElement | null {
    try {
      const bounds = this.getElementBounds(element);
      const { selector } = this.generateSelector(element);
      
      return {
        element,
        selector,
        bounds,
        isContainer: this.isContainer(element),
        isDropTarget: this.canAcceptDrop(element),
        canDrag: this.canDrag(element),
        constraints: this.getConstraints(element),
        metadata: {
          tagName: element.tagName.toLowerCase(),
          classList: Array.from(element.classList),
          textContent: element.textContent?.trim().substring(0, 100) || '',
          attributes: this.getElementAttributes(element)
        }
      };
    } catch (error) {
      console.warn('[WebExp] Failed to create canvas element:', error);
      return null;
    }
  }

  /**
   * Check if element can accept drops
   */
  static canAcceptDrop(element: Element): boolean {
    // Don't allow drops into form controls
    const formControls = ['input', 'select', 'textarea', 'button'];
    if (formControls.includes(element.tagName.toLowerCase())) {
      return false;
    }

    // Don't allow drops into inline elements unless they're containers
    const computedStyle = window.getComputedStyle(element);
    if (computedStyle.display === 'inline' && !this.isContainer(element)) {
      return false;
    }

    return true;
  }

  /**
   * Check if element can be dragged
   */
  static canDrag(element: Element): boolean {
    // Don't allow dragging of critical elements
    const criticalElements = ['html', 'head', 'body', 'script', 'style', 'link', 'meta'];
    if (criticalElements.includes(element.tagName.toLowerCase())) {
      return false;
    }

    // Don't drag form labels away from their controls
    if (element.tagName.toLowerCase() === 'label') {
      const forAttr = element.getAttribute('for');
      if (forAttr && document.getElementById(forAttr)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get movement constraints for an element
   */
  static getConstraints(element: Element): string[] {
    const constraints: string[] = [];
    
    // Form relationship constraints
    if (element.tagName.toLowerCase() === 'label') {
      constraints.push('maintain-form-relationship');
    }
    
    // ARIA relationship constraints
    if (element.hasAttribute('aria-labelledby') || element.hasAttribute('aria-describedby')) {
      constraints.push('maintain-aria-relationship');
    }

    // Table constraints
    if (['tr', 'td', 'th', 'thead', 'tbody', 'tfoot'].includes(element.tagName.toLowerCase())) {
      constraints.push('table-structure');
    }

    return constraints;
  }

  /**
   * Get element bounds relative to viewport
   */
  static getElementBounds(element: Element): ElementBounds {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      top: rect.top,
      left: rect.left,
      right: rect.right,
      bottom: rect.bottom
    };
  }

  /**
   * Generate selector for element (simplified version)
   */
  static generateSelector(element: Element): { selector: string; stability: number } {
    // Try data attributes first
    const dataAttrs = ['data-testid', 'data-test', 'data-cy', 'data-webexp-id'];
    for (const attr of dataAttrs) {
      const value = element.getAttribute(attr);
      if (value) {
        return { selector: `[${attr}="${CSS.escape(value)}"]`, stability: 90 };
      }
    }

    // Try ID
    if (element.id && !element.id.match(/^[a-f0-9-]{20,}$/)) {
      return { selector: `#${CSS.escape(element.id)}`, stability: 80 };
    }

    // Try stable classes
    const stableClasses = Array.from(element.classList).filter(cls => 
      /^(btn|card|nav|header|footer|hero|feature|cta)-/.test(cls)
    );
    if (stableClasses.length > 0) {
      return { 
        selector: '.' + stableClasses.map(cls => CSS.escape(cls)).join('.'), 
        stability: 70 
      };
    }

    // Fallback to tag + nth-child
    const parent = element.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children);
      const index = siblings.indexOf(element) + 1;
      return { 
        selector: `${element.tagName.toLowerCase()}:nth-child(${index})`, 
        stability: 30 
      };
    }

    return { selector: element.tagName.toLowerCase(), stability: 10 };
  }

  /**
   * Get element attributes as key-value pairs
   */
  static getElementAttributes(element: Element): Record<string, string> {
    const attrs: Record<string, string> = {};
    for (const attr of Array.from(element.attributes)) {
      attrs[attr.name] = attr.value;
    }
    return attrs;
  }
}

/**
 * Drop zone calculator
 */
export class DropZoneCalculator {
  /**
   * Calculate valid drop zones for a dragged element
   */
  static calculateDropZones(
    draggedElement: Element,
    containers: CanvasElement[],
    mousePosition: { x: number; y: number }
  ): DropZone[] {
    const dropZones: DropZone[] = [];

    for (const container of containers) {
      if (!container.isDropTarget) continue;
      if (container.element === draggedElement) continue;
      if (container.element.contains(draggedElement)) continue;

      // Check if the container is near the mouse position
      const distance = this.getDistanceToElement(mousePosition, container.bounds);
      if (distance > 100) continue; // Too far away

      // Calculate drop positions within this container
      const zones = this.getDropPositions(container, draggedElement, mousePosition);
      dropZones.push(...zones);
    }

    return dropZones.sort((a, b) => {
      const distA = this.getDistanceToElement(mousePosition, a.bounds);
      const distB = this.getDistanceToElement(mousePosition, b.bounds);
      return distA - distB;
    });
  }

  /**
   * Get possible drop positions within a container
   */
  private static getDropPositions(
    container: CanvasElement,
    draggedElement: Element,
    mousePosition: { x: number; y: number }
  ): DropZone[] {
    const positions: DropZone[] = [];
    const children = Array.from(container.element.children);

    // Add "inside at end" position
    positions.push({
      container: container.element,
      bounds: container.bounds,
      position: 'inside',
      isValid: this.validateDrop(draggedElement, container.element, 'inside'),
      reason: this.getDropReason(draggedElement, container.element, 'inside')
    });

    // Add positions before/after each child
    for (const child of children) {
      if (child === draggedElement) continue;

      const childBounds = SafeContainerDetector.getElementBounds(child);
      
      // Before this child
      positions.push({
        container: container.element,
        bounds: {
          ...childBounds,
          height: 4,
          y: childBounds.top - 2,
          top: childBounds.top - 2,
          bottom: childBounds.top + 2
        },
        position: 'before',
        targetElement: child,
        isValid: this.validateDrop(draggedElement, container.element, 'before', child),
        reason: this.getDropReason(draggedElement, container.element, 'before', child)
      });

      // After this child
      positions.push({
        container: container.element,
        bounds: {
          ...childBounds,
          height: 4,
          y: childBounds.bottom - 2,
          top: childBounds.bottom - 2,
          bottom: childBounds.bottom + 2
        },
        position: 'after',
        targetElement: child,
        isValid: this.validateDrop(draggedElement, container.element, 'after', child),
        reason: this.getDropReason(draggedElement, container.element, 'after', child)
      });
    }

    return positions.filter(pos => pos.isValid);
  }

  /**
   * Validate if a drop operation is allowed
   */
  private static validateDrop(
    draggedElement: Element,
    container: Element,
    position: 'before' | 'after' | 'inside',
    targetElement?: Element
  ): boolean {
    // Can't drop element into itself
    if (draggedElement.contains(container)) {
      return false;
    }

    // Check form relationships
    if (this.wouldBreakFormRelationship(draggedElement, container)) {
      return false;
    }

    // Check ARIA relationships
    if (this.wouldBreakAriaRelationship(draggedElement, container)) {
      return false;
    }

    // Check table structure
    if (this.wouldBreakTableStructure(draggedElement, container, position, targetElement)) {
      return false;
    }

    return true;
  }

  /**
   * Get reason for drop validation result
   */
  private static getDropReason(
    draggedElement: Element,
    container: Element,
    position: 'before' | 'after' | 'inside',
    targetElement?: Element
  ): string | undefined {
    if (draggedElement.contains(container)) {
      return 'Cannot drop element into itself';
    }

    if (this.wouldBreakFormRelationship(draggedElement, container)) {
      return 'Would break form label/control relationship';
    }

    if (this.wouldBreakAriaRelationship(draggedElement, container)) {
      return 'Would break ARIA relationship';
    }

    if (this.wouldBreakTableStructure(draggedElement, container, position, targetElement)) {
      return 'Would break table structure';
    }

    return undefined;
  }

  /**
   * Check if move would break form relationships
   */
  private static wouldBreakFormRelationship(draggedElement: Element, container: Element): boolean {
    // If dragging a form control, ensure its label stays accessible
    const formControls = ['input', 'select', 'textarea'];
    if (formControls.includes(draggedElement.tagName.toLowerCase())) {
      const label = this.findAssociatedLabel(draggedElement);
      if (label && !container.contains(label) && !label.contains(container)) {
        return true;
      }
    }

    // If dragging a label, ensure its control stays accessible
    if (draggedElement.tagName.toLowerCase() === 'label') {
      const control = this.findAssociatedControl(draggedElement);
      if (control && !container.contains(control) && !control.contains(container)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if move would break ARIA relationships
   */
  private static wouldBreakAriaRelationship(draggedElement: Element, container: Element): boolean {
    // Check aria-labelledby
    const labelledBy = draggedElement.getAttribute('aria-labelledby');
    if (labelledBy) {
      const labelElement = document.getElementById(labelledBy);
      if (labelElement && !container.contains(labelElement)) {
        return true;
      }
    }

    // Check if element is referenced by aria-labelledby
    const id = draggedElement.id;
    if (id) {
      const referencingElements = document.querySelectorAll(`[aria-labelledby~="${CSS.escape(id)}"]`);
      for (const element of Array.from(referencingElements)) {
        if (!container.contains(element)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if move would break table structure
   */
  private static wouldBreakTableStructure(
    draggedElement: Element,
    container: Element,
    position: 'before' | 'after' | 'inside',
    targetElement?: Element
  ): boolean {
    const tableElements = ['tr', 'td', 'th', 'thead', 'tbody', 'tfoot'];
    const draggedIsTable = tableElements.includes(draggedElement.tagName.toLowerCase());
    const containerIsTable = tableElements.includes(container.tagName.toLowerCase());

    // Don't allow table elements to move outside tables
    if (draggedIsTable && !this.isWithinTable(container)) {
      return true;
    }

    // Don't allow non-table elements into table structure
    if (!draggedIsTable && containerIsTable) {
      return true;
    }

    return false;
  }

  /**
   * Find label associated with form control
   */
  private static findAssociatedLabel(control: Element): Element | null {
    const id = control.id;
    if (id) {
      const label = document.querySelector(`label[for="${CSS.escape(id)}"]`);
      if (label) return label;
    }

    // Check for implicit association (control inside label)
    let parent = control.parentElement;
    while (parent) {
      if (parent.tagName.toLowerCase() === 'label') {
        return parent;
      }
      parent = parent.parentElement;
    }

    return null;
  }

  /**
   * Find control associated with label
   */
  private static findAssociatedControl(label: Element): Element | null {
    const forAttr = label.getAttribute('for');
    if (forAttr) {
      return document.getElementById(forAttr);
    }

    // Check for implicit association (control inside label)
    const controls = label.querySelectorAll('input, select, textarea');
    return controls.length > 0 ? controls[0] : null;
  }

  /**
   * Check if element is within a table
   */
  private static isWithinTable(element: Element): boolean {
    let parent = element.parentElement;
    while (parent) {
      if (parent.tagName.toLowerCase() === 'table') {
        return true;
      }
      parent = parent.parentElement;
    }
    return false;
  }

  /**
   * Calculate distance from point to element bounds
   */
  private static getDistanceToElement(point: { x: number; y: number }, bounds: ElementBounds): number {
    const dx = Math.max(bounds.left - point.x, 0, point.x - bounds.right);
    const dy = Math.max(bounds.top - point.y, 0, point.y - bounds.bottom);
    return Math.sqrt(dx * dx + dy * dy);
  }
}
