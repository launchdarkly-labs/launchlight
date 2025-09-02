import * as LD from 'launchdarkly-js-client-sdk';
import type { WebExpPayloadV1 } from '@webexp/patch-engine';

export interface LDClientConfig {
  envKey: string;
  context?: LD.LDContext;
  options?: LD.LDOptions;
}

export interface WebExpClient {
  getVariation(flagKey: string, fallback?: WebExpPayloadV1): Promise<WebExpPayloadV1>;
  getRawVariation(flagKey: string): Promise<any>;
  track(eventKey: string, data?: any): void;
  close(): void;
  isReady(): boolean;
  onReady(callback: () => void): void;
  onError(callback: (error: any) => void): void;
}

/**
 * Create and initialize LaunchDarkly client for web experiments
 */
export async function createLDClient(config: LDClientConfig): Promise<WebExpClient> {
  const { envKey, context, options = {} } = config;
  
  // Default options optimized for web experiments
  const defaultOptions: LD.LDOptions = {
    streaming: true,
    useReport: false,
    sendEvents: true,
    allAttributesPrivate: false,
    sendEventsOnlyForVariation: true, // Only send events when variations are evaluated
    flushInterval: 30000,
    bootstrap: 'localStorage', // Cache flags in localStorage
    ...options
  };
  
  const client = LD.initialize(envKey, context as any, defaultOptions);
  
  let isReady = false;
  let readyCallbacks: (() => void)[] = [];
  let errorCallbacks: ((error: any) => void)[] = [];
  
  // Handle initialization
  try {
    await client.waitForInitialization();
    isReady = true;
    readyCallbacks.forEach(callback => callback());
    readyCallbacks = [];
  } catch (error) {
    console.error('[WebExp] LaunchDarkly initialization failed:', error);
    errorCallbacks.forEach(callback => callback(error));
    errorCallbacks = [];
    throw error;
  }
  
  // Listen for changes and errors
  client.on('change', () => {
    console.info('[WebExp] LaunchDarkly flag values updated');
  });
  
  client.on('error', (error: any) => {
    console.error('[WebExp] LaunchDarkly error:', error);
    errorCallbacks.forEach(callback => callback(error));
  });
  
  return {
    async getVariation(flagKey: string, fallback: WebExpPayloadV1 = { version: 1, ops: [] }): Promise<WebExpPayloadV1> {
      try {
        const variation = client.variation(flagKey, fallback);
        
        // Validate that we got a proper payload
        if (typeof variation === 'object' && variation !== null && 'version' in variation) {
          return variation as WebExpPayloadV1;
        }
        
        console.warn(`[WebExp] Invalid variation for flag ${flagKey}, using fallback`);
        return fallback;
      } catch (error) {
        console.error(`[WebExp] Error getting variation for flag ${flagKey}:`, error);
        return fallback;
      }
    },
    async getRawVariation(flagKey: string): Promise<any> {
      try {
        // Pass undefined default so LD returns null/undefined if off
        return (client as any).variation(flagKey);
      } catch (error) {
        console.error(`[WebExp] Error getting raw variation for flag ${flagKey}:`, error);
        return undefined;
      }
    },
    
    track(eventKey: string, data?: any): void {
      try {
        if (data !== undefined) {
          client.track(eventKey, data);
        } else {
          client.track(eventKey);
        }
      } catch (error) {
        console.error(`[WebExp] Error tracking event ${eventKey}:`, error);
      }
    },
    
    close(): void {
      client.close();
    },
    
    isReady(): boolean {
      return isReady;
    },
    
    onReady(callback: () => void): void {
      if (isReady) {
        callback();
      } else {
        readyCallbacks.push(callback);
      }
    },
    
    onError(callback: (error: any) => void): void {
      errorCallbacks.push(callback);
    }
  };
}

/**
 * Create anonymous context for web experiments
 */
export function createAnonymousContext(customAttributes?: Record<string, any>): LD.LDContext {
  return {
    kind: 'user',
    anonymous: true,
    ...customAttributes
  };
}

/**
 * Create user context for web experiments
 */
export function createUserContext(key: string, attributes?: Record<string, any>): LD.LDContext {
  return {
    kind: 'user',
    key,
    anonymous: false,
    ...attributes
  };
}
