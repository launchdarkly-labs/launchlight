export interface PublisherEnv {
  storage: 's3' | 'local';
  s3Bucket?: string;
  cdnBaseUrl: string;
  inlineThresholdKb: number; // default 8
  auditBucketOrPath?: string;
}

export function readPublisherEnv(): PublisherEnv {
  const storage = (process.env.PUBLISHER_STORAGE || 'local') as 's3' | 'local';
  const cdnBaseUrl = process.env.CDN_BASE_URL || '';
  const inlineThresholdKb = Number(process.env.INLINE_THRESHOLD_KB || 8);
  return {
    storage,
    s3Bucket: process.env.S3_BUCKET,
    cdnBaseUrl,
    inlineThresholdKb: Number.isFinite(inlineThresholdKb) ? inlineThresholdKb : 8,
    auditBucketOrPath: process.env.AUDIT_BUCKET_OR_PATH
  };
}


