import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { CheckCircle2, Info, AlertTriangle, X } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((options) => {
    setToast({
      id: Date.now(),
      duration: options?.duration ?? 4000,
      ...options,
    });
  }, []);

  const dismiss = useCallback(() => {
    setToast(null);
  }, []);

  useEffect(() => {
    if (!toast?.duration) return;
    const timer = setTimeout(dismiss, toast.duration);
    return () => clearTimeout(timer);
  }, [toast, dismiss]);

  const value = useMemo(
    () => ({
      showToast,
      dismiss,
    }),
    [showToast, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toast={toast} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastViewport({ toast, onDismiss }) {
  if (!toast) return null;

  return createPortal(
    <div className="pointer-events-none fixed right-4 top-4 z-[9999] flex w-full max-w-xs flex-col gap-3 sm:max-w-sm">
      <ToastCard toast={toast} onDismiss={onDismiss} />
    </div>,
    document.body,
  );
}

function ToastCard({ toast, onDismiss }) {
  const variant = toast.type ?? "default";
  const variants = {
    default:
      "border-slate-200 bg-white text-slate-800 shadow-xl shadow-slate-200/40",
    success:
      "border-green-200 bg-green-50 text-green-800 shadow-xl shadow-green-100/60",
    error:
      "border-red-200 bg-red-50 text-red-800 shadow-xl shadow-red-100/60",
    warning:
      "border-orange-200 bg-orange-50 text-orange-800 shadow-xl shadow-orange-100/60",
  };

  const iconMap = {
    default: Info,
    success: CheckCircle2,
    error: AlertTriangle,
    warning: AlertTriangle,
  };

  const Icon = iconMap[variant] ?? iconMap.default;

  return (
    <div
      className={cn(
        "pointer-events-auto w-full overflow-hidden rounded-xl border transition-all",
        variants[variant],
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3 p-4">
        {Icon ? <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" /> : null}
        <div className="flex-1">
          {toast.title ? (
            <p className="text-sm font-semibold leading-relaxed">
              {toast.title}
            </p>
          ) : null}
          {toast.description ? (
            <p className="mt-1 text-sm leading-relaxed text-current/90">
              {toast.description}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-full p-1 text-current/60 transition hover:bg-current/10 hover:text-current/90"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
