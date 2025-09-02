/**
 * Client-side LaunchDarkly wrapper for web experiments
 */
import * as LD from 'launchdarkly-js-client-sdk';
import type { LDClientWrapper } from './types.js';

export interface ClientConfig {
  envKey: string;
  context?: LD.LDContext;
  options?: LD.LDOptions;
}

/**
 * Create a LaunchDarkly client wrapper for web experiments
 */
export async function createClient(config: ClientConfig): Promise<LDClientWrapper> {
  const { envKey, context = { kind: 'user', anonymous: true }, options = {} } = config;
  
  // Default options optimized for web experiments
  const defaultOptions: LD.LDOptions = {
    streaming: true,
    useReport: false,
    sendEvents: true,
    allAttributesPrivate: false,
    sendEventsOnlyForVariation: true,
    flushInterval: 30000,
    bootstrap: 'localStorage',
    ...options
  };
  
  const client = LD.initialize(envKey, context, defaultOptions);
  
  try {
    await client.waitForInitialization();
  } catch (error) {
    console.error('[WebExp] LaunchDarkly client initialization failed:', error);
    throw error;
  }
  
  return {
    variationJSON<T = any>(flagKey: string, fallback: T): T {
      try {
        return client.variation(flagKey, fallback);
      } catch (error) {
        console.error(`[WebExp] Error getting variation for flag ${flagKey}:`, error);
        return fallback;
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
