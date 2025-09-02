import { vi } from 'vitest';

// Mock fetch for server-side tests
global.fetch = vi.fn();

// Mock LaunchDarkly
vi.mock('launchdarkly-js-client-sdk', () => ({
  initialize: vi.fn(() => ({
    waitForInitialization: vi.fn(() => Promise.resolve()),
    variation: vi.fn(() => ({ version: 1, ops: [] })),
    track: vi.fn(),
    close: vi.fn(),
    on: vi.fn(),
    off: vi.fn()
  }))
}));
