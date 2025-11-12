import type { AgentChatRequest } from "../agent/types.ts";

export interface RouterDecision {
  next_agent: string;
  next_skill: string;
}

function lastUserMessage(req: AgentChatRequest): string {
  const msgs = Array.isArray(req.messages) ? req.messages : [];
  for (let i = msgs.length - 1; i >= 0; i--) {
    const m = msgs[i];
    if (m?.role === "user") {
      const c = m.content;
      return typeof c === "string" ? c : JSON.stringify(c);
    }
  }
  return "";
}

function normalize(s: string) {
  return String(s || "").toLowerCase();
}

function agentForSkill(skill: string): string {
  if (skill.startsWith("kb__")) return "mira_knowledge_brain_agent";
  if (skill.startsWith("fna__")) return "mira_fna_advisor_agent";
  if (skill.startsWith("ops__")) return "mira_ops_task_agent";
  return "mira_ops_task_agent";
}

/**
 * Pure routing function: no model calls or business logic.
 * Returns the next agent + skill for this turn.
 */
export function routeMira(req: AgentChatRequest): RouterDecision {
  const meta: Record<string, unknown> = (req.metadata ?? {}) as Record<string, unknown>;
  const journey = normalize(String((meta as any).journey_type ?? (meta as any).journeyType ?? ""));
  const hintSkill = normalize(String((meta as any).nextSkill ?? ""));
  const text = normalize(lastUserMessage(req));

  // 1) Hard hint from metadata
  if (hintSkill && (hintSkill.startsWith("kb__") || hintSkill.startsWith("fna__") || hintSkill.startsWith("ops__"))) {
    return { next_agent: agentForSkill(hintSkill), next_skill: hintSkill };
  }

  // 2) Knowledge intents
  if (/(?:\bkb__knowledge_lookup\b|\bkb\s*:|knowledge lookup|lookup knowledge)/.test(text)) {
    return {
      next_agent: "mira_knowledge_brain_agent",
      next_skill: "kb__knowledge_lookup",
    };
  }

  // 3) FNA intents (very light heuristic)
  if (/(\bfna\b|needs analysis|recommendation plan|cashflow gap)/.test(text)) {
    return {
      next_agent: "mira_fna_advisor_agent",
      next_skill: "fna__generate_recommendation",
    };
  }

  // 4) Journey hinting to Ops
  if (journey === "ops" || /(\btask\b|\btodo\b|follow[- ]?up|\bnote\b)/.test(text)) {
    return {
      next_agent: "mira_ops_task_agent",
      next_skill: "ops__agent_passthrough",
    };
  }

  // 5) Default to passthrough so existing LLM chat remains unchanged
  return {
    next_agent: "mira_ops_task_agent",
    next_skill: "ops__agent_passthrough",
  };
}

export default { routeMira };
