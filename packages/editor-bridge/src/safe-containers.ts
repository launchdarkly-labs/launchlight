import type { Bounds } from "@webexp/shared";
import type { InternalElementRef } from "./types-internal.js";
import { generateStableSelector, toBounds } from "./dom.js";

/**
 * Safe container manager for scanning and tracking safe editing zones
 */
export class SafeContainerManager {
  private containers: Map<string, InternalElementRef> = new Map();
  private highlightElements: Map<string, HTMLElement> = new Map();
  private shadowRoot: ShadowRoot;
  
  constructor(shadowRoot: ShadowRoot) {
    this.shadowRoot = shadowRoot;
  }
  
  /**
   * Scan for safe containers and update internal state
   */
  scanContainers(): void {
    this.containers.clear();
    
    const containerElements = document.querySelectorAll('[data-webexp-container="true"]');
    
    containerElements.forEach(el => {
      const selector = generateStableSelector(el);
      const bounds = toBounds(el);
      const meta = {
        tagName: el.tagName,
        id: el.id || undefined,
        classes: Array.from(el.classList),
        attributes: { 'data-webexp-container': 'true' },
        textContent: undefined,
        role: el.getAttribute('role') || undefined
      };
      
      const ref: InternalElementRef = {
        el,
        selector,
        bounds,
        meta,
        containerSafe: true,
        selectorUnique: true,
        canDrag: false,
        nearestContainerSelector: undefined
      };
      
      this.containers.set(selector, ref);
    });
    
    this.updateContainerHighlights();
  }
  
  /**
   * Get all safe container selectors
   */
  getContainerSelectors(): string[] {
    return Array.from(this.containers.keys());
  }
  
  /**
   * Check if an element is within any safe container
   */
  isElementInSafeContainer(el: Element): boolean {
    for (const container of this.containers.values()) {
      if (container.el.contains(el)) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Find the nearest safe container for an element
   */
  findNearestContainer(el: Element): InternalElementRef | null {
    let current = el;
    
    while (current && current !== document.body) {
      for (const container of this.containers.values()) {
        if (container.el === current) {
          return container;
        }
      }
      current = current.parentElement!;
    }
    
    return null;
  }
  
  /**
   * Get potential drop targets for drag operations
   */
  getDropTargets(): Array<{ selector: string; bounds: Bounds; position: 'before' | 'after' | 'append' }> {
    const targets: Array<{ selector: string; bounds: Bounds; position: 'before' | 'after' | 'append' }> = [];
    
    for (const container of this.containers.values()) {
      // Add append position
      targets.push({
        selector: container.selector,
        bounds: container.bounds,
        position: 'append'
      });
      
      // Add before/after positions for child elements
      const children = Array.from(container.el.children);
      children.forEach((child, index) => {
        const childBounds = toBounds(child);
        
        // Before position
        targets.push({
          selector: container.selector,
          bounds: childBounds,
          position: 'before'
        });
        
        // After position (for last child, this becomes append)
        if (index === children.length - 1) {
          targets.push({
            selector: container.selector,
            bounds: childBounds,
            position: 'after'
          });
        }
      });
    }
    
    return targets;
  }
  
  /**
   * Update visual highlights for safe containers
   */
  private updateContainerHighlights(): void {
    // Remove old highlights
    this.highlightElements.forEach(el => el.remove());
    this.highlightElements.clear();
    
    // Create new highlights
    this.containers.forEach((container, selector) => {
      const highlight = this.createContainerHighlight(container.bounds);
      this.shadowRoot.appendChild(highlight);
      this.highlightElements.set(selector, highlight);
    });
  }
  
  /**
   * Create a visual highlight element for a safe container
   */
  private createContainerHighlight(bounds: Bounds): HTMLElement {
    const highlight = document.createElement('div');
    highlight.style.cssText = `
      position: fixed;
      left: ${bounds.x}px;
      top: ${bounds.y}px;
      width: ${bounds.w}px;
      height: ${bounds.h}px;
      border: 2px dashed rgba(0, 255, 0, 0.3);
      background: rgba(0, 255, 0, 0.05);
      pointer-events: none;
      z-index: 9998;
      box-sizing: border-box;
    `;
    
    return highlight;
  }
  
  /**
   * Clean up all highlights
   */
  destroy(): void {
    this.highlightElements.forEach(el => el.remove());
    this.highlightElements.clear();
    this.containers.clear();
  }
}
