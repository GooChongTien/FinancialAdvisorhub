import { describe, expect, it, vi } from "vitest";

vi.mock("https://esm.sh/zod@3.25.76", async () => {
  const actual = await vi.importActual<typeof import("zod")>("zod");
  return { z: actual.z };
});

import {
  agentChatBodySchema,
  formatAgentChatIssues,
} from "../../supabase/functions/_shared/services/security/agent-request-schema.ts";

describe("agent chat request schema", () => {
  it("requires at least one user message for streaming mode", () => {
    const result = agentChatBodySchema.safeParse({
      mode: "stream",
      messages: [{ role: "assistant", content: "hello" }],
    });
    expect(result.success).toBe(false);
    const details = formatAgentChatIssues(result.error.issues);
    expect(details[0].path).toBe("messages");
    expect(details[0].message).toMatch(/At least one user message/i);
  });

  it("allows suggest mode without messages", () => {
    const result = agentChatBodySchema.safeParse({ mode: "suggest" });
    expect(result.success).toBe(true);
    expect(result.data.mode).toBe("suggest");
    expect(result.data.messages).toEqual([]);
  });

  it("normalizes mode and message defaults", () => {
    const parsed = agentChatBodySchema.parse({
      messages: [{ role: "user", content: "hello" }],
    });
    expect(parsed.mode).toBe("stream");
    expect(parsed.messages).toHaveLength(1);
  });
});
