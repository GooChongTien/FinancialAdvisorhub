import { describe, expect, it } from "vitest";
import type { MiraContext, MiraModule } from "../../supabase/functions/_shared/services/types.ts";
import { getAgentRegistry } from "../../supabase/functions/_shared/services/agents/registry.ts";

const MODULE_PAGES: Record<MiraModule, string> = {
  customer: "/customer",
  new_business: "/new-business",
  product: "/product",
  analytics: "/analytics",
  todo: "/smart-plan",
  broadcast: "/broadcast",
  visualizer: "/visualizer",
};

describe("Skill agent suggestions", () => {
  const registry = getAgentRegistry();

  (Object.keys(MODULE_PAGES) as MiraModule[]).forEach((module) => {
    it(`returns actionable suggestions for ${module}`, async () => {
      const agent = registry.getAgentByModule(module);
      expect(agent).not.toBeNull();

      const context: MiraContext = {
        module,
        page: MODULE_PAGES[module],
        pageData: {},
      };

      const suggestions = (await agent?.generateSuggestions?.(context)) ?? [];
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
      for (const suggestion of suggestions) {
        expect(typeof suggestion.intent).toBe("string");
        expect(suggestion.intent.length).toBeGreaterThan(0);
        expect(typeof suggestion.promptText).toBe("string");
        expect(suggestion.promptText.length).toBeGreaterThan(0);
      }
    });
  });
});
