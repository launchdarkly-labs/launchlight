import { describe, it, expect } from 'vitest';
import { byteLengthUtf8, kb } from '../src/size';

describe('size utils', () => {
  it('computes byte length for utf-8 strings', () => {
    expect(byteLengthUtf8('')).toBe(0);
    expect(byteLengthUtf8('a')).toBe(1);
    expect(byteLengthUtf8('🙂')).toBe(4); // surrogate pair
  });

  it('converts bytes to kilobytes', () => {
    expect(kb(1024)).toBe(1);
    expect(kb(2048)).toBe(2);
  });
});


