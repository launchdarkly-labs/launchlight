import type { WebExpPayloadV1, WebExpGoal, WebExpOp } from '@webexp/patch-engine';
import type { AutoIdOptions } from '@webexp/shared';
import { createEmptyPayload } from '@webexp/shared';
import { applyPayload, enableSpaMode, cleanupPatchEngine, applyMask, removeMask } from '@webexp/patch-engine';
import { createLDClient, createAnonymousContext, createUserContext, type LDClientConfig, type WebExpClient } from './ld-client.js';
import { createGoalTracker, type GoalTracker } from './goals.js';
import { initializeAutoId, getAnonymousId, resetAnonymousId, getAutoIdDiagnostics } from './auto-id.js';

export * from './ld-client.js';
export * from './goals.js';
export * from './targeting.js';
export * from './manifest.js';
export * from './conflicts.js';
export * from './init.js';

export interface InjectorConfig extends LDClientConfig {
  flagKey: string;
  spaMode?: boolean;
  autoId?: AutoIdOptions;
  onReady?: () => void;
  onError?: (error: any) => void;
  relyOnLDEvaluationExposure?: boolean;
  debug?: boolean;
}

export interface WebExpInjector {
  applyFromVariationJSON(payload: WebExpPayloadV1, options?: { relyOnLDEvaluationExposure?: boolean }): Promise<void>;
  bindGoals(goals: WebExpGoal[], trackFunction?: (eventKey: string, data?: any) => void): void;
  getClient(): WebExpClient | null;
  getGoalTracker(): GoalTracker;
  destroy(): void;
}

let globalInjector: WebExpInjector | null = null;

function collectTargetSelectors(ops: WebExpOp[]): string[] {
  const selectors = new Set<string>();
  for (const op of ops) {
    // Discriminated by op.op
    // @ts-ignore
    const kind = op.op as string;
    if (!kind) continue;
    // @ts-ignore
    if (op.selector) selectors.add(op.selector as string);
    // @ts-ignore
    if (op.targetSelector) selectors.add(op.targetSelector as string);
    // @ts-ignore
    if (op.containerSelector) selectors.add(op.containerSelector as string);
  }
  return Array.from(selectors);
}

/**
 * Initialize the web experiment injector
 */
export async function init(config: InjectorConfig): Promise<WebExpInjector> {
  const {
    flagKey,
    spaMode = false,
    autoId,
    onReady,
    onError,
    relyOnLDEvaluationExposure = true,
    debug = false,
    ...ldConfig
  } = config;
  
  // Cleanup any existing injector
  if (globalInjector) {
    globalInjector.destroy();
  }
  
  let client: WebExpClient | null = null;
  const goalTracker = createGoalTracker();
  
  try {
    // Initialize auto-ID if configured
    let contextWithAutoId = ldConfig.context;
    if (autoId?.enabled === false) {
      initializeAutoId({ enabled: false });
      if (!ldConfig.context) {
        contextWithAutoId = undefined as any;
      }
    } else {
      try {
        const autoIdManager = initializeAutoId(autoId || {});
        const anonymousId = await autoIdManager.getOrCreateId();
        
        if (anonymousId && (!ldConfig.context?.key)) {
          contextWithAutoId = {
            kind: 'user',
            key: anonymousId,
            anonymous: true,
            ...ldConfig.context
          };
          if (debug) console.info(`[WebExp] Using auto-generated anonymous ID: ${anonymousId}`);
        } else if (!anonymousId && !ldConfig.context) {
          contextWithAutoId = undefined as any;
        }
      } catch (autoIdError) {
        console.error('[WebExp] Auto-ID error:', autoIdError);
        if (!ldConfig.context) {
          contextWithAutoId = undefined as any;
        }
      }
    }
    
    // Initialize LaunchDarkly client with potentially auto-generated context
    client = await createLDClient({
      ...ldConfig,
      context: (contextWithAutoId as any) ?? undefined
    });
    
    // Get initial variation and apply
    const payload = await client.getVariation(flagKey, createEmptyPayload());
    
    // Apply initial payload
    if (payload.ops.length > 0) {
      const maskSelectors = collectTargetSelectors(payload.ops as any);
      if (maskSelectors.length > 0) {
        try {
          applyMask({ selectors: maskSelectors });
        } catch {}
      }
      const result = applyPayload(payload, { spa: spaMode });
      if (!result.success) {
        console.warn('[WebExp] Initial payload application had errors:', result.errors);
      }
      try { removeMask(); } catch {}
      
      if (debug) console.info('[WebExp] Applied initial payload', { flagKey, ops: payload.ops.length });
      
      // Enable SPA mode if requested
      if (spaMode) {
        enableSpaMode(payload);
        if (debug) console.info('[WebExp] SPA mode enabled');
      }
      
      // Bind goals if present
      if (payload.goals && payload.goals.length > 0) {
        goalTracker.bind(payload.goals, (eventKey, data) => {
          client!.track(eventKey, data);
        });
      }
    }
    
    if (debug) console.info(`[WebExp] Injector initialized for flag: ${flagKey}`);
    if (onReady) onReady();
    
  } catch (error) {
    console.error('[WebExp] Injector initialization failed:', error);
    if (onError) onError(error);
    throw error;
  }
  
  const injector: WebExpInjector = {
    async applyFromVariationJSON(payload: WebExpPayloadV1, options = {}): Promise<void> {
      const { relyOnLDEvaluationExposure: relyOnLD = relyOnLDEvaluationExposure } = options;
      
      try {
        const maskSelectors = collectTargetSelectors(payload.ops as any);
        if (maskSelectors.length > 0) {
          try { applyMask({ selectors: maskSelectors }); } catch {}
        }
        const result = applyPayload(payload, { spa: spaMode });
        if (!result.success) {
          console.warn('[WebExp] Payload application had errors:', result.errors);
        }
        try { removeMask(); } catch {}
        
        if (debug) console.info('[WebExp] Applied variation JSON', { ops: payload.ops.length });
        
        if (payload.goals && payload.goals.length > 0) {
          goalTracker.bind(payload.goals, (eventKey, data) => {
            if (client) client.track(eventKey, data);
          });
        }
        
        if (!relyOnLD && client) {
          client.track('webexp_exposure', { flagKey, variation: 'applied' });
        }
        
      } catch (error) {
        console.error('[WebExp] Error applying variation JSON:', error);
        throw error;
      }
    },
    
    bindGoals(goals: WebExpGoal[], trackFunction?: (eventKey: string, data?: any) => void): void {
      const defaultTracker = (eventKey: string, data?: any) => {
        if (client) {
          client.track(eventKey, data);
        }
      };
      
      goalTracker.bind(goals, trackFunction || defaultTracker);
    },
    
    getClient(): WebExpClient | null {
      return client;
    },
    
    getGoalTracker(): GoalTracker {
      return goalTracker;
    },
    
    destroy(): void {
      goalTracker.unbind();
      cleanupPatchEngine();
      if (client) {
        client.close();
        client = null;
      }
      if (debug) console.info('[WebExp] Injector destroyed');
    }
  };
  
  globalInjector = injector;
  return injector;
}

/**
 * Get the global injector instance
 */
export function getInjector(): WebExpInjector | null {
  return globalInjector;
}

/**
 * Apply a payload using the global injector
 */
export async function applyFromVariationJSON(payload: WebExpPayloadV1, options?: { relyOnLDEvaluationExposure?: boolean }): Promise<void> {
  if (!globalInjector) {
    throw new Error('Injector not initialized. Call init() first.');
  }
  
  return globalInjector.applyFromVariationJSON(payload, options);
}

/**
 * Bind goals using the global injector
 */
export function bindGoals(goals: WebExpGoal[], trackFunction?: (eventKey: string, data?: any) => void): void {
  if (!globalInjector) {
    throw new Error('Injector not initialized. Call init() first.');
  }
  
  globalInjector.bindGoals(goals, trackFunction);
}

/**
 * Create context helpers (re-exported for convenience)
 */
export { createAnonymousContext, createUserContext };

/**
 * Auto-ID management functions
 */
export { getAnonymousId, resetAnonymousId, getAutoIdDiagnostics };

/**
 * Cleanup function for page unload
 */
export function cleanup(): void {
  if (globalInjector) {
    globalInjector.destroy();
    globalInjector = null;
  }
}

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanup);
}
