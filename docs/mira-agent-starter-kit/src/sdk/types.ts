export type Navigate = { type: "navigate"; route: string; section?: string; anchor?: string };
export type OpenForm = { type: "open_form"; form: "LeadCreate"|"AppointmentCreate"; data?: any };
export type Schedule = { type: "schedule"; customerId: string; when?: string; location?: string; draft?: boolean };
export type Notify = { type: "notify"; level: "info"|"warn"|"success"; text: string };
export type Job = { type: "job"; id: string; status: "queued"|"running"|"done"|"failed" };

export type Envelope = {
  message: string;
  actions?: Array<Navigate|OpenForm|Schedule|Notify|Job>;
  confirm?: { summary: string; on_approve: Array<Navigate|OpenForm|Schedule|Notify|Job> } | null;
  telemetry?: { intent: string; confidence: number; notes?: string };
};
export type Context = {
  advisor: { id: string; role: string; permissions: string[]; tenant_id: string };
  client?: { id: string; name: string; mobile?: string };
  session: { route: string; tenant: string };
  task?: { intent: string; entities: Record<string, any> };
  flags?: { dryRun: boolean };
};
