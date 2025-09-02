// LaunchDarkly API client

export interface LaunchDarklyCredentials {
  apiKey: string
  projectKey: string
}

export interface FeatureFlagVariation {
  value: string
  name: string
}

export interface FeatureFlag {
  name: string
  key: string
  description?: string
  variations: FeatureFlagVariation[]
  clientSideAvailability: {
    usingEnvironmentId: boolean
  }
}

export interface ExperimentVariation {
  name: string
  value: string
  weight: number
}

export interface ExperimentMetric {
  key: string
}

export interface Experiment {
  name: string
  key: string
  hypothesis?: string
  variations: ExperimentVariation[]
  metrics: ExperimentMetric[]
  audience: {
    name: string
  }
  duration: number
}

export class LaunchDarklyClient {
  private apiKey: string
  private projectKey: string
  private baseUrl = "https://app.launchdarkly.com/api/v2"

  constructor(credentials: LaunchDarklyCredentials) {
    this.apiKey = credentials.apiKey
    this.projectKey = credentials.projectKey
  }

  private async request<T>(endpoint: string, method: string, data?: any): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `api-key ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || response.statusText)
    }

    return await response.json()
  }

  async createFeatureFlag(flag: FeatureFlag): Promise<FeatureFlag> {
    return this.request<FeatureFlag>(`/flags/${this.projectKey}`, "POST", flag)
  }

  async updateFeatureFlag(flagKey: string, flag: Partial<FeatureFlag>): Promise<FeatureFlag> {
    return this.request<FeatureFlag>(`/flags/${this.projectKey}/${flagKey}`, "PATCH", flag)
  }

  async getFeatureFlag(flagKey: string): Promise<FeatureFlag> {
    return this.request<FeatureFlag>(`/flags/${this.projectKey}/${flagKey}`, "GET")
  }

  async createExperiment(experiment: Experiment): Promise<Experiment> {
    return this.request<Experiment>(`/projects/${this.projectKey}/experiments`, "POST", experiment)
  }

  async getExperiment(experimentKey: string): Promise<Experiment> {
    return this.request<Experiment>(`/projects/${this.projectKey}/experiments/${experimentKey}`, "GET")
  }

  async getExperiments(): Promise<Experiment[]> {
    const response = await this.request<{ items: Experiment[] }>(`/projects/${this.projectKey}/experiments`, "GET")
    return response.items
  }
}
