// Core WebExp types (WebExpOp, WebExpGoal, WebExpMask, WebExpPayloadV1, OpResult, ValidationResult) 
// have been moved to @webexp/patch-engine to avoid circular dependencies.
// Import them directly from @webexp/patch-engine instead of @webexp/shared.

// Selector analysis result
export interface SelectorResult {
  selector: string;
  diagnostics: {
    matchCount: number;
    stabilityScore: number;
    warnings?: string[];
  };
}

// Element analysis for drag-and-drop
export interface ElementInfo {
  selector: string;
  tagName: string;
  classList: string[];
  attributes: Record<string, string>;
  textContent: string;
  isContainer: boolean;
  stability: {
    score: number;
    reasons: string[];
  };
}

// Safe container detection
export interface SafeContainer {
  element: Element;
  selector: string;
  type: 'semantic' | 'layout' | 'annotated';
  constraints?: string[];
}



// LaunchDarkly integration types
export interface LDFlagInfo {
  key: string;
  name: string;
  kind: string;
  variations: Array<{
    _id: string;
    value: unknown;
    name?: string;
    description?: string;
  }>;
  environments: Record<string, {
    on: boolean;
    archived: boolean;
  }>;
}

export interface LDVariationUpdate {
  variations: Array<{
    _id: string;
    value: unknown;
  }>;
}

// EditorState moved to editor app since it's not used elsewhere and depends on WebExpPayloadV1



// Auto-ID configuration types
export interface AutoIdOptions {
  enabled?: boolean;            // default true
  cookieName?: string;          // default "ld_webexp_id"
  ttlDays?: number;             // default 365
  sameSite?: 'Lax' | 'Strict' | 'None'; // default 'Lax'
  secure?: boolean;             // default true if https
  path?: string;                // default '/'
  domain?: string;              // optional, default current host
  respectDoNotTrack?: boolean;  // default true
  requireConsent?: boolean;     // default false; if true, only create ID after consent flag is provided
  consentGranted?: () => boolean; // optional callback used when requireConsent=true
  storageFallback?: 'localStorage' | 'none'; // default 'localStorage'
}

// Cookie configuration
export interface CookieConfig {
  name: string;
  value: string;
  ttlDays: number;
  sameSite: 'Lax' | 'Strict' | 'None';
  secure: boolean;
  path: string;
  domain?: string;
}

// Storage result
export interface StorageResult {
  success: boolean;
  value?: string;
  error?: string;
  method: 'cookie' | 'localStorage' | 'none';
}
