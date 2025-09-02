import { vi } from 'vitest';

// Mock CSS.escape for older environments
if (typeof CSS === 'undefined' || !CSS.escape) {
  global.CSS = {
    escape: (value: string) => {
      return value.replace(/[!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~]/g, '\\$&');
    }
  };
}

// Setup DOM
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    display: 'block',
    getPropertyValue: () => ''
  })
});

// Mock MutationObserver
global.MutationObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn()
}));
