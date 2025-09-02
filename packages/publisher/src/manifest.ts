import { createHash } from 'node:crypto';

/**
 * Compute SRI string (sha384-<base64>) for a string body
 */
export function computeSriSha384(body: string): string {
  const hash = createHash('sha384').update(body).digest('base64');
  return `sha384-${hash}`;
}

/**
 * Hash body to produce a deterministic path component (hex sha256)
 */
export function hashBodyForPath(body: string): string {
  return createHash('sha256').update(body).digest('hex');
}


