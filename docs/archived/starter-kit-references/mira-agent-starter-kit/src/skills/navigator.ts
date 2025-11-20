import type { Context } from "../sdk/types.js";
export async function navigate(ctx: Context, { route, section, anchor }: { route:string; section?:string; anchor?:string }) {
  return { ok: true, route, section, anchor };
}
