import { describe, expect, it } from "vitest";
import { sanitizeRequest, validateRequest } from "../../backend/api/agent-chat.ts";

const basePayload = {
  mode: "stream",
  messages: [
    { role: "system", content: "test" },
    { role: "user", content: "hello" },
  ],
};

describe("/agent-chat contract validation", () => {
  it("rejects payloads without messages", () => {
    const result = validateRequest({ mode: "stream" });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("messages");
  });

  it("accepts valid payloads and sanitizes them", () => {
    const validation = validateRequest(basePayload);
    expect(validation.valid).toBe(true);

    const sanitized = sanitizeRequest({
      ...basePayload,
      metadata: { fact_find_completed: true },
      temperature: "not-a-number",
    });

    expect(sanitized.mode).toBe("stream");
    expect(sanitized.messages).toHaveLength(2);
    expect(sanitized.metadata).toEqual({ fact_find_completed: true });
    expect(sanitized.temperature).toBeUndefined();
  });

  it("truncates oversized message content", () => {
    const huge = "x".repeat(60000);
    const sanitized = sanitizeRequest({
      ...basePayload,
      messages: [
        { role: "user", content: huge },
      ],
    }, "tenant_abc");
    const content = sanitized.messages[0]?.content as string;
    expect(content.length).toBeLessThan(huge.length);
    expect(content).toContain("[truncated]");
    expect(sanitized.metadata?.tenantId).toBe("tenant_abc");
  });

  it("rejects payloads without mode", async () => {
    const req = new Request("https://example.com/api/agent-chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "hi" }] }),
    });
    const handleRequest = (await import("../../backend/api/agent-chat.ts")).default;
    const res = await handleRequest(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("mode is required");
  });
});
