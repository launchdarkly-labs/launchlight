import { z } from "zod";

export const Manifest = z.object({
  id: z.string(),
  rev: z.number().int().nonnegative(),
  compat: z.object({ injector: z.string() }).optional(),
  ops: z.array(z.any()),
  assets: z.object({ preload: z.array(z.string()).default([]) }).default({ preload: [] })
});
export type Manifest = z.infer<typeof Manifest>;


