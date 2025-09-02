import { describe, it, expect } from 'vitest';
import { VariationInline } from '../src/schemas/variation';
import { TargetRule } from '../src/schemas/targeting';

describe('VariationInline schema', () => {
  it('applies defaults and validates minimal valid payload', () => {
    const minimal = {
      v: 1,
      ops: [],
      target: {
        url: { include: ['*'] }
      } as any as typeof TargetRule._type
    };
    const res = VariationInline.safeParse(minimal);
    expect(res.success).toBe(true);
    if (!res.success) return;
    expect(res.data.randUnit).toBe('device');
    expect(res.data.antiFlicker.timeoutMs).toBe(800);
    expect(res.data.antiFlicker.masks).toEqual([]);
    expect(res.data.goals).toEqual([]);
    expect(res.data.target.url.mode).toBe('glob');
    expect(res.data.target.url.exclude).toEqual([]);
    expect(res.data.target.query).toEqual([]);
    expect(res.data.target.referrer).toEqual([]);
    expect(res.data.target.device).toBe('any');
  });

  it('rejects invalid antiFlicker timeout', () => {
    const invalid = {
      v: 1,
      ops: [],
      target: { url: { include: ['*'] } },
      antiFlicker: { timeoutMs: 9000, masks: [] }
    };
    const res = VariationInline.safeParse(invalid);
    expect(res.success).toBe(false);
  });
});


