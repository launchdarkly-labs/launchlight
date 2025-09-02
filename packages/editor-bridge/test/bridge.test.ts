import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { BridgeMessage, InitPayload } from '@webexp/shared';

// Mock the shared package
vi.mock('@webexp/shared', () => ({
  isBridgeMessage: (value: unknown) => {
    return !!value && typeof (value as any).type === 'string' && typeof (value as any).sessionId === 'string';
  }
}));

describe('WebExpBridge', () => {
  let bridge: any;
  
  beforeEach(() => {
    // Set up test environment
    document.body.innerHTML = `
      <div data-webexp-container="true">
        <button data-testid="submit">Submit</button>
        <div class="content">
          <p>Hello World</p>
        </div>
      </div>
    `;
    
    // Mock postMessage
    Object.defineProperty(window, 'parent', {
      value: {
        postMessage: vi.fn()
      },
      writable: true
    });
    
    // Mock history methods
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = vi.fn(originalPushState);
    history.replaceState = vi.fn(originalReplaceState);
    
    // Enable test mode and get bridge instance
    (window as any).__WEBEXP_TEST__ = true;
    bridge = (window as any).__webexpBridge;
  });
  
  afterEach(() => {
    if (bridge) {
      bridge.destroy();
    }
    
    // Clean up
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });
  
  it('should initialize on INIT message', () => {
    const initMessage: InitPayload = {
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
    };
    
    // Simulate INIT message
    window.dispatchEvent(new MessageEvent('message', {
      data: initMessage,
      origin: 'https://example.com'
    }));
    
    // Check that overlay was created
    const overlayHost = document.getElementById('webexp-overlay-host');
    expect(overlayHost).toBeTruthy();
    expect(overlayHost?.shadowRoot).toBeTruthy();
  });
  
  it('should handle element hover', () => {
    // Initialize bridge first
    const initMessage: InitPayload = {
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
    };
    
    window.dispatchEvent(new MessageEvent('message', {
      data: initMessage,
      origin: 'https://example.com'
    }));
    
    // Simulate hover over button
    const button = document.querySelector('[data-testid="submit"]');
    expect(button).toBeTruthy();
    
    button?.dispatchEvent(new MouseEvent('mouseover', {
      bubbles: true,
      cancelable: true
    }));
    
    // Check that postMessage was called with HOVER
    expect(window.parent.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'HOVER',
        sessionId: 'test-session',
        element: expect.objectContaining({
          selector: expect.stringContaining('data-testid="submit"')
        })
      }),
      'https://example.com'
    );
  });
  
  it('should handle element selection', () => {
    // Initialize bridge first
    const initMessage: InitPayload = {
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
    };
    
    window.dispatchEvent(new MessageEvent('message', {
      data: initMessage,
      origin: 'https://example.com'
    }));
    
    // Simulate click on button
    const button = document.querySelector('[data-testid="submit"]');
    expect(button).toBeTruthy();
    
    button?.dispatchEvent(new MouseEvent('click', {
      bubbles: true,
      cancelable: true
    }));
    
    // Check that postMessage was called with SELECT
    expect(window.parent.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'SELECT',
        sessionId: 'test-session',
        element: expect.objectContaining({
          selector: expect.stringContaining('data-testid="submit"')
        })
      }),
      'https://example.com'
    );
  });
  
  it('should reject messages without valid session ID', () => {
    const invalidMessage = {
      type: 'SELECT',
      sessionId: 'wrong-session',
      element: { selector: 'button' }
    };
    
    // Try to send invalid message
    window.dispatchEvent(new MessageEvent('message', {
      data: invalidMessage,
      origin: 'https://example.com'
    }));
    
    // Should not call postMessage
    expect(window.parent.postMessage).not.toHaveBeenCalled();
  });
  
  it('should reject messages from wrong origin', () => {
    const initMessage: InitPayload = {
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
    };
    
    // Initialize with correct origin
    window.dispatchEvent(new MessageEvent('message', {
      data: initMessage,
      origin: 'https://example.com'
    }));
    
    // Try to send message from wrong origin
    const selectMessage = {
      type: 'SELECT',
      sessionId: 'test-session',
      element: { selector: 'button' }
    };
    
    window.dispatchEvent(new MessageEvent('message', {
      data: selectMessage,
      origin: 'https://malicious.com'
    }));
    
    // Should not process message from wrong origin
    expect(window.parent.postMessage).toHaveBeenCalledTimes(1); // Only the INIT response
  });
});
