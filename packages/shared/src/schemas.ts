// Core schemas (webExpOpSchema, webExpGoalSchema, webExpMaskSchema, webExpPayloadV1Schema, 
// isWebExpOp, isWebExpGoal, isWebExpPayloadV1, validatePayload, validateOp, validateGoal)
// have been moved to @webexp/patch-engine to avoid circular dependencies.
// Import them directly from @webexp/patch-engine instead of @webexp/shared.

import { z } from 'zod';

// Auto-ID configuration schema
export const autoIdOptionsSchema = z.object({
  enabled: z.boolean().optional(),
  cookieName: z.string().min(1).optional(),
  ttlDays: z.number().min(1).max(3650).optional(), // 1 day to 10 years
  sameSite: z.enum(['Lax', 'Strict', 'None']).optional(),
  secure: z.boolean().optional(),
  path: z.string().optional(),
  domain: z.string().optional(),
  respectDoNotTrack: z.boolean().optional(),
  requireConsent: z.boolean().optional(),
  consentGranted: z.function().optional(),
  storageFallback: z.enum(['localStorage', 'none']).optional()
});

export function validateAutoIdOptions(options: unknown) {
  return autoIdOptionsSchema.safeParse(options);
}
