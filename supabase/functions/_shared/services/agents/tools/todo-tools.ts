import type { AgentTool } from "../../types.ts";

export interface Task {
  id: string;
  title: string;
  status: "pending" | "completed";
  dueDate?: string;
  customerId?: string;
}

export interface TaskFilters {
  status?: Task["status"];
  overdue?: boolean;
}

export interface CreateTaskInput {
  title: string;
  dueDate?: string;
  customerId?: string;
}

export interface UpdateTaskInput {
  title?: string;
  dueDate?: string;
  status?: Task["status"];
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
}

const mockTasks: Task[] = [
  { id: "T-1", title: "Call Kim about proposal", status: "pending", dueDate: new Date().toISOString() },
  { id: "T-2", title: "Prepare review deck", status: "pending" },
  { id: "T-3", title: "Submit compliance docs", status: "completed" },
];

async function listTasks(filters: TaskFilters = {}): Promise<Task[]> {
  return mockTasks.filter((task) => {
    if (filters.status && task.status !== filters.status) return false;
    if (filters.overdue && task.dueDate && new Date(task.dueDate) > new Date()) return false;
    return true;
  });
}

async function createTask(data: CreateTaskInput): Promise<Task> {
  const task: Task = { id: `T-${mockTasks.length + 1}`, status: "pending", ...data };
  mockTasks.push(task);
  return task;
}

async function updateTask(id: string, data: UpdateTaskInput): Promise<Task> {
  const task = mockTasks.find((t) => t.id === id);
  if (!task) throw new Error(`Task ${id} not found`);
  Object.assign(task, data);
  return task;
}

async function markComplete(id: string): Promise<Task> {
  return updateTask(id, { status: "completed" });
}

async function getCalendarEvents(startDate: string, endDate: string): Promise<CalendarEvent[]> {
  return [
    { id: "EV-1", title: "FNA review", start: startDate, end: endDate },
    { id: "EV-2", title: "Roadshow", start: startDate, end: endDate },
  ];
}

export function getTodoTools(): AgentTool[] {
  return [
    {
      name: "tasks.list",
      description: "List tasks with filters",
      handler: async (input: TaskFilters) => listTasks(input),
    },
    {
      name: "tasks.create",
      description: "Create a new task",
      handler: async (input: CreateTaskInput) => createTask(input),
    },
    {
      name: "tasks.update",
      description: "Update an existing task",
      handler: async (input: { id: string } & UpdateTaskInput) => updateTask(input.id, input),
    },
    {
      name: "tasks.markComplete",
      description: "Mark task as completed",
      handler: async (input: { id: string }) => markComplete(input.id),
    },
    {
      name: "calendar.getEvents",
      description: "Get calendar events for a range",
      handler: async (input: { startDate: string; endDate: string }) => getCalendarEvents(input.startDate, input.endDate),
    },
  ];
}
