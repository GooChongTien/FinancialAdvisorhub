import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { UIActionExecutor } from "./action-executor";
import { useToast } from "@/admin/components/ui/toast.jsx";
import supabase from "@/admin/api/supabaseClient.js";
import { useMiraConfirm } from "./useMiraConfirm";
import { useMiraContext } from "@/admin/state/providers/MiraContextProvider.jsx";

async function defaultAuthHeaders() {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  } catch {
    // Ignore auth failures; executor will continue without headers.
  }
  return {};
}

async function dispatchPrefill(action, correlationId) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("mira:prefill", {
      detail: {
        action,
        correlationId: correlationId ?? null,
      },
    }),
  );
}

async function dispatchPopup(popupId, action, correlationId) {
  if (typeof window === "undefined" || !popupId) return;
  window.dispatchEvent(
    new CustomEvent("mira:popup", {
      detail: {
        popup: popupId,
        action,
        correlationId: correlationId ?? null,
      },
    }),
  );
}

export function useUIActionExecutor() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { requestConfirmation } = useMiraConfirm();
  const { getContext } = useMiraContext();

  const getAuthHeaders = useCallback(() => defaultAuthHeaders(), []);
  const contextProvider = useCallback(() => {
    try {
      return getContext();
    } catch (_err) {
      return null;
    }
  }, [getContext]);

  return useMemo(() => {
    return new UIActionExecutor({
      navigate,
      baseUrl:
        import.meta.env.VITE_AGENT_API_URL ||
        import.meta.env.VITE_APP_API_BASE_URL ||
        "",
      notify: (payload) => showToast(payload),
      getAuthHeaders,
      emitPrefillEvent: dispatchPrefill,
      triggerPopupEvent: dispatchPopup,
      requestConfirmation,
      getContext: contextProvider,
    });
  }, [navigate, showToast, getAuthHeaders, requestConfirmation, contextProvider]);
}

export default useUIActionExecutor;
