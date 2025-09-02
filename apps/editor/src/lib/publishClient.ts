export async function publishFlagVariation(input: {
  flagKey: string;
  variationKey: string;
  payload: import('@webexp/shared/src/schemas/variation').VariationInline;
  expId: string;
  workspaceId: string;
}) {
  const res = await fetch('/api/publish', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) throw new Error(`Publish failed (${res.status})`);
  return res.json() as Promise<{ mode: 'inline' | 'manifest'; url?: string; sri?: string }>;
}


