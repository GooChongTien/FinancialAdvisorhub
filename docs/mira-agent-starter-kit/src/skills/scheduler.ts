import type { Context } from "../sdk/types.js";
export async function find_slots(ctx: Context, { person, prefs }: any) {
  return { slots: ["2025-11-11T07:00:00Z","2025-11-11T08:00:00Z"] };
}
export async function create(ctx: Context, { customerId, start_at, location }: any) {
  return { appointment: { id: "appt_123", customerId, start_at, location } };
}
