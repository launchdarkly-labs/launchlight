import type { WebExpPayloadV1, WebExpOp, WebExpGoal, OpResult, ValidationResult } from './types.js';
import { validatePayload } from './schemas.js';
import { applyOperation } from './operations.js';
import { applyMask, removeMask, applyMaskWithReveal } from './mask.js';
import { enableSpaMode, disableSpaMode, isSpaMode, reapplyPatches, updateSpaPayload } from './spa.js';
import { setResolverRoot } from './resolver.js';

export * from './types.js';
export * from './schemas.js';
export * from './operations.js';
export * from './resolver.js';
export * from './sanitizer.js';
export * from './mask.js';
export * from './spa.js';

export interface ApplyOptions {
  skipMask?: boolean;
  spa?: boolean;
  validateFirst?: boolean;
  onOpResult?: (op: WebExpOp, result: OpResult) => void;
}

/**
 * Apply operations to a specific root (Document or Element)
 */
export function applyOperations(root: Document | Element, ops: WebExpOp[], onOpResult?: (op: WebExpOp, result: OpResult) => void): {
  success: boolean;
  results: OpResult[];
  errors: string[];
} {
  const restore = setResolverRoot(root);
  const results: OpResult[] = [];
  const errors: string[] = [];
  try {
    for (const op of ops) {
      const result = applyOperation(op);
      results.push(result);
      if (!result.success) {
        errors.push(`Operation ${op.op} failed: ${result.error}`);
      }
      if (onOpResult) onOpResult(op, result);
    }
  } finally {
    restore();
  }
  return { success: errors.length === 0, results, errors };
}

/**
 * Apply a complete payload to the DOM
 */
export function applyPayload(payload: WebExpPayloadV1, options: ApplyOptions = {}): {
  success: boolean;
  results: OpResult[];
  errors: string[];
} {
  const { skipMask = false, spa = false, validateFirst = true, onOpResult } = options;
  
  // Validate payload first if requested
  if (validateFirst) {
    const validation = validatePayload(payload);
    if (!validation.success) {
      return {
        success: false,
        results: [],
        errors: [`Invalid payload: ${validation.error?.message || 'Unknown error'}`]
      };
    }
  }
  
  const results: OpResult[] = [];
  const errors: string[] = [];
  
  try {
    // Apply mask if specified and not skipped
    if (!skipMask && payload.mask) {
      if (spa) {
        applyMaskWithReveal(payload.mask, 50);
      } else {
        applyMask(payload.mask);
      }
    }
    
    // Apply operations
    for (const op of payload.ops) {
      const result = applyOperation(op);
      results.push(result);
      
      if (!result.success) {
        errors.push(`Operation ${op.op} failed: ${result.error}`);
      }
      
      // Call callback if provided
      if (onOpResult) {
        onOpResult(op, result);
      }
    }
    
    // Remove mask if we applied one and not in SPA mode
    if (!skipMask && payload.mask && !spa) {
      // Let mask timeout handle removal, or remove immediately if no timeout
      if (!payload.mask.timeoutMs) {
        removeMask();
      }
    }
    
    // Update SPA state if in SPA mode
    if (spa && isSpaMode()) {
      updateSpaPayload(payload);
    }
    
  } catch (error) {
    errors.push(`Payload application failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    // Always remove mask on error
    if (!skipMask) {
      removeMask();
    }
  }
  
  const success = errors.length === 0;
  
  console.info(`[WebExp] Applied payload with ${payload.ops.length} operations: ${success ? 'SUCCESS' : 'PARTIAL'}`);
  if (errors.length > 0) {
    console.warn('[WebExp] Errors:', errors);
  }
  
  return { success, results, errors };
}

/**
 * Apply a single operation
 */
export function applySingleOp(op: WebExpOp): OpResult {
  return applyOperation(op);
}

/**
 * Validate a payload and return detailed results
 */
export function validateExperimentPayload(payload: unknown): ValidationResult {
  // Schema validation
  const schemaResult = validatePayload(payload);
  if (!schemaResult.success) {
    return {
      valid: false,
      errors: [{
        path: 'root',
        message: schemaResult.error?.message || 'Invalid payload structure',
        severity: 'error'
      }]
    };
  }
  
  const validPayload = schemaResult.data;
  const errors: ValidationResult['errors'] = [];
  
  // Validate selectors
  validPayload.ops.forEach((op: WebExpOp, index: number) => {
    try {
      document.querySelector(op.selector);
    } catch (error) {
      errors.push({
        path: `ops[${index}].selector`,
        message: `Invalid selector: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error'
      });
    }
  });
  
  // Validate goals
  if (validPayload.goals) {
    validPayload.goals.forEach((goal: WebExpGoal, index: number) => {
      if (goal.type === 'click') {
        try {
          document.querySelector(goal.selector);
        } catch (error) {
          errors.push({
            path: `goals[${index}].selector`,
            message: `Invalid goal selector: ${error instanceof Error ? error.message : 'Unknown error'}`,
            severity: 'error'
          });
        }
      }
    });
  }
  
  // Size validation
  const jsonString = JSON.stringify(validPayload);
  const jsonSize = new Blob([jsonString]).size;
  const estimatedGzipSize = Math.ceil(jsonSize * 0.3);
  
  if (estimatedGzipSize > 20 * 1024) {
    errors.push({
      path: 'root',
      message: `Payload too large: ${Math.ceil(estimatedGzipSize / 1024)}KB (max 20KB)`,
      severity: 'error'
    });
  } else if (estimatedGzipSize > 15 * 1024) {
    errors.push({
      path: 'root',
      message: `Payload size warning: ${Math.ceil(estimatedGzipSize / 1024)}KB (approaching 20KB limit)`,
      severity: 'warning'
    });
  }
  
  return {
    valid: errors.filter(e => e.severity === 'error').length === 0,
    errors,
    sizeInfo: {
      jsonSize,
      gzippedSize: estimatedGzipSize
    }
  };
}

/**
 * Initialize patch engine
 */
export function initPatchEngine(): void {
  console.info('[WebExp] Patch engine initialized');
}

/**
 * Cleanup patch engine
 */
export function cleanupPatchEngine(): void {
  removeMask();
  disableSpaMode();
  console.info('[WebExp] Patch engine cleaned up');
}

/**
 * Patch engine utilities
 */
export const patchEngine = {
  apply: applyPayload,
  applyOp: applySingleOp,
  validate: validateExperimentPayload,
  init: initPatchEngine,
  cleanup: cleanupPatchEngine,
  
  // Mask utilities
  mask: {
    apply: applyMask,
    remove: removeMask,
    applyWithReveal: applyMaskWithReveal
  },
  
  // SPA utilities
  spa: {
    enable: enableSpaMode,
    disable: disableSpaMode,
    isEnabled: isSpaMode,
    reapply: reapplyPatches
  }
};
