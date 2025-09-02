import { describe, it, expect, beforeEach } from 'vitest';
import { matchesTargetRule } from '../src/targeting';

function setLocation(href: string, referrer = '') {
  Object.defineProperty(document, 'referrer', { value: referrer, configurable: true });
  Object.defineProperty(window, 'location', { value: new URL(href), configurable: true });
}

describe('matchesTargetRule', () => {
  beforeEach(() => {
    // no-op
  });

  it('matches glob include/exclude and query presence', () => {
    setLocation('https://example.com/path?foo=1&bar=2');
    const rule = {
      url: { mode: 'glob' as const, include: ['https://example.com/*'], exclude: ['*/blocked*'] },
      query: [{ k: 'foo' }],
      referrer: [],
      device: 'any' as const
    };
    expect(matchesTargetRule(window, rule)).toBe(true);
  });

  it('rejects when excluded by glob', () => {
    setLocation('https://example.com/blocked/section?foo=1');
    const rule = {
      url: { mode: 'glob' as const, include: ['https://example.com/*'], exclude: ['*/blocked/*'] },
      query: [],
      referrer: [],
      device: 'any' as const
    };
    expect(matchesTargetRule(window, rule)).toBe(false);
  });

  it('matches regex include and referrer substring', () => {
    setLocation('https://example.com/a/b', 'https://google.com?q=ex');
    const rule = {
      url: { mode: 'regex' as const, include: ['example\\.com\\/a\\/.*'], exclude: [] },
      query: [],
      referrer: ['google.com'],
      device: 'any' as const
    };
    expect(matchesTargetRule(window, rule)).toBe(true);
  });
});


