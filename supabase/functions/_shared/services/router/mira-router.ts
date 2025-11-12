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

export function routeMira(req: AgentChatRequest): RouterDecision {
  const meta: Record<string, unknown> = (req.metadata ?? {}) as Record<string, unknown>;
  const journey = normalize(String((meta as any).journey_type ?? (meta as any).journeyType ?? ""));
  const hintSkill = normalize(String((meta as any).nextSkill ?? ""));
  const text = normalize(lastUserMessage(req));

  if (hintSkill && (hintSkill.startsWith("kb__") || hintSkill.startsWith("fna__") || hintSkill.startsWith("ops__"))) {
    return { next_agent: agentForSkill(hintSkill), next_skill: hintSkill };
  }

  // Knowledge intents
  if (/(?:\bkb__knowledge_lookup\b|\bkb\s*:|knowledge lookup|lookup knowledge)/.test(text)) {
    return { next_agent: "mira_knowledge_brain_agent", next_skill: "kb__knowledge_lookup" };
  }

  if (/(?:risk nudge|compliance nudge|nudge)/.test(text)) {
    return { next_agent: "mira_knowledge_brain_agent", next_skill: "kb__risk_nudge" };
  }

  if (/(?:sales help|sales script|what to say)/.test(text)) {
    return { next_agent: "mira_knowledge_brain_agent", next_skill: "kb__sales_help_explicit" };
  }

  // FNA intents
  if (/(\bfna\b|needs analysis|recommendation plan|cashflow gap)/.test(text)) {
    return { next_agent: "mira_fna_advisor_agent", next_skill: "fna__generate_recommendation" };
  }

  if (/(?:case overview|summarize case|snapshot)/.test(text)) {
    return { next_agent: "mira_fna_advisor_agent", next_skill: "fna__case_overview" };
  }

  if (/(?:update|set|change)\s+(?:income|child|kyc|fact[- ]?find|data)/.test(text)) {
    return { next_agent: "mira_fna_advisor_agent", next_skill: "fna__capture_update_data" };
  }

  // Ops intents
  if (/(?:analytics|dashboard|kpi|performance snapshot|premium this month|new policies|leads this week)/.test(text)) {
    return { next_agent: "mira_ops_task_agent", next_skill: "ops__analytics_explain" };
  }

  if (/(?:prepare meeting|prep meeting|meeting agenda)/.test(text)) {
    return { next_agent: "mira_ops_task_agent", next_skill: "ops__prepare_meeting" };
  }

  if (/(?:post[- ]?meeting wrap|wrap[- ]?up|follow[- ]?ups?)/.test(text)) {
    return { next_agent: "mira_ops_task_agent", next_skill: "ops__post_meeting_wrap" };
  }

  if (journey === "ops" || /(\btask\b|\btodo\b|follow[- ]?up|\bnote\b)/.test(text)) {
    return { next_agent: "mira_ops_task_agent", next_skill: "ops__agent_passthrough" };
  }

  return { next_agent: "mira_ops_task_agent", next_skill: "ops__agent_passthrough" };
}

export default { routeMira };
