import { useEffect, useRef } from "react";
import { matchesPopupTarget } from "@/lib/mira/popupTargets.ts";

/**
 * Listens for `mira:popup` events targeting the provided popup identifier.
 * Invokes the supplied handler whenever the popup is requested.
 * If the handler returns an undo callback, it will be invoked when `mira:auto-actions:undo`
 * fires with the same correlation id.
 *
 * @param {string | string[]} targetId - canonical popup identifier(s)
 * @param {(detail: { popup: string; action?: any; correlationId: string | null }) => (() => void) | void} handler
 */
export function useMiraPopupListener(targetId, handler) {
  const undoStacksRef = useRef(new Map());

  useEffect(() => {
    if (typeof window === "undefined" || !targetId || typeof handler !== "function") {
      return undefined;
    }

    const onPopup = (event) => {
      const detail = event?.detail ?? {};
      const popupId =
        detail?.popup ??
        detail?.action?.popup ??
        detail?.action?.payload?.popup ??
        null;
      if (!matchesPopupTarget(popupId, targetId)) return;
      const correlationId =
        detail?.correlationId ??
        detail?.action?.correlationId ??
        detail?.action?.id ??
        null;
      try {
        const undo = handler({
          popup: popupId,
          action: detail?.action ?? null,
          correlationId,
        });
        if (correlationId && typeof undo === "function") {
          const stack = undoStacksRef.current.get(correlationId) ?? [];
          stack.push(undo);
          undoStacksRef.current.set(correlationId, stack);
        }
      } catch (err) {
        console.error("[useMiraPopupListener] handler failed", err);
      }
    };

    window.addEventListener("mira:popup", onPopup);
    return () => window.removeEventListener("mira:popup", onPopup);
  }, [targetId, handler]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
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
          console.warn("[useMiraPopupListener] Undo callback failed", err);
        }
      }
    };
    window.addEventListener("mira:auto-actions:undo", onUndo);
    return () => window.removeEventListener("mira:auto-actions:undo", onUndo);
  }, []);
}

export default useMiraPopupListener;
