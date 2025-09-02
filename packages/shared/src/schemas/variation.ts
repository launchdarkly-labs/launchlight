import { z } from "zod";
import { TargetRule } from "./targeting";

// IMPORTANT: ops validated at runtime by patch-engine; keep schema permissive here.

export const Goal = z.discriminatedUnion("type", [
  z.object({ type: z.literal("click"), id: z.string(), sel: z.string(), event: z.string() }),
  z.object({ type: z.literal("pageview"), id: z.string(), event: z.string() })
]);

export const VariationInline = z.object({
  v: z.literal(1),
  // Keep as any here; runtime validate ops separately in patch-engine.
  ops: z.array(z.any()),
  target: TargetRule,
  randUnit: z.enum(["device","user","request"]).default("device"),
  goals: z.array(Goal).default([]),
  antiFlicker: z.object({
    timeoutMs: z.number().int().min(0).max(2000).default(800),
    masks: z.array(z.string()).default([])
  }).default({ timeoutMs: 800, masks: [] }),
});
export type VariationInline = z.infer<typeof VariationInline>;

export const VariationManifestPtr = VariationInline
  .omit({ ops: true })
  .extend({ man: z.object({ url: z.string().url(), sri: z.string() }) });
export type VariationManifestPtr = z.infer<typeof VariationManifestPtr>;


