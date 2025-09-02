import type { AutoIdOptions, StorageResult } from '@webexp/shared';
import { 
  AnonymousIdStorage, 
  PrivacyManager, 
  IdGenerator,
  validateAutoIdOptions 
} from '@webexp/shared';

/**
 * Anonymous ID manager for LaunchDarkly contexts
 */
export class AutoIdManager {
  private static instance: AutoIdManager | null = null;
  private currentId: string | null = null;
  private options: Required<AutoIdOptions>;
  
  private constructor(options: AutoIdOptions) {
    // Set defaults for all options
    this.options = {
      enabled: options.enabled ?? true,
      cookieName: options.cookieName ?? 'ld_webexp_id',
      ttlDays: options.ttlDays ?? 365,
      sameSite: options.sameSite ?? 'Lax',
      secure: options.secure ?? PrivacyManager.isSecureContext(),
      path: options.path ?? '/',
      domain: options.domain ?? '',
      respectDoNotTrack: options.respectDoNotTrack ?? true,
      requireConsent: options.requireConsent ?? false,
      consentGranted: options.consentGranted ?? (() => true),
      storageFallback: options.storageFallback ?? 'localStorage'
    };
  }

  /**
   * Get or create singleton instance
   */
  static getInstance(options: AutoIdOptions = {}): AutoIdManager {
    if (!AutoIdManager.instance) {
      AutoIdManager.instance = new AutoIdManager(options);
    }
    return AutoIdManager.instance;
  }

  /**
   * Reset singleton instance (for testing)
   */
  static resetInstance(): void {
    AutoIdManager.instance = null;
  }

  /**
   * Get the current anonymous ID, generating one if needed
   */
  async getOrCreateId(): Promise<string | null> {
    // Return cached ID if available
    if (this.currentId) {
      return this.currentId;
    }

    // Check if auto-ID is disabled
    if (!this.options.enabled) {
      return null;
    }

    // Check Do Not Track if respect is enabled
    if (this.options.respectDoNotTrack && PrivacyManager.isDoNotTrackEnabled()) {
      console.info('[WebExp] Auto-ID disabled due to Do Not Track');
      return null;
    }

    // Check consent if required
    if (!PrivacyManager.checkConsent(this.options)) {
      console.info('[WebExp] Auto-ID disabled due to missing consent');
      return null;
    }

    // Try to retrieve existing ID
    const existing = this.retrieveExistingId();
    if (existing) {
      this.currentId = existing;
      return existing;
    }

    // Generate new ID
    return this.generateNewId();
  }

  /**
   * Get current ID without generating a new one
   */
  getCurrentId(): string | null {
    if (this.currentId) {
      return this.currentId;
    }

    // Try to retrieve from storage without generating
    return this.retrieveExistingId();
  }

  /**
   * Reset the current ID (for consent changes)
   */
  resetId(): void {
    console.info('[WebExp] Resetting anonymous ID');
    
    // Clear from storage
    AnonymousIdStorage.delete(this.options);
    
    // Clear cached ID
    this.currentId = null;
  }

  /**
   * Update options (for consent changes)
   */
  updateOptions(newOptions: Partial<AutoIdOptions>): void {
    // Validate new options
    const validation = validateAutoIdOptions(newOptions);
    if (!validation.success) {
      console.warn('[WebExp] Invalid auto-ID options:', validation.error);
      return;
    }

    // Merge with existing options
    this.options = {
      ...this.options,
      ...newOptions,
      // Re-apply defaults for undefined values
      secure: newOptions.secure ?? PrivacyManager.isSecureContext()
    };

    console.info('[WebExp] Auto-ID options updated');
  }

  /**
   * Retrieve existing ID from storage
   */
  private retrieveExistingId(): string | null {
    try {
      const result = AnonymousIdStorage.retrieve(this.options);
      
      if (result.success && result.value) {
        // Validate the retrieved ID
        if (IdGenerator.validate(result.value)) {
          console.info(`[WebExp] Retrieved anonymous ID from ${result.method}`);
          return result.value;
        } else {
          console.warn('[WebExp] Invalid stored ID format, will generate new one');
          // Clean up invalid stored ID
          AnonymousIdStorage.delete(this.options);
        }
      }
    } catch (error) {
      console.warn('[WebExp] Error retrieving stored ID:', error);
    }

    return null;
  }

  /**
   * Generate and store a new ID
   */
  private generateNewId(): string | null {
    try {
      // Generate new ID
      const newId = IdGenerator.generate();
      
      // Store the ID
      const storeResult = AnonymousIdStorage.store(newId, this.options);
      
      if (storeResult.success) {
        console.info(`[WebExp] Generated and stored new anonymous ID via ${storeResult.method}`);
        this.currentId = newId;
        return newId;
      } else {
        console.warn(`[WebExp] Failed to store anonymous ID: ${storeResult.error}`);
        
        // If we can't store persistently, return a session-only ID
        if (this.options.storageFallback !== 'none') {
          const sessionId = IdGenerator.generateSession();
          console.info('[WebExp] Using session-only ID as fallback');
          this.currentId = sessionId;
          return sessionId;
        }
      }
    } catch (error) {
      console.error('[WebExp] Error generating anonymous ID:', error);
    }

    return null;
  }

  /**
   * Get storage diagnostics for debugging
   */
  getDiagnostics(): {
    cookiesAvailable: boolean;
    localStorageAvailable: boolean;
    doNotTrack: boolean;
    secureContext: boolean;
    currentId: string | null;
    storageMethod: string;
  } {
    const currentId = this.getCurrentId();
    let storageMethod = 'none';
    
    if (currentId) {
      const result = AnonymousIdStorage.retrieve(this.options);
      storageMethod = result.method;
    }

    return {
      cookiesAvailable: typeof document !== 'undefined' && navigator.cookieEnabled,
      localStorageAvailable: typeof localStorage !== 'undefined',
      doNotTrack: PrivacyManager.isDoNotTrackEnabled(),
      secureContext: PrivacyManager.isSecureContext(),
      currentId,
      storageMethod
    };
  }
}

/**
 * Global auto-ID instance management
 */
let globalAutoIdManager: AutoIdManager | null = null;

/**
 * Initialize auto-ID with options
 */
export function initializeAutoId(options: AutoIdOptions): AutoIdManager {
  globalAutoIdManager = AutoIdManager.getInstance(options);
  return globalAutoIdManager;
}

/**
 * Get the current anonymous ID
 */
export function getAnonymousId(): string | undefined {
  if (!globalAutoIdManager) {
    return undefined;
  }
  
  return globalAutoIdManager.getCurrentId() ?? undefined;
}

/**
 * Reset the anonymous ID (for consent changes)
 */
export function resetAnonymousId(): void {
  if (globalAutoIdManager) {
    globalAutoIdManager.resetId();
  }
  // Ensure global manager is cleared for fresh initialization
  globalAutoIdManager = null;
}

/**
 * Get auto-ID diagnostics
 */
export function getAutoIdDiagnostics() {
  if (!globalAutoIdManager) {
    return {
      cookiesAvailable: typeof document !== 'undefined' && navigator.cookieEnabled,
      localStorageAvailable: typeof localStorage !== 'undefined',
      doNotTrack: PrivacyManager.isDoNotTrackEnabled(),
      secureContext: PrivacyManager.isSecureContext(),
      currentId: null,
      storageMethod: 'none'
    };
  }
  
  return globalAutoIdManager.getDiagnostics();
}
