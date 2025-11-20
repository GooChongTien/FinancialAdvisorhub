import { classify } from "./orchestrator/router.js";
import { runIntent } from "./orchestrator/planner.js";
import { run as runGuards } from "./orchestrator/guardrails.js";
import type { Context, Envelope } from "./sdk/types.js";

const ctx: Context = {
  journey_type: "A2C",
  advisor: { id: "A-001", role: "Advisor", permissions: ["ui:navigate","data:update","task:create"], tenant_id: process.env.TENANT_ID || "tenant" },
  customer: { id: "C-001", name: "Kim" },
  session: { route: "/home", tenant: "AdviseU" },
  flags: { dryRun: true }
};

async function handleTurn(userText: string): Promise<Envelope> {
  const g1 = await runGuards("input", userText);
  if (g1.decision !== "allow") return { message: "Request blocked by guardrails." };

  const { intent, confidence } = await classify(userText);
  const env = await runIntent(ctx, intent, userText);
  return { ...env, telemetry: { ...(env.telemetry || {}), intent, confidence } };
}

(async () => {
  const sampleUtterances = [
    "where do i update risk profile?",
    "set income to 4500 and add a child age 2",
    "summarise this client for me",
    "help me prepare for meeting with Jason",
    "summarise this meeting and create follow up task",
    "give me a script to explain CI vs medical card"
  ];
  for (const u of sampleUtterances) {
    const out = await handleTurn(u);
    console.log("\nUSER:", u);
    console.log("MIRA:", JSON.stringify(out, null, 2));
  }
})();

