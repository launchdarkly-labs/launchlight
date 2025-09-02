import type { VariationInline, VariationManifestPtr, Manifest } from '@webexp/shared';
import { matchesTargetRule } from './targeting';
import { fetchAndVerify } from './manifest';
import { surfaceKeyFromOps } from './conflicts';
import { exposeRuntimeState, maybeLoadOverlay } from './debug/index';
import { applyPayload, enableSpaMode } from '@webexp/patch-engine';
import { createLDClient } from './ld-client';

export async function initPointerAware(opts: {
  envKey: string;
  flagKey: string;
  spaMode?: boolean;
}) {
  const client = await createLDClient({ envKey: opts.envKey });
  const raw = await client.getRawVariation(opts.flagKey);
  const value = raw as VariationInline | (Omit<VariationManifestPtr, 'ops'> & { ops?: never }) | undefined;
  if (!value) return;

  let inline: VariationInline | null = null;
  let manifest: Manifest | null = null;
  if ((value as any).man) {
    const ptr = value as VariationManifestPtr;
    try {
      manifest = await fetchAndVerify(ptr.man.url, ptr.man.sri);
      inline = { ...(value as any), ops: manifest.ops } as VariationInline;
    } catch (e) {
      console.warn('[WebExp] Manifest fetch/verify failed, skipping apply', e);
      return;
    }
  } else {
    inline = value as VariationInline;
  }

  if (!matchesTargetRule(window, inline.target)) {
    return;
  }

  const surface = surfaceKeyFromOps(inline.ops as any);
  exposeRuntimeState({ flagKey: opts.flagKey, surface, opsCount: (inline.ops as any[]).length });
  maybeLoadOverlay(false);

  const start = performance.now();
  const result = applyPayload({ version: 1, ops: inline.ops as any, goals: [] }, { spa: !!opts.spaMode });
  const applyMs = Math.round(performance.now() - start);
  if (!result.success) console.warn('[WebExp] Apply warnings/errors', result.errors);
  if (opts.spaMode) enableSpaMode({ version: 1, ops: inline.ops as any });
  exposeRuntimeState({ flagKey: opts.flagKey, applyMs });
}


