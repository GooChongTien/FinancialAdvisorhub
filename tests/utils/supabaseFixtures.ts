import crypto from "node:crypto";

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Record<string, unknown> ? DeepPartial<T[K]> : T[K];
};

export interface FactFindRecord {
  id: string;
  advisorId: string;
  clientId: string;
  completedAt: string;
  income: number;
  expenses: number;
  dependants: number;
  goals: string[];
}

export interface LeadRecord {
  id: string;
  advisorId: string;
  stage: "new" | "fact_find" | "proposal" | "won" | "lost";
  createdAt: string;
  updatedAt: string;
}

export interface ProposalRecord {
  id: string;
  leadId: string;
  advisorId: string;
  premium: number;
  currency: "SGD" | "MYR";
  status: "draft" | "presented" | "signed";
  createdAt: string;
}

export interface SupabaseAgentFixture {
  advisorId: string;
  factFind: FactFindRecord;
  leads: LeadRecord[];
  proposals: ProposalRecord[];
}

let sequence = 0;

const nextId = (prefix: string) => `${prefix}_${++sequence}_${crypto.randomUUID().slice(0, 8)}`;
const nowIso = () => new Date().toISOString();

export function makeFactFindRecord(overrides: DeepPartial<FactFindRecord> = {}): FactFindRecord {
  const base: FactFindRecord = {
    id: nextId("ff"),
    advisorId: nextId("adv"),
    clientId: nextId("client"),
    completedAt: nowIso(),
    income: 120000,
    expenses: 60000,
    dependants: 2,
    goals: ["Protect income", "Fund education"],
  };
  return { ...base, ...overrides } as FactFindRecord;
}

export function makeLeadRecord(overrides: DeepPartial<LeadRecord> = {}): LeadRecord {
  const base: LeadRecord = {
    id: nextId("lead"),
    advisorId: overrides.advisorId ?? nextId("adv"),
    stage: "fact_find",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  return { ...base, ...overrides } as LeadRecord;
}

export function makeProposalRecord(overrides: DeepPartial<ProposalRecord> = {}): ProposalRecord {
  const base: ProposalRecord = {
    id: nextId("proposal"),
    leadId: overrides.leadId ?? nextId("lead"),
    advisorId: overrides.advisorId ?? nextId("adv"),
    premium: 1800,
    currency: "SGD",
    status: "draft",
    createdAt: nowIso(),
  };
  return { ...base, ...overrides } as ProposalRecord;
}

export function buildSupabaseAgentFixture(
  overrides: Partial<SupabaseAgentFixture> = {}
): SupabaseAgentFixture {
  const factFind = overrides.factFind ?? makeFactFindRecord({ advisorId: overrides.advisorId });
  const leads =
    overrides.leads ??
    [
      makeLeadRecord({
        advisorId: factFind.advisorId,
        stage: "proposal",
      }),
    ];
  const proposals =
    overrides.proposals ??
    [
      makeProposalRecord({
        advisorId: factFind.advisorId,
        leadId: leads[0]?.id ?? nextId("lead"),
      }),
    ];

  return {
    advisorId: overrides.advisorId ?? factFind.advisorId,
    factFind,
    leads,
    proposals,
  };
}
