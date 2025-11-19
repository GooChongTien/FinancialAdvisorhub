// @ts-nocheck
import { assign, createMachine } from "xstate";

export type MiraMode = "hidden" | "command" | "copilot" | "insight";

export interface MiraModeContext {
  currentMode: MiraMode;
  previousMode: MiraMode | null;
  conversationId: string | null;
}

type ModeEvent =
  | { type: "OPEN_COMMAND"; conversationId?: string | null }
  | { type: "OPEN_COPILOT"; conversationId?: string | null }
  | { type: "OPEN_INSIGHT" }
  | { type: "CLOSE" }
  | { type: "TOGGLE_MODE"; mode: MiraMode; conversationId?: string | null }
  | { type: "ATTACH_CONVERSATION"; conversationId?: string | null };

const STORAGE_KEY = "mira:mode";

function readPersistedMode(): MiraMode {
  if (typeof window === "undefined") return "command";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "hidden" || stored === "copilot" || stored === "insight") {
    return stored;
  }
  return "command";
}

function persistMode(mode: MiraMode) {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, mode);
    }
  } catch {
    // Non-blocking persistence.
  }
}

const getConversationId = (event: ModeEvent): string | null => {
  if ("conversationId" in event) {
    const value = event.conversationId;
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return null;
};

const withMode = (mode: MiraMode) =>
  assign(({ context, event }: { context: MiraModeContext; event: ModeEvent }) => {
    persistMode(mode);
    return {
      previousMode: context.currentMode === mode ? context.previousMode : context.currentMode,
      currentMode: mode,
      conversationId: getConversationId(event),
    };
  });

export const miraModeMachine = createMachine(
  {
    id: "miraMode",
    types: {} as { context: MiraModeContext; events: ModeEvent },
    initial: readPersistedMode(),
    context: (): MiraModeContext => ({
      currentMode: readPersistedMode(),
      previousMode: null,
      conversationId: null,
    }),
    states: {
      hidden: {},
      command: {},
      copilot: {},
      insight: {},
    },
    on: {
      OPEN_COMMAND: { target: ".command", actions: "enterCommand" },
      OPEN_COPILOT: { target: ".copilot", actions: "enterCopilot" },
      OPEN_INSIGHT: { target: ".insight", actions: "enterInsight" },
      CLOSE: { target: ".hidden", actions: "enterHidden" },
      TOGGLE_MODE: {
        actions: "toggleMode",
        target: undefined,
      },
      ATTACH_CONVERSATION: {
        actions: assign(({ event }) => {
          if (event.type !== "ATTACH_CONVERSATION") return {};
          return { conversationId: getConversationId(event) };
        }),
      },
    },
  },
  {
    actions: {
      enterCommand: withMode("command"),
      enterCopilot: withMode("copilot"),
      enterInsight: withMode("insight"),
      enterHidden: withMode("hidden"),
      toggleMode: assign(({ context, event }) => {
        if (event.type !== "TOGGLE_MODE") {
          return {};
        }
        persistMode(event.mode);
        return {
          previousMode: context.currentMode === event.mode ? context.previousMode : context.currentMode,
          currentMode: event.mode,
          conversationId: getConversationId(event),
        };
      }),
    },
  },
);
