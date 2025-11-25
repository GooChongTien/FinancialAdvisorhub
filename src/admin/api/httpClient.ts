/**
 * Lightweight HTTP client with interceptors, retry logic, cancellation, and typed helpers.
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type RequestInterceptor = (config: InternalRequestConfig) => Promise<InternalRequestConfig> | InternalRequestConfig;
export type ResponseInterceptor<T = unknown> = (response: HttpResponse<T>) => Promise<HttpResponse<T>> | HttpResponse<T>;

export interface RequestConfig<TBody = unknown> {
  method?: HttpMethod;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  body?: TBody;
  signal?: AbortSignal;
  retries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
}

interface InternalRequestConfig extends RequestConfig {
  url: string;
}

export interface HttpResponse<T = unknown> {
  ok: boolean;
  status: number;
  statusText: string;
  headers: Headers;
  data: T;
  raw: Response;
}

export class ApiError<T = unknown> extends Error {
  status: number;
  data: T | null;

  constructor(message: string, status: number, data: T | null = null) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

function buildBaseUrl() {
  const metaEnv = typeof import.meta !== "undefined" ? import.meta.env ?? {} : {};
  const processEnv = typeof process !== "undefined" && process.env ? process.env : {};
  return (
    metaEnv.VITE_API_BASE_URL ||
    processEnv.VITE_API_BASE_URL ||
    processEnv.API_BASE_URL ||
    "https://api.test.local"
  );
}

function serializeParams(params: InternalRequestConfig["params"]) {
  if (!params) return "";
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined) return;
    search.append(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createHttpClient(baseUrl = buildBaseUrl()) {
  const requestInterceptors: RequestInterceptor[] = [];
  const responseInterceptors: ResponseInterceptor[] = [];
  let activeRequests = 0;
  const listeners = new Set<(count: number) => void>();

  function notify() {
    listeners.forEach((listener) => {
      try {
        listener(activeRequests);
      } catch {
        // ignore listener failures to avoid breaking requests
      }
    });
  }

  function addRequestInterceptor(interceptor: RequestInterceptor) {
    requestInterceptors.push(interceptor);
  }

  function addResponseInterceptor(interceptor: ResponseInterceptor) {
    responseInterceptors.push(interceptor);
  }

  function subscribe(listener: (count: number) => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function getActiveRequests() {
    return activeRequests;
  }

  const defaultHeaders = { "Content-Type": "application/json" };

  async function executeRequest<T>(config: InternalRequestConfig): Promise<HttpResponse<T>> {
    let prepared = { ...config };
    for (const interceptor of requestInterceptors) {
      prepared = await interceptor(prepared);
    }

    const { retries = 1, retryDelayMs = 150, timeoutMs, signal, body, params, ...rest } = prepared;
    const url = `${baseUrl.replace(/\/$/, "")}/${prepared.url.replace(/^\//, "")}${serializeParams(params)}`;

    const controller = new AbortController();
    if (signal) {
      signal.addEventListener("abort", () => controller.abort(signal.reason));
    }
    let timeoutId: NodeJS.Timeout | undefined;
    if (timeoutMs) {
      timeoutId = setTimeout(() => controller.abort(new Error("timeout")), timeoutMs);
    }

    const fetchConfig: RequestInit = {
      ...rest,
      method: (rest.method || "GET") as HttpMethod,
      headers: { ...defaultHeaders, ...(rest.headers || {}) },
      signal: controller.signal,
    };
    if (body !== undefined && body !== null) {
      fetchConfig.body = typeof body === "string" ? body : JSON.stringify(body);
    }

    const attemptRequest = async (): Promise<HttpResponse<T>> => {
      const response = await fetch(url, fetchConfig);
      const isJson = response.headers.get("content-type")?.includes("application/json");
      const data = (isJson ? await response.json() : await response.text()) as T;
      const wrapped: HttpResponse<T> = {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data,
        raw: response,
      };
      return wrapped;
    };

    let lastError: unknown = null;
    try {
      activeRequests += 1;
      notify();
      for (let attempt = 0; attempt < Math.max(1, retries); attempt++) {
        try {
          const response = await attemptRequest();
          let intercepted = response;
          for (const interceptor of responseInterceptors) {
            intercepted = await interceptor(intercepted);
          }
          if (!intercepted.ok) {
            throw new ApiError(
              intercepted.statusText || "Request failed",
              intercepted.status,
              intercepted.data as unknown as T,
            );
          }
          return intercepted;
        } catch (error: unknown) {
          lastError = error;
          const isAborted = error instanceof DOMException && error.name === "AbortError";
          const status = (error as ApiError)?.status;
          const shouldRetry = !isAborted && (status === undefined || status >= 500);
          if (attempt < Math.max(1, retries) - 1 && shouldRetry) {
            await sleep(retryDelayMs);
            continue;
          }
          throw error;
        }
      }
      throw lastError ?? new Error("Request failed");
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      activeRequests = Math.max(0, activeRequests - 1);
      notify();
    }
  }

  function request<T>(url: string, config: RequestConfig = {}) {
    return executeRequest<T>({ url, ...config });
  }

  function get<T>(url: string, config: RequestConfig = {}) {
    return request<T>(url, { ...config, method: "GET" });
  }

  function post<TBody = unknown, TResponse = unknown>(url: string, body?: TBody, config: RequestConfig = {}) {
    return request<TResponse>(url, { ...config, method: "POST", body });
  }

  function put<TBody = unknown, TResponse = unknown>(url: string, body?: TBody, config: RequestConfig = {}) {
    return request<TResponse>(url, { ...config, method: "PUT", body });
  }

  function patch<TBody = unknown, TResponse = unknown>(url: string, body?: TBody, config: RequestConfig = {}) {
    return request<TResponse>(url, { ...config, method: "PATCH", body });
  }

  function del<TResponse = unknown>(url: string, config: RequestConfig = {}) {
    return request<TResponse>(url, { ...config, method: "DELETE" });
  }

  return {
    request,
    get,
    post,
    put,
    patch,
    del,
    addRequestInterceptor,
    addResponseInterceptor,
    subscribe,
    getActiveRequests,
  };
}

export const apiClient = createHttpClient();

export default apiClient;
