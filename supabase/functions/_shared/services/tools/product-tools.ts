import { z } from "https://esm.sh/zod@3.25.76";
import { toolRegistry } from "./registry.ts";
import type { ToolContext } from "./types.ts";
import { createServiceClient } from "./service-client.ts";
import { executeSafely } from "./error-handling.ts";

const productSearchSchema = z.object({
  keyword: z.string().min(1),
  category: z.string().optional(),
  limit: z.number().int().min(1).max(50).optional(),
});

async function productsSearch(ctx: ToolContext, args: z.infer<typeof productSearchSchema>) {
  const { keyword, category, limit = 20 } = productSearchSchema.parse(args);

  return executeSafely(
    "product__products.search",
    async () => {
      const client = createServiceClient();
      let query = client
        .from("products")
        .select("*,categories(*)")
        .ilike("name", `%${keyword}%`);
      if (category) query = query.eq("category", category);
      const { data, error } = await query.limit(limit);
      if (error) throw error;
      return data;
    },
    args
  );
}

toolRegistry.registerTool("product__products.search", productsSearch, productSearchSchema);
