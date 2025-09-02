import { appendFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

export type AuditEntry = {
  expId: string;
  rev: number;
  mode: 'inline' | 'manifest';
  url?: string;
  sri?: string;
  actor: string;
  ts: string; // ISO
};

export function appendAuditLocal(pathOrDir: string, entry: AuditEntry) {
  const isDir = !pathOrDir.endsWith('.jsonl');
  const file = isDir ? join(pathOrDir, 'audit.jsonl') : pathOrDir;
  const dir = dirname(file);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  appendFileSync(file, JSON.stringify(entry) + '\n', 'utf8');
}


