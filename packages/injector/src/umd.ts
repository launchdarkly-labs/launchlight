/**
 * UMD build for browser injection
 * This creates a global WebExpInjector object with the injector API
 */
import { 
  init, 
  getInjector, 
  applyFromVariationJSON, 
  bindGoals, 
  cleanup, 
  createAnonymousContext, 
  createUserContext,
  getAnonymousId,
  resetAnonymousId,
  getAutoIdDiagnostics
} from './index.js';

// Expose the API globally
(window as any).WebExpInjector = {
  init,
  getInjector,
  applyFromVariationJSON,
  bindGoals,
  cleanup,
  createAnonymousContext,
  createUserContext,
  getAnonymousId,
  resetAnonymousId,
  getAutoIdDiagnostics
};

export {
  init,
  getInjector,
  applyFromVariationJSON,
  bindGoals,
  cleanup,
  createAnonymousContext,
  createUserContext,
  getAnonymousId,
  resetAnonymousId,
  getAutoIdDiagnostics
};
