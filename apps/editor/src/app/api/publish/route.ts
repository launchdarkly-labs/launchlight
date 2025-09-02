import { NextRequest } from 'next/server';
import { z } from 'zod';
import { VariationInline } from '@webexp/shared';
import { publishVariation } from '@webexp/publisher';

const BodySchema = z.object({
  flagKey: z.string().min(1),
  variationKey: z.string().min(1),
  payload: VariationInline,
  expId: z.string().min(1),
  workspaceId: z.string().min(1)
});

export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).slice(2);
  try {
    const json = await req.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'validation_error', details: parsed.error.flatten(), requestId }), { status: 400 });
    }

    const { flagKey, variationKey, payload, expId, workspaceId } = parsed.data;
    const result = await publishVariation(payload, {
      expId,
      workspaceId,
      actor: 'system',
      flagKey,
      variationKey
    });

    return new Response(JSON.stringify(result), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (err: any) {
    const code = typeof err?.message === 'string' && /concurr|etag/i.test(err.message) ? 409
      : typeof err?.message === 'string' && /launchdarkly|api/i.test(err.message) ? 502
      : 500;
    return new Response(JSON.stringify({ error: 'publish_failed', message: err?.message || 'Unknown', requestId }), { status: code });
  }
}


