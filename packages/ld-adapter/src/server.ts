/**
 * Server-side LaunchDarkly API wrapper for flag management
 */
import type {
  LDFlag,
  LDFlagListResponse,
  LDFlagResponse,
  LDVariationUpdateRequest,
  LDApiError,
  LDServerConfig
} from './types.js';

export class LDServerAPI {
  private config: Required<LDServerConfig>;
  
  constructor(config: LDServerConfig) {
    this.config = {
      apiToken: config.apiToken,
      baseUrl: config.baseUrl || 'https://app.launchdarkly.com/api/v2',
      timeout: config.timeout || 10000
    };
  }
  
  /**
   * List flags for a project and environment
   */
  async listFlags(
    projectKey: string,
    envKey?: string,
    options: {
      search?: string;
      limit?: number;
      offset?: number;
      tags?: string[];
    } = {}
  ): Promise<LDFlag[]> {
    const { search, limit = 50, offset = 0, tags } = options;
    
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });
    
    if (search) {
      params.append('filter', `name:${search},key:${search}`);
    }
    
    if (tags && tags.length > 0) {
      params.append('filter', `tags:${tags.join(',')}`);
    }
    
    if (envKey) {
      params.append('env', envKey);
    }
    
    const url = `${this.config.baseUrl}/flags/${projectKey}?${params}`;
    
    const response = await this.makeRequest<LDFlagListResponse>(url, {
      method: 'GET'
    });
    
    return response.items;
  }
  
  /**
   * Get a specific flag
   */
  async getFlag(projectKey: string, flagKey: string, envKey?: string): Promise<LDFlag> {
    let url = `${this.config.baseUrl}/flags/${projectKey}/${flagKey}`;
    
    if (envKey) {
      url += `?env=${envKey}`;
    }
    
    return this.makeRequest<LDFlagResponse>(url, {
      method: 'GET'
    });
  }
  
  /**
   * Update flag variations
   */
  async updateFlagVariations(
    projectKey: string,
    flagKey: string,
    envKey: string,
    variations: Array<{ _id: string; value: any }>
  ): Promise<LDFlag> {
    const url = `${this.config.baseUrl}/flags/${projectKey}/${flagKey}`;
    
    // Create patch operations for each variation
    const patch = variations.map(variation => ({
      op: 'replace' as const,
      path: `/environments/${envKey}/variations/${variation._id}/value`,
      value: variation.value
    }));
    
    const request: LDVariationUpdateRequest = {
      comment: 'Updated via WebExp platform',
      patch
    };
    
    return this.makeRequest<LDFlag>(url, {
      method: 'PATCH',
      body: JSON.stringify(request)
    });
  }
  
  /**
   * Update a single flag variation
   */
  async updateFlagVariation(
    projectKey: string,
    flagKey: string,
    envKey: string,
    variationId: string,
    value: any
  ): Promise<LDFlag> {
    return this.updateFlagVariations(projectKey, flagKey, envKey, [
      { _id: variationId, value }
    ]);
  }
  
  /**
   * Search flags by naming convention (e.g., webexp_*)
   */
  async searchWebExpFlags(
    projectKey: string,
    envKey?: string,
    prefix = 'webexp_'
  ): Promise<LDFlag[]> {
    return this.listFlags(projectKey, envKey, {
      search: prefix,
      limit: 100
    });
  }
  
  /**
   * Get flag with environment-specific data
   */
  async getFlagWithEnvironment(
    projectKey: string,
    flagKey: string,
    envKey: string
  ): Promise<{ flag: LDFlag; environment: any }> {
    const flag = await this.getFlag(projectKey, flagKey, envKey);
    const environment = flag.environments?.[envKey];
    
    if (!environment) {
      throw new Error(`Environment ${envKey} not found for flag ${flagKey}`);
    }
    
    return { flag, environment };
  }
  
  /**
   * Make authenticated request to LaunchDarkly API
   */
  private async makeRequest<T>(url: string, options: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': this.config.apiToken,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const error: LDApiError = {
          code: response.status.toString(),
          message: errorData?.message || response.statusText,
          details: errorData
        };
        throw new Error(`LaunchDarkly API error (${error.code}): ${error.message}`);
      }
      
      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`LaunchDarkly API request timed out after ${this.config.timeout}ms`);
      }
      
      throw error;
    }
  }
}

/**
 * Create LaunchDarkly server API client
 */
export function createServerAPI(config: LDServerConfig): LDServerAPI {
  return new LDServerAPI(config);
}

/**
 * Update a single variation value with basic retry and ETag handling.
 */
export async function updateVariation({ flagKey, variationKey, value }: { flagKey: string; variationKey: string; value: unknown }): Promise<void> {
  const projectKey = process.env.LD_PROJECT_KEY || '';
  const envKey = process.env.LD_ENV_KEY || '';
  const apiToken = process.env.LD_API_TOKEN || '';
  if (!projectKey || !envKey || !apiToken) throw new Error('LaunchDarkly server env not configured');
  const api = createServerAPI({ apiToken, baseUrl: undefined, timeout: 10000 });
  // Get flag to resolve variation _id by name/key if needed
  const flag = await api.getFlag(projectKey, flagKey, envKey);
  const found = flag.variations.find((v: any) => v.name === variationKey || v._id === variationKey);
  if (!found) throw new Error(`Variation ${variationKey} not found on flag ${flagKey}`);
  let attempts = 0;
  // naive retry loop
  while (true) {
    try {
      await api.updateFlagVariation(projectKey, flagKey, envKey, found._id, value as any);
      return;
    } catch (e: any) {
      attempts++;
      if (attempts >= 3 || !(e?.message || '').includes('409')) throw e;
      await new Promise(res => setTimeout(res, 200 * attempts));
    }
  }
}

/**
 * Helper function to validate API token format
 */
export function validateApiToken(token: string): boolean {
  // LaunchDarkly API tokens typically start with 'api-' followed by UUID-like string
  return /^api-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(token);
}

/**
 * Helper to extract project and environment keys from URL or config
 */
export function parseProjectConfig(input: {
  projectKey?: string;
  envKey?: string;
  url?: string;
}): { projectKey: string; envKey: string } {
  if (input.projectKey && input.envKey) {
    return { projectKey: input.projectKey, envKey: input.envKey };
  }
  
  // Try to parse from URL if provided
  if (input.url) {
    const match = input.url.match(/projects\/([^\/]+).*environments\/([^\/]+)/);
    if (match) {
      return { projectKey: match[1], envKey: match[2] };
    }
  }
  
  throw new Error('Project key and environment key are required');
}
