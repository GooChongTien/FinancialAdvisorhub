import { z } from "https://esm.sh/zod@3.25.76";
import { toolRegistry } from "./registry.ts";
import type { ToolContext } from "./types.ts";
import { createServiceClient } from "./service-client.ts";
import { executeSafely } from "./error-handling.ts";

const visualizerSchema = z.object({
  limit: z.number().int().min(1).max(20).optional(),
});

async function visualizerMetrics(_ctx: ToolContext, args: z.infer<typeof visualizerSchema>) {
  const { limit = 5 } = visualizerSchema.parse(args ?? {});

  return executeSafely(
    "visualizer__metrics.recent",
    async () => {
      const client = createServiceClient();
      const { data, error } = await client.from("metrics").select("*").order("timestamp", { ascending: false }).limit(limit);
      if (error) throw error;
      return data;
    },
    args
  );
}

toolRegistry.registerTool("visualizer__metrics.recent", visualizerMetrics, visualizerSchema);
