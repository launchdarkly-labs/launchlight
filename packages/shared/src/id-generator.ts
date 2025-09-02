/**
 * Anonymous ID generator for LaunchDarkly contexts
 * Generates secure, URL-safe identifiers with good entropy
 */

/**
 * Generate a cryptographically secure random ID
 * Format: webexp_XXXXXXXXXXXXXXXXXXXXXXXX (32 chars total)
 * Uses crypto.getRandomValues when available, falls back to Math.random
 */
export function generateAnonymousId(): string {
  const prefix = 'webexp_';
  const length = 24; // Total length will be 32 chars including prefix
  
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // Use crypto.getRandomValues for cryptographically secure randomness
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    
    // Convert to URL-safe base64-like string
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
    
    return prefix + result;
  } else {
    // Fallback to Math.random (less secure but widely supported)
    console.warn('[WebExp] Using Math.random for ID generation - not cryptographically secure');
    
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    
    return prefix + result;
  }
}

/**
 * Validate an anonymous ID format
 * Must start with 'webexp_' followed by 24 alphanumeric characters
 */
export function isValidAnonymousId(id: string): boolean {
  if (typeof id !== 'string') {
    return false;
  }
  
  // Check format: webexp_ + 24 alphanumeric chars
  const pattern = /^webexp_[A-Za-z0-9]{24}$/;
  return pattern.test(id);
}

/**
 * Generate a timestamp-based ID (less secure, for fallback scenarios)
 * Format: webexp_t{timestamp}_{random}
 */
export function generateTimestampId(): string {
  const timestamp = Date.now().toString(36); // Base36 timestamp
  const random = Math.random().toString(36).substring(2, 8); // 6 random chars
  return `webexp_t${timestamp}_${random}`;
}

/**
 * Generate session-scoped ID (browser session only)
 * These IDs are designed to be ephemeral and not persisted
 */
export function generateSessionId(): string {
  const sessionMarker = 's'; // Indicates session-only ID
  const timestamp = Date.now().toString(36).substring(-6); // Last 6 chars of timestamp
  const random = Math.random().toString(36).substring(2, 12); // 10 random chars
  return `webexp_${sessionMarker}${timestamp}${random}`;
}

/**
 * ID generation utilities
 */
export const IdGenerator = {
  /**
   * Generate the best available anonymous ID
   */
  generate(): string {
    return generateAnonymousId();
  },

  /**
   * Generate a fallback ID when crypto is unavailable
   */
  generateFallback(): string {
    return generateTimestampId();
  },

  /**
   * Generate a session-only ID
   */
  generateSession(): string {
    return generateSessionId();
  },

  /**
   * Validate ID format
   */
  validate(id: string): boolean {
    return isValidAnonymousId(id);
  },

  /**
   * Check if ID is session-scoped
   */
  isSessionId(id: string): boolean {
    return typeof id === 'string' && id.includes('webexp_s');
  },

  /**
   * Check if ID is timestamp-based
   */
  isTimestampId(id: string): boolean {
    return typeof id === 'string' && id.includes('webexp_t');
  },

  /**
   * Extract creation time from timestamp-based IDs
   */
  getCreationTime(id: string): Date | null {
    if (!this.isTimestampId(id)) {
      return null;
    }

    try {
      const match = id.match(/webexp_t([a-z0-9]+)_/);
      if (match) {
        const timestamp = parseInt(match[1], 36);
        return new Date(timestamp);
      }
    } catch (error) {
      // Invalid timestamp format
    }

    return null;
  }
};
