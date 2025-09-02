import { z } from 'zod';
import type { WebExpOp, WebExpGoal, WebExpMask, WebExpPayloadV1 } from './types.js';

// Base operation schemas
const textReplaceSchema = z.object({
  op: z.literal('textReplace'),
  selector: z.string().min(1),
  value: z.string()
});

const attrSetSchema = z.object({
  op: z.literal('attrSet'),
  selector: z.string().min(1),
  name: z.string().min(1),
  value: z.string()
});

const classOpSchema = z.object({
  op: z.enum(['classAdd', 'classRemove', 'classToggle']),
  selector: z.string().min(1),
  value: z.string().min(1)
});

const styleSetSchema = z.object({
  op: z.literal('styleSet'),
  selector: z.string().min(1),
  name: z.string().min(1),
  value: z.string()
});

const imgSwapSchema = z.object({
  op: z.literal('imgSwap'),
  selector: z.string().min(1),
  src: z.string().url(),
  alt: z.string().optional()
});

const removeSchema = z.object({
  op: z.literal('remove'),
  selector: z.string().min(1)
});

const insertHTMLSchema = z.object({
  op: z.literal('insertHTML'),
  selector: z.string().min(1),
  html: z.string()
});

// Reorder operation schemas
const moveBeforeSchema = z.object({
  op: z.literal('moveBefore'),
  selector: z.string().min(1),
  targetSelector: z.string().min(1)
});

const moveAfterSchema = z.object({
  op: z.literal('moveAfter'),
  selector: z.string().min(1),
  targetSelector: z.string().min(1)
});

const appendToSchema = z.object({
  op: z.literal('appendTo'),
  selector: z.string().min(1),
  containerSelector: z.string().min(1)
});

const duplicateSchema = z.object({
  op: z.literal('duplicate'),
  selector: z.string().min(1),
  mode: z.enum(['deep', 'shallow']).optional()
});

// Main operation schema
export const webExpOpSchema: z.ZodType<WebExpOp> = z.discriminatedUnion('op', [
  textReplaceSchema,
  attrSetSchema,
  classOpSchema,
  styleSetSchema,
  imgSwapSchema,
  removeSchema,
  insertHTMLSchema,
  moveBeforeSchema,
  moveAfterSchema,
  appendToSchema,
  duplicateSchema
]);

// Goal schemas
const clickGoalSchema = z.object({
  type: z.literal('click'),
  selector: z.string().min(1),
  eventKey: z.string().min(1)
});

const pageviewGoalSchema = z.object({
  type: z.literal('pageview'),
  path: z.string().min(1),
  eventKey: z.string().min(1)
});

export const webExpGoalSchema: z.ZodType<WebExpGoal> = z.discriminatedUnion('type', [
  clickGoalSchema,
  pageviewGoalSchema
]);

// Mask schema
export const webExpMaskSchema: z.ZodType<WebExpMask> = z.object({
  selectors: z.array(z.string().min(1)).min(1),
  timeoutMs: z.number().min(100).max(5000).optional()
});

// Main payload schema
export const webExpPayloadV1Schema: z.ZodType<WebExpPayloadV1> = z.object({
  version: z.literal(1),
  ops: z.array(webExpOpSchema),
  goals: z.array(webExpGoalSchema).optional(),
  mask: webExpMaskSchema.optional(),
  meta: z.object({
    note: z.string().optional()
  }).optional()
});

// Type guards
export function isWebExpOp(value: unknown): value is WebExpOp {
  return webExpOpSchema.safeParse(value).success;
}

export function isWebExpGoal(value: unknown): value is WebExpGoal {
  return webExpGoalSchema.safeParse(value).success;
}

export function isWebExpPayloadV1(value: unknown): value is WebExpPayloadV1 {
  return webExpPayloadV1Schema.safeParse(value).success;
}

// Validation helpers
export function validatePayload(payload: unknown) {
  return webExpPayloadV1Schema.safeParse(payload);
}

export function validateOp(op: unknown) {
  return webExpOpSchema.safeParse(op);
}

export function validateGoal(goal: unknown) {
  return webExpGoalSchema.safeParse(goal);
}
