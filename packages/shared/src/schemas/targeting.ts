import { z } from "zod";

export const TargetRule = z.object({
  url: z.object({
    mode: z.enum(["glob", "regex"]).default("glob"),
    include: z.array(z.string()).min(1),
    exclude: z.array(z.string()).default([])
  }),
  query: z.array(z.object({ k: z.string(), v: z.string().optional() })).default([]),
  referrer: z.array(z.string()).default([]),
  device: z.enum(["any","mobile","desktop"]).default("any")
});
export type TargetRule = z.infer<typeof TargetRule>;


