import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("https://esm.sh/zod@3.25.76", async () => {
  const actual = await vi.importActual<typeof import("zod")>("zod");
  return { z: actual.z };
});

import { z } from "zod";
import { ToolRegistry } from "../../supabase/functions/_shared/services/tools/registry.ts";

describe("ToolRegistry", () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();
  });

  describe("registerTool", () => {
    it("registers a tool successfully", () => {
      const handler = vi.fn().mockResolvedValue({ success: true, data: "test" });
      registry.registerTool("test_tool", handler);

      const tool = registry.getTool("test_tool");
      expect(tool).toBeDefined();
      expect(tool?.name).toBe("test_tool");
    });

    it("throws error for invalid tool name", () => {
      const handler = vi.fn();
      expect(() => registry.registerTool("", handler)).toThrow("Tool name must be a non-empty string");
    });

    it("allows registering a tool with schema", () => {
      const handler = vi.fn();
      const schema = z.object({ id: z.string() });
      registry.registerTool("test_tool", handler, schema);

      const tool = registry.getTool("test_tool");
      expect(tool?.schema).toBe(schema);
    });
  });

  describe("getTool", () => {
    it("returns registered tool", () => {
      const handler = vi.fn();
      registry.registerTool("test_tool", handler);

      const tool = registry.getTool("test_tool");
      expect(tool).not.toBeNull();
      expect(tool?.name).toBe("test_tool");
    });

    it("returns null for non-existent tool", () => {
      const tool = registry.getTool("non_existent");
      expect(tool).toBeNull();
    });
  });

  describe("getAllTools", () => {
    it("returns all registered tools", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      registry.registerTool("tool1", handler1);
      registry.registerTool("tool2", handler2);

      const tools = registry.getAllTools();
      expect(tools).toHaveLength(2);
      expect(tools.map(t => t.name)).toContain("tool1");
      expect(tools.map(t => t.name)).toContain("tool2");
    });

    it("returns empty array when no tools registered", () => {
      const tools = registry.getAllTools();
      expect(tools).toEqual([]);
    });
  });

  describe("executeTool", () => {
    it("executes a registered tool and returns validation errors when args mismatch", async () => {
      registry.registerTool(
        "debug_tool",
        async (_ctx, args) => ({ success: true, data: { echo: args } }),
        z.object({ message: z.string() }),
      );
      const response = await registry.executeTool("debug_tool", {
        req: new Request("https://example.com"),
        args: { message: "hello" },
      });
      expect(response.success).toBe(true);
      expect(response.data).toBeTruthy();

      const invalid = await registry.executeTool("debug_tool", {
        req: new Request("https://example.com"),
        args: { message: 42 },
      });
      expect(invalid.success).toBe(false);
      expect(invalid.error?.code).toBe("validation_error");
    });

    it("reports not found tools gracefully", async () => {
      const result = await registry.executeTool("does_not_exist", {
        req: new Request("https://example.com"),
        args: {},
      });
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("tool_not_found");
    });

    it("executes tool without schema validation", async () => {
      const handler = vi.fn().mockResolvedValue({ success: true, data: "result" });
      registry.registerTool("test_tool", handler);

      const result = await registry.executeTool("test_tool", {
        req: new Request("https://example.com"),
        args: { id: "123" },
      });

      expect(result.success).toBe(true);
      expect(result.data).toBe("result");
      expect(handler).toHaveBeenCalled();
    });

    it("catches and returns handler errors", async () => {
      const handler = vi.fn().mockRejectedValue(new Error("Handler failed"));
      registry.registerTool("failing_tool", handler);

      const result = await registry.executeTool("failing_tool", {
        req: new Request("https://example.com"),
        args: {},
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("tool_failure");
      expect(result.error?.message).toBe("Handler failed");
    });

    it("validates optional fields in schema", async () => {
      const schema = z.object({
        id: z.string(),
        name: z.string().optional(),
      });
      const handler = vi.fn().mockResolvedValue({ success: true, data: "ok" });
      registry.registerTool("test_tool", handler, schema);

      const result = await registry.executeTool("test_tool", {
        req: new Request("https://example.com"),
        args: { id: "123" },
      });

      expect(result.success).toBe(true);
    });
  });
});
