import { useEffect, useRef } from "react";
import { matchesPrefillTarget, resolvePrefillTarget } from "@/lib/mira/prefillTargets.ts";

/**
 * React hook that listens for Mira prefill events targeting the provided identifier.
 * When a matching action arrives, it invokes the supplied handler and stores the returned undo callback (if any)
 * so a later "mira:auto-actions:undo" event can roll the change back.
 *
 * @param {string | string[]} targetId - canonical target identifier(s) for the component/form
 * @param {(payload: Record<string, unknown>, meta: { action: any; correlationId: string | null }) => (() => void) | void} handler
 */
export function useMiraPrefillListener(targetId, handler) {
  const undoStacksRef = useRef(new Map());

  useEffect(() => {
    if (typeof window === "undefined" || !targetId || typeof handler !== "function") {
      return;
    }

    const onPrefill = (event) => {
      const detail = event?.detail ?? {};
      const action = detail.action ?? null;
      if (!action) return;
      const correlationId = detail.correlationId ?? action?.correlationId ?? action?.id ?? null;
      const resolvedTarget = resolvePrefillTarget(action);
      if (!matchesPrefillTarget(resolvedTarget, targetId)) return;
      const payload = typeof action.payload === "object" && action.payload !== null ? action.payload : {};
      try {
        const undoHandler = handler(payload, { action, correlationId });
        if (correlationId && typeof undoHandler === "function") {
          const stack = undoStacksRef.current.get(correlationId) ?? [];
          stack.push(undoHandler);
          undoStacksRef.current.set(correlationId, stack);
        }
      } catch (err) {
        console.error("[useMiraPrefillListener] Failed to handle prefill action", err);
      }
    };

    window.addEventListener("mira:prefill", onPrefill);
    return () => window.removeEventListener("mira:prefill", onPrefill);
  }, [targetId, handler]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onUndo = (event) => {
      const id = event?.detail?.id;
      if (!id) return;
      const stack = undoStacksRef.current.get(id);
      if (!stack?.length) return;
      undoStacksRef.current.delete(id);
      while (stack.length) {
        const undo = stack.pop();
        try {
          undo?.();
        } catch (err) {
          console.warn("[useMiraPrefillListener] Prefill undo failed", err);
        }
      }
    };
    window.addEventListener("mira:auto-actions:undo", onUndo);
    return () => window.removeEventListener("mira:auto-actions:undo", onUndo);
  }, []);
}

export default useMiraPrefillListener;

