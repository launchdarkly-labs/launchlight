import type { Manifest } from '@webexp/shared';

async function digestSha384Base64(input: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(input);
  const hash = await crypto.subtle.digest('SHA-384', data);
  const bytes = new Uint8Array(hash);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const b64 = btoa(binary);
  return `sha384-${b64}`;
}

export async function fetchAndVerify(manUrl: string, sri: string): Promise<Manifest> {
  const res = await fetch(manUrl, { cache: 'force-cache' });
  if (!res.ok) throw new Error(`Manifest fetch failed: ${res.status}`);
  const text = await res.text();
  const computed = await digestSha384Base64(text);
  if (computed !== sri) {
    throw new Error('Manifest SRI mismatch');
  }
  return JSON.parse(text);
}


