import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  generateAnonymousId, 
  isValidAnonymousId, 
  generateTimestampId, 
  generateSessionId, 
  IdGenerator 
} from './id-generator.js';

// Mock crypto for testing
const mockCrypto = {
  getRandomValues: vi.fn()
};

describe('generateAnonymousId', () => {
  beforeEach(() => {
    // Redefine global crypto to be writable in Node test env
    try {
      Object.defineProperty(global, 'crypto', { value: mockCrypto as any, configurable: true });
    } catch {
      // ignore
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should generate ID with correct format using crypto', () => {
    // Mock crypto.getRandomValues to return predictable values
    mockCrypto.getRandomValues.mockImplementation((array: Uint8Array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = i % 62; // Will map to chars 'A-Za-z0-9'
      }
      return array;
    });

    const id = generateAnonymousId();
    
    expect(id).toMatch(/^webexp_[A-Za-z0-9]{24}$/);
    // 'webexp_' is 7 chars; +24 random = 31
    expect(id.length).toBe(31);
    expect(mockCrypto.getRandomValues).toHaveBeenCalledTimes(1);
  });

  it('should fall back to Math.random when crypto unavailable', () => {
    try {
      Object.defineProperty(global, 'crypto', { value: undefined as any, configurable: true });
    } catch {
      // ignore
    }
    
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    const id = generateAnonymousId();
    
    expect(id).toMatch(/^webexp_[A-Za-z0-9]{24}$/);
    expect(id.length).toBe(31);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[WebExp] Using Math.random for ID generation - not cryptographically secure'
    );
    
    consoleWarnSpy.mockRestore();
  });

  it('should generate unique IDs', () => {
    // Force fallback randomness to avoid deterministic crypto mock
    try { Object.defineProperty(global, 'crypto', { value: undefined as any, configurable: true }); } catch {}
    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      ids.add(generateAnonymousId());
    }
    expect(ids.size).toBe(100);
  });
});

describe('isValidAnonymousId', () => {
  it('should validate correct format', () => {
    expect(isValidAnonymousId('webexp_ABCDEFGHIJKLMNOPQRSTabcd')).toBe(true);
    expect(isValidAnonymousId('webexp_1234567890abcdefghijklmn')).toBe(true);
  });

  it('should reject invalid formats', () => {
    expect(isValidAnonymousId('invalid_format')).toBe(false);
    expect(isValidAnonymousId('webexp_')).toBe(false);
    expect(isValidAnonymousId('webexp_short')).toBe(false);
    expect(isValidAnonymousId('webexp_toolongabcdefghijklmnopqrstuvwxyz')).toBe(false);
    expect(isValidAnonymousId('webexp_contains@invalidchars!')).toBe(false);
    expect(isValidAnonymousId('')).toBe(false);
    expect(isValidAnonymousId(null as any)).toBe(false);
    expect(isValidAnonymousId(undefined as any)).toBe(false);
    expect(isValidAnonymousId(123 as any)).toBe(false);
  });
});

describe('generateTimestampId', () => {
  it('should generate timestamp-based ID with correct format', () => {
    const id = generateTimestampId();
    
    expect(id).toMatch(/^webexp_t[a-z0-9]+_[a-z0-9]{6}$/);
    expect(id.startsWith('webexp_t')).toBe(true);
  });

  it('should generate unique IDs', () => {
    const ids = new Set();
    for (let i = 0; i < 10; i++) {
      ids.add(generateTimestampId());
    }
    expect(ids.size).toBe(10); // All should be unique
  });
});

describe('generateSessionId', () => {
  it('should generate session ID with correct format', () => {
    const id = generateSessionId();
    expect(id.startsWith('webexp_s')).toBe(true);
  });

  it('should generate unique session IDs', () => {
    const ids = new Set();
    for (let i = 0; i < 10; i++) {
      ids.add(generateSessionId());
    }
    expect(ids.size).toBe(10); // All should be unique
  });
});

describe('IdGenerator', () => {
  describe('generate', () => {
    it('should use generateAnonymousId', () => {
      const id = IdGenerator.generate();
      expect(id).toMatch(/^webexp_[A-Za-z0-9]{24}$/);
    });
  });

  describe('generateFallback', () => {
    it('should use generateTimestampId', () => {
      const id = IdGenerator.generateFallback();
      expect(id).toMatch(/^webexp_t[a-z0-9]+_[a-z0-9]{6}$/);
    });
  });

  describe('generateSession', () => {
    it('should use generateSessionId', () => {
      const id = IdGenerator.generateSession();
      expect(id.startsWith('webexp_s')).toBe(true);
    });
  });

  describe('validate', () => {
    it('should validate using isValidAnonymousId', () => {
      expect(IdGenerator.validate('webexp_ABCDEFGHIJKLMNOPQRSTabcd')).toBe(true);
      expect(IdGenerator.validate('invalid')).toBe(false);
    });
  });

  describe('isSessionId', () => {
    it('should identify session IDs', () => {
      const sessionId = IdGenerator.generateSession();
      const regularId = IdGenerator.generate();
      
      expect(IdGenerator.isSessionId(sessionId)).toBe(true);
      expect(IdGenerator.isSessionId(regularId)).toBe(false);
      expect(IdGenerator.isSessionId('webexp_sABCDEF1234567890')).toBe(true);
      expect(IdGenerator.isSessionId('webexp_regular_id')).toBe(false);
    });
  });

  describe('isTimestampId', () => {
    it('should identify timestamp IDs', () => {
      const timestampId = IdGenerator.generateFallback();
      const regularId = IdGenerator.generate();
      
      expect(IdGenerator.isTimestampId(timestampId)).toBe(true);
      expect(IdGenerator.isTimestampId(regularId)).toBe(false);
      expect(IdGenerator.isTimestampId('webexp_t12345_abc123')).toBe(true);
      expect(IdGenerator.isTimestampId('webexp_regular_id')).toBe(false);
    });
  });

  describe('getCreationTime', () => {
    it('should extract creation time from timestamp IDs', () => {
      const beforeTime = Date.now();
      const timestampId = IdGenerator.generateFallback();
      const afterTime = Date.now();
      
      const creationTime = IdGenerator.getCreationTime(timestampId);
      
      expect(creationTime).toBeInstanceOf(Date);
      expect(creationTime!.getTime()).toBeGreaterThanOrEqual(beforeTime);
      expect(creationTime!.getTime()).toBeLessThanOrEqual(afterTime);
    });

    it('should return null for non-timestamp IDs', () => {
      const regularId = IdGenerator.generate();
      const sessionId = IdGenerator.generateSession();
      
      expect(IdGenerator.getCreationTime(regularId)).toBe(null);
      expect(IdGenerator.getCreationTime(sessionId)).toBe(null);
      expect(IdGenerator.getCreationTime('invalid_id')).toBe(null);
    });

    it('should handle invalid timestamp format gracefully', () => {
      const invalidTimestampId = 'webexp_t_invalid_abc123';
      expect(IdGenerator.getCreationTime(invalidTimestampId)).toBe(null);
    });
  });
});
