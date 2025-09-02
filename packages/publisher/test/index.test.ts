import { describe, it, expect } from 'vitest';
import { computeSriSha384, hashBodyForPath } from '../src/manifest';

describe('publisher manifest utils', () => {
  it('computes SRI sha384 for known text', () => {
    const sri = computeSriSha384('hello');
    expect(sri.startsWith('sha384-')).toBe(true);
  });

  it('hashBodyForPath is deterministic', () => {
    const a = hashBodyForPath('body');
    const b = hashBodyForPath('body');
    expect(a).toBe(b);
  });
});


