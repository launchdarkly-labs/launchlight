import type { WebExpOp } from '@webexp/patch-engine';

export function surfaceKeyFromOps(ops: WebExpOp[]): string {
  if (!ops || ops.length === 0) return 'default-surface';
  // Naive approach: derive from first operation selector's top-level segment
  const sel = (ops[0] as any).selector || (ops[0] as any).targetSelector || (ops[0] as any).containerSelector || '';
  if (!sel) return 'default-surface';
  const match = sel.match(/#[A-Za-z0-9_-]+|\.[A-Za-z0-9_-]+|^[a-z]+/);
  return match ? match[0] : 'default-surface';
}

export function selectWinningExperiment(candidates: Array<{ flagKey: string; publishedAt: number; surfaceKey: string }>): string | null {
  if (!candidates || candidates.length === 0) return null;
  // First sort by surfaceKey equality groups handled upstream; here global policy
  // First match wins by lexicographic order of flagKey; if tie on key, newest publish wins
  const sorted = [...candidates].sort((a, b) => {
    if (a.flagKey < b.flagKey) return -1;
    if (a.flagKey > b.flagKey) return 1;
    return b.publishedAt - a.publishedAt;
  });
  return sorted[0].flagKey;
}


