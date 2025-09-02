import type { WebExpPayloadV1 } from './types.js';
import { applyPayload } from './index.js';

interface SPAState {
  enabled: boolean;
  observer: MutationObserver | null;
  payload: WebExpPayloadV1 | null;
  lastUrl: string;
}

const spaState: SPAState = {
  enabled: false,
  observer: null,
  payload: null,
  lastUrl: ''
};

/**
 * Enable SPA mode for automatic reapplication of patches
 */
export function enableSpaMode(payload: WebExpPayloadV1): void {
  if (spaState.enabled) {
    disableSpaMode();
  }
  
  spaState.enabled = true;
  spaState.payload = payload;
  spaState.lastUrl = window.location.href;
  
  // Watch for DOM changes
  setupMutationObserver();
  
  // Watch for navigation changes
  setupNavigationWatcher();
  
  console.info('[WebExp] SPA mode enabled');
}

/**
 * Disable SPA mode
 */
export function disableSpaMode(): void {
  if (!spaState.enabled) return;
  
  spaState.enabled = false;
  spaState.payload = null;
  
  // Disconnect observers
  if (spaState.observer) {
    spaState.observer.disconnect();
    spaState.observer = null;
  }
  
  // Remove navigation listeners
  removeNavigationWatcher();
  
  console.info('[WebExp] SPA mode disabled');
}

/**
 * Check if SPA mode is enabled
 */
export function isSpaMode(): boolean {
  return spaState.enabled;
}

/**
 * Manually trigger reapplication (useful for custom SPA frameworks)
 */
export function reapplyPatches(): void {
  if (!spaState.enabled || !spaState.payload) {
    return;
  }
  
  console.info('[WebExp] Reapplying patches for SPA navigation');
  applyPayload(spaState.payload, { skipMask: true, spa: true });
}

/**
 * Setup MutationObserver to watch for DOM changes
 */
function setupMutationObserver(): void {
  spaState.observer = new MutationObserver((mutations) => {
    let shouldReapply = false;
    
    for (const mutation of mutations) {
      // Check if significant DOM changes occurred
      if (mutation.type === 'childList') {
        // Only reapply if substantial content was added/removed
        if (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0) {
          // Filter out script/style changes and small text nodes
          const significantChanges = Array.from(mutation.addedNodes)
            .concat(Array.from(mutation.removedNodes))
            .some(node => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;
                return !['script', 'style', 'link', 'meta'].includes(element.tagName.toLowerCase());
              }
              return false;
            });
          
          if (significantChanges) {
            shouldReapply = true;
            break;
          }
        }
      }
    }
    
    if (shouldReapply) {
      // Debounce reapplication
      debounceReapply();
    }
  });
  
  spaState.observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false,
    characterData: false
  });
}

let reapplyTimeout: ReturnType<typeof setTimeout> | null = null;

function debounceReapply(): void {
  if (reapplyTimeout) {
    clearTimeout(reapplyTimeout);
  }
  
  reapplyTimeout = setTimeout(() => {
    reapplyPatches();
    reapplyTimeout = null;
  }, 100); // 100ms debounce
}

/**
 * Setup navigation watcher for URL changes
 */
function setupNavigationWatcher(): void {
  // Watch for pushState/replaceState
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function(...args) {
    originalPushState.apply(history, args);
    handleNavigation();
  };
  
  history.replaceState = function(...args) {
    originalReplaceState.apply(history, args);
    handleNavigation();
  };
  
  // Watch for popstate (back/forward buttons)
  window.addEventListener('popstate', handleNavigation);
  
  // Store original functions for cleanup
  (window as any).__webexpOriginalPushState = originalPushState;
  (window as any).__webexpOriginalReplaceState = originalReplaceState;
}

/**
 * Remove navigation watchers
 */
function removeNavigationWatcher(): void {
  // Restore original functions
  if ((window as any).__webexpOriginalPushState) {
    history.pushState = (window as any).__webexpOriginalPushState;
    delete (window as any).__webexpOriginalPushState;
  }
  
  if ((window as any).__webexpOriginalReplaceState) {
    history.replaceState = (window as any).__webexpOriginalReplaceState;
    delete (window as any).__webexpOriginalReplaceState;
  }
  
  window.removeEventListener('popstate', handleNavigation);
}

/**
 * Handle navigation changes
 */
function handleNavigation(): void {
  if (!spaState.enabled) return;
  
  const currentUrl = window.location.href;
  if (currentUrl !== spaState.lastUrl) {
    spaState.lastUrl = currentUrl;
    
    // Wait for new content to load
    setTimeout(() => {
      reapplyPatches();
    }, 50);
  }
}

/**
 * Update payload for SPA mode
 */
export function updateSpaPayload(payload: WebExpPayloadV1): void {
  if (spaState.enabled) {
    spaState.payload = payload;
  }
}
