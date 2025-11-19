import type { NavigateOptions } from "react-router-dom";
import { createPageUrl } from "@/admin/utils";
import type {
  UIAction,
  NavigateAction,
  PrefillAction,
  ExecuteAction,
  UIActionResult,
  MiraContext,
} from "./types.ts";
import { logMiraActionEvent } from "./action-logger";

type ToastPayload = {
  type?: "default" | "success" | "error" | "warning";
  title: string;
  description?: string;
};

export interface UIActionExecutorOptions {
  navigate: (to: string, options?: NavigateOptions) => void;
  baseUrl?: string;
  notify?: (payload: ToastPayload) => void;
  requestConfirmation?: (action: ExecuteAction) => Promise<boolean>;
  emitPrefillEvent?: (action: PrefillAction, correlationId?: string | null) => Promise<void>;
  triggerPopupEvent?: (popupId: string, action: NavigateAction, correlationId?: string | null) => Promise<void>;
  getAuthHeaders?: () => Promise<Record<string, string>>;
  getContext?: () => MiraContext | null | undefined;
}

export interface ExecuteActionsOptions {
  correlationId?: string | null;
}

const DEFAULT_BASE_URL = "";

type UndoCallback = () => void;
const undoRegistry = new Map<string, UndoCallback[]>();
let undoListenerBound = false;

function ensureUndoListener() {
  if (undoListenerBound || typeof window === "undefined") return;
  window.addEventListener("mira:auto-actions:undo", (event: Event) => {
    const customEvent = event as CustomEvent<{ id?: string }>;
    const id = customEvent?.detail?.id;
    if (!id) return;
    const callbacks = undoRegistry.get(id);
    if (!callbacks?.length) return;
    undoRegistry.delete(id);
    for (let i = callbacks.length - 1; i >= 0; i -= 1) {
      try {
        callbacks[i]?.();
      } catch (err) {
        console.warn("[UIActionExecutor] Undo callback failed", err);
      }
    }
  });
  undoListenerBound = true;
}

function registerUndoCallback(correlationId: string | null | undefined, callback: UndoCallback) {
  if (!correlationId || typeof callback !== "function") return;
  const stack = undoRegistry.get(correlationId) ?? [];
  stack.push(callback);
  undoRegistry.set(correlationId, stack);
  ensureUndoListener();
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const MAX_PREFILL_DEPTH = 3;
const MAX_PREFILL_KEYS = 50;
const MAX_PREFILL_ARRAY_LENGTH = 25;

function sanitizePrefillValue(value: unknown, depth: number): unknown {
  if (depth > MAX_PREFILL_DEPTH) {
    throw new Error("Prefill payload is too deep");
  }
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    if (value.length > MAX_PREFILL_ARRAY_LENGTH) {
      throw new Error("Prefill arrays may include at most 25 entries");
    }
    return value.map((entry) => sanitizePrefillValue(entry, depth + 1));
  }
  if (isPlainObject(value)) {
    return sanitizePrefillPayload(value, depth + 1);
  }
  if (typeof value === "undefined") {
    throw new Error("Prefill payload cannot include undefined values");
  }
  throw new Error("Prefill payload includes unsupported data");
}

function sanitizePrefillPayload(
  payload: Record<string, unknown>,
  depth = 0,
): Record<string, unknown> {
  if (!isPlainObject(payload)) {
    throw new Error("Prefill payload must be a plain object");
  }
  const keys = Object.keys(payload);
  if (keys.length === 0) {
    throw new Error("Prefill payload must include at least one field");
  }
  if (keys.length > MAX_PREFILL_KEYS) {
    throw new Error("Prefill payload has too many fields");
  }
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (typeof key !== "string" || key.trim().length === 0) {
      throw new Error("Prefill field names must be non-empty strings");
    }
    result[key] = sanitizePrefillValue(value, depth);
  }
  return result;
}

export class UIActionExecutor {
  private navigate: UIActionExecutorOptions["navigate"];
  private baseUrl: string;
  private notify?: UIActionExecutorOptions["notify"];
  private requestConfirmation?: UIActionExecutorOptions["requestConfirmation"];
  private emitPrefillEvent?: UIActionExecutorOptions["emitPrefillEvent"];
  private triggerPopupEvent?: UIActionExecutorOptions["triggerPopupEvent"];
  private getAuthHeaders?: UIActionExecutorOptions["getAuthHeaders"];
  private getContext?: UIActionExecutorOptions["getContext"];

  constructor(options: UIActionExecutorOptions) {
    if (!options?.navigate) {
      throw new Error("UIActionExecutor requires a navigate function");
    }
    this.navigate = options.navigate;
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.notify = options.notify;
    this.requestConfirmation = options.requestConfirmation;
    this.emitPrefillEvent = options.emitPrefillEvent;
    this.triggerPopupEvent = options.triggerPopupEvent;
    this.getAuthHeaders = options.getAuthHeaders;
    this.getContext = options.getContext;
  }

  async executeActions(actions?: UIAction[] | null, options: ExecuteActionsOptions = {}): Promise<UIActionResult[]> {
    if (!Array.isArray(actions) || actions.length === 0) {
      return [];
    }
    const results: UIActionResult[] = [];

    for (const action of actions) {
      try {
        await this.handleAction(action, options);
        this.logAction(action, true, undefined, options?.correlationId ?? null);
        results.push({ action, success: true });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logAction(action, false, message, options?.correlationId ?? null);
        results.push({ action, success: false, error: message });
        this.notify?.({
          type: "error",
          title: "Action failed",
          description: message,
        });
      }
    }

    return results;
  }

  private async handleAction(action: UIAction, options: ExecuteActionsOptions): Promise<void> {
    switch (action.action) {
      case "navigate":
        await this.navigateTo(action as NavigateAction, options?.correlationId ?? null);
        return;
      case "frontend_prefill":
      case "update_field":
        await this.prefill(action as PrefillAction, options?.correlationId ?? null);
        return;
      case "execute":
      case "submit_action":
        await this.executeBackend(action as ExecuteAction);
        return;
      default:
        // Unsupported actions are ignored but logged for visibility.
        console.warn("[UIActionExecutor] Unsupported action type", action);
    }
  }

  private async navigateTo(action: NavigateAction, correlationId: string | null): Promise<void> {
    const target = action.page || action.target;
    const destination = target
      ? target.startsWith("/") || target.startsWith("http")
        ? target
        : createPageUrl(target)
      : "/";

    const url = this.applyQueryParams(destination, action.params);
    const previousUrl =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}${window.location.hash}`
        : null;

    // Check if we're in a chat context - if so, activate split view
    const inChatContext = typeof window !== "undefined" &&
      (window.location.pathname.includes("/chat") ||
       window.location.search.includes("from="));

    // Navigate to the target URL
    this.navigate(url);

    // If in chat context, trigger split view mode via custom event
    if (inChatContext && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("mira:open-split-view"));
      this.notify?.({
        type: "success",
        title: "Opened in split view",
        description: action.description || url,
      });
    } else {
      this.notify?.({
        type: "success",
        title: "Navigated",
        description: action.description || url,
      });
    }

    if (previousUrl) {
      registerUndoCallback(correlationId, () => {
        this.navigate(previousUrl, { replace: true });
        this.notify?.({
          type: "default",
          title: "Navigation reverted",
          description: previousUrl,
        });
      });
    }

    if (typeof action.popup === "string" && action.popup.trim().length > 0) {
      await this.openPopup(action.popup.trim(), action, correlationId);
    }
  }

  private applyQueryParams(path: string, params: unknown): string {
    if (!params || typeof params !== "object" || Array.isArray(params)) {
      return path;
    }
    const [base, existingSearch] = path.split("?");
    const search = new URLSearchParams(existingSearch);
    Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        search.delete(key);
      } else {
        search.set(key, String(value));
      }
    });
    const query = search.toString();
    return query ? `${base}?${query}` : base;
  }

  private async prefill(action: PrefillAction, correlationId: string | null): Promise<void> {
    const sanitizedPayload = sanitizePrefillPayload(action.payload ?? {});
    const prefillAction: PrefillAction = {
      ...action,
      payload: sanitizedPayload,
    };

    if (typeof this.emitPrefillEvent === "function") {
      await this.emitPrefillEvent(prefillAction, correlationId);
      this.notify?.({
        type: "success",
        title: "Form prepared",
        description: prefillAction.description || "Fields prefilled",
      });
      return;
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("mira:prefill", {
          detail: {
            action: prefillAction,
            correlationId,
          },
        }),
      );
      this.notify?.({
        type: "success",
        title: "Form prepared",
        description: prefillAction.description || "Fields prefilled",
      });
    }
  }

  private async openPopup(popupId: string, action: NavigateAction, correlationId: string | null): Promise<void> {
    if (typeof this.triggerPopupEvent === "function") {
      await this.triggerPopupEvent(popupId, action, correlationId ?? null);
      return;
    }
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent("mira:popup", {
        detail: {
          popup: popupId,
          action,
          correlationId,
        },
      }),
    );
  }

  private async executeBackend(action: ExecuteAction): Promise<void> {
    if (action.confirm_required && !(await this.confirm(action))) {
      this.notify?.({
        type: "warning",
        title: "Action cancelled",
        description: action.description || "Confirmation declined",
      });
      throw new Error("Action cancelled by user");
    }

    const endpoint = this.resolveEndpoint(action.api_call?.endpoint);
    const method = action.api_call?.method ?? "POST";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(action.api_call?.headers ?? {}),
      ...(this.getAuthHeaders ? await this.getAuthHeaders() : {}),
    };

    const payload = action.api_call?.payload ?? {};

    const response = await fetch(endpoint, {
      method,
      headers,
      body: method === "GET" ? undefined : JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Backend action failed (${response.status}): ${text || "Unknown error"}`);
    }

    this.notify?.({
      type: "success",
      title: "Action completed",
      description: action.description || endpoint,
    });
  }

  private resolveEndpoint(endpoint?: string): string {
    if (!endpoint) {
      throw new Error("Missing endpoint for execute action");
    }
    if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
      return endpoint;
    }
    if (endpoint.startsWith("/")) {
      return `${this.baseUrl}${endpoint}`;
    }
    return `${this.baseUrl}/${endpoint}`.replace(/\/{2,}/g, "/");
  }

  private async confirm(action: ExecuteAction): Promise<boolean> {
    if (typeof this.requestConfirmation === "function") {
      return this.requestConfirmation(action);
    }
    throw new Error("Confirmation dialog unavailable");
  }

  private logAction(action: UIAction, success: boolean, errorMessage?: string, correlationId?: string | null) {
    try {
      const contextSnapshot = this.getContext ? this.getContext() : null;
      Promise.resolve(
        logMiraActionEvent({
          baseUrl: this.baseUrl,
          action,
          success,
          errorMessage: errorMessage ?? null,
          context: contextSnapshot ?? null,
          getAuthHeaders: this.getAuthHeaders,
          correlationId: correlationId ?? null,
        }),
      ).catch(() => {
        // Non-blocking telemetry.
      });
    } catch (_err) {
      // Logging should never block UI execution.
    }
  }
}

export default UIActionExecutor;
