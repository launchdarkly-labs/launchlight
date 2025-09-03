import type { 
  BridgeMessage, 
  InitPayload, 
  EditorCanvasMode, 
  BridgeSettings,
  SerializedElement,
  DropTarget
} from "@webexp/shared";
import { isBridgeMessage } from "@webexp/shared";
import { HighlightManager } from "./highlight-manager.js";
import { SafeContainerManager } from "./safe-containers.js";
import { toInternalRef, toSerializedElement } from "./dom.js";

/**
 * WebExp Editor Bridge - Secure iframe overlay for element selection and manipulation
 */
class WebExpBridge {
  private sessionId: string | null = null;
  private parentOrigin: string | null = null;
  private mode: EditorCanvasMode = 'select';
  private settings: BridgeSettings | null = null;
  
  private shadowHost: HTMLElement | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private highlightManager: HighlightManager | null = null;
  private safeContainerManager: SafeContainerManager | null = null;
  
  private currentHoverElement: Element | null = null;
  private currentSelection: Element | null = null;
  private isDragging = false;
  private dragStartElement: Element | null = null;
  
  private throttleTimeout: number | null = null;
  
  constructor() {
    this.setupMessageListener();
    this.setupRouteChangeListener();
  }
  
  /**
   * Set up message listener for parent communication
   */
  private setupMessageListener(): void {
    window.addEventListener('message', (event) => {
      if (!this.validateMessage(event)) return;
      
      const message = event.data as BridgeMessage;
      
      switch (message.type) {
        case 'INIT':
          this.handleInit(message);
          break;
        default:
          this.sendError('UNKNOWN_MESSAGE_TYPE', `Unknown message type: ${message.type}`);
      }
    });
  }
  
  /**
   * Validate incoming message security
   */
  private validateMessage(event: MessageEvent): boolean {
    if (!event.data || !isBridgeMessage(event.data)) {
      return false;
    }
    
    if (this.sessionId && (event.data as any).sessionId !== this.sessionId) {
      return false;
    }
    
    if (this.parentOrigin && event.origin !== this.parentOrigin) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Handle initialization message
   */
  private handleInit(message: InitPayload): void {
    this.sessionId = message.sessionId;
    this.parentOrigin = message.parentOrigin;
    this.mode = message.mode;
    this.settings = message.settings;
    
    this.initializeOverlay();
    this.setupEventListeners();
    this.scanForSafeContainers();
    
    this.postMessage({
      type: 'INIT',
      sessionId: this.sessionId,
      parentOrigin: window.location.origin,
      mode: this.mode,
      settings: this.settings
    } as any);
  }
  
  /**
   * Initialize the shadow DOM overlay
   */
  private initializeOverlay(): void {
    this.shadowHost = document.createElement('div');
    this.shadowHost.id = 'webexp-overlay-host';
    this.shadowHost.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 9999;
    `;
    
    // Use open shadow root to allow tests to inspect
    this.shadowRoot = this.shadowHost.attachShadow({ mode: 'open' });
    document.body.appendChild(this.shadowHost);
    
    this.highlightManager = new HighlightManager(this.shadowRoot);
    this.safeContainerManager = new SafeContainerManager(this.shadowRoot);
  }
  
  /**
   * Set up event listeners for element interaction
   */
  private setupEventListeners(): void {
    document.addEventListener('mouseover', this.handleMouseOver.bind(this), { capture: true });
    document.addEventListener('mouseout', this.handleMouseOut.bind(this), { capture: true });
    document.addEventListener('click', this.handleClick.bind(this), { capture: true });
    
    if (this.mode === 'drag') {
      document.addEventListener('mousedown', this.handleMouseDown.bind(this), { capture: true });
      document.addEventListener('mousemove', this.handleMouseMove.bind(this), { capture: true });
      document.addEventListener('mouseup', this.handleMouseUp.bind(this), { capture: true });
    }
    
    this.setupThrottledListeners();
  }
  
  /**
   * Handle mouse over for hover highlighting
   */
  private handleMouseOver(event: MouseEvent): void {
    const target = event.target as Element;
    if (!target || target === this.shadowHost) return;
    
    this.currentHoverElement = target;
    const ref = toInternalRef(target);
    
    if (this.highlightManager) {
      this.highlightManager.showHover(ref.bounds);
    }
    
    this.postMessage({
      type: 'HOVER',
      sessionId: this.sessionId!,
      element: toSerializedElement(ref)
    } as any);
  }
  
  /**
   * Handle mouse out to hide hover
   */
  private handleMouseOut(event: MouseEvent): void {
    const target = event.target as Element;
    if (!target || target === this.shadowHost) return;
    
    this.currentHoverElement = null;
    
    if (this.highlightManager) {
      this.highlightManager.hideHover();
    }
    
    this.postMessage({
      type: 'HOVER',
      sessionId: this.sessionId!,
      element: null
    } as any);
  }
  
  /**
   * Handle click for element selection
   */
  private handleClick(event: MouseEvent): void {
    const target = event.target as Element;
    if (!target || target === this.shadowHost) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    this.currentSelection = target;
    const ref = toInternalRef(target);
    
    if (this.highlightManager) {
      this.highlightManager.showSelection(ref.bounds);
    }
    
    this.postMessage({
      type: 'SELECT',
      sessionId: this.sessionId!,
      element: toSerializedElement(ref)
    } as any);
  }
  
  /**
   * Handle mouse down for drag start
   */
  private handleMouseDown(event: MouseEvent): void {
    if (this.mode !== 'drag') return;
    
    const target = event.target as Element;
    if (!target || target === this.shadowHost) return;
    
    const ref = toInternalRef(target);
    if (!(ref as any).canDrag) return;
    
    this.isDragging = true;
    this.dragStartElement = target;
    
    if (this.highlightManager) {
      this.highlightManager.showDragPreview(ref.bounds);
    }
    
    this.postMessage({
      type: 'DRAG_START',
      sessionId: this.sessionId!,
      element: toSerializedElement(ref)
    } as any);
  }
  
  /**
   * Handle mouse move for drag over
   */
  private handleMouseMove(event: MouseEvent): void {
    if (!this.isDragging || this.mode !== 'drag') return;
    
    const dropTargets = this.safeContainerManager?.getDropTargets() || [];
    const mousePos = { x: event.clientX, y: event.clientY };
    const bestTarget = this.findBestDropTarget(dropTargets as any, mousePos);
    
    if (bestTarget) {
      this.postMessage({
        type: 'DRAG_OVER',
        sessionId: this.sessionId!,
        target: bestTarget
      } as any);
    }
  }
  
  /**
   * Handle mouse up for drag end
   */
  private handleMouseUp(event: MouseEvent): void {
    if (!this.isDragging || this.mode !== 'drag') return;
    
    this.isDragging = false;
    
    if (this.highlightManager) {
      this.highlightManager.hideDragPreview();
    }
    
    const operation = {
      type: 'move',
      source: this.dragStartElement ? (toInternalRef(this.dragStartElement) as any).selector : null,
      target: this.findBestDropTarget(
        (this.safeContainerManager?.getDropTargets() || []) as any,
        { x: event.clientX, y: event.clientY }
      )
    };
    
    this.postMessage({
      type: 'DRAG_END',
      sessionId: this.sessionId!,
      operation
    } as any);
    
    this.dragStartElement = null;
  }
  
  /**
   * Find the best drop target based on mouse position
   */
  private findBestDropTarget(
    targets: Array<{ selector: string; bounds: any; position: 'before' | 'after' | 'append' }>,
    mousePos: { x: number; y: number }
  ): DropTarget | null {
    if (targets.length === 0) return null;
    
    let bestTarget = targets[0];
    let bestDistance = Infinity;
    
    targets.forEach(target => {
      const centerX = (target as any).bounds.x + (target as any).bounds.w / 2;
      const centerY = (target as any).bounds.y + (target as any).bounds.h / 2;
      const distance = Math.sqrt(
        Math.pow(mousePos.x - centerX, 2) + Math.pow(mousePos.y - centerY, 2)
      );
      
      if (distance < bestDistance) {
        bestDistance = distance;
        bestTarget = target;
      }
    });
    
    return {
      selector: (bestTarget as any).selector,
      position: (bestTarget as any).position,
      bounds: (bestTarget as any).bounds
    } as any;
  }
  
  /**
   * Set up throttled listeners for scroll and resize
   */
  private setupThrottledListeners(): void {
    const throttledHandler = () => {
      if (this.throttleTimeout) return;
      
      this.throttleTimeout = window.setTimeout(() => {
        this.throttleTimeout = null;
        this.handleLayoutChange();
      }, 32);
    };
    
    window.addEventListener('scroll', throttledHandler, { passive: true });
    window.addEventListener('resize', throttledHandler, { passive: true });
  }
  
  /**
   * Handle layout changes (scroll, resize)
   */
  private handleLayoutChange(): void {
    this.scanForSafeContainers();
    
    if (this.currentHoverElement && this.highlightManager) {
      const ref = toInternalRef(this.currentHoverElement);
      this.highlightManager.showHover((ref as any).bounds);
    }
    
    if (this.currentSelection && this.highlightManager) {
      const ref = toInternalRef(this.currentSelection);
      this.highlightManager.showSelection((ref as any).bounds);
    }
  }
  
  /**
   * Set up route change listener for SPA navigation
   */
  private setupRouteChangeListener(): void {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = (...args) => {
      originalPushState.apply(history, args as any);
      this.handleRouteChange();
    };
    
    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args as any);
      this.handleRouteChange();
    };
    
    window.addEventListener('popstate', () => {
      this.handleRouteChange();
    });
  }
  
  /**
   * Handle route changes
   */
  private handleRouteChange(): void {
    this.currentHoverElement = null;
    this.currentSelection = null;
    this.isDragging = false;
    
    if (this.highlightManager) {
      this.highlightManager.clear();
    }
    
    setTimeout(() => {
      this.scanForSafeContainers();
    }, 100);
  }
  
  /**
   * Scan for safe containers
   */
  private scanForSafeContainers(): void {
    if (this.safeContainerManager) {
      this.safeContainerManager.scanContainers();
    }
  }
  
  /**
   * Post message to parent window
   */
  private postMessage(message: BridgeMessage): void {
    if (!this.parentOrigin) return;
    
    try {
      (window.parent as any).postMessage(message, this.parentOrigin);
    } catch (error) {
      this.sendError('POST_MESSAGE_FAILED', `Failed to post message: ${error}`);
    }
  }
  
  /**
   * Send error message to parent
   */
  private sendError(code: string, detail?: string): void {
    this.postMessage({
      type: 'ERROR',
      sessionId: this.sessionId!,
      code,
      detail
    } as any);
  }
  
  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.throttleTimeout) {
      clearTimeout(this.throttleTimeout);
    }
    
    if (this.highlightManager) {
      this.highlightManager.destroy();
    }
    
    if (this.safeContainerManager) {
      this.safeContainerManager.destroy();
    }
    
    if (this.shadowHost) {
      this.shadowHost.remove();
    }
    
    document.removeEventListener('mouseover', this.handleMouseOver.bind(this), { capture: true } as any);
    document.removeEventListener('mouseout', this.handleMouseOut.bind(this), { capture: true } as any);
    document.removeEventListener('click', this.handleClick.bind(this), { capture: true } as any);
    document.removeEventListener('mousedown', this.handleMouseDown.bind(this), { capture: true } as any);
    document.removeEventListener('mousemove', this.handleMouseMove.bind(this), { capture: true } as any);
    document.removeEventListener('mouseup', this.handleMouseUp.bind(this), { capture: true } as any);
  }
}

// Create and expose the bridge instance
const bridge = new WebExpBridge();

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  bridge.destroy();
});

// Expose for testing
if (typeof window !== 'undefined') {
  (window as any).__webexpBridge = bridge;
}
