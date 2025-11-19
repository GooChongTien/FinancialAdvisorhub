import type { AgentTool } from "../../types.ts";

export interface Broadcast {
  id: string;
  title: string;
  audience: string;
  status: "draft" | "scheduled" | "sent";
}

export interface BroadcastFilters {
  status?: Broadcast["status"];
}

export interface CreateBroadcastInput {
  title: string;
  audience: string;
  scheduledAt?: string;
}

export interface CampaignStats {
  id: string;
  sent: number;
  opened: number;
  clicked: number;
}

const mockBroadcasts: Broadcast[] = [
  { id: "B-1", title: "Q4 Wealth Tips", audience: "Existing clients", status: "sent" },
  { id: "B-2", title: "Term Promo", audience: "Warm leads", status: "draft" },
];

async function listBroadcasts(filters: BroadcastFilters = {}): Promise<Broadcast[]> {
  return mockBroadcasts.filter((b) => {
    if (filters.status && b.status !== filters.status) return false;
    return true;
  });
}

async function createBroadcast(input: CreateBroadcastInput): Promise<Broadcast> {
  const broadcast: Broadcast = {
    id: `B-${mockBroadcasts.length + 1}`,
    status: "draft",
    ...input,
  };
  mockBroadcasts.push(broadcast);
  return broadcast;
}

async function getBroadcast(id: string): Promise<Broadcast> {
  const broadcast = mockBroadcasts.find((b) => b.id === id);
  if (!broadcast) throw new Error(`Broadcast ${id} not found`);
  return broadcast;
}

async function getStats(id: string): Promise<CampaignStats> {
  return {
    id,
    sent: 1200,
    opened: 620,
    clicked: 210,
  };
}

export function getBroadcastTools(): AgentTool[] {
  return [
    {
      name: "broadcast__broadcasts.list",
      description: "List broadcast campaigns",
      handler: async (input: BroadcastFilters) => listBroadcasts(input),
    },
    {
      name: "broadcast__broadcasts.create",
      description: "Create a new broadcast campaign",
      handler: async (input: CreateBroadcastInput) => createBroadcast(input),
    },
    {
      name: "broadcast__broadcasts.get",
      description: "Fetch broadcast by id",
      handler: async (input: { id: string }) => getBroadcast(input.id),
    },
    {
      name: "broadcast__broadcasts.getStats",
      description: "Retrieve campaign performance stats",
      handler: async (input: { id: string }) => getStats(input.id),
    },
  ];
}
