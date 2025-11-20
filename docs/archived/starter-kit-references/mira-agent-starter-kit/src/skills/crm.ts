import type { Context } from "../sdk/types.js";
export async function resolve_contact(ctx: Context, args: any) {
  return { contact: { id: "C551", name: "Kim" } };
}
