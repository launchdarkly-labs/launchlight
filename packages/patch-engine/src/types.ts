// Web Experiment Operation Types
export type WebExpOp =
  | { op: 'textReplace'; selector: string; value: string }
  | { op: 'attrSet'; selector: string; name: string; value: string }
  | { op: 'classAdd' | 'classRemove' | 'classToggle'; selector: string; value: string }
  | { op: 'styleSet'; selector: string; name: string; value: string }
  | { op: 'imgSwap'; selector: string; src: string; alt?: string }
  | { op: 'remove'; selector: string }
  | { op: 'insertHTML'; selector: string; html: string }
  // DnD reorder ops (idempotent, structural):
  | { op: 'moveBefore'; selector: string; targetSelector: string }
  | { op: 'moveAfter'; selector: string; targetSelector: string }
  | { op: 'appendTo'; selector: string; containerSelector: string }
  | { op: 'duplicate'; selector: string; mode?: 'deep' | 'shallow' };

// Goal tracking types
export type WebExpGoal =
  | { type: 'click'; selector: string; eventKey: string }
  | { type: 'pageview'; path: string; eventKey: string };

// Anti-flicker mask configuration
export interface WebExpMask {
  selectors: string[];
  timeoutMs?: number;
}

// Main payload interface
export interface WebExpPayloadV1 {
  version: 1;
  ops: WebExpOp[];
  goals?: WebExpGoal[];
  mask?: WebExpMask;
  meta?: { note?: string };
}

// Operation result
export interface OpResult {
  success: boolean;
  error?: string;
  matchCount?: number;
  modified?: boolean;
}

// Validation result
export interface ValidationResult {
  valid: boolean;
  errors: Array<{
    path: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  sizeInfo?: {
    jsonSize: number;
    gzippedSize: number;
  };
}
