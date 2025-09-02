# @webexp/publisher

Serverless-friendly publisher for WebExp variations. Handles inline vs manifest storage, SRI generation, upload to storage, and audit logging.

## Env vars

- PUBLISHER_STORAGE: local | s3 (default local)
- S3_BUCKET: S3 bucket for manifests (when storage=s3)
- CDN_BASE_URL: Public base URL for manifests (e.g., https://cdn.example.com)
- INLINE_THRESHOLD_KB: Inline ops threshold in KB (default 8)
- AUDIT_BUCKET_OR_PATH: Local folder or bucket path for JSONL audit
- PUBLISHER_LOCAL_BASE: Local base folder for manifests (default /tmp/webexp)

## API

```ts
import { publishVariation } from '@webexp/publisher';

await publishVariation(variationInline, {
  expId: 'exp_hero_test',
  workspaceId: 'default',
  actor: 'user@example.com',
  flagKey: 'webexp_hero_test',
  variationKey: 'variation-1'
});
```

Returns `{ mode: 'inline' | 'manifest', url?, sri? }`.


