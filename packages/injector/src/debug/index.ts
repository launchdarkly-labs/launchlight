let overlayLoaded = false;

export function maybeLoadOverlay(triggered: boolean) {
  if (overlayLoaded) return;
  const url = new URL(window.location.href);
  const debug = url.searchParams.get('webexp_debug') === '1';
  if (!debug && !triggered) return;
  overlayLoaded = true;
  const script = document.createElement('script');
  // Assume bundling will output overlay UMD to /webexp/overlay.umd.js or provide via CDN
  script.src = (window as any).__WEBEXP_OVERLAY_URL__ || '/webexp/overlay.umd.js';
  script.async = true;
  document.head.appendChild(script);
}

export interface OverlayRuntimeState {
  flagKey: string;
  variationKey?: string;
  surface?: string;
  opsCount?: number;
  applyMs?: number;
  masks?: string[];
  conflicts?: string[];
  trackingSuppressed?: boolean;
}

export function exposeRuntimeState(state: OverlayRuntimeState) {
  (window as any).__WEBEXP_RUNTIME__ = { ...(window as any).__WEBEXP_RUNTIME__, ...state };
}


