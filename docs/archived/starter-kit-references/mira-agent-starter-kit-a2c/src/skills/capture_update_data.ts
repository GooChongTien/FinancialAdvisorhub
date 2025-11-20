import type { Context, Envelope, PrefillForm, UpdateField } from "../sdk/types.js";

export async function capture_update_data(ctx: Context, userText: string): Promise<Envelope> {
  const actions: (PrefillForm|UpdateField)[] = [];
  const lower = userText.toLowerCase();

  const incomeMatch = lower.match(/income (to)?\s*(\d+[\d,]*)/);
  if (incomeMatch) {
    const value = parseInt(incomeMatch[2].replace(/,/g, ""), 10);
    actions.push({ type: "update_field", path: "fna.income.monthly", value });
  }

  const childMatch = lower.match(/child (age|aged)?\s*(\d{1,2})/);
  if (childMatch) {
    actions.push({
      type: "prefill_form",
      form: "DependentCreate",
      fields: { relationship: "Child", age: Number(childMatch[2]) }
    });
  }

  if (!actions.length) {
    return { message: "Tell me what to update, for example: 'set income to 4500' or 'add a child age 2'." };
  }

  return {
    message: "Got it – I'll update these details on the client record. Please review them on screen before you submit.",
    actions
  };
}

