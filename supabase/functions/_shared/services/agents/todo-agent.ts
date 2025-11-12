import type { MiraContext, MiraResponse } from "../types.ts";
import { SkillAgent } from "./base-agent.ts";
import { buildAgentResponse } from "./response-builder.ts";
import { createCRUDFlow, createNavigateAction, createPrefillAction } from "./action-templates.ts";
import { getTodoTools } from "./tools/todo-tools.ts";

const SYSTEM_PROMPT = `You are a task and calendar management specialist.
Keep advisors organized by listing tasks, logging follow-ups, and surfacing calendar events.`;

export class ToDoAgent extends SkillAgent {
  constructor() {
    super("ToDoAgent", "todo", SYSTEM_PROMPT, getTodoTools());
  }

  async execute(intent: string, context: MiraContext): Promise<MiraResponse> {
    switch (intent) {
      case "list_tasks":
        return this.handleListTasks(context);
      case "create_task":
        return this.handleCreateTask(context);
      case "mark_complete":
        return this.handleMarkComplete(context);
      case "view_calendar":
        return this.handleViewCalendar(context);
      default:
        return buildAgentResponse(
          this.id,
          intent,
          context,
          "Opening To-Do workspace.",
          [createNavigateAction(context.module, "/todo")],
        );
    }
  }

  private async handleListTasks(context: MiraContext): Promise<MiraResponse> {
    const filters = {
      status: (context.pageData?.status as string) ?? "pending",
      overdue: Boolean(context.pageData?.overdue ?? false),
    };
    await this.invokeTool("tasks.list", filters, { context });
    const actions = [createNavigateAction(context.module, "/todo", filters)];
    const reply = "Listing your pending items with overdue filter applied so you can triage quickly.";
    return buildAgentResponse(this.id, "list_tasks", context, reply, actions, {
      subtopic: "tasks",
    });
  }

  private async handleCreateTask(context: MiraContext): Promise<MiraResponse> {
    const payload = {
      title: (context.pageData?.title as string) ?? "Follow up with client",
      dueDate: (context.pageData?.dueDate as string) ?? new Date().toISOString(),
      customerId: (context.pageData?.customerId as string) ?? undefined,
    };
    await this.invokeTool("tasks.create", payload, { context });
    const actions = createCRUDFlow("create", context.module, {
      page: "/todo",
      payload,
      description: "Prefill the new task modal",
    });
    const reply = "I'll open the To-Do modal with your task details prefilled for quick confirmation.";
    return buildAgentResponse(this.id, "create_task", context, reply, actions, {
      subtopic: "tasks",
    });
  }

  private async handleMarkComplete(context: MiraContext): Promise<MiraResponse> {
    const taskId = (context.pageData?.taskId as string) ?? "T-1";
    await this.invokeTool("tasks.markComplete", { id: taskId }, { context });
    const actions = createCRUDFlow("update", context.module, {
      page: "/todo",
      payload: { id: taskId, status: "completed" },
      endpoint: `/api/todo/tasks/${taskId}`,
      description: "Confirm completion",
    });
    const reply = `Marking task ${taskId} as done and refreshing your list.`;
    return buildAgentResponse(this.id, "mark_complete", context, reply, actions, {
      subtopic: "tasks",
    });
  }

  private async handleViewCalendar(context: MiraContext): Promise<MiraResponse> {
    const startDate = (context.pageData?.startDate as string) ?? new Date().toISOString();
    const endDate = (context.pageData?.endDate as string) ?? new Date(Date.now() + 7 * 86400000).toISOString();
    await this.invokeTool("calendar.getEvents", { startDate, endDate }, { context });
    const actions = [createNavigateAction(context.module, "/todo/calendar", { startDate, endDate })];
    const reply = "Switching to calendar view and highlighting events for the selected range.";
    return buildAgentResponse(this.id, "view_calendar", context, reply, actions, {
      subtopic: "calendar",
    });
  }
}
