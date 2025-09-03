import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'node:crypto';
import { publishVariation } from '@webexp/publisher';

const Body = z.object({
  variationKey: z.string().min(1),
  payload: z.object({
    type: z.literal('webexp'),
    version: z.string().optional(),
    ops: z.array(z.any())
  }),
  meta: z.record(z.any()).optional(),
  actor: z.string().optional(),
  expId: z.string().min(1).optional(),
  workspaceId: z.string().min(1).optional()
});

export async function POST(req: NextRequest, { params }: { params: { projectKey: string, envKey: string, flagKey: string } }) {
  // Basic same-origin check (Next automatically handles CORS for same-origin)
  const origin = req.headers.get('origin');
  const host = req.headers.get('host');
  if (origin && host && !origin.includes(host)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Ensure server-only token exists (publisher will read LD_API_TOKEN/LD_PROJECT_KEY/LD_ENV_KEY)
  if (!process.env.LD_API_TOKEN || !process.env.LD_PROJECT_KEY || !process.env.LD_ENV_KEY) {
    return NextResponse.json({ error: 'Missing LaunchDarkly server configuration' }, { status: 500 });
  }

  const { projectKey, envKey, flagKey } = params;
  // Ensure request params match configured defaults if provided
  if (process.env.LD_PROJECT_KEY && process.env.LD_PROJECT_KEY !== projectKey) {
    return NextResponse.json({ error: 'Project key mismatch' }, { status: 400 });
  }
  if (process.env.LD_ENV_KEY && process.env.LD_ENV_KEY !== envKey) {
    return NextResponse.json({ error: 'Environment key mismatch' }, { status: 400 });
  }

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', detail: parsed.error.format() }, { status: 400 });
  }

  const { variationKey, payload, meta, actor, expId, workspaceId } = parsed.data;

  // Add checksum/version
  const checksum = crypto.createHash('sha256').update(JSON.stringify(payload.ops)).digest('hex').slice(0, 12);
  const withVersion = Object.assign({}, payload, { version: checksum, meta: meta || {} });

  try {
    const result = await publishVariation(withVersion as any, {
      expId: expId || `${flagKey}:${variationKey}`,
      workspaceId: workspaceId || 'default',
      actor: actor || 'anonymous',
      flagKey,
      variationKey
    });

    return NextResponse.json({ ok: true, mode: result.mode, url: result.url, checksum, sri: result.sri });
  } catch (e: any) {
    return NextResponse.json({ error: 'Publish failed', detail: e?.message || String(e) }, { status: 502 });
  }
}
