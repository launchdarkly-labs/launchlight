import type { Bounds } from "@webexp/shared";

/**
 * Manages visual highlights for hover and selection states
 */
export class HighlightManager {
  private shadowRoot: ShadowRoot;
  private hoverHighlight: HTMLElement | null = null;
  private selectionHighlight: HTMLElement | null = null;
  private dragPreview: HTMLElement | null = null;
  private animationFrameId: number | null = null;
  
  constructor(shadowRoot: ShadowRoot) {
    this.shadowRoot = shadowRoot;
    this.createStyles();
  }
  
  /**
   * Create CSS styles for highlights
   */
  private createStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .webexp-hover {
        position: fixed;
        border: 2px solid #007bff;
        background: rgba(0, 123, 255, 0.1);
        pointer-events: none;
        z-index: 9999;
        box-sizing: border-box;
        transition: all 0.1s ease-out;
      }
      
      .webexp-selection {
        position: fixed;
        border: 3px solid #28a745;
        background: rgba(40, 167, 69, 0.15);
        pointer-events: none;
        z-index: 10000;
        box-sizing: border-box;
        box-shadow: 0 0 0 1px rgba(40, 167, 69, 0.3);
      }
      
      .webexp-drag-preview {
        position: fixed;
        border: 2px dashed #ffc107;
        background: rgba(255, 193, 7, 0.1);
        pointer-events: none;
        z-index: 10001;
        box-sizing: border-box;
        opacity: 0.8;
      }
    `;
    
    this.shadowRoot.appendChild(style);
  }
  
  /**
   * Show hover highlight for an element
   */
  showHover(bounds: Bounds): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    this.animationFrameId = requestAnimationFrame(() => {
      if (!this.hoverHighlight) {
        this.hoverHighlight = document.createElement('div');
        this.hoverHighlight.className = 'webexp-hover';
        this.shadowRoot.appendChild(this.hoverHighlight);
      }
      
      this.updateHighlightPosition(this.hoverHighlight, bounds);
      this.hoverHighlight.style.display = 'block';
    });
  }
  
  /**
   * Hide hover highlight
   */
  hideHover(): void {
    if (this.hoverHighlight) {
      this.hoverHighlight.style.display = 'none';
    }
  }
  
  /**
   * Show selection highlight
   */
  showSelection(bounds: Bounds): void {
    if (!this.selectionHighlight) {
      this.selectionHighlight = document.createElement('div');
      this.selectionHighlight.className = 'webexp-selection';
      this.shadowRoot.appendChild(this.selectionHighlight);
    }
    
    this.updateHighlightPosition(this.selectionHighlight, bounds);
    this.selectionHighlight.style.display = 'block';
  }
  
  /**
   * Hide selection highlight
   */
  hideSelection(): void {
    if (this.selectionHighlight) {
      this.selectionHighlight.style.display = 'none';
    }
  }
  
  /**
   * Show drag preview
   */
  showDragPreview(bounds: Bounds): void {
    if (!this.dragPreview) {
      this.dragPreview = document.createElement('div');
      this.dragPreview.className = 'webexp-drag-preview';
      this.shadowRoot.appendChild(this.dragPreview);
    }
    
    this.updateHighlightPosition(this.dragPreview, bounds);
    this.dragPreview.style.display = 'block';
  }
  
  /**
   * Hide drag preview
   */
  hideDragPreview(): void {
    if (this.dragPreview) {
      this.dragPreview.style.display = 'none';
    }
  }
  
  /**
   * Update highlight position and size
   */
  private updateHighlightPosition(element: HTMLElement, bounds: Bounds): void {
    element.style.left = `${bounds.x}px`;
    element.style.top = `${bounds.y}px`;
    element.style.width = `${bounds.w}px`;
    element.style.height = `${bounds.h}px`;
  }
  
  /**
   * Clear all highlights
   */
  clear(): void {
    this.hideHover();
    this.hideSelection();
    this.hideDragPreview();
  }
  
  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    this.clear();
    
    if (this.hoverHighlight) {
      this.hoverHighlight.remove();
      this.hoverHighlight = null;
    }
    
    if (this.selectionHighlight) {
      this.selectionHighlight.remove();
      this.selectionHighlight = null;
    }
    
    if (this.dragPreview) {
      this.dragPreview.remove();
      this.dragPreview = null;
    }
  }
}
