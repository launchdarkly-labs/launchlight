import { byteLengthUtf8, VariationInline, VariationManifestPtr, Manifest } from '@webexp/shared';
import { computeSriSha384, hashBodyForPath } from './manifest.js';
import { readPublisherEnv } from './env.js';
import { localPutObject } from './storage/local.js';
import { appendAuditLocal } from './audit.js';

type PublishCtx = { expId: string; workspaceId: string; actor: string; flagKey: string; variationKey: string };

import { updateVariation as updateVariationOnLD } from '@webexp/ld-adapter/server';

function getNextRev(): number {
  // Placeholder monotonic rev; in real env, derive from LD or audit history
  return Math.floor(Date.now() / 1000);
}

export async function publishVariation(payload: import('@webexp/shared').VariationInline, ctx: PublishCtx): Promise<{ mode: 'inline' | 'manifest'; url?: string; sri?: string }> {
  const env = readPublisherEnv();
  // Validate payload shape
  const parsed = VariationInline.safeParse(payload);
  if (!parsed.success) {
    throw new Error(`Invalid variation payload: ${parsed.error.message}`);
  }

  const opsBytes = byteLengthUtf8(JSON.stringify(parsed.data.ops));
  const thresholdBytes = env.inlineThresholdKb * 1024;

  if (opsBytes <= thresholdBytes) {
    await updateVariationOnLD({ flagKey: ctx.flagKey, variationKey: ctx.variationKey, value: parsed.data });
    appendAuditLocal(process.env.AUDIT_BUCKET_OR_PATH || '/tmp/webexp/audit', {
      expId: ctx.expId,
      rev: getNextRev(),
      mode: 'inline',
      actor: ctx.actor,
      ts: new Date().toISOString()
    });
    return { mode: 'inline' };
  }

  // Build manifest for large payloads
  const man: import('@webexp/shared').Manifest = {
    id: ctx.expId,
    rev: getNextRev(),
    compat: { injector: '^1.0.0' },
    ops: parsed.data.ops as any,
    assets: { preload: [] }
  };
  const body = JSON.stringify(man);
  const sri = computeSriSha384(body);
  const hash = hashBodyForPath(body);
  const key = `webexp/manifests/${ctx.expId}/${hash}.json`;

  let url: string;
  if (env.storage === 'local') {
    url = localPutObject(key, body).url;
  } else {
    const { s3PutObject } = await import('./storage/s3.js');
    if (!env.s3Bucket) throw new Error('S3_BUCKET not configured');
    const put = await s3PutObject({ bucket: env.s3Bucket, key, body, contentType: 'application/json', cacheControl: 'public, max-age=31536000, immutable' });
    url = put.url;
  }

  const { ops: _ops, ...rest } = parsed.data as any;
  const pointer: import('@webexp/shared').VariationManifestPtr = Object.assign({}, rest, {
    man: { url: env.cdnBaseUrl ? `${env.cdnBaseUrl}/${key}` : url, sri }
  });

  await updateVariationOnLD({ flagKey: ctx.flagKey, variationKey: ctx.variationKey, value: pointer });
  appendAuditLocal(process.env.AUDIT_BUCKET_OR_PATH || '/tmp/webexp/audit', {
    expId: ctx.expId,
    rev: man.rev,
    mode: 'manifest',
    url: env.cdnBaseUrl ? `${env.cdnBaseUrl}/${key}` : url,
    sri,
    actor: ctx.actor,
    ts: new Date().toISOString()
  });

  return { mode: 'manifest', url: env.cdnBaseUrl ? `${env.cdnBaseUrl}/${key}` : url, sri };
}


