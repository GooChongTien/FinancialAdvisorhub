import { registerExecutor, unregisterExecutor } from "./executor.js";
import { getIntentSchema } from "./catalog.js";
import { adviseUAdminApi } from "@/admin/api/adviseUAdminApi";
import { createPageUrl } from "@/admin/utils";

const DEFAULT_FETCH_TASKS = async () =>
  adviseUAdminApi.entities.Task.list("-date", 20);

let registrationCount = 0;
let activeExecutor = null;

function nextMeetingsFromTasks(tasks = []) {
  const upcoming = (tasks ?? []).filter((task) => {
    if (!task?.date) return false;
    const type = String(task.type ?? "").toLowerCase();
    return type.includes("appointment") || type.includes("meeting");
  });
  upcoming.sort((a, b) => {
    const aTime = new Date(`${a.date}T${a.time ?? "00:00"}`).getTime();
    const bTime = new Date(`${b.date}T${b.time ?? "00:00"}`).getTime();
    return aTime - bTime;
  });
  return upcoming.slice(0, 3);
}

function buildMeetingSummary(meeting) {
  const scheduledAt = meeting?.date
    ? `${meeting.date}${meeting.time ? ` ${meeting.time}` : ""}`
    : "soon";
  return {
    id: meeting?.id ?? `meeting-${Date.now()}`,
    title: meeting?.title ?? "Upcoming meeting",
    description: `Scheduled ${scheduledAt}. Linked lead ${
      meeting?.linked_lead_name ?? "not specified"
    }.`,
    type: "metric",
    tag: "Meeting",
  };
}

function makeExecutor({ fetchTasks, createDestination }) {
  return async (intent, environment = {}) => {
    const tasks =
      Array.isArray(environment.tasks) && environment.tasks.length > 0
        ? environment.tasks
        : await fetchTasks();

    const meetings = nextMeetingsFromTasks(tasks);
    if (!meetings.length) {
      return {
        status: "not_found",
        message: "No upcoming meetings found for the next few days.",
      };
    }

    const nextMeeting = meetings[0];
    const destination =
      environment.createPageUrl?.("ToDo") ?? createDestination("ToDo");

    if (environment.navigate) {
      environment.navigate(destination);
    }

    return {
      status: "prepared",
      nextMeeting: {
        id: nextMeeting.id,
        title: nextMeeting.title,
        date: nextMeeting.date,
        time: nextMeeting.time,
        linkedLeadId: nextMeeting.linked_lead_id,
        linkedLeadName: nextMeeting.linked_lead_name,
      },
      recommendations: meetings.map(buildMeetingSummary),
      navigationUrl: destination,
    };
  };
}

export function registerMeetingPrepExecutor(options = {}) {
  registrationCount += 1;
  if (registrationCount === 1) {
    const executor = makeExecutor({
      fetchTasks: options.fetchTasks ?? DEFAULT_FETCH_TASKS,
      createDestination:
        options.createDestination ??
        ((path) => createPageUrl(path)),
    });
    activeExecutor = executor;
    registerExecutor("meeting.prep", executor);
  }

  return () => {
    registrationCount = Math.max(0, registrationCount - 1);
    if (registrationCount === 0 && activeExecutor) {
      unregisterExecutor("meeting.prep");
      activeExecutor = null;
    }
  };
}

export function detectMeetingIntentFromPrompt(text) {
  if (!text) return false;
  const lc = text.toLowerCase();
  return (
    lc.includes("prepare") ||
    lc.includes("agenda") ||
    lc.includes("meeting") ||
    lc.includes("brief")
  );
}

export function buildMeetingIntent(prompt) {
  const schema = getIntentSchema("meeting.prep");
  return {
    name: "meeting.prep",
    confidence: 0.7,
    schema,
    context: { prompt },
  };
}
