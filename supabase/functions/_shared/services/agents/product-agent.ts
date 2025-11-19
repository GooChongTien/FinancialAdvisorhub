import type { MiraContext, MiraResponse } from "../types.ts";
import { SkillAgent } from "./base-agent.ts";
import { buildAgentResponse } from "./response-builder.ts";
import { createNavigateAction, createPrefillAction } from "./action-templates.ts";
import { getProductTools } from "./tools/product-tools.ts";

const SYSTEM_PROMPT = `You are a product catalog expert.
Help advisors find products, review details, and highlight key differentiators.
Always respond with next UI navigation and any filters applied.`;

export class ProductAgent extends SkillAgent {
  constructor() {
    super("ProductAgent", "product", SYSTEM_PROMPT, getProductTools());
  }

  async execute(intent: string, context: MiraContext, userMessage: string): Promise<MiraResponse> {
    switch (intent) {
      case "list_by_category":
        return this.handleListByCategory(context);
      case "search_by_keyword":
        return this.handleSearch(context, userMessage);
      case "view_product_detail":
        return this.handleViewDetail(context);
      case "compare_products":
        return this.handleCompare(context);
      default:
        return buildAgentResponse(
          this.id,
          intent,
          context,
          "I'll open the product workspace for you.",
          [createNavigateAction(context.module, "/product")],
        );
    }
  }

  private async handleListByCategory(context: MiraContext): Promise<MiraResponse> {
    const category = (context.pageData?.category as string) ?? "Protection";
    await this.invokeTool("product__products.search", { keyword: "", category }, { context });
    const actions = [
      createNavigateAction(context.module, "/product", { category }),
      createPrefillAction({ category }),
    ];
    const reply = `Showing ${category} products with filters applied in the catalog.`;
    return buildAgentResponse(this.id, "list_by_category", context, reply, actions, {
      subtopic: "catalog",
    });
  }

  private async handleSearch(context: MiraContext, userMessage: string): Promise<MiraResponse> {
    const keyword = (context.pageData?.keyword as string) ?? userMessage;
    await this.invokeTool("product__products.search", { keyword }, { context });
    const actions = [
      createNavigateAction(context.module, "/product", { search: keyword }),
      createPrefillAction({ search: keyword }),
    ];
    const reply = `Searching for "${keyword}" and highlighting the closest matches.`;
    return buildAgentResponse(this.id, "search_by_keyword", context, reply, actions, {
      subtopic: "catalog",
    });
  }

  private async handleViewDetail(context: MiraContext): Promise<MiraResponse> {
    const productId = (context.pageData?.productId as string) ?? "PR-1001";
    await this.invokeTool("product__products.getDetails", { id: productId }, { context });
    const actions = [createNavigateAction(context.module, `/product/detail/${productId}`)];
    const reply = `Opening the detail page for ${productId} with coverage, riders, and suitability summary.`;
    return buildAgentResponse(this.id, "view_product_detail", context, reply, actions, {
      subtopic: "details",
    });
  }

  private async handleCompare(context: MiraContext): Promise<MiraResponse> {
    const ids = (context.pageData?.productIds as string[]) ?? ["PR-1001", "PR-1002"];
    await this.invokeTool("product__products.compare", { ids }, { context });
    const actions = [createNavigateAction(context.module, "/product/compare", { ids: ids.join(",") })];
    const reply = `Stacking ${ids.length} products side-by-side. Use the comparison tray to adjust rows.`;
    return buildAgentResponse(this.id, "compare_products", context, reply, actions, {
      subtopic: "comparison",
    });
  }

  async generateSuggestions(context: MiraContext) {
    const category =
      typeof context.pageData?.category === "string" && context.pageData.category.trim()
        ? context.pageData.category.trim()
        : "protection";
    const keyword =
      typeof context.pageData?.keyword === "string" && context.pageData.keyword.trim()
        ? context.pageData.keyword.trim()
        : "income protection";
    const focusProduct =
      typeof context.pageData?.productId === "string" && context.pageData.productId.trim()
        ? context.pageData.productId.trim()
        : "PR-1001";

    return [
      this.buildSuggestion({
        intent: "list_by_category",
        title: `Browse ${category} plans`,
        description: "Filter the catalog so I only see relevant products.",
        promptText: `Show me ${category} products in the catalog and highlight any best sellers.`,
        confidence: 0.78,
      }),
      this.buildSuggestion({
        intent: "search_by_keyword",
        title: `Search for “${keyword}”`,
        description: "Find matching products and surface key notes.",
        promptText: `Search the product catalog for "${keyword}" and summarize the top 3 matches.`,
        confidence: 0.73,
      }),
      this.buildSuggestion({
        intent: "view_product_detail",
        title: `Open ${focusProduct} details`,
        description: "Jump directly into riders and suitability.",
        promptText: `Open the product detail page for ${focusProduct} including availability notes.`,
        confidence: 0.69,
      }),
    ];
  }
}
