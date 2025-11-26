// @ts-nocheck
import { assign, createMachine } from "xstate";

export type MiraMode = "hidden" | "command" | "copilot" | "insight" | "split";

export interface MiraModeContext {
  currentMode: MiraMode;
  previousMode: MiraMode | null;
  conversationId: string | null;
  autoNavEnabled: boolean;
}

type ModeEvent =
  | { type: "OPEN_COMMAND"; conversationId?: string | null }
  | { type: "OPEN_COPILOT"; conversationId?: string | null }
  | { type: "OPEN_INSIGHT" }
  | { type: "OPEN_SPLIT"; conversationId?: string | null }
  | { type: "CLOSE" }
  | { type: "TOGGLE_MODE"; mode: MiraMode; conversationId?: string | null }
  | { type: "ATTACH_CONVERSATION"; conversationId?: string | null }
  | { type: "TOGGLE_AUTO_NAV" }
  | { type: "SET_AUTO_NAV"; enabled: boolean };

const STORAGE_KEY = "mira:mode";
const AUTO_NAV_STORAGE_KEY = "mira:auto-nav-enabled";

function readPersistedMode(): MiraMode {
  if (typeof window === "undefined") return "command";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "hidden" || stored === "copilot" || stored === "insight" || stored === "split") {
    return stored;
  }
  return "command";
}

function readPersistedAutoNav(): boolean {
  if (typeof window === "undefined") return false; // Default: OFF
  const stored = window.localStorage.getItem(AUTO_NAV_STORAGE_KEY);
  return stored === "true";
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

function persistAutoNav(enabled: boolean) {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(AUTO_NAV_STORAGE_KEY, String(enabled));
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
      autoNavEnabled: readPersistedAutoNav(),
    }),
    states: {
      hidden: {},
      command: {},
      copilot: {},
      insight: {},
      split: {},
    },
    on: {
      OPEN_COMMAND: { target: ".command", actions: "enterCommand" },
      OPEN_COPILOT: { target: ".copilot", actions: "enterCopilot" },
      OPEN_INSIGHT: { target: ".insight", actions: "enterInsight" },
      OPEN_SPLIT: { target: ".split", actions: "enterSplit" },
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
      TOGGLE_AUTO_NAV: {
        actions: "toggleAutoNav",
      },
      SET_AUTO_NAV: {
        actions: "setAutoNav",
      },
    },
  },
  {
    actions: {
      enterCommand: withMode("command"),
      enterCopilot: withMode("copilot"),
      enterInsight: withMode("insight"),
      enterSplit: withMode("split"),
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
      toggleAutoNav: assign(({ context }) => {
        const newValue = !context.autoNavEnabled;
        persistAutoNav(newValue);
        return {
          autoNavEnabled: newValue,
        };
      }),
      setAutoNav: assign(({ event }) => {
        if (event.type !== "SET_AUTO_NAV") return {};
        persistAutoNav(event.enabled);
        return {
          autoNavEnabled: event.enabled,
        };
      }),
    },
  },
);
