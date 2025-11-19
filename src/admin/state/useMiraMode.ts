import { useCallback, useMemo } from "react";
import { useMachine } from "@xstate/react";
import { type MiraMode, miraModeMachine } from "./miraModeMachine";

export function useMiraMode() {
  const [state, send] = useMachine(miraModeMachine);
  const mode = state.value as MiraMode;

  const openCommand = useCallback(
    (conversationId?: string | null) =>
      send({ type: "OPEN_COMMAND", conversationId: conversationId ?? null }),
    [send],
  );
  const openCopilot = useCallback(
    (conversationId?: string | null) =>
      send({ type: "OPEN_COPILOT", conversationId: conversationId ?? null }),
    [send],
  );
  const openInsight = useCallback(() => send({ type: "OPEN_INSIGHT" }), [send]);
  const close = useCallback(() => send({ type: "CLOSE" }), [send]);
  const toggleMode = useCallback(
    (next: MiraMode, conversationId?: string | null) =>
      send({ type: "TOGGLE_MODE", mode: next, conversationId: conversationId ?? null }),
    [send],
  );
  const attachConversation = useCallback(
    (conversationId?: string | null) =>
      send({ type: "ATTACH_CONVERSATION", conversationId: conversationId ?? null }),
    [send],
  );

  return useMemo(
    () => ({
      mode,
      previousMode: state.context.previousMode,
      conversationId: state.context.conversationId,
      openCommand,
      openCopilot,
      openInsight,
      close,
      toggleMode,
      attachConversation,
    }),
    [mode, state.context, openCommand, openCopilot, openInsight, close, toggleMode, attachConversation],
  );
}

export default useMiraMode;
