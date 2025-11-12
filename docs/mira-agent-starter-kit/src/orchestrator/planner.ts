import YAML from "yaml";
import { readFileSync } from "node:fs";
import { Envelope, Context } from "../sdk/types.js";

export type Step = { name: string; args?: any; summary?: string; result?: any };
export type Plan = { steps: Step[] };

export function loadWorkflow(intent: string) {
  const path = `config/workflows/${intent}.yaml`;
  const wf = YAML.parse(readFileSync(path, "utf-8"));
  return wf;
}

export async function runPlan(ctx: Context, wf: any): Promise<Envelope> {
  // Extremely simplified executor: demonstrate confirm and message composition
  // Real implementation should traverse wf.states[...] as a state machine
  const first = Object.keys(wf.states)[0];
  const confirm = wf.states.propose_plan?.require_confirmation;
  if (confirm) {
    return {
      message: "I can proceed with the planned action.",
      confirm: {
        summary: "Proposed plan requires confirmation",
        on_approve: []
      }
    };
  }
  return { message: "Plan executed (stub)." };
}
