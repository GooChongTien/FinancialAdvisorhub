export type Navigate = { type: "navigate"; route: string; section?: string; anchor?: string };
export type OpenForm = { type: "open_form"; form: "LeadCreate"|"AppointmentCreate"|"FNA"|"Quote"; data?: any };
export type PrefillForm = { type: "prefill_form"; form: string; fields: Record<string, any> };
export type UpdateField = { type: "update_field"; path: string; value: any };
export type CreateTask = { type: "create_task"; customerId: string; title: string; due?: string };
export type LogNote = { type: "log_note"; customerId: string; text: string };
export type Notify = { type: "notify"; level: "info"|"warn"|"success"; text: string };

export type Envelope = {
  message: string;
  actions?: Array<Navigate|OpenForm|PrefillForm|UpdateField|CreateTask|LogNote|Notify>;
  confirm?: { summary: string; on_approve: Envelope["actions"] } | null;
  telemetry?: { intent: string; confidence: number; notes?: string };
};

export type JourneyType = "A2C";

export type Context = {
  journey_type: JourneyType;
  advisor: { id: string; role: string; permissions: string[]; tenant_id: string };
  customer?: { id: string; name: string };
  session: { route: string; tenant: string };
  task?: { intent: string; entities: Record<string, any> };
  flags?: { dryRun: boolean };
};

