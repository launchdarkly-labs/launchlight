import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CookieManager, LocalStorageManager, PrivacyManager, AnonymousIdStorage } from './storage-utils.js';
import type { CookieConfig, AutoIdOptions } from './types.js';

// Mock document.cookie
let mockCookies: Record<string, string> = {};

Object.defineProperty(document, 'cookie', {
  get: () => {
    return Object.entries(mockCookies)
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
  },
  set: (cookieString: string) => {
    const [nameValue] = cookieString.split(';');
    const [name, value] = nameValue.split('=');
    if (value === '' || cookieString.includes('expires=Thu, 01 Jan 1970')) {
      delete mockCookies[name];
    } else {
      mockCookies[name] = value;
    }
  }
});

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock navigator
Object.defineProperty(navigator, 'cookieEnabled', {
  value: true,
  writable: true
});

Object.defineProperty(navigator, 'doNotTrack', {
  value: '0',
  writable: true
});

describe('CookieManager', () => {
  beforeEach(() => {
    mockCookies = {};
  });

  describe('set', () => {
    it('should set a cookie with all options', () => {
      const config: CookieConfig = {
        name: 'test_cookie',
        value: 'test_value',
        ttlDays: 30,
        sameSite: 'Lax',
        secure: true,
        path: '/',
        domain: 'example.com'
      };

      const result = CookieManager.set(config);
      expect(result).toBe(true);
      expect(CookieManager.get('test_cookie')).toBe('test_value');
    });

    it('should handle URL encoding in cookie values', () => {
      const config: CookieConfig = {
        name: 'test cookie',
        value: 'test value with spaces',
        ttlDays: 1,
        sameSite: 'Lax',
        secure: false,
        path: '/'
      };

      const result = CookieManager.set(config);
      expect(result).toBe(true);
      expect(CookieManager.get('test cookie')).toBe('test value with spaces');
    });
  });

  describe('get', () => {
    it('should retrieve existing cookie', () => {
      mockCookies['existing'] = 'value';
      expect(CookieManager.get('existing')).toBe('value');
    });

    it('should return null for non-existent cookie', () => {
      expect(CookieManager.get('nonexistent')).toBe(null);
    });

    it('should handle URL decoding', () => {
      mockCookies['test%20cookie'] = 'test%20value';
      expect(CookieManager.get('test cookie')).toBe('test value');
    });
  });

  describe('delete', () => {
    it('should delete existing cookie', () => {
      mockCookies['to_delete'] = 'value';
      const result = CookieManager.delete('to_delete');
      expect(result).toBe(true);
      expect(CookieManager.get('to_delete')).toBe(null);
    });
  });

  describe('isAvailable', () => {
    it('should return true when cookies are available', () => {
      expect(CookieManager.isAvailable()).toBe(true);
    });
  });
});

describe('LocalStorageManager', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  describe('set', () => {
    it('should set value with TTL', () => {
      const result = LocalStorageManager.set('test_key', 'test_value', 30);
      expect(result).toBe(true);
      expect(LocalStorageManager.get('test_key')).toBe('test_value');
    });

    it('should store expiration data', () => {
      LocalStorageManager.set('test_key', 'test_value', 1);
      const storedData = JSON.parse(mockLocalStorage.getItem('test_key')!);
      expect(storedData.value).toBe('test_value');
      expect(storedData.expiration).toBeGreaterThan(Date.now());
    });
  });

  describe('get', () => {
    it('should retrieve non-expired value', () => {
      LocalStorageManager.set('test_key', 'test_value', 30);
      expect(LocalStorageManager.get('test_key')).toBe('test_value');
    });

    it('should return null for expired value', () => {
      // Set with past expiration
      const expiredData = {
        value: 'expired_value',
        expiration: Date.now() - 1000
      };
      mockLocalStorage.setItem('expired_key', JSON.stringify(expiredData));
      
      expect(LocalStorageManager.get('expired_key')).toBe(null);
      expect(mockLocalStorage.getItem('expired_key')).toBe(null);
    });

    it('should handle corrupted data gracefully', () => {
      mockLocalStorage.setItem('corrupted', 'invalid json');
      expect(LocalStorageManager.get('corrupted')).toBe(null);
      expect(mockLocalStorage.getItem('corrupted')).toBe(null);
    });
  });

  describe('delete', () => {
    it('should delete existing item', () => {
      LocalStorageManager.set('to_delete', 'value', 1);
      const result = LocalStorageManager.delete('to_delete');
      expect(result).toBe(true);
      expect(LocalStorageManager.get('to_delete')).toBe(null);
    });
  });

  describe('isAvailable', () => {
    it('should return true when localStorage is available', () => {
      expect(LocalStorageManager.isAvailable()).toBe(true);
    });
  });
});

describe('PrivacyManager', () => {
  describe('isDoNotTrackEnabled', () => {
    it('should return false when DNT is not set', () => {
      (navigator as any).doNotTrack = '0';
      expect(PrivacyManager.isDoNotTrackEnabled()).toBe(false);
    });

    it('should return true when DNT is enabled', () => {
      (navigator as any).doNotTrack = '1';
      expect(PrivacyManager.isDoNotTrackEnabled()).toBe(true);
    });

    it('should handle "yes" value', () => {
      (navigator as any).doNotTrack = 'yes';
      expect(PrivacyManager.isDoNotTrackEnabled()).toBe(true);
    });
  });

  describe('isSecureContext', () => {
    it('should return true for HTTPS', () => {
      Object.defineProperty(window, 'location', {
        value: { protocol: 'https:', hostname: 'example.com' },
        writable: true
      });
      expect(PrivacyManager.isSecureContext()).toBe(true);
    });

    it('should return true for localhost', () => {
      Object.defineProperty(window, 'location', {
        value: { protocol: 'http:', hostname: 'localhost' },
        writable: true
      });
      expect(PrivacyManager.isSecureContext()).toBe(true);
    });

    it('should return false for HTTP on non-localhost', () => {
      Object.defineProperty(window, 'location', {
        value: { protocol: 'http:', hostname: 'example.com' },
        writable: true
      });
      expect(PrivacyManager.isSecureContext()).toBe(false);
    });
  });

  describe('checkConsent', () => {
    it('should return true when consent is not required', () => {
      const options: AutoIdOptions = { requireConsent: false };
      expect(PrivacyManager.checkConsent(options)).toBe(true);
    });

    it('should return true when consent callback returns true', () => {
      const options: AutoIdOptions = {
        requireConsent: true,
        consentGranted: () => true
      };
      expect(PrivacyManager.checkConsent(options)).toBe(true);
    });

    it('should return false when consent callback returns false', () => {
      const options: AutoIdOptions = {
        requireConsent: true,
        consentGranted: () => false
      };
      expect(PrivacyManager.checkConsent(options)).toBe(false);
    });

    it('should return false when consent required but no callback provided', () => {
      const options: AutoIdOptions = { requireConsent: true };
      expect(PrivacyManager.checkConsent(options)).toBe(false);
    });

    it('should handle callback errors gracefully', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const options: AutoIdOptions = {
        requireConsent: true,
        consentGranted: () => { throw new Error('Callback error'); }
      };
      
      expect(PrivacyManager.checkConsent(options)).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalled();
      
      consoleWarnSpy.mockRestore();
    });
  });
});

describe('AnonymousIdStorage', () => {
  beforeEach(() => {
    mockCookies = {};
    mockLocalStorage.clear();
  });

  const defaultOptions: AutoIdOptions = {
    cookieName: 'test_id',
    ttlDays: 30,
    sameSite: 'Lax',
    secure: false,
    path: '/',
    storageFallback: 'localStorage'
  };

  describe('store', () => {
    it('should store in cookies when available', () => {
      const result = AnonymousIdStorage.store('test_id_123', defaultOptions);
      
      expect(result.success).toBe(true);
      expect(result.method).toBe('cookie');
      expect(result.value).toBe('test_id_123');
      expect(CookieManager.get('test_id')).toBe('test_id_123');
    });

    it('should fall back to localStorage when cookies fail', () => {
      // Mock cookie failure
      vi.spyOn(CookieManager, 'isAvailable').mockReturnValue(false);
      
      const result = AnonymousIdStorage.store('test_id_123', defaultOptions);
      
      expect(result.success).toBe(true);
      expect(result.method).toBe('localStorage');
      expect(result.value).toBe('test_id_123');
      expect(LocalStorageManager.get('test_id')).toBe('test_id_123');
      
      vi.restoreAllMocks();
    });

    it('should fail when no storage is available', () => {
      const options: AutoIdOptions = {
        ...defaultOptions,
        storageFallback: 'none'
      };
      
      vi.spyOn(CookieManager, 'isAvailable').mockReturnValue(false);
      
      const result = AnonymousIdStorage.store('test_id_123', options);
      
      expect(result.success).toBe(false);
      expect(result.method).toBe('none');
      expect(result.error).toBe('No storage method available');
      
      vi.restoreAllMocks();
    });
  });

  describe('retrieve', () => {
    it('should retrieve from cookies when available', () => {
      mockCookies['test_id'] = 'cookie_value';
      
      const result = AnonymousIdStorage.retrieve(defaultOptions);
      
      expect(result.success).toBe(true);
      expect(result.method).toBe('cookie');
      expect(result.value).toBe('cookie_value');
    });

    it('should fall back to localStorage when cookies empty', () => {
      LocalStorageManager.set('test_id', 'localStorage_value', 30);
      
      const result = AnonymousIdStorage.retrieve(defaultOptions);
      
      expect(result.success).toBe(true);
      expect(result.method).toBe('localStorage');
      expect(result.value).toBe('localStorage_value');
    });

    it('should return failure when no value found', () => {
      const result = AnonymousIdStorage.retrieve(defaultOptions);
      
      expect(result.success).toBe(false);
      expect(result.method).toBe('none');
      expect(result.error).toBe('No stored ID found');
    });
  });

  describe('delete', () => {
    it('should delete from all storage methods', () => {
      // Set in both storage methods
      mockCookies['test_id'] = 'cookie_value';
      LocalStorageManager.set('test_id', 'localStorage_value', 30);
      
      const result = AnonymousIdStorage.delete(defaultOptions);
      
      expect(result).toBe(true);
      expect(CookieManager.get('test_id')).toBe(null);
      expect(LocalStorageManager.get('test_id')).toBe(null);
    });
  });
});
