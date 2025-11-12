import { describe, expect, it } from "vitest";
import {
  buildSupabaseAgentFixture,
  makeFactFindRecord,
  makeProposalRecord,
} from "../utils/supabaseFixtures.ts";
import { createSimulatedSSEStream, formatSSEChunk, simulateAgentEvents } from "../utils/sseSimulator.ts";
import { enforceGuardrails } from "../utils/guardrails.ts";

describe("test harness utilities", () => {
  it("builds consistent Supabase fixtures", () => {
    const fixture = buildSupabaseAgentFixture();
    expect(fixture.factFind.id).toMatch(/^ff_/);
    expect(fixture.leads).toHaveLength(1);
    expect(fixture.proposals[0]?.leadId).toBe(fixture.leads[0]?.id);

    const custom = buildSupabaseAgentFixture({
      factFind: makeFactFindRecord({ advisorId: "adv_fixed" }),
      proposals: [makeProposalRecord({ premium: 2400, currency: "MYR" })],
    });
    expect(custom.advisorId).toBe("adv_fixed");
    expect(custom.proposals[0]?.currency).toBe("MYR");
  });

  it("simulates SSE scripts deterministically", async () => {
    const script = [
      { type: "message.delta" as const, data: { delta: "Hello" } },
      { type: "tool_call.created" as const, data: { name: "foo" } },
      { type: "done" as const },
    ];

    const collected = [];
    for await (const event of simulateAgentEvents(script)) {
      collected.push(event.type);
    }
    expect(collected).toEqual(["message.delta", "tool_call.created", "done"]);

    const stream = createSimulatedSSEStream(script);
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    const chunks: string[] = [];
    while (true) {
      const { value, done } = await reader.read();
      if (done || !value) break;
      chunks.push(decoder.decode(value));
    }
    expect(chunks.join("")).toContain(formatSSEChunk(script[0]!));
  });

  it("scrubs PII and blocks toxic responses", () => {
    const evaluation = enforceGuardrails(
      "Email me at user@example.com you idiot. NRIC S1234567A and phone 9123-4567."
    );
    expect(evaluation.sanitizedText).not.toContain("user@example.com");
    expect(evaluation.sanitizedText).toContain("[redacted-email]");
    expect(evaluation.blocked).toBe(true);
    expect(evaluation.reason).toBe("toxicity");
    expect(evaluation.score).toBeGreaterThan(0);
  });
});
