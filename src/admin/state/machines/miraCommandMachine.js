import { createMachine, assign } from "xstate";
import { MIRA_PERSONA_OPTIONS } from "@/lib/mira/personas.js";

const DEFAULT_PERSONA = MIRA_PERSONA_OPTIONS[0]?.id ?? "advisor";
const HISTORY_LIMIT = 5;

const pushHistory = (history, prompt) => {
  if (!prompt?.trim()) return history;
  const trimmed = prompt.trim();
  const next = [trimmed, ...history.filter((item) => item !== trimmed)];
  return next.slice(0, HISTORY_LIMIT);
};

const prepareSubmit = assign({
  lastPrompt: (_, event) => event.prompt,
  history: (ctx, event) => pushHistory(ctx.history, event.prompt),
  response: () => null,
  intent: () => null,
  execution: () => null,
  error: () => null,
  submittedAt: (_, event) => event.timestamp ?? Date.now(),
  feedback: () => null,
  pendingAction: () => null,
});

export const miraCommandMachine = createMachine({
  id: "miraCommandCenter",
  initial: "idle",
  context: {
    mode: "command",
    persona: DEFAULT_PERSONA,
    lastPrompt: "",
    history: [],
    pendingAction: null,
    trustedSkillsSession: [],
    response: null,
    intent: null,
    execution: null,
    error: null,
    submittedAt: null,
    feedback: null,
  },
  on: {
    SET_MODE: {
      actions: assign({
        // Be defensive: some callers may not provide an event payload
        mode: (_, event) => {
          try {
            if (event && typeof event.mode === "string" && event.mode.trim()) {
              return event.mode;
            }
          } catch {}
          return "command";
        },
      }),
    },
    SET_PERSONA: {
      actions: assign({
        persona: (_, event) => event.persona ?? DEFAULT_PERSONA,
      }),
    },
    SET_FEEDBACK: {
      actions: assign({
        feedback: (_, event) => event.feedback ?? null,
      }),
    },
    RESET: {
      target: "#miraCommandCenter.idle",
      actions: assign({
        response: () => null,
        intent: () => null,
        execution: () => null,
        error: () => null,
        feedback: () => null,
        submittedAt: () => null,
        pendingAction: () => null,
        trustedSkillsSession: () => [],
      }),
    },
    SET_PENDING_ACTION: {
      actions: assign({ pendingAction: (_, event) => event?.action ?? null }),
    },
    CLEAR_PENDING_ACTION: {
      actions: assign({ pendingAction: () => null }),
    },
    CONFIRM_PENDING_ACTION: {
      actions: assign({ pendingAction: () => null }),
    },
    REJECT_PENDING_ACTION: {
      actions: assign({ pendingAction: () => null }),
    },
    TRUST_SKILL_IN_SESSION: {
      actions: assign({
        trustedSkillsSession: (ctx, event) => {
          const list = Array.isArray(ctx.trustedSkillsSession) ? ctx.trustedSkillsSession.slice() : [];
          const skill = typeof event?.skill === 'string' ? event.skill : null;
          if (skill && !list.includes(skill)) list.push(skill);
          return list;
        },
        pendingAction: () => null,
      }),
    },
  },
  states: {
    idle: {
      on: {
        SUBMIT: {
          target: "#miraCommandCenter.running",
          actions: prepareSubmit,
          guard: (_, event) => Boolean(event.prompt?.trim().length),
        },
      },
    },
    running: {
      on: {
        PROVIDER_RESPONSE: [
          {
            target: "#miraCommandCenter.streaming",
            guard: (_, event) => Boolean(event.response?.content),
            actions: assign({
              response: (_, event) => event.response,
            }),
          },
          {
            target: "#miraCommandCenter.completed",
            actions: assign({
              response: (_, event) => event.response,
            }),
          },
        ],
        INTENT_RESOLVED: {
          actions: assign({
            intent: (_, event) => event.intent ?? null,
          }),
        },
        EXECUTION_COMPLETED: {
          actions: assign({
            execution: (_, event) => event.execution ?? null,
          }),
        },
        COMMAND_FAILURE: {
          target: "#miraCommandCenter.error",
          actions: assign({
            error: (_, event) => event.error ?? new Error("Unknown error"),
          }),
        },
      },
    },
    streaming: {
      on: {
        INTENT_RESOLVED: {
          actions: assign({
            intent: (_, event) => event.intent ?? null,
          }),
        },
        EXECUTION_COMPLETED: {
          actions: assign({
            execution: (_, event) => event.execution ?? null,
          }),
        },
        STREAM_COMPLETE: "#miraCommandCenter.completed",
        STOP_STREAM: "#miraCommandCenter.completed",
        COMMAND_FAILURE: {
          target: "#miraCommandCenter.error",
          actions: assign({
            error: (_, event) => event.error ?? new Error("Unknown error"),
          }),
        },
      },
    },
    completed: {
      on: {
        SUBMIT: {
          target: "#miraCommandCenter.running",
          actions: prepareSubmit,
          guard: (_, event) => Boolean(event.prompt?.trim().length),
        },
        INTENT_RESOLVED: {
          actions: assign({
            intent: (_, event) => event.intent ?? null,
          }),
        },
        EXECUTION_COMPLETED: {
          actions: assign({
            execution: (_, event) => event.execution ?? null,
          }),
        },
      },
    },
    error: {
      on: {
        SUBMIT: {
          target: "#miraCommandCenter.running",
          actions: prepareSubmit,
          guard: (_, event) => Boolean(event.prompt?.trim().length),
        },
      },
    },
  },
});
