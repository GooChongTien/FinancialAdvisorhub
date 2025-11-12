import type { AgentChatRequest } from "../agent/types.ts";
import { knowledgeLookup } from "../knowledge/lookup.ts";
import type { AgentExecutionInput } from "../agents/agent-runner.ts";
import { executeRegisteredAgent, hasRegisteredAgent } from "../agents/agent-runner.ts";

// A2C starter-kit skill implementations (wrapped for Edge runtime)
// Note: Removed external A2C imports; lightweight local implementations below.

export interface SkillContext {
  request: AgentChatRequest;
  requestId?: string;
  tenantId?: string | null;
}

export interface SkillResult { content: string; actions?: any[] }

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

function buildA2CContext(req: AgentChatRequest): any {
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
    flags: { dryRun: (meta as any).dryRun === true },
  };
}
function envelopeToContent(message: string): string {
  return message ?? "";
}
function envelopeToActions(actions: any[] | undefined): any[] | undefined {
  if (!Array.isArray(actions) || actions.length === 0) return undefined;
  return actions;
}

// Local lightweight skills (no external dependencies)
const opsSystemHelp: SkillHandler = async ({ request }) => {
  const content = `You can ask me to navigate, update records, or summarize context. For example: "Open the FNA" or "Update monthly income to 4500".`;
  return { content: envelopeToContent(content) };
};
const opsPrepareMeeting: SkillHandler = async ({ request }) => {
  const content = `Here's a simple agenda you can follow:\n\n1) Confirm changes in family, income, or debts.\n2) Review protection vs liabilities.\n3) Check medical/health cover.\n4) Ask about new goals (education, retirement, business).\n\nI'll open the FNA so you can review details.`;
  const customerId = buildA2CContext(request).customer?.id ?? null;
  const actions = [
    { type: 'navigate', route: '/fna' },
    { type: 'create_task', customerId, title: 'Prepare client meeting', due: undefined },
  ];
  return { content: envelopeToContent(content), actions: envelopeToActions(actions) };
};
const opsPostMeetingWrap: SkillHandler = async ({ request }) => {
  const text = lastUserMessage(request);
  const message = `I'll save your notes and create a follow-up task. Adjust details on screen if needed.`;
  const customerId = buildA2CContext(request).customer?.id ?? null;
  const actions = [
    { type: 'log_note', customerId, text },
    { type: 'create_task', customerId, title: 'Follow up with client (from last meeting)', due: undefined },
  ];
  return { content: envelopeToContent(message), actions: envelopeToActions(actions) };
};
const fnaCaptureUpdateData: SkillHandler = async ({ request }) => {
  const userText = lastUserMessage(request).toLowerCase();
  const actions: any[] = [];
  const incomeMatch = userText.match(/income (to)?\s*(\d+[\d,]*)/);
  if (incomeMatch) {
    const value = parseInt(incomeMatch[2].replace(/,/g, ''), 10);
    actions.push({ type: 'update_field', path: 'fna.income.monthly', value });
  }
  const childMatch = userText.match(/child (age|aged)?\s*(\d{1,2})/);
  if (childMatch) {
    actions.push({ type: 'prefill_form', form: 'DependentCreate', fields: { relationship: 'Child', age: Number(childMatch[2]) } });
  }
  const content = actions.length
    ? `Got it — I'll update these details on the client record. Please review them on screen before you submit.`
    : `Tell me what to update, for example: "set income to 4500" or "add a child age 2".`;
  return { content: envelopeToContent(content), actions: envelopeToActions(actions) };
};
const fnaCaseOverview: SkillHandler = async ({ request }) => {
  const summary = [
    `Client: ${(buildA2CContext(request).customer?.name ?? 'N/A')}`,
    'Age: 35 (example)',
    'Family: married, 1 child (example)',
    'Liabilities: mortgage 600k (example)',
    'Existing cover: life 150k, CI 50k (example)',
    'Main gaps: life cover vs mortgage & income replacement, CI shortfall.'
  ].join('\n');
  const content = `Here is a quick snapshot based on available data (example data):\n\n${summary}\n\nYou might want to review the FNA and policy list before the conversation.`;
  const actions = [{ type: 'navigate', route: '/fna' }];
  return { content: envelopeToContent(content), actions: envelopeToActions(actions) };
};
const kbRiskNudge: SkillHandler = async ({ request }) => {
  const content = `This is a placeholder for risk nudges (e.g. heavy premium vs income, missing fact-find). In production, this skill surfaces gentle reminders based on your firm's compliance rules.`;
  return { content: envelopeToContent(content) };
};
const kbSalesHelpExplicit: SkillHandler = async ({ request }) => {
  const script = [
    'You could say something like:',
    '',
    '"From what you\'ve shared, I want to first make sure we\'re protecting your basics —',
    'things like medical bills and your family\'s ability to keep the home if something happens to you.',
    'We don\'t have to decide everything today; we can start with what fits your budget and review regularly."'
  ].join('\n');
  return { content: envelopeToContent(script) };
};

// Analytics routing skill: navigate to Analytics module and explain where to look
const opsAnalyticsExplain: SkillHandler = async ({ request }) => {
  const text = lastUserMessage(request).toLowerCase();
  let focus = 'performance overview';
  if (/premium|revenue|production/.test(text)) focus = 'premium trend and production summary';
  else if (/policy|policies/.test(text)) focus = 'new policies and team average';
  else if (/lead|acquisition/.test(text)) focus = 'new lead acquisition over time';
  else if (/proposal|quote|application/.test(text)) focus = 'active proposals and completion %';
  const content = `Opening Analytics so you can review ${focus}. In the dashboard, use the range toggles (30D/90D/YTD/12M) and the charts to drill in. I won’t compute numbers here — I’ll help you interpret what you see.`;
  return {
    content,
    actions: [{ type: 'navigate', route: '/analytics' }],
  };
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
  "ops__analytics_explain": { agent: "mira_ops_task_agent", handler: opsAnalyticsExplain },
  // NOTE: ops__agent_passthrough is a router hint only; deliberately not implemented here.
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

export function hasModuleAgent(agentId?: string | null, module?: string): boolean {
  return hasRegisteredAgent(agentId, module);
}

export function executeModuleAgent(input: AgentExecutionInput) {
  return executeRegisteredAgent(input);
}

export type { AgentExecutionInput } from "../agents/agent-runner.ts";
