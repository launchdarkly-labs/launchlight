import { describe, it, expect } from 'vitest';
import { 
  isBridgeMessage, 
  type BridgeMessage, 
  type SerializedElement,
  type Bounds,
  type ElementMetadata 
} from '../src/editor/bridge.js';

describe('Bridge Types', () => {
  describe('isBridgeMessage', () => {
    it('should validate valid bridge messages', () => {
      const validMessages: BridgeMessage[] = [
        {
          type: 'INIT',
          sessionId: 'test-session',
          parentOrigin: 'https://example.com',
          mode: 'select',
          settings: {
            highlightColor: '#ff0000',
            containerColor: '#00ff00',
            selectionColor: '#0000ff',
            enableSafeContainers: true
          }
        },
        {
          type: 'HOVER',
          sessionId: 'test-session',
          element: null
        },
        {
          type: 'SELECT',
          sessionId: 'test-session',
          element: {
            selector: 'button[data-testid="submit"]',
            bounds: { x: 0, y: 0, w: 100, h: 40, scrollX: 0, scrollY: 0, dpr: 1 },
            metadata: {
              tagName: 'BUTTON',
              classes: ['btn', 'btn-primary'],
              attributes: { 'data-testid': 'submit' },
              textContent: 'Submit'
            },
            containerSafe: true,
            selectorUnique: true,
            canDrag: false
          }
        }
      ];

      validMessages.forEach(message => {
        expect(isBridgeMessage(message)).toBe(true);
      });
    });

    it('should reject invalid messages', () => {
      const invalidMessages = [
        null,
        undefined,
        {},
        { type: 'INIT' },
        { sessionId: 'test' },
        { type: 'INIT', sessionId: 123 },
        { type: 'INIT', sessionId: 'test', parentOrigin: 456 }
      ];

      invalidMessages.forEach(message => {
        expect(isBridgeMessage(message)).toBe(false);
      });
    });
  });

  describe('structuredClone compatibility', () => {
    it('should allow structuredClone of SerializedElement', () => {
      const element: SerializedElement = {
        selector: 'div[data-testid="container"]',
        bounds: { x: 10, y: 20, w: 300, h: 200, scrollX: 0, scrollY: 0, dpr: 2 },
        metadata: {
          tagName: 'DIV',
          classes: ['container', 'main'],
          attributes: { 'data-testid': 'container' },
          textContent: 'Content here'
        },
        containerSafe: true,
        selectorUnique: true,
        canDrag: true,
        nearestContainerSelector: 'main[data-webexp-container="true"]'
      };

      expect(() => {
        const cloned = structuredClone(element);
        expect(cloned).toEqual(element);
      }).not.toThrow();
    });

    it('should allow structuredClone of BridgeMessage', () => {
      const message: BridgeMessage = {
        type: 'DRAG_START',
        sessionId: 'drag-session',
        element: {
          selector: 'li[data-testid="item"]',
          bounds: { x: 50, y: 100, w: 80, h: 60, scrollX: 0, scrollY: 0, dpr: 1 },
          metadata: {
            tagName: 'LI',
            classes: ['item', 'draggable'],
            attributes: { 'data-testid': 'item' }
          },
          containerSafe: true,
          selectorUnique: true,
          canDrag: true
        }
      };

      expect(() => {
        const cloned = structuredClone(message);
        expect(cloned).toEqual(message);
      }).not.toThrow();
    });

    it('should allow structuredClone of complex nested structures', () => {
      const bounds: Bounds = { x: 0, y: 0, w: 100, h: 100, scrollX: 0, scrollY: 0, dpr: 1 };
      const metadata: ElementMetadata = {
        tagName: 'BUTTON',
        id: 'submit-btn',
        classes: ['btn', 'btn-primary'],
        attributes: { 'type': 'submit', 'disabled': 'false' },
        textContent: 'Submit Form',
        role: 'button'
      };

      expect(() => {
        const clonedBounds = structuredClone(bounds);
        const clonedMetadata = structuredClone(metadata);
        
        expect(clonedBounds).toEqual(bounds);
        expect(clonedMetadata).toEqual(metadata);
      }).not.toThrow();
    });
  });
});
