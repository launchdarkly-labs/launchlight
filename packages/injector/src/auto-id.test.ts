import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AutoIdManager, initializeAutoId, getAnonymousId, resetAnonymousId, getAutoIdDiagnostics } from './auto-id.js';
import type { AutoIdOptions } from '@webexp/shared';

// Mock the shared utilities
vi.mock('@webexp/shared', async () => {
  const actual = await vi.importActual('@webexp/shared');
  return {
    ...actual,
    AnonymousIdStorage: {
      retrieve: vi.fn(),
      store: vi.fn(),
      delete: vi.fn()
    },
    PrivacyManager: {
      isDoNotTrackEnabled: vi.fn(() => false),
      isSecureContext: vi.fn(() => true),
      checkConsent: vi.fn(() => true)
    },
    IdGenerator: {
      generate: vi.fn(() => 'webexp_mockedid123456789012'),
      generateSession: vi.fn(() => 'webexp_smocked123456789'),
      validate: vi.fn(() => true)
    },
    validateAutoIdOptions: vi.fn(() => ({ success: true }))
  };
});

import { AnonymousIdStorage, PrivacyManager, IdGenerator } from '@webexp/shared';

describe('AutoIdManager', () => {
  beforeEach(() => {
    // Reset singleton
    AutoIdManager.resetInstance();
    
    // Reset mocks
    vi.clearAllMocks();
    
    // Set up default mock implementations
    (PrivacyManager.isDoNotTrackEnabled as any).mockReturnValue(false);
    (PrivacyManager.isSecureContext as any).mockReturnValue(true);
    (PrivacyManager.checkConsent as any).mockReturnValue(true);
    (IdGenerator.generate as any).mockReturnValue('webexp_mockedid123456789012');
    (IdGenerator.validate as any).mockReturnValue(true);
  });

  describe('getInstance', () => {
    it('should create singleton instance', () => {
      const options: AutoIdOptions = { enabled: true };
      const instance1 = AutoIdManager.getInstance(options);
      const instance2 = AutoIdManager.getInstance(options);
      
      expect(instance1).toBe(instance2);
    });

    it('should apply default options', () => {
      const instance = AutoIdManager.getInstance({});
      expect(instance).toBeDefined();
    });
  });

  describe('getOrCreateId', () => {
    it('should return cached ID if available', async () => {
      const manager = AutoIdManager.getInstance({ enabled: true });
      
      // Mock existing ID retrieval
      (AnonymousIdStorage.retrieve as any).mockReturnValue({
        success: true,
        value: 'existing_id',
        method: 'cookie'
      });
      
      const id1 = await manager.getOrCreateId();
      const id2 = await manager.getOrCreateId();
      
      expect(id1).toBe('existing_id');
      expect(id2).toBe('existing_id');
      expect(AnonymousIdStorage.retrieve).toHaveBeenCalledTimes(1);
    });

    it('should return null when disabled', async () => {
      const manager = AutoIdManager.getInstance({ enabled: false });
      const id = await manager.getOrCreateId();
      
      expect(id).toBe(null);
      expect(AnonymousIdStorage.retrieve).not.toHaveBeenCalled();
    });

    it('should return null when Do Not Track is enabled', async () => {
      (PrivacyManager.isDoNotTrackEnabled as any).mockReturnValue(true);
      
      const manager = AutoIdManager.getInstance({ 
        enabled: true,
        respectDoNotTrack: true 
      });
      
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const id = await manager.getOrCreateId();
      
      expect(id).toBe(null);
      expect(consoleInfoSpy).toHaveBeenCalledWith('[WebExp] Auto-ID disabled due to Do Not Track');
      
      consoleInfoSpy.mockRestore();
    });

    it('should return null when consent is required but not granted', async () => {
      (PrivacyManager.checkConsent as any).mockReturnValue(false);
      
      const manager = AutoIdManager.getInstance({ 
        enabled: true,
        requireConsent: true 
      });
      
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const id = await manager.getOrCreateId();
      
      expect(id).toBe(null);
      expect(consoleInfoSpy).toHaveBeenCalledWith('[WebExp] Auto-ID disabled due to missing consent');
      
      consoleInfoSpy.mockRestore();
    });

    it('should retrieve existing valid ID', async () => {
      (AnonymousIdStorage.retrieve as any).mockReturnValue({
        success: true,
        value: 'existing_valid_id',
        method: 'cookie'
      });
      
      const manager = AutoIdManager.getInstance({ enabled: true });
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      
      const id = await manager.getOrCreateId();
      
      expect(id).toBe('existing_valid_id');
      expect(consoleInfoSpy).toHaveBeenCalledWith('[WebExp] Retrieved anonymous ID from cookie');
      
      consoleInfoSpy.mockRestore();
    });

    it('should generate new ID when none exists', async () => {
      (AnonymousIdStorage.retrieve as any).mockReturnValue({
        success: false,
        error: 'No stored ID found',
        method: 'none'
      });
      
      (AnonymousIdStorage.store as any).mockReturnValue({
        success: true,
        value: 'webexp_mockedid123456789012',
        method: 'cookie'
      });
      
      const manager = AutoIdManager.getInstance({ enabled: true });
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      
      const id = await manager.getOrCreateId();
      
      expect(id).toBe('webexp_mockedid123456789012');
      expect(IdGenerator.generate).toHaveBeenCalled();
      expect(AnonymousIdStorage.store).toHaveBeenCalled();
      expect(consoleInfoSpy).toHaveBeenCalledWith('[WebExp] Generated and stored new anonymous ID via cookie');
      
      consoleInfoSpy.mockRestore();
    });

    it('should clean up invalid stored ID and generate new one', async () => {
      (AnonymousIdStorage.retrieve as any).mockReturnValue({
        success: true,
        value: 'invalid_id_format',
        method: 'cookie'
      });
      
      (IdGenerator.validate as any).mockReturnValue(false);
      (AnonymousIdStorage.store as any).mockReturnValue({
        success: true,
        value: 'webexp_mockedid123456789012',
        method: 'cookie'
      });
      
      const manager = AutoIdManager.getInstance({ enabled: true });
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const id = await manager.getOrCreateId();
      
      expect(id).toBe('webexp_mockedid123456789012');
      expect(AnonymousIdStorage.delete).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith('[WebExp] Invalid stored ID format, will generate new one');
      
      consoleWarnSpy.mockRestore();
    });

    it('should fall back to session ID when storage fails', async () => {
      (AnonymousIdStorage.retrieve as any).mockReturnValue({
        success: false,
        error: 'No stored ID found',
        method: 'none'
      });
      
      (AnonymousIdStorage.store as any).mockReturnValue({
        success: false,
        error: 'Storage failed',
        method: 'none'
      });
      
      const manager = AutoIdManager.getInstance({ 
        enabled: true,
        storageFallback: 'localStorage'
      });
      
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const id = await manager.getOrCreateId();
      
      expect(id).toBe('webexp_smocked123456789');
      expect(IdGenerator.generateSession).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith('[WebExp] Failed to store anonymous ID: Storage failed');
      expect(consoleInfoSpy).toHaveBeenCalledWith('[WebExp] Using session-only ID as fallback');
      
      consoleInfoSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it('should return null when storage fails and fallback is disabled', async () => {
      (AnonymousIdStorage.retrieve as any).mockReturnValue({
        success: false,
        error: 'No stored ID found',
        method: 'none'
      });
      
      (AnonymousIdStorage.store as any).mockReturnValue({
        success: false,
        error: 'Storage failed',
        method: 'none'
      });
      
      const manager = AutoIdManager.getInstance({ 
        enabled: true,
        storageFallback: 'none'
      });
      
      const id = await manager.getOrCreateId();
      expect(id).toBe(null);
    });
  });

  describe('getCurrentId', () => {
    it('should return cached ID without generating new one', () => {
      const manager = AutoIdManager.getInstance({ enabled: true });
      
      // Mock that no cached ID exists
      const id = manager.getCurrentId();
      
      expect(id).toBe(null);
      expect(IdGenerator.generate).not.toHaveBeenCalled();
    });
  });

  describe('resetId', () => {
    it('should clear stored ID and cache', () => {
      const manager = AutoIdManager.getInstance({ enabled: true });
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      
      manager.resetId();
      
      expect(AnonymousIdStorage.delete).toHaveBeenCalled();
      expect(consoleInfoSpy).toHaveBeenCalledWith('[WebExp] Resetting anonymous ID');
      
      consoleInfoSpy.mockRestore();
    });
  });

  describe('getDiagnostics', () => {
    it('should return diagnostic information', () => {
      const manager = AutoIdManager.getInstance({ enabled: true });
      const diagnostics = manager.getDiagnostics();
      
      expect(diagnostics).toHaveProperty('cookiesAvailable');
      expect(diagnostics).toHaveProperty('localStorageAvailable');
      expect(diagnostics).toHaveProperty('doNotTrack');
      expect(diagnostics).toHaveProperty('secureContext');
      expect(diagnostics).toHaveProperty('currentId');
      expect(diagnostics).toHaveProperty('storageMethod');
    });
  });
});

describe('Global auto-ID functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initializeAutoId', () => {
    it('should initialize global manager', () => {
      const options: AutoIdOptions = { enabled: true };
      const manager = initializeAutoId(options);
      
      expect(manager).toBeInstanceOf(AutoIdManager);
    });
  });

  describe('getAnonymousId', () => {
    it('should return undefined when not initialized', () => {
      const id = getAnonymousId();
      expect(id).toBe(undefined);
    });

    it('should return current ID when initialized', () => {
      initializeAutoId({ enabled: true });
      
      // Mock that there's a current ID
      (AnonymousIdStorage.retrieve as any).mockReturnValue({
        success: true,
        value: 'current_id',
        method: 'cookie'
      });
      
      const id = getAnonymousId();
      expect(id).toBe('current_id');
    });
  });

  describe('resetAnonymousId', () => {
    it('should reset when manager exists', () => {
      const manager = initializeAutoId({ enabled: true });
      const resetSpy = vi.spyOn(manager, 'resetId');
      
      resetAnonymousId();
      
      expect(resetSpy).toHaveBeenCalled();
      resetSpy.mockRestore();
    });

    it('should not error when manager does not exist', () => {
      expect(() => resetAnonymousId()).not.toThrow();
    });
  });

  describe('getAutoIdDiagnostics', () => {
    it('should return default diagnostics when not initialized', () => {
      const diagnostics = getAutoIdDiagnostics();
      
      expect(diagnostics).toHaveProperty('cookiesAvailable');
      expect(diagnostics).toHaveProperty('localStorageAvailable');
      expect(diagnostics).toHaveProperty('doNotTrack');
      expect(diagnostics).toHaveProperty('secureContext');
      expect(diagnostics.currentId).toBe(null);
      expect(diagnostics.storageMethod).toBe('none');
    });

    it('should return manager diagnostics when initialized', () => {
      const manager = initializeAutoId({ enabled: true });
      const mockDiagnostics = {
        cookiesAvailable: true,
        localStorageAvailable: true,
        doNotTrack: false,
        secureContext: true,
        currentId: 'test_id',
        storageMethod: 'cookie'
      };
      
      vi.spyOn(manager, 'getDiagnostics').mockReturnValue(mockDiagnostics);
      
      const diagnostics = getAutoIdDiagnostics();
      expect(diagnostics).toEqual(mockDiagnostics);
    });
  });
});
