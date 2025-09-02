/**
 * LaunchDarkly API types for server-side operations
 */

export interface LDFlag {
  key: string;
  name: string;
  description?: string;
  kind: 'boolean' | 'string' | 'number' | 'json';
  creationDate: number;
  includeInSnippet?: boolean;
  clientSideAvailability?: {
    usingEnvironmentId: boolean;
    usingMobileKey: boolean;
  };
  variations: LDVariation[];
  temporary?: boolean;
  tags?: string[];
  customProperties?: Record<string, any>;
  defaults?: {
    onVariation: number;
    offVariation: number;
  };
  environments?: Record<string, LDEnvironment>;
}

export interface LDVariation {
  _id: string;
  value: any;
  name?: string;
  description?: string;
}

export interface LDEnvironment {
  on: boolean;
  archived: boolean;
  salt: string;
  sel: string;
  lastModified: number;
  version: number;
  targets?: LDTarget[];
  rules?: LDRule[];
  fallthrough?: LDFallthrough;
  offVariation?: number;
  prerequisites?: LDPrerequisite[];
  trackEvents: boolean;
  trackEventsFallthrough: boolean;
  debugEventsUntilDate?: number;
}

export interface LDTarget {
  values: string[];
  variation: number;
}

export interface LDRule {
  _id: string;
  variation?: number;
  rollout?: LDRollout;
  clauses: LDClause[];
  trackEvents?: boolean;
  description?: string;
}

export interface LDRollout {
  variations: Array<{
    variation: number;
    weight: number;
    _id: string;
  }>;
  bucketBy?: string;
}

export interface LDClause {
  _id: string;
  attribute: string;
  op: string;
  values: any[];
  negate?: boolean;
}

export interface LDFallthrough {
  variation?: number;
  rollout?: LDRollout;
}

export interface LDPrerequisite {
  key: string;
  variation: number;
}

// API Request/Response types
export interface LDFlagListResponse {
  items: LDFlag[];
  totalCount: number;
  _links?: {
    next?: {
      href: string;
    };
  };
}

export interface LDFlagResponse extends LDFlag {}

export interface LDFlagPatchRequest {
  comment?: string;
  patch: Array<{
    op: 'replace' | 'add' | 'remove';
    path: string;
    value?: any;
  }>;
}

export interface LDVariationUpdateRequest {
  comment?: string;
  patch: Array<{
    op: 'replace';
    path: string;
    value: any;
  }>;
}

// API Error types
export interface LDApiError {
  code: string;
  message: string;
  details?: any;
}

// Client wrapper types
export interface LDClientWrapper {
  variationJSON<T = any>(flagKey: string, fallback: T): T;
  track(eventKey: string, data?: any): void;
  close(): void;
}

// Server API configuration
export interface LDServerConfig {
  apiToken: string;
  baseUrl?: string;
  timeout?: number;
}
