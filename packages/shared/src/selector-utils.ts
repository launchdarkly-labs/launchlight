import type { SelectorResult, ElementInfo } from './types.js';

/**
 * Stable selector generation helper
 * Preference order: data-* attributes, IDs, stable classnames
 * Fallback: anchor + index strategy
 */
export class StableSelector {
  private static readonly DATA_ATTRS = [
    'data-testid',
    'data-test',
    'data-cy',
    'data-webexp-id'
  ];

  private static readonly ARIA_ATTRS = [
    'aria-label',
    'aria-labelledby',
    'role'
  ];

  private static readonly STABLE_CLASSES = [
    /^btn-/,
    /^card-/,
    /^nav-/,
    /^header-/,
    /^footer-/,
    /^hero-/,
    /^feature-/,
    /^cta-/
  ];

  /**
   * Generate a stable selector for an element
   */
  static generate(element: Element): SelectorResult {
    const strategies = [
      () => this.tryDataAttributes(element),
      () => this.tryId(element),
      () => this.tryAriaAttributes(element),
      () => this.tryStableClasses(element),
      () => this.tryTagWithAttributes(element),
      () => this.tryAnchorStrategy(element)
    ];

    for (const strategy of strategies) {
      const result = strategy();
      if (result) {
        const diagnostics = this.analyzeSelectorStability(result, element);
        return {
          selector: result,
          diagnostics
        };
      }
    }

    // Fallback to basic tag selector
    const fallback = element.tagName.toLowerCase();
    return {
      selector: fallback,
      diagnostics: {
        matchCount: document.querySelectorAll(fallback).length,
        stabilityScore: 10,
        warnings: ['Using basic tag selector - very unstable']
      }
    };
  }

  private static tryDataAttributes(element: Element): string | null {
    for (const attr of this.DATA_ATTRS) {
      const value = element.getAttribute(attr);
      if (value) {
        return `[${attr}="${CSS.escape(value)}"]`;
      }
    }
    return null;
  }

  private static tryId(element: Element): string | null {
    const id = element.id;
    if (id && this.isStableId(id)) {
      return `#${CSS.escape(id)}`;
    }
    return null;
  }

  private static tryAriaAttributes(element: Element): string | null {
    for (const attr of this.ARIA_ATTRS) {
      const value = element.getAttribute(attr);
      if (value && value.length > 2) {
        return `[${attr}="${CSS.escape(value)}"]`;
      }
    }
    return null;
  }

  private static tryStableClasses(element: Element): string | null {
    const classList = Array.from(element.classList);
    const stableClasses = classList.filter(cls => 
      this.STABLE_CLASSES.some(pattern => pattern.test(cls))
    );

    if (stableClasses.length > 0) {
      return '.' + stableClasses.map(cls => CSS.escape(cls)).join('.');
    }
    return null;
  }

  private static tryTagWithAttributes(element: Element): string | null {
    const tag = element.tagName.toLowerCase();
    
    // Try tag + type for inputs
    if (tag === 'input') {
      const type = element.getAttribute('type');
      if (type) {
        return `input[type="${CSS.escape(type)}"]`;
      }
    }

    // Try tag + role
    const role = element.getAttribute('role');
    if (role) {
      return `${tag}[role="${CSS.escape(role)}"]`;
    }

    return null;
  }

  private static tryAnchorStrategy(element: Element): string | null {
    let current = element;
    const path: string[] = [];
    
    while (current && current !== document.body && path.length < 5) {
      // Try to find a stable ancestor
      const stableAncestor = this.findStableAncestor(current);
      if (stableAncestor) {
        const ancestorSelector = this.generateBasicSelector(stableAncestor);
        const childIndex = this.getChildIndex(current, stableAncestor);
        if (childIndex !== -1) {
          return `${ancestorSelector} > :nth-child(${childIndex + 1})`;
        }
      }

      const index = this.getSiblingIndex(current);
      const tag = current.tagName.toLowerCase();
      path.unshift(`${tag}:nth-child(${index + 1})`);
      current = current.parentElement!;
    }

    return path.length > 0 ? path.join(' > ') : null;
  }

  private static findStableAncestor(element: Element): Element | null {
    let current = element.parentElement;
    while (current && current !== document.body) {
      if (current.id && this.isStableId(current.id)) {
        return current;
      }
      if (this.hasStableDataAttribute(current)) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  }

  private static generateBasicSelector(element: Element): string {
    if (element.id && this.isStableId(element.id)) {
      return `#${CSS.escape(element.id)}`;
    }
    for (const attr of this.DATA_ATTRS) {
      const value = element.getAttribute(attr);
      if (value) {
        return `[${attr}="${CSS.escape(value)}"]`;
      }
    }
    return element.tagName.toLowerCase();
  }

  private static hasStableDataAttribute(element: Element): boolean {
    return this.DATA_ATTRS.some(attr => element.hasAttribute(attr));
  }

  private static isStableId(id: string): boolean {
    // Avoid generated IDs (UUIDs, random strings, etc.)
    return !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id) &&
           !/^[a-z0-9]{20,}$/i.test(id) &&
           !id.includes('__') &&
           !id.startsWith('react-');
  }

  private static getSiblingIndex(element: Element): number {
    if (!element.parentElement) return 0;
    return Array.from(element.parentElement.children).indexOf(element);
  }

  private static getChildIndex(child: Element, parent: Element): number {
    return Array.from(parent.children).indexOf(child);
  }

  private static analyzeSelectorStability(selector: string, element: Element): SelectorResult['diagnostics'] {
    try {
      const matches = document.querySelectorAll(selector);
      const matchCount = matches.length;
      const isUnique = matchCount === 1;
      const containsTarget = Array.from(matches).includes(element);

      let stabilityScore = 50; // Base score
      const warnings: string[] = [];

      // Score based on selector type
      if (selector.includes('[data-')) {
        stabilityScore += 40;
      } else if (selector.startsWith('#')) {
        stabilityScore += 35;
      } else if (selector.includes('[aria-')) {
        stabilityScore += 30;
      } else if (selector.includes('.')) {
        stabilityScore += 20;
      } else if (selector.includes(':nth-child')) {
        stabilityScore -= 20;
        warnings.push('Uses position-based selector - may break on layout changes');
      }

      // Adjust for uniqueness
      if (isUnique) {
        stabilityScore += 10;
      } else if (matchCount > 10) {
        stabilityScore -= 20;
        warnings.push(`Selector matches ${matchCount} elements - not specific enough`);
      }

      // Check if selector actually matches the target
      if (!containsTarget) {
        stabilityScore = 0;
        warnings.push('Selector does not match the target element');
      }

      return {
        matchCount,
        stabilityScore: Math.max(0, Math.min(100, stabilityScore)),
        warnings: warnings.length > 0 ? warnings : undefined
      };
    } catch (error) {
      return {
        matchCount: 0,
        stabilityScore: 0,
        warnings: [`Invalid selector: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Analyze an element for drag-and-drop capabilities
   */
  static analyzeElement(element: Element): ElementInfo {
    const selectorResult = this.generate(element);
    
    return {
      selector: selectorResult.selector,
      tagName: element.tagName.toLowerCase(),
      classList: Array.from(element.classList),
      attributes: this.getElementAttributes(element),
      textContent: element.textContent?.trim().substring(0, 100) || '',
      isContainer: this.isContainer(element),
      stability: {
        score: selectorResult.diagnostics.stabilityScore,
        reasons: selectorResult.diagnostics.warnings || []
      }
    };
  }

  private static getElementAttributes(element: Element): Record<string, string> {
    const attrs: Record<string, string> = {};
    for (const attr of Array.from(element.attributes)) {
      attrs[attr.name] = attr.value;
    }
    return attrs;
  }

  private static isContainer(element: Element): boolean {
    const computedStyle = window.getComputedStyle(element);
    const display = computedStyle.display;
    
    // Layout containers
    if (display.includes('flex') || display.includes('grid')) {
      return true;
    }

    // Semantic containers
    const semanticContainers = [
      'header', 'nav', 'main', 'section', 'article', 
      'aside', 'footer', 'div', 'ul', 'ol'
    ];
    
    if (semanticContainers.includes(element.tagName.toLowerCase())) {
      return true;
    }

    // Explicitly marked containers
    if (element.hasAttribute('data-webexp-container')) {
      return true;
    }

    return false;
  }
}

/**
 * Utility functions for selector operations
 */
export const selectorUtils = {
  /**
   * Escape a CSS selector
   */
  escape: (value: string): string => CSS.escape(value),

  /**
   * Test if a selector is valid
   */
  isValid: (selector: string): boolean => {
    try {
      document.querySelector(selector);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Count elements matching a selector
   */
  count: (selector: string): number => {
    try {
      return document.querySelectorAll(selector).length;
    } catch {
      return 0;
    }
  },

  /**
   * Find the closest common ancestor of two elements
   */
  findCommonAncestor: (elem1: Element, elem2: Element): Element | null => {
    const path1 = [];
    let current = elem1;
    while (current) {
      path1.push(current);
      current = current.parentElement!;
    }

    current = elem2;
    while (current) {
      if (path1.includes(current)) {
        return current;
      }
      current = current.parentElement!;
    }
    return null;
  }
};
