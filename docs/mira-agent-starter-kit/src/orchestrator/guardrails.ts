import YAML from "yaml";
import { readFileSync } from "node:fs";

const cfg = YAML.parse(readFileSync("config/policies/guardrails.yaml", "utf-8"));

export async function run(stage: "input"|"toolcall"|"output", payload: any) {
  // Placeholder guardrail executor – extend with detectors and policies
  return { decision: "allow" as const, reason: null };
}
