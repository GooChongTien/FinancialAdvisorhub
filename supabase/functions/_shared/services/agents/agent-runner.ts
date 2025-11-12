import type { MiraContext, MiraModule, MiraResponse } from "../types.ts";
import type { SkillAgent } from "./base-agent.ts";
import { getAgentRegistry } from "./registry.ts";

export interface AgentExecutionInput {
  intent: string;
  context: MiraContext;
  userMessage: string;
  agentId?: string | null;
}

const KNOWN_MODULES: MiraModule[] = [
  "customer",
  "new_business",
  "product",
  "analytics",
  "todo",
  "broadcast",
  "visualizer",
];

const MODULE_SET = new Set<KnownModule>(KNOWN_MODULES);
type KnownModule = (typeof KNOWN_MODULES)[number];

function resolveAgent(agentId?: string | null, module?: string): SkillAgent | null {
  const registry = getAgentRegistry();
  if (agentId) {
    const agent = registry.getAgentById(agentId);
    if (agent) return agent;
  }
  if (module && MODULE_SET.has(module as KnownModule)) {
    return registry.getAgentByModule(module as KnownModule);
  }
  return null;
}

export function hasRegisteredAgent(agentId?: string | null, module?: string): boolean {
  return resolveAgent(agentId, module) !== null;
}

export function getRegisteredAgent(agentId?: string | null, module?: string) {
  return resolveAgent(agentId, module);
}

export async function executeRegisteredAgent(input: AgentExecutionInput): Promise<MiraResponse> {
  const agent = resolveAgent(input.agentId, input.context.module);
  if (!agent) {
    throw new Error(`No registered agent for module ${input.context.module}`);
  }
  return agent.execute(input.intent, input.context, input.userMessage);
}
