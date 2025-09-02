import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

export function localPutObject(pathname: string, body: string): { url: string } {
  const base = process.env.PUBLISHER_LOCAL_BASE || '/tmp/webexp';
  const fullPath = join(base, pathname);
  const dir = dirname(fullPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(fullPath, body, 'utf8');
  return { url: `file://${fullPath}` };
}


