import { useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/admin/components/ui/dialog.jsx";
import { Button } from "@/admin/components/ui/button";
import { Badge } from "@/admin/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import type { ExecuteAction } from "@/lib/mira/types.ts";

interface MiraConfirmationDialogProps {
  action?: ExecuteAction | null;
  isOpen?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

function formatMethod(method) {
  if (!method) return "POST";
  return String(method).toUpperCase();
}

function summarizePayload(payload) {
  if (!payload || typeof payload !== "object") return "{}";
  try {
    return JSON.stringify(payload, null, 2).slice(0, 1200);
  } catch (_err) {
    return "{}";
  }
}

function fieldPreview(action) {
  if (!action || typeof action !== "object") return [];
  const payload =
    (action.action === "frontend_prefill" || action.action === "update_field") &&
    action.payload &&
    typeof action.payload === "object"
      ? action.payload
      : null;
  if (!payload) return [];
  return Object.keys(payload).slice(0, 5);
}

const METHOD_STYLES = {
  DELETE: "bg-red-100 text-red-700 border-red-200",
  POST: "bg-blue-100 text-blue-700 border-blue-200",
  PUT: "bg-amber-100 text-amber-700 border-amber-200",
  PATCH: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export function MiraConfirmationDialog({
  action = null,
  isOpen = false,
  onConfirm,
  onCancel,
}: MiraConfirmationDialogProps) {
  const method = formatMethod(action?.api_call?.method || "POST");
  const payloadPreview = useMemo(() => summarizePayload(action?.api_call?.payload), [action]);
  const fieldKeys = useMemo(() => fieldPreview(action), [action]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        onConfirm?.();
      } else if (event.key === "Escape") {
        event.preventDefault();
        onCancel?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onConfirm, onCancel]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel?.()}>
      <DialogContent className="max-w-xl space-y-4" data-testid="mira-confirm-dialog">
        <DialogHeader>
          <DialogTitle>Allow Mira to run this action?</DialogTitle>
          <DialogDescription>
            Mira wants to execute a backend action on your behalf. Review the request before approving.
          </DialogDescription>
        </DialogHeader>
        {method === "DELETE" && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4" />
            This action might modify or delete data.
          </div>
        )}
        <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
          <div className="flex items-center gap-3">
            <Badge className={METHOD_STYLES[method] || METHOD_STYLES.POST}>{method}</Badge>
            <span className="font-mono text-xs text-slate-700 break-all">
              {action?.api_call?.endpoint || action?.target || "Unknown endpoint"}
            </span>
          </div>
          <div className="text-xs text-slate-500">
            {action?.description || "Requested via Mira UI Action Executor"}
          </div>
        </div>
        {fieldKeys.length > 0 && (
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Fields involved
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {fieldKeys.map((key) => (
                <span key={key} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                  {key}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payload</div>
          <pre className="mt-2 max-h-48 overflow-auto rounded bg-slate-900/90 p-3 text-xs text-slate-100">
            {payloadPreview}
          </pre>
        </div>
        <DialogFooter className="flex items-center justify-between">
          <Button
            variant="secondary"
            onClick={onCancel}
            data-testid="mira-confirm-cancel"
          >
            Undo
          </Button>
          <Button
            variant={method === "DELETE" ? "destructive" : "default"}
            onClick={onConfirm}
            data-testid="mira-confirm-approve"
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default MiraConfirmationDialog;
