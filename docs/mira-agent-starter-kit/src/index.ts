import { classify } from "./orchestrator/router.js";
import { loadWorkflow, runPlan } from "./orchestrator/planner.js";
import { run as runGuards } from "./orchestrator/guardrails.js";
import type { Envelope, Context } from "./sdk/types.js";

const ctx: Context = {
  advisor: { id: "A-001", role: "Advisor", permissions: ["ui:navigate","appt:create"], tenant_id: process.env.TENANT_ID || "tenant" },
  session: { route: "/home", tenant: "AdviseU" },
  flags: { dryRun: true }
};

async function handleTurn(userText: string): Promise<Envelope> {
  const g1 = await runGuards("input", userText);
  if (g1.decision !== "allow") return { message: "Blocked by guardrails." };

  const { intent } = await classify(userText);
  const wf = loadWorkflow(intent === "navigate" ? "navigate" : intent);
  const env = await runPlan(ctx, wf);
  return env;
}

(async () => {
  const sample = "book Kim next Tue 3pm";
  const out = await handleTurn(sample);
  console.log(JSON.stringify(out, null, 2));
})();
