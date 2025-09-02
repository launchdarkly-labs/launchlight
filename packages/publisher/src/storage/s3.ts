// Placeholder thin S3 wrapper. Implement with AWS SDK v3 if needed later.
export interface PutObjectInput {
  bucket: string;
  key: string;
  body: string;
  contentType?: string;
  cacheControl?: string;
}

export async function s3PutObject(_input: PutObjectInput): Promise<{ url: string }> {
  throw new Error('S3 storage not configured in this environment');
}


