/**
 * To-Do Tools - Supabase Integration
 * Task and calendar management
 */

import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  ToolRegistry,
  createSuccessResult,
  createErrorResult,
  type ToolContext,
  type ToolResult,
} from "./registry.ts";

// Zod Schemas
const TaskFiltersSchema = z.object({
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  due_date_from: z.string().optional(),
  due_date_to: z.string().optional(),
  assignee_id: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

const CreateTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  due_date: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  assignee_id: z.string().optional(),
  related_lead_id: z.string().optional(),
  related_customer_id: z.string().optional(),
  task_type: z.enum(["call", "meeting", "follow_up", "email", "other"]).default("other"),
});

const UpdateTaskSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  due_date: z.string().optional(),
  assignee_id: z.string().optional(),
});

const MarkCompleteSchema = z.object({
  id: z.string(),
});

const CalendarEventsSchema = z.object({
  start_date: z.string(),
  end_date: z.string(),
  advisor_id: z.string().optional(),
});

// Types
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  due_date?: string;
  assignee_id?: string;
  assignee_name?: string;
  related_lead_id?: string;
  related_customer_id?: string;
  task_type?: string;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  duration?: number;
  type: string;
  related_entity?: { type: string; id: string; name: string };
}

// Tool Handlers

async function listTasks(
  params: z.infer<typeof TaskFiltersSchema>,
  context?: ToolContext,
): Promise<ToolResult<Task[]>> {
  try {
    const supabase = context?.supabase as SupabaseClient | undefined;
    if (!supabase) {
      // Mock data
      return createSuccessResult([
        {
          id: "T-1001",
          title: "Follow up with Kim Tan",
          status: "pending",
          priority: "high",
          due_date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
          task_type: "follow_up",
        },
        {
          id: "T-1002",
          title: "Prepare proposal for Amanda",
          status: "in_progress",
          priority: "medium",
          due_date: new Date(Date.now() + 172800000).toISOString().split("T")[0],
          task_type: "other",
        },
      ]);
    }

    let query = supabase.from("tasks").select("*");

    if (params.status) {
      query = query.eq("status", params.status);
    }
    if (params.priority) {
      query = query.eq("priority", params.priority);
    }
    if (params.assignee_id) {
      query = query.eq("assignee_id", params.assignee_id);
    }
    if (params.due_date_from) {
      query = query.gte("due_date", params.due_date_from);
    }
    if (params.due_date_to) {
      query = query.lte("due_date", params.due_date_to);
    }

    query = query.range(params.offset, params.offset + params.limit - 1).order("due_date", { ascending: true });

    const { data, error } = await query;

    if (error) {
      return createErrorResult("DATABASE_ERROR", error.message, error);
    }

    return createSuccessResult(data as Task[]);
  } catch (error) {
    return createErrorResult(
      "EXECUTION_ERROR",
      error instanceof Error ? error.message : "Failed to list tasks",
      error,
    );
  }
}

async function createTask(
  params: z.infer<typeof CreateTaskSchema>,
  context?: ToolContext,
): Promise<ToolResult<Task>> {
  try {
    const supabase = context?.supabase as SupabaseClient | undefined;
    if (!supabase) {
      // Mock
      return createSuccessResult({
        id: `T-${Math.floor(Math.random() * 9000) + 1000}`,
        status: "pending" as const,
        ...params,
      });
    }

    const taskData = {
      ...params,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from("tasks").insert(taskData).select().single();

    if (error) {
      return createErrorResult("DATABASE_ERROR", error.message, error);
    }

    return createSuccessResult(data as Task);
  } catch (error) {
    return createErrorResult(
      "EXECUTION_ERROR",
      error instanceof Error ? error.message : "Failed to create task",
      error,
    );
  }
}

async function updateTask(
  params: z.infer<typeof UpdateTaskSchema>,
  context?: ToolContext,
): Promise<ToolResult<Task>> {
  try {
    const supabase = context?.supabase as SupabaseClient | undefined;
    if (!supabase) {
      // Mock
      return createSuccessResult({
        id: params.id,
        title: params.title || "Mock Task",
        status: params.status || "pending",
        priority: params.priority || "medium",
      });
    }

    const { id, ...updateData } = params;
    const updatePayload = {
      ...updateData,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from("tasks").update(updatePayload).eq("id", id).select().single();

    if (error) {
      return createErrorResult("DATABASE_ERROR", error.message, error);
    }

    if (!data) {
      return createErrorResult("NOT_FOUND", `Task ${id} not found`);
    }

    return createSuccessResult(data as Task);
  } catch (error) {
    return createErrorResult(
      "EXECUTION_ERROR",
      error instanceof Error ? error.message : "Failed to update task",
      error,
    );
  }
}

async function markComplete(
  params: z.infer<typeof MarkCompleteSchema>,
  context?: ToolContext,
): Promise<ToolResult<Task>> {
  try {
    const supabase = context?.supabase as SupabaseClient | undefined;
    if (!supabase) {
      // Mock
      return createSuccessResult({
        id: params.id,
        title: "Completed Task",
        status: "completed" as const,
        priority: "medium" as const,
        completed_at: new Date().toISOString(),
      });
    }

    const updatePayload = {
      status: "completed",
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from("tasks").update(updatePayload).eq("id", params.id).select().single();

    if (error) {
      return createErrorResult("DATABASE_ERROR", error.message, error);
    }

    if (!data) {
      return createErrorResult("NOT_FOUND", `Task ${params.id} not found`);
    }

    return createSuccessResult(data as Task);
  } catch (error) {
    return createErrorResult(
      "EXECUTION_ERROR",
      error instanceof Error ? error.message : "Failed to mark task complete",
      error,
    );
  }
}

async function getCalendarEvents(
  params: z.infer<typeof CalendarEventsSchema>,
  context?: ToolContext,
): Promise<ToolResult<CalendarEvent[]>> {
  try {
    const supabase = context?.supabase as SupabaseClient | undefined;
    if (!supabase) {
      // Mock data
      return createSuccessResult([
        {
          id: "E-1001",
          title: "Meeting with Kim Tan",
          date: new Date().toISOString().split("T")[0],
          time: "10:00",
          duration: 60,
          type: "meeting",
        },
        {
          id: "E-1002",
          title: "Follow up call",
          date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
          time: "14:30",
          duration: 30,
          type: "call",
        },
      ]);
    }

    let query = supabase.from("tasks").select("*").gte("due_date", params.start_date).lte("due_date", params.end_date);

    if (params.advisor_id) {
      query = query.eq("assignee_id", params.advisor_id);
    }

    query = query.order("due_date", { ascending: true });

    const { data, error } = await query;

    if (error) {
      return createErrorResult("DATABASE_ERROR", error.message, error);
    }

    // Transform tasks to calendar events
    const events: CalendarEvent[] =
      data?.map((task: Task) => ({
        id: task.id,
        title: task.title,
        date: task.due_date || new Date().toISOString().split("T")[0],
        time: undefined, // Would need a separate time field in tasks table
        duration: 60, // Default
        type: task.task_type || "task",
        related_entity: task.related_lead_id
          ? { type: "lead", id: task.related_lead_id, name: "Lead" }
          : task.related_customer_id
            ? { type: "customer", id: task.related_customer_id, name: "Customer" }
            : undefined,
      })) || [];

    return createSuccessResult(events);
  } catch (error) {
    return createErrorResult(
      "EXECUTION_ERROR",
      error instanceof Error ? error.message : "Failed to get calendar events",
      error,
    );
  }
}

/**
 * Register all to-do tools
 */
export function registerTodoTools(registry: ToolRegistry): void {
  registry.registerTool({
    name: "tasks.list",
    description: "List tasks with filters (status, priority, due date, assignee)",
    schema: TaskFiltersSchema,
    handler: listTasks,
    module: "todo",
  });

  registry.registerTool({
    name: "tasks.create",
    description: "Create a new task",
    schema: CreateTaskSchema,
    handler: createTask,
    module: "todo",
    requiresAuth: true,
  });

  registry.registerTool({
    name: "tasks.update",
    description: "Update an existing task",
    schema: UpdateTaskSchema,
    handler: updateTask,
    module: "todo",
    requiresAuth: true,
  });

  registry.registerTool({
    name: "tasks.markComplete",
    description: "Mark a task as completed",
    schema: MarkCompleteSchema,
    handler: markComplete,
    module: "todo",
    requiresAuth: true,
  });

  registry.registerTool({
    name: "calendar.getEvents",
    description: "Get calendar events in a date range",
    schema: CalendarEventsSchema,
    handler: getCalendarEvents,
    module: "todo",
  });
}
