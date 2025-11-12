import type { AgentChatRequest } from "../agent/types.ts";
import { knowledgeLookup } from "../knowledge/lookup.ts";
export {
  hasRegisteredAgent as hasModuleAgent,
  executeRegisteredAgent as executeModuleAgent,
} from "../../../supabase/functions/_shared/services/agents/agent-runner.ts";
export type { AgentExecutionInput } from "../../../supabase/functions/_shared/services/agents/agent-runner.ts";
// A2C starter-kit skill implementations (kept intact; we wrap them here)
import type { Context as A2CContext, Envelope as A2CEnvelope } from "../../../docs/mira-agent-starter-kit-a2c/src/sdk/types.ts";
import { system_help } from "../../../docs/mira-agent-starter-kit-a2c/src/skills/system_help.ts";
import { capture_update_data } from "../../../docs/mira-agent-starter-kit-a2c/src/skills/capture_update_data.ts";
import { case_overview } from "../../../docs/mira-agent-starter-kit-a2c/src/skills/case_overview.ts";
import { risk_nudge } from "../../../docs/mira-agent-starter-kit-a2c/src/skills/risk_nudge.ts";
import { prepare_meeting } from "../../../docs/mira-agent-starter-kit-a2c/src/skills/prepare_meeting.ts";
import { post_meeting_wrap } from "../../../docs/mira-agent-starter-kit-a2c/src/skills/post_meeting_wrap.ts";
import { sales_help_explicit } from "../../../docs/mira-agent-starter-kit-a2c/src/skills/sales_help_explicit.ts";

export interface SkillContext {
  request: AgentChatRequest;
  requestId?: string;
  tenantId?: string | null;
}

export interface SkillResult {
  content: string;
}

type SkillHandler = (ctx: SkillContext) => Promise<SkillResult>;

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

function summarizeList(items: Array<{ title: string | null; topic: string | null; summary: string }>): string {
  if (!items || items.length === 0) return "No knowledge items found.";
  const bullets = items.slice(0, 5).map((it) => {
    const title = it.title ? `“${it.title}”` : "Untitled";
    const topic = it.topic ? ` [${it.topic}]` : "";
    return `• ${title}${topic}: ${it.summary}`;
  });
  return `Here’s what I found:\n${bullets.join("\n")}`;
}

const kbKnowledgeLookup: SkillHandler = async ({ request }) => {
  const text = lastUserMessage(request);
  // Natural language: extract phrase after "knowledge lookup" if present; else use whole message
  const m = /knowledge lookup[:\s]*(.+)$/i.exec(text);
  const scenario = m && m[1] ? m[1].trim() : text.trim();
  const result = await knowledgeLookup({ scenario, limit: 3 });
  return { content: summarizeList(result.items || []) };
};

const fnaGenerateRecommendation: SkillHandler = async ({ request }) => {
  const prompt = lastUserMessage(request);
  return {
    content: `FNA recommendation (stub): Using your prompt "${prompt.slice(0, 140)}"... we will compile a tailored recommendation in a later iteration.`,
  };
};

function buildA2CContext(req: AgentChatRequest): A2CContext {
  const meta = (req.metadata ?? {}) as Record<string, unknown>;
  const advisor = (meta.advisor as any) ?? {};
  const customerId = (meta.customerId as string) ?? (meta.customer_id as string) ?? undefined;
  const customerName = (meta.customerName as string) ?? (meta.customer_name as string) ?? undefined;
  const tenantId = (meta.tenantId as string) ?? (meta.tenant_id as string) ?? "default";
  const route = (meta.route as string) ?? "/";
  return {
    journey_type: (meta.journey_type as any) ?? (meta.journeyType as any) ?? "A2C",
    advisor: {
      id: advisor.id ?? "advisor-unknown",
      role: advisor.role ?? "advisor",
      permissions: Array.isArray(advisor.permissions) ? advisor.permissions : [],
      tenant_id: advisor.tenant_id ?? tenantId,
    },
    customer: customerId ? { id: customerId, name: customerName ?? "" } : undefined,
    session: { route, tenant: tenantId },
    task: typeof meta.intent === "string" ? { intent: meta.intent, entities: {} } : undefined,
    flags: { dryRun: meta.dryRun === true },
  };
}

function envelopeToContent(envelope: A2CEnvelope): string {
  return envelope?.message ?? "";
}

// Wrapper helpers for A2C skills
const opsSystemHelp: SkillHandler = async ({ request }) => {
  const ctx = buildA2CContext(request);
  const text = lastUserMessage(request);
  const env = await system_help(ctx, text);
  return { content: envelopeToContent(env) };
};

const opsPrepareMeeting: SkillHandler = async ({ request }) => {
  const ctx = buildA2CContext(request);
  const text = lastUserMessage(request);
  const env = await prepare_meeting(ctx, text);
  return { content: envelopeToContent(env) };
};

const opsPostMeetingWrap: SkillHandler = async ({ request }) => {
  const ctx = buildA2CContext(request);
  const text = lastUserMessage(request);
  const env = await post_meeting_wrap(ctx, text);
  return { content: envelopeToContent(env) };
};

const fnaCaptureUpdateData: SkillHandler = async ({ request }) => {
  const ctx = buildA2CContext(request);
  const text = lastUserMessage(request);
  const env = await capture_update_data(ctx, text);
  return { content: envelopeToContent(env) };
};

const fnaCaseOverview: SkillHandler = async ({ request }) => {
  const ctx = buildA2CContext(request);
  const text = lastUserMessage(request);
  const env = await case_overview(ctx, text);
  return { content: envelopeToContent(env) };
};

const kbRiskNudge: SkillHandler = async ({ request }) => {
  const ctx = buildA2CContext(request);
  const text = lastUserMessage(request);
  const env = await risk_nudge(ctx, text);
  return { content: envelopeToContent(env) };
};

const kbSalesHelpExplicit: SkillHandler = async ({ request }) => {
  const ctx = buildA2CContext(request);
  const text = lastUserMessage(request);
  const env = await sales_help_explicit(ctx, text);
  return { content: envelopeToContent(env) };
};

const registry: Record<string, { agent: string; handler: SkillHandler }> = {
  // Knowledge agent skills
  "kb__knowledge_lookup": { agent: "mira_knowledge_brain_agent", handler: kbKnowledgeLookup },
  "kb__risk_nudge": { agent: "mira_knowledge_brain_agent", handler: kbRiskNudge },
  "kb__sales_help_explicit": { agent: "mira_knowledge_brain_agent", handler: kbSalesHelpExplicit },

  // FNA agent skills
  "fna__capture_update_data": { agent: "mira_fna_advisor_agent", handler: fnaCaptureUpdateData },
  "fna__case_overview": { agent: "mira_fna_advisor_agent", handler: fnaCaseOverview },
  "fna__generate_recommendation": { agent: "mira_fna_advisor_agent", handler: fnaGenerateRecommendation },

  // Ops agent skills
  "ops__system_help": { agent: "mira_ops_task_agent", handler: opsSystemHelp },
  "ops__prepare_meeting": { agent: "mira_ops_task_agent", handler: opsPrepareMeeting },
  "ops__post_meeting_wrap": { agent: "mira_ops_task_agent", handler: opsPostMeetingWrap },
  // NOTE: ops__agent_passthrough is a router hint only; deliberately not implemented here.
  // NOTE: ops__create_task intentionally not added for now (stub remains in FE/doc scaffolding).
};

export function hasSkill(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(registry, name);
}

export async function executeSkill(name: string, ctx: SkillContext): Promise<SkillResult> {
  const entry = registry[name];
  if (!entry) throw new Error(`Unknown skill: ${name}`);
  return entry.handler(ctx);
}

export function getAgentForSkill(name: string): string | null {
  const entry = registry[name];
  return entry?.agent ?? null;
}
