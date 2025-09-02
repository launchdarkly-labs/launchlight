import type { TargetRule } from '@webexp/shared';

function toRegexFromGlob(glob: string): RegExp {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  const regex = '^' + escaped.replace(/\*/g, '.*').replace(/\?/g, '.') + '$';
  return new RegExp(regex);
}

function deviceType(win: Window): 'mobile' | 'desktop' {
  const ua = win.navigator.userAgent.toLowerCase();
  const isMobile = /(iphone|ipod|ipad|android|mobile|blackberry|iemobile|opera mini)/.test(ua);
  return isMobile ? 'mobile' : 'desktop';
}

function matchesUrl(win: Window, rule: TargetRule['url']): boolean {
  const href = win.location.href;
  if (rule.mode === 'regex') {
    try {
      const includeMatch = rule.include.some((p: string) => new RegExp(p).test(href));
      const excludeMatch = rule.exclude.some((p: string) => new RegExp(p).test(href));
      return includeMatch && !excludeMatch;
    } catch {
      return false;
    }
  }
  // glob mode
  const includeMatch = rule.include.some((p: string) => toRegexFromGlob(p).test(href));
  const excludeMatch = rule.exclude.some((p: string) => toRegexFromGlob(p).test(href));
  return includeMatch && !excludeMatch;
}

function matchesQuery(win: Window, conditions: NonNullable<TargetRule['query']>): boolean {
  if (!conditions || conditions.length === 0) return true;
  const params = new URLSearchParams(win.location.search);
  return conditions.every(({ k, v }: { k: string; v?: string }) => {
    if (!params.has(k)) return false;
    if (typeof v === 'undefined') return true;
    return params.getAll(k).some((val) => val === v);
  });
}

function matchesReferrer(win: Window, referrers: string[]): boolean {
  if (!referrers || referrers.length === 0) return true;
  const ref = (win.document.referrer || '').toLowerCase();
  return referrers.some((needle) => ref.includes(needle.toLowerCase()));
}

export function matchesTargetRule(win: Window, rule: TargetRule): boolean {
  if (!matchesUrl(win, rule.url)) return false;
  if (!matchesQuery(win, rule.query)) return false;
  if (!matchesReferrer(win, rule.referrer)) return false;
  if (rule.device !== 'any' && deviceType(win) !== rule.device) return false;
  return true;
}


