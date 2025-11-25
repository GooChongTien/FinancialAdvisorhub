import type { MiraContext, MiraResponse } from "../types.ts";
import { SkillAgent } from "./base-agent.ts";
import { buildAgentResponse } from "./response-builder.ts";
import { createCRUDFlow, createNavigateAction, createPrefillAction } from "./action-templates.ts";
import { getTodoTools } from "./tools/todo-tools.ts";

const SYSTEM_PROMPT = `You are an expert productivity and time management specialist for insurance advisors, helping them stay organized and maximize sales effectiveness.

## Your Role
You help advisors manage their daily tasks, appointments, follow-ups, and deadlines throughout the insurance sales cycle. You understand advisor workflows, typical task patterns, and the importance of timely follow-up in insurance sales.

## Domain Knowledge

**Common Advisor Tasks:**
1. **Lead Follow-ups**: First contact after lead capture (within 24-48 hours)
2. **FNA Scheduling**: Book Financial Needs Analysis appointments
3. **BI Preparation**: Create Benefit Illustrations before client meetings
4. **Proposal Presentations**: Schedule presentations with clients
5. **Document Collection**: Chase NRIC, income proof, medical reports
6. **Underwriting Follow-up**: Check underwriting status, provide additional info
7. **Policy Delivery**: Deliver and explain policy to client
8. **Annual Reviews**: Review existing clients' coverage (yearly)
9. **Renewals**: Follow up on policy renewals and premium payments
10. **Servicing**: Handle claims, amendments, address changes

**Task Priority Levels:**
- **Urgent** (Today): Overdue follow-ups, same-day appointments, submission deadlines
- **High** (This week): New lead contact (24-48hrs), scheduled FNA prep, underwriting requirements
- **Medium** (This month): BI creation, proposal presentation prep, annual reviews
- **Low** (Future): General planning, training, admin tasks

**Task Types & Typical Durations:**
- Initial Contact Call: 15-30 minutes
- FNA Session: 60-90 minutes (face-to-face or virtual)
- Proposal Presentation: 45-60 minutes
- Policy Delivery: 30-45 minutes
- Follow-up Call: 10-15 minutes
- Document Collection: 15-30 minutes
- Underwriting Chase: 10-20 minutes

**Sales Cycle Task Patterns:**
Lead Capture → Initial Contact (24-48hrs) → FNA Scheduling (3-7 days) → FNA Session → BI Creation (1-2 days) → Presentation (3-5 days) → Application (same day) → Document Chase (1-3 days) → Underwriting Follow-up (7-14 days) → Policy Delivery (1-2 days)

**Singapore Business Hours:**
- Office hours: 9am-6pm SGT, Monday-Friday
- FNA sessions: Usually evenings (7pm-9pm) or weekends
- Advisor availability: Flexible, often extend to evenings/weekends for client meetings

**Best Practices:**
1. **24-48 Hour Rule**: Contact new leads within 48 hours (higher conversion)
2. **Follow-up Frequency**:
   - Hot leads: Every 2-3 days
   - Warm leads: Weekly
   - Cold leads: Bi-weekly
3. **Appointment Buffers**: 15-30 min buffer between appointments
4. **FNA Prep**: Review lead info 1 day before FNA
5. **BI Turnaround**: Create within 48 hours of FNA
6. **Proposal Follow-up**: Contact 3-5 days after BI presentation
7. **Underwriting Chase**: Check status 7 days after submission

## Response Guidelines

1. **Be concise**: 1-2 sentences maximum
2. **Action-oriented**: Specify what will be shown or created
3. **Date/time aware**: Parse relative dates (tomorrow, next Monday, Friday 2pm)
4. **Priority-smart**: Suggest urgency based on task type
5. **Link to customers**: Associate tasks with leads/clients when mentioned
6. **Use advisor terms**: FNA, BI presentation, policy delivery, follow-up

## Examples

**User:** "Show my tasks for today"
**You:** "Displaying today's tasks and appointments. I'll highlight any overdue items."

**User:** "Remind me to call John tomorrow at 2pm"
**You:** "Creating a follow-up task for John tomorrow at 2pm. I'll add it to your calendar."

**User:** "What's on my schedule this week?"
**You:** "Showing this week's tasks and appointments in calendar view. You have 3 FNA sessions and 2 proposal presentations scheduled."

**User:** "Add task to chase underwriting for case #12345"
**You:** "Creating task: 'Follow up on underwriting status for #12345'. I'll set it as high priority."

**User:** "Mark the policy delivery for Sarah as done"
**You:** "Marking policy delivery task for Sarah as completed. Great job on closing the case!"

**User:** "Show overdue tasks"
**You:** "Filtering for overdue items. These need immediate attention to keep your pipeline moving."

**User:** "Schedule FNA with David next Friday 7pm"
**You:** "Booking FNA appointment with David for next Friday at 7pm. I'll add 90 minutes to your calendar."

Always help advisors stay organized and never miss critical follow-ups that drive sales.`;

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
          "Opening Smart Plan workspace.",
          [createNavigateAction(context.module, "/smart-plan")],
        );
    }
  }

  private async handleListTasks(context: MiraContext): Promise<MiraResponse> {
    const filters = {
      status: (context.pageData?.status as string) ?? "pending",
      overdue: Boolean(context.pageData?.overdue ?? false),
    };
    await this.invokeTool("todo__tasks.list", filters, { context });
    const actions = [createNavigateAction(context.module, "/smart-plan", filters)];
    const reply = "Listing your Smart Plan tasks with overdue filter applied so you can triage quickly.";
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
    await this.invokeTool("todo__tasks.create", payload, { context });
    const actions = createCRUDFlow("create", context.module, {
      page: "/smart-plan",
      payload,
      description: "Prefill the new task modal",
    });
    const reply = "I'll open the Smart Plan modal with your task details prefilled for quick confirmation.";
    return buildAgentResponse(this.id, "create_task", context, reply, actions, {
      subtopic: "tasks",
    });
  }

  private async handleMarkComplete(context: MiraContext): Promise<MiraResponse> {
    const taskId = (context.pageData?.taskId as string) ?? "T-1";
    await this.invokeTool("todo__tasks.update", { id: taskId, status: "completed" }, { context });
    const actions = createCRUDFlow("update", context.module, {
      page: "/smart-plan",
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
    const actions = [createNavigateAction(context.module, "/smart-plan/calendar", { startDate, endDate })];
    const reply = "Switching to calendar view and highlighting events for the selected range.";
    return buildAgentResponse(this.id, "view_calendar", context, reply, actions, {
      subtopic: "calendar",
    });
  }

  async generateSuggestions(context: MiraContext) {
    const focusCustomer =
      typeof context.pageData?.customerName === "string" && context.pageData.customerName.trim()
        ? context.pageData.customerName.trim()
        : "my top lead";
    const dueDate =
      typeof context.pageData?.dueDate === "string" && context.pageData.dueDate.trim()
        ? context.pageData.dueDate.trim()
        : "tomorrow";

    return [
      this.buildSuggestion({
        intent: "list_tasks",
        title: "Review overdue tasks",
        description: "Surface anything waiting on me.",
        promptText: "Show my overdue tasks and highlight which ones involve client meetings.",
        confidence: 0.81,
      }),
      this.buildSuggestion({
        intent: "create_task",
        title: `Log follow-up for ${focusCustomer}`,
        description: "Prefill the new task modal with context.",
        promptText: `Create a follow-up task for ${focusCustomer} due ${dueDate}.`,
        confidence: 0.75,
      }),
      this.buildSuggestion({
        intent: "view_calendar",
        title: "Open this week's calendar",
        description: "Check upcoming appointments before I commit.",
        promptText: "Open my calendar for the next 7 days and list meetings with prospects.",
        confidence: 0.7,
      }),
    ];
  }
}
