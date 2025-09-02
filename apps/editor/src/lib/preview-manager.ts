/**
 * Preview manager for real-time operation application in iframe
 */

import type { WebExpOp, WebExpPayloadV1 } from '@webexp/patch-engine';
import { applyOperation, unmaskElements, enableSpaMode } from '@webexp/patch-engine';

export interface PreviewState {
  appliedOperations: WebExpOp[];
  isLiveMode: boolean;
  deviceSimulation: DeviceSimulation;
  performance: PerformanceMetrics;
}

export interface DeviceSimulation {
  type: 'desktop' | 'tablet' | 'mobile' | 'custom';
  width: number;
  height: number;
  userAgent: string;
  pixelRatio: number;
  touchEnabled: boolean;
}

export interface PerformanceMetrics {
  operationCount: number;
  renderTime: number;
  memoryUsage: number;
  warnings: string[];
}

export interface PreviewEvents {
  operationApplied: { operation: WebExpOp; success: boolean; error?: string };
  operationsCleared: { count: number };
  deviceChanged: { device: DeviceSimulation };
  performanceUpdate: { metrics: PerformanceMetrics };
  error: { message: string; operation?: WebExpOp };
}

/**
 * Device presets for common screen sizes
 */
export const DEVICE_PRESETS: Record<string, DeviceSimulation> = {
  desktop: {
    type: 'desktop',
    width: 1920,
    height: 1080,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    pixelRatio: 1,
    touchEnabled: false
  },
  'desktop-small': {
    type: 'desktop',
    width: 1366,
    height: 768,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    pixelRatio: 1,
    touchEnabled: false
  },
  tablet: {
    type: 'tablet',
    width: 768,
    height: 1024,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    pixelRatio: 2,
    touchEnabled: true
  },
  'tablet-landscape': {
    type: 'tablet',
    width: 1024,
    height: 768,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    pixelRatio: 2,
    touchEnabled: true
  },
  mobile: {
    type: 'mobile',
    width: 375,
    height: 667,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    pixelRatio: 3,
    touchEnabled: true
  },
  'mobile-large': {
    type: 'mobile',
    width: 414,
    height: 896,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    pixelRatio: 3,
    touchEnabled: true
  },
  'mobile-small': {
    type: 'mobile',
    width: 320,
    height: 568,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    pixelRatio: 2,
    touchEnabled: true
  }
};

/**
 * Real-time preview manager for iframe operations
 */
export class PreviewManager {
  private iframe: HTMLIFrameElement | null = null;
  private iframeDocument: Document | null = null;
  private state: PreviewState;
  private eventListeners: { [K in keyof PreviewEvents]?: ((event: PreviewEvents[K]) => void)[] } = {};
  private performanceObserver: PerformanceObserver | null = null;

  constructor() {
    this.state = {
      appliedOperations: [],
      isLiveMode: false,
      deviceSimulation: DEVICE_PRESETS.desktop,
      performance: {
        operationCount: 0,
        renderTime: 0,
        memoryUsage: 0,
        warnings: []
      }
    };
  }

  /**
   * Initialize preview manager with iframe
   */
  initialize(iframe: HTMLIFrameElement): void {
    this.iframe = iframe;
    this.setupIframeListeners();
    this.startPerformanceMonitoring();
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stopPerformanceMonitoring();
    this.iframe = null;
    this.iframeDocument = null;
    this.eventListeners = {};
  }

  /**
   * Set device simulation
   */
  setDevice(device: DeviceSimulation): void {
    this.state.deviceSimulation = device;
    this.applyDeviceSimulation();
    this.emit('deviceChanged', { device });
  }

  /**
   * Set device by preset name
   */
  setDevicePreset(presetName: string): void {
    const preset = DEVICE_PRESETS[presetName];
    if (preset) {
      this.setDevice(preset);
    }
  }

  /**
   * Toggle live preview mode
   */
  setLiveMode(enabled: boolean): void {
    this.state.isLiveMode = enabled;
    
    if (enabled) {
      this.enableSpaMode();
    }
  }

  /**
   * Apply a single operation to the preview
   */
  async applyOperation(operation: WebExpOp): Promise<boolean> {
    if (!this.iframeDocument) {
      this.emit('error', { message: 'Preview not ready', operation });
      return false;
    }

    const startTime = performance.now();

    try {
      await applyOperation(operation, this.iframeDocument);
      
      this.state.appliedOperations.push(operation);
      this.state.performance.operationCount++;
      this.state.performance.renderTime = performance.now() - startTime;

      this.emit('operationApplied', { operation, success: true });
      this.updatePerformanceMetrics();
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.emit('operationApplied', { operation, success: false, error: errorMessage });
      this.emit('error', { message: errorMessage, operation });
      
      return false;
    }
  }

  /**
   * Apply multiple operations in sequence
   */
  async applyOperations(operations: WebExpOp[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const operation of operations) {
      const result = await this.applyOperation(operation);
      if (result) {
        success++;
      } else {
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * Apply entire payload to preview
   */
  async applyPayload(payload: WebExpPayloadV1): Promise<{ success: number; failed: number }> {
    // Clear existing operations first
    this.clearOperations();

    // Apply mask if specified
    if (payload.mask?.selectors) {
      // Note: In real implementation, mask would be applied here
      // For now, we'll skip masking in preview mode
    }

    // Apply operations
    const result = await this.applyOperations(payload.ops);

    // Unmask after operations
    if (payload.mask?.selectors && this.iframeDocument) {
      unmaskElements(this.iframeDocument);
    }

    return result;
  }

  /**
   * Clear all applied operations and reset preview
   */
  clearOperations(): void {
    if (!this.iframe) return;

    const count = this.state.appliedOperations.length;
    
    // Reload iframe to reset state
    const currentSrc = this.iframe.src;
    this.iframe.src = 'about:blank';
    
    // Small delay to ensure clean reload
    setTimeout(() => {
      if (this.iframe) {
        this.iframe.src = currentSrc;
      }
    }, 50);

    this.state.appliedOperations = [];
    this.state.performance.operationCount = 0;
    
    this.emit('operationsCleared', { count });
  }

  /**
   * Take screenshot of current preview state
   */
  async takeScreenshot(): Promise<string | null> {
    if (!this.iframe || !this.iframeDocument) return null;

    try {
      // Use html2canvas or similar library to capture iframe content
      // For now, return a placeholder
      return 'data:image/png;base64,placeholder';
    } catch (error) {
      this.emit('error', { message: 'Failed to capture screenshot' });
      return null;
    }
  }

  /**
   * Get current preview metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.state.performance };
  }

  /**
   * Get current preview state
   */
  getState(): PreviewState {
    return { ...this.state };
  }

  /**
   * Add event listener
   */
  on<K extends keyof PreviewEvents>(event: K, listener: (data: PreviewEvents[K]) => void): void {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event]!.push(listener);
  }

  /**
   * Remove event listener
   */
  off<K extends keyof PreviewEvents>(event: K, listener: (data: PreviewEvents[K]) => void): void {
    const listeners = this.eventListeners[event];
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  private emit<K extends keyof PreviewEvents>(event: K, data: PreviewEvents[K]): void {
    const listeners = this.eventListeners[event];
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error('Error in preview event listener:', error);
        }
      });
    }
  }

  /**
   * Setup iframe event listeners
   */
  private setupIframeListeners(): void {
    if (!this.iframe) return;

    const onLoad = () => {
      this.iframeDocument = this.iframe?.contentDocument || null;
      
      if (this.iframeDocument) {
        this.applyDeviceSimulation();
        
        if (this.state.isLiveMode) {
          this.enableSpaMode();
        }
      }
    };

    this.iframe.addEventListener('load', onLoad);
    
    // If already loaded
    if (this.iframe.contentDocument?.readyState === 'complete') {
      onLoad();
    }
  }

  /**
   * Apply current device simulation settings
   */
  private applyDeviceSimulation(): void {
    if (!this.iframe || !this.iframeDocument) return;

    const { deviceSimulation } = this.state;

    // Set viewport meta tag for mobile simulation
    if (deviceSimulation.type !== 'desktop') {
      let viewport = this.iframeDocument.querySelector('meta[name="viewport"]');
      if (!viewport) {
        viewport = this.iframeDocument.createElement('meta');
        viewport.setAttribute('name', 'viewport');
        this.iframeDocument.head.appendChild(viewport);
      }
      
      viewport.setAttribute('content', 
        `width=${deviceSimulation.width}, initial-scale=${1 / deviceSimulation.pixelRatio}, user-scalable=no`
      );
    }

    // Apply CSS media query simulation
    const style = this.iframeDocument.createElement('style');
    style.textContent = `
      @media (max-width: ${deviceSimulation.width}px) {
        html { 
          font-size: ${deviceSimulation.type === 'mobile' ? '14px' : '16px'};
        }
      }
      
      ${deviceSimulation.touchEnabled ? `
        * {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
        }
        
        button, a, input, textarea, select {
          -webkit-user-select: auto;
          user-select: auto;
        }
      ` : ''}
    `;
    
    this.iframeDocument.head.appendChild(style);
  }

  /**
   * Enable SPA mode for dynamic content
   */
  private enableSpaMode(): void {
    if (!this.iframeDocument) return;

    try {
      enableSpaMode(this.iframeDocument, () => {
        // Reapply operations after SPA navigation
        if (this.state.appliedOperations.length > 0) {
          this.applyOperations([...this.state.appliedOperations]);
        }
      });
    } catch (error) {
      this.emit('error', { message: 'Failed to enable SPA mode' });
    }
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    if (typeof PerformanceObserver === 'undefined') return;

    this.performanceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'measure' && entry.name.startsWith('webexp-')) {
          this.state.performance.renderTime = entry.duration;
        }
      }
      this.updatePerformanceMetrics();
    });

    this.performanceObserver.observe({ entryTypes: ['measure', 'navigation'] });
  }

  /**
   * Stop performance monitoring
   */
  private stopPerformanceMonitoring(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(): void {
    const warnings: string[] = [];

    // Check for performance issues
    if (this.state.performance.operationCount > 50) {
      warnings.push('High operation count may impact performance');
    }

    if (this.state.performance.renderTime > 100) {
      warnings.push('Slow rendering detected');
    }

    // Estimate memory usage (simplified)
    this.state.performance.memoryUsage = this.state.appliedOperations.length * 1024; // Rough estimate

    if (this.state.performance.memoryUsage > 100 * 1024) {
      warnings.push('High memory usage detected');
    }

    this.state.performance.warnings = warnings;
    
    this.emit('performanceUpdate', { metrics: this.state.performance });
  }
}
