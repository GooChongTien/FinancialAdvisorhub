import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/admin/components/ui/button";
import useUIActionExecutor from "@/lib/mira/useUIActionExecutor.ts";

const TEST_FLAG_KEY = "mira:test:ui-actions";

function useTestFlag() {
  return useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(TEST_FLAG_KEY) === "true";
  });
}

export default function MiraActionTestPanel() {
  const [enabled, setEnabled] = useTestFlag();
  const [activeAction, setActiveAction] = useState(null);
  const [lastRun, setLastRun] = useState(null);
  const [error, setError] = useState(null);
  const executor = useUIActionExecutor();

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const syncFlag = () => {
      setEnabled(window.localStorage.getItem(TEST_FLAG_KEY) === "true");
    };
    window.addEventListener("storage", syncFlag);
    window.addEventListener("mira:test:ui-actions", syncFlag);
    return () => {
      window.removeEventListener("storage", syncFlag);
      window.removeEventListener("mira:test:ui-actions", syncFlag);
    };
  }, [setEnabled]);

  const actions = useMemo(
    () => ({
      navigate: [
        {
          action: "navigate",
          page: "CustomerDetail?id=pw-autotest",
          params: { filter: "hot" },
          description: "Test navigate to Customer Detail",
        },
      ],
      prefill: [
        {
          action: "frontend_prefill",
          target: "customers.new_lead_form",
          description: "Prefill lead dialog",
          payload: {
            name: "Playwright Lead",
            contact_number: "81234567",
            email: "lead+playwright@advisorhub.io",
          },
        },
      ],
      execute: [
        {
          action: "execute",
          description: "POST to Playwright echo endpoint",
          api_call: {
            method: "POST",
            endpoint: "/__playwright__/echo",
            payload: { ping: "mira" },
          },
        },
      ],
    }),
    [],
  );

  const runAction = useCallback(
    async (type) => {
      const plan = actions[type];
      if (!plan) return;
      setActiveAction(type);
      setError(null);
      try {
        await executor.executeActions(plan, { correlationId: `mira-test-${type}` });
        setLastRun({ type, timestamp: Date.now() });
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setActiveAction(null);
      }
    },
    [actions, executor],
  );

  if (!enabled) {
    return null;
  }

  return (
    <div
      data-testid="mira-action-test-panel"
      className="fixed bottom-4 right-4 z-[2500] w-72 rounded-xl border border-slate-200 bg-white/95 p-4 text-slate-800 shadow-2xl"
    >
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        UI Action Test Controls
      </div>
      <p className="mt-1 text-[11px] text-slate-500">
        Enabled via <code>{TEST_FLAG_KEY}</code>. Buttons exercise Mira&apos;s navigate, prefill, and execute actions.
      </p>
      <div className="mt-3 flex flex-col gap-2">
        <Button
          size="sm"
          data-testid="mira-test-navigate"
          onClick={() => runAction("navigate")}
          disabled={activeAction !== null}
        >
          {activeAction === "navigate" ? "Running…" : "Test Navigate"}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          data-testid="mira-test-prefill"
          onClick={() => runAction("prefill")}
          disabled={activeAction !== null}
        >
          {activeAction === "prefill" ? "Running…" : "Test Prefill"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          data-testid="mira-test-execute"
          onClick={() => runAction("execute")}
          disabled={activeAction !== null}
        >
          {activeAction === "execute" ? "Running…" : "Test Execute"}
        </Button>
      </div>
      {lastRun ? (
        <p className="mt-2 text-[11px] text-slate-500">
          Last run: <span className="font-medium">{lastRun.type}</span> at{" "}
          {new Date(lastRun.timestamp).toLocaleTimeString()}
        </p>
      ) : (
        <p className="mt-2 text-[11px] text-slate-400">No actions run yet.</p>
      )}
      {error ? (
        <p className="mt-1 text-[11px] text-red-600" data-testid="mira-test-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
