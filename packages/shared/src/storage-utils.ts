import type { CookieConfig, StorageResult, AutoIdOptions } from './types.js';

/**
 * Cookie utilities for anonymous ID storage
 */
export class CookieManager {
  /**
   * Set a cookie with the given configuration
   */
  static set(config: CookieConfig): boolean {
    if (typeof document === 'undefined') {
      return false; // Server-side environment
    }

    try {
      const { name, value, ttlDays, sameSite, secure, path, domain } = config;
      
      // Calculate expiration date
      const expires = new Date();
      expires.setTime(expires.getTime() + (ttlDays * 24 * 60 * 60 * 1000));
      
      // Build cookie string
      let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
      cookieString += `; expires=${expires.toUTCString()}`;
      cookieString += `; path=${path}`;
      cookieString += `; SameSite=${sameSite}`;
      
      if (secure) {
        cookieString += '; Secure';
      }
      
      if (domain) {
        cookieString += `; Domain=${domain}`;
      }
      
      document.cookie = cookieString;
      
      // Verify cookie was set
      return this.get(name) === value;
    } catch (error) {
      console.warn('[WebExp] Failed to set cookie:', error);
      return false;
    }
  }

  /**
   * Get a cookie value by name
   */
  static get(name: string): string | null {
    if (typeof document === 'undefined') {
      return null; // Server-side environment
    }

    try {
      const nameEQ = encodeURIComponent(name) + '=';
      const cookies = document.cookie.split(';');
      
      for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.indexOf(nameEQ) === 0) {
          return decodeURIComponent(cookie.substring(nameEQ.length));
        }
      }
      
      return null;
    } catch (error) {
      console.warn('[WebExp] Failed to get cookie:', error);
      return null;
    }
  }

  /**
   * Delete a cookie by name
   */
  static delete(name: string, path = '/', domain?: string): boolean {
    if (typeof document === 'undefined') {
      return false; // Server-side environment
    }

    try {
      let cookieString = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`;
      
      if (domain) {
        cookieString += `; Domain=${domain}`;
      }
      
      document.cookie = cookieString;
      
      // Verify cookie was deleted
      return this.get(name) === null;
    } catch (error) {
      console.warn('[WebExp] Failed to delete cookie:', error);
      return false;
    }
  }

  /**
   * Check if cookies are available
   */
  static isAvailable(): boolean {
    if (typeof document === 'undefined') {
      return false; // Server-side environment
    }

    try {
      const testKey = '_webexp_test_cookie';
      const testValue = 'test';
      
      document.cookie = `${testKey}=${testValue}; path=/; SameSite=Lax`;
      const canRead = document.cookie.indexOf(`${testKey}=${testValue}`) !== -1;
      
      // Clean up test cookie
      if (canRead) {
        document.cookie = `${testKey}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
      }
      
      return canRead;
    } catch (error) {
      return false;
    }
  }
}

/**
 * LocalStorage utilities for anonymous ID storage
 */
export class LocalStorageManager {
  /**
   * Set a value in localStorage with TTL
   */
  static set(key: string, value: string, ttlDays: number): boolean {
    if (typeof localStorage === 'undefined') {
      return false; // Environment doesn't support localStorage
    }

    try {
      const expirationTime = Date.now() + (ttlDays * 24 * 60 * 60 * 1000);
      const data = {
        value,
        expiration: expirationTime
      };
      
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.warn('[WebExp] Failed to set localStorage:', error);
      return false;
    }
  }

  /**
   * Get a value from localStorage, respecting TTL
   */
  static get(key: string): string | null {
    if (typeof localStorage === 'undefined') {
      return null; // Environment doesn't support localStorage
    }

    try {
      const item = localStorage.getItem(key);
      if (!item) {
        return null;
      }

      const data = JSON.parse(item);
      
      // Check if expired
      if (data.expiration && Date.now() > data.expiration) {
        localStorage.removeItem(key);
        return null;
      }

      return data.value || null;
    } catch (error) {
      console.warn('[WebExp] Failed to get localStorage:', error);
      // Clean up corrupted data
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore cleanup errors
      }
      return null;
    }
  }

  /**
   * Delete a value from localStorage
   */
  static delete(key: string): boolean {
    if (typeof localStorage === 'undefined') {
      return false; // Environment doesn't support localStorage
    }

    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('[WebExp] Failed to delete localStorage:', error);
      return false;
    }
  }

  /**
   * Check if localStorage is available
   */
  static isAvailable(): boolean {
    if (typeof localStorage === 'undefined') {
      return false; // Environment doesn't support localStorage
    }

    try {
      const testKey = '_webexp_test_storage';
      const testValue = 'test';
      
      localStorage.setItem(testKey, testValue);
      const canRead = localStorage.getItem(testKey) === testValue;
      
      // Clean up test item
      if (canRead) {
        localStorage.removeItem(testKey);
      }
      
      return canRead;
    } catch (error) {
      return false;
    }
  }
}

/**
 * Privacy and consent utilities
 */
export class PrivacyManager {
  /**
   * Check if Do Not Track is enabled
   */
  static isDoNotTrackEnabled(): boolean {
    if (typeof navigator === 'undefined') {
      return false; // Server-side environment
    }

    const dnt = navigator.doNotTrack || 
                (navigator as any).msDoNotTrack || 
                (window as any).doNotTrack;
    
    return dnt === '1' || dnt === 'yes';
  }

  /**
   * Check if we're in a secure context (HTTPS)
   */
  static isSecureContext(): boolean {
    if (typeof window === 'undefined') {
      return false; // Server-side environment
    }

    return window.location.protocol === 'https:' || 
           window.location.hostname === 'localhost' ||
           window.location.hostname === '127.0.0.1';
  }

  /**
   * Check if user has granted consent (if required)
   */
  static checkConsent(options: AutoIdOptions): boolean {
    if (!options.requireConsent) {
      return true; // Consent not required
    }

    if (typeof options.consentGranted === 'function') {
      try {
        return options.consentGranted();
      } catch (error) {
        console.warn('[WebExp] Consent callback error:', error);
        return false;
      }
    }

    return false; // Consent required but no callback provided
  }
}

/**
 * Unified storage manager that handles both cookies and localStorage
 */
export class AnonymousIdStorage {
  /**
   * Store anonymous ID using the best available method
   */
  static store(id: string, options: AutoIdOptions): StorageResult {
    const {
      cookieName = 'ld_webexp_id',
      ttlDays = 365,
      sameSite = 'Lax',
      secure = PrivacyManager.isSecureContext(),
      path = '/',
      domain,
      storageFallback = 'localStorage'
    } = options;

    // Try cookies first
    if (CookieManager.isAvailable()) {
      const cookieConfig: CookieConfig = {
        name: cookieName,
        value: id,
        ttlDays,
        sameSite,
        secure,
        path,
        domain
      };

      if (CookieManager.set(cookieConfig)) {
        return {
          success: true,
          value: id,
          method: 'cookie'
        };
      }
    }

    // Fall back to localStorage if enabled
    if (storageFallback === 'localStorage' && LocalStorageManager.isAvailable()) {
      if (LocalStorageManager.set(cookieName, id, ttlDays)) {
        return {
          success: true,
          value: id,
          method: 'localStorage'
        };
      }
    }

    return {
      success: false,
      error: 'No storage method available',
      method: 'none'
    };
  }

  /**
   * Retrieve anonymous ID from storage
   */
  static retrieve(options: AutoIdOptions): StorageResult {
    const {
      cookieName = 'ld_webexp_id',
      storageFallback = 'localStorage'
    } = options;

    // Try cookies first
    const cookieValue = CookieManager.get(cookieName);
    if (cookieValue) {
      return {
        success: true,
        value: cookieValue,
        method: 'cookie'
      };
    }

    // Fall back to localStorage if enabled
    if (storageFallback === 'localStorage') {
      const localStorageValue = LocalStorageManager.get(cookieName);
      if (localStorageValue) {
        return {
          success: true,
          value: localStorageValue,
          method: 'localStorage'
        };
      }
    }

    return {
      success: false,
      error: 'No stored ID found',
      method: 'none'
    };
  }

  /**
   * Delete anonymous ID from all storage methods
   */
  static delete(options: AutoIdOptions): boolean {
    const {
      cookieName = 'ld_webexp_id',
      path = '/',
      domain,
      storageFallback = 'localStorage'
    } = options;

    let success = true;

    // Delete from cookies
    if (CookieManager.isAvailable()) {
      success = CookieManager.delete(cookieName, path, domain) && success;
    }

    // Delete from localStorage
    if (storageFallback === 'localStorage' && LocalStorageManager.isAvailable()) {
      success = LocalStorageManager.delete(cookieName) && success;
    }

    return success;
  }
}
