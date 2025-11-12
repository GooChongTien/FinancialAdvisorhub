import type { MiraModule, UIAction } from "../types.ts";

type Params = Record<string, string | number | boolean | null | undefined>;

export type CrudOperation = "create" | "read" | "update" | "delete";

export interface CrudFlowOptions {
  page?: string;
  popup?: string;
  filters?: Params;
  payload?: Record<string, unknown>;
  endpoint?: string;
  confirmRequired?: boolean;
  description?: string;
}

function defaultPage(module: MiraModule | string): string {
  return `/${String(module).replace(/_/g, "-")}`;
}

export function createNavigateAction(
  module: MiraModule | string,
  page: string,
  params?: Params,
): UIAction {
  const sanitizedParams = params
    ? Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined))
    : undefined;

  return {
    action: "navigate",
    module,
    page,
    params: sanitizedParams && Object.keys(sanitizedParams).length > 0 ? sanitizedParams : undefined,
  };
}

export function createPrefillAction(
  payload: Record<string, unknown>,
  confirmRequired = false,
  description?: string,
): UIAction {
  return {
    action: "frontend_prefill",
    payload,
    confirm_required: confirmRequired,
    description,
  };
}

export function createExecuteAction(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  endpoint: string,
  payload?: Record<string, unknown>,
  confirmRequired = true,
  description?: string,
): UIAction {
  return {
    action: method === "GET" ? "submit_action" : "execute",
    api_call: {
      method,
      endpoint,
      payload,
    },
    confirm_required: confirmRequired,
    description,
  };
}

export function createCRUDFlow(
  operation: CrudOperation,
  module: MiraModule | string,
  options: CrudFlowOptions = {},
): UIAction[] {
  const page = options.page ?? defaultPage(module);
  const endpoint = options.endpoint ?? `/api/${String(module)}/${operation}`;
  const actions: UIAction[] = [];

  if (operation === "read") {
    actions.push(createNavigateAction(module, page, options.filters));
    return actions;
  }

  if (operation === "delete") {
    actions.push(
      createExecuteAction("DELETE", endpoint, options.payload, true, options.description ?? "Confirm deletion"),
    );
    return actions;
  }

  actions.push(createNavigateAction(module, page, options.filters));

  if (options.payload && Object.keys(options.payload).length > 0) {
    actions.push(
      createPrefillAction(options.payload, operation === "update" ? true : false, options.description),
    );
  }

  actions.push(
    createExecuteAction(
      operation === "create" ? "POST" : "PATCH",
      endpoint,
      options.payload,
      options.confirmRequired ?? operation === "update",
      options.description,
    ),
  );

  return actions;
}
