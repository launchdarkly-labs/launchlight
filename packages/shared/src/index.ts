// Types
export type * from './types.js';

// Editor bridge protocol
export * from './editor/bridge.js';

// Schemas and validation
export * from './schemas.js';
export * from './schemas/targeting.js';
export * from './schemas/variation.js';
export * from './schemas/manifest.js';

// Selector utilities
export * from './selector-utils.js';

// Storage utilities
export * from './storage-utils.js';

// ID generation
export * from './id-generator.js';

// Canvas utilities
export * from './canvas-utils.js';

// Operation templates - moved to editor app to avoid circular dependency

// Preview manager - moved to editor package to avoid circular dependency

// Advanced goals - moved to editor app to avoid circular dependency

// QA tools
export * from './qa-tools.js';

// Collaboration
export * from './collaboration.js';

// Utilities
export * from './size.js';
export * from './cookies.js';

// Constants
export const WEBEXP_VERSION = 1;
export const MAX_PAYLOAD_SIZE_KB = 20;
export const DEFAULT_MASK_TIMEOUT_MS = 800;
export const MAX_MASK_TIMEOUT_MS = 5000;

// Default payload
export const createEmptyPayload = () => ({
  version: 1 as const,
  ops: []
});

// Utility functions
export const utils = {
  /**
   * Calculate gzipped size of a payload
   */
  estimateGzippedSize: (payload: unknown): number => {
    const jsonString = JSON.stringify(payload);
    // Rough estimation: gzip typically achieves 70-80% compression for JSON
    return Math.ceil(jsonString.length * 0.3);
  },

  /**
   * Check if payload exceeds size limits
   */
  checkPayloadSize: (payload: unknown): { withinLimit: boolean; size: number; limit: number } => {
    const size = utils.estimateGzippedSize(payload);
    const limit = MAX_PAYLOAD_SIZE_KB * 1024;
    return {
      withinLimit: size <= limit,
      size,
      limit
    };
  },

  /**
   * Deep clone a payload
   */
  clonePayload: <T>(payload: T): T => {
    return JSON.parse(JSON.stringify(payload));
  }
};
