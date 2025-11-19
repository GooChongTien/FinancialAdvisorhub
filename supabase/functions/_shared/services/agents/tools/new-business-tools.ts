import type { AgentTool } from "../../types.ts";

export interface Proposal {
  id: string;
  customerId: string;
  productId: string;
  premium: number;
  status: "draft" | "submitted" | "approved" | "rejected";
}

export interface ProposalFilters {
  status?: Proposal["status"];
  customerId?: string;
}

export interface CreateProposalInput {
  customerId: string;
  productId: string;
  premium: number;
}

export interface Quote {
  id: string;
  productId: string;
  customerId: string;
  premium: number;
  coverage: number;
}

export interface UWStatus {
  proposalId: string;
  status: "pending" | "review" | "approved" | "additional_info";
  notes?: string;
}

const mockProposals: Proposal[] = [
  { id: "P-3001", customerId: "C-2001", productId: "PR-1001", premium: 2500, status: "draft" },
  { id: "P-3002", customerId: "C-2002", productId: "PR-1002", premium: 1800, status: "submitted" },
];

async function listProposals(filters: ProposalFilters = {}): Promise<Proposal[]> {
  return mockProposals.filter((proposal) => {
    if (filters.status && proposal.status !== filters.status) return false;
    if (filters.customerId && proposal.customerId !== filters.customerId) return false;
    return true;
  });
}

async function createProposal(input: CreateProposalInput): Promise<Proposal> {
  const proposal: Proposal = {
    id: `P-${Math.floor(Math.random() * 9000) + 3000}`,
    status: "draft",
    ...input,
  };
  mockProposals.push(proposal);
  return proposal;
}

async function getProposal(id: string): Promise<Proposal> {
  const proposal = mockProposals.find((p) => p.id === id);
  if (!proposal) throw new Error(`Proposal ${id} not found`);
  return proposal;
}

async function generateQuote(productId: string, customerId: string): Promise<Quote> {
  return {
    id: `Q-${Math.floor(Math.random() * 9000) + 4000}`,
    productId,
    customerId,
    premium: Math.round(Math.random() * 2000) + 1000,
    coverage: Math.round(Math.random() * 200000) + 100000,
  };
}

async function submitUnderwriting(proposalId: string): Promise<UWStatus> {
  return {
    proposalId,
    status: "pending",
    notes: "Submitted to underwriting queue",
  };
}

async function checkUnderwritingStatus(proposalId: string): Promise<UWStatus> {
  return {
    proposalId,
    status: "review",
    notes: "Underwriter requested confirmation of income documents",
  };
}

export function getNewBusinessTools(): AgentTool[] {
  return [
    {
    name: "new_business__proposals.create",
      description: "Create a new proposal draft",
      handler: async (input: CreateProposalInput) => createProposal(input),
    },
    {
    name: "new_business__proposals.list",
      description: "List proposals with filters",
      handler: async (input: ProposalFilters) => listProposals(input),
    },
    {
    name: "new_business__proposals.get",
      description: "Fetch a proposal by id",
      handler: async (input: { id: string }) => getProposal(input.id),
    },
    {
    name: "new_business__quotes.generate",
      description: "Generate a quick quote for a product and customer",
      handler: async (input: { productId: string; customerId: string }) => generateQuote(input.productId, input.customerId),
    },
    {
    name: "new_business__underwriting.submit",
      description: "Submit proposal to underwriting",
      handler: async (input: { proposalId: string }) => submitUnderwriting(input.proposalId),
    },
    {
    name: "new_business__underwriting.checkStatus",
      description: "Check underwriting decision status",
      handler: async (input: { proposalId: string }) => checkUnderwritingStatus(input.proposalId),
    },
  ];
}
