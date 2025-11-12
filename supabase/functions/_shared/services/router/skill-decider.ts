import type { AgentChatRequest } from "../agent/types.ts";
import type { CandidateAgentScore, IntentClassification } from "../types.ts";

export interface SkillDecision {
  next_agent: string;
  next_skill: string;
  reason: string;
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

const TOPIC_DEFAULT_SKILL: Record<string, string> = {
  analytics: "ops__analytics_explain",
  todo: "ops__agent_passthrough",
  customer: "ops__system_help",
  new_business: "ops__agent_passthrough",
  product: "ops__agent_passthrough",
  broadcast: "ops__agent_passthrough",
  visualizer: "fna__generate_recommendation",
};

const agentForSkill = (skill: string, fallbackAgent: string): string => {
  if (skill.startsWith("kb__")) return "mira_knowledge_brain_agent";
  if (skill.startsWith("fna__")) return "mira_fna_advisor_agent";
  if (skill.startsWith("ops__")) return "mira_ops_task_agent";
  return fallbackAgent;
};

export function decideSkillFromClassification(options: {
  classification: IntentClassification;
  agentSelection: CandidateAgentScore;
  request: AgentChatRequest;
  userMessage?: string;
}): SkillDecision {
  const { classification, agentSelection, request } = options;
  const metadata = (request.metadata ?? {}) as Record<string, unknown>;
  const hintSkill = String(metadata?.nextSkill ?? metadata?.next_skill ?? "").toLowerCase();
  const text = (options.userMessage ?? lastUserMessage(request) ?? "").toLowerCase();

  const applyHeuristics = (): SkillDecision | null => {
    if (hintSkill && (hintSkill.startsWith("kb__") || hintSkill.startsWith("fna__") || hintSkill.startsWith("ops__"))) {
      const normalized = metadata?.nextSkill ?? metadata?.next_skill ?? hintSkill;
      const agent = agentForSkill(String(normalized), agentSelection.agentId);
      return { next_agent: agent, next_skill: String(normalized), reason: "hint_skill" };
    }

    if (/(?:\bkb__knowledge_lookup\b|\bkb\s*:|knowledge lookup|lookup knowledge)/.test(text)) {
      return { next_agent: "mira_knowledge_brain_agent", next_skill: "kb__knowledge_lookup", reason: "knowledge_lookup" };
    }
    if (/(?:risk nudge|compliance nudge|nudge)/.test(text)) {
      return { next_agent: "mira_knowledge_brain_agent", next_skill: "kb__risk_nudge", reason: "risk_nudge" };
    }
    if (/(?:sales help|sales script|what to say)/.test(text)) {
      return {
        next_agent: "mira_knowledge_brain_agent",
        next_skill: "kb__sales_help_explicit",
        reason: "sales_help",
      };
    }

    if (/(\bfna\b|needs analysis|recommendation plan|cashflow gap)/.test(text)) {
      return { next_agent: "mira_fna_advisor_agent", next_skill: "fna__generate_recommendation", reason: "fna_generate" };
    }
    if (/(?:case overview|summarize case|snapshot)/.test(text)) {
      return { next_agent: "mira_fna_advisor_agent", next_skill: "fna__case_overview", reason: "fna_case_overview" };
    }
    if (/(?:update|set|change)\s+(?:income|child|kyc|fact[- ]?find|data)/.test(text)) {
      return { next_agent: "mira_fna_advisor_agent", next_skill: "fna__capture_update_data", reason: "fna_capture" };
    }

    if (/(?:analytics|dashboard|kpi|performance snapshot|premium this month|new policies|leads this week)/.test(text)) {
      return { next_agent: "mira_ops_task_agent", next_skill: "ops__analytics_explain", reason: "ops_analytics" };
    }
    if (/(?:prepare meeting|prep meeting|meeting agenda)/.test(text)) {
      return { next_agent: "mira_ops_task_agent", next_skill: "ops__prepare_meeting", reason: "ops_prepare_meeting" };
    }
    if (/(?:post[- ]?meeting wrap|wrap[- ]?up|follow[- ]?ups?)/.test(text)) {
      return { next_agent: "mira_ops_task_agent", next_skill: "ops__post_meeting_wrap", reason: "ops_post_meeting" };
    }
    if (/(\btask\b|\btodo\b|follow[- ]?up|\bnote\b)/.test(text)) {
      return { next_agent: "mira_ops_task_agent", next_skill: "ops__agent_passthrough", reason: "ops_task" };
    }

    return null;
  };

  const heuristicDecision = applyHeuristics();
  if (heuristicDecision) return heuristicDecision;

  const defaultSkill = TOPIC_DEFAULT_SKILL[classification.topic] ?? "ops__agent_passthrough";
  const agent = agentForSkill(defaultSkill, agentSelection.agentId);
  return { next_agent: agent, next_skill: defaultSkill, reason: "topic_default" };
}
