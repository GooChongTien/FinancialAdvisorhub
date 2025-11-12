import type { Context, Envelope, CreateTask, LogNote } from "../sdk/types.js";

export async function post_meeting_wrap(ctx: Context, userText: string): Promise<Envelope> {
  const customerId = ctx.customer?.id ?? "unknown";

  const note: LogNote = {
    type: "log_note",
    customerId,
    text: userText
  };

  const task: CreateTask = {
    type: "create_task",
    customerId,
    title: "Follow up with client (from last meeting)",
    due: undefined
  };

  return {
    message: "I'll save these notes to the client timeline and create a simple follow-up task. You can adjust details on screen.",
    actions: [note, task]
  };
}

