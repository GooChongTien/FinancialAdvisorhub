import { describe, expect, it, beforeEach } from "vitest";
import { apiClient, createHttpClient, ApiError } from "@/admin/api/httpClient";
import { resetUnstableCounter } from "../mocks/handlers";

describe("httpClient", () => {
  beforeEach(() => {
    resetUnstableCounter();
    process.env.VITE_API_BASE_URL = "https://api.test.local";
  });

  it("tracks loading state", async () => {
    const client = createHttpClient("https://api.test.local");
    const states: number[] = [];
    const unsubscribe = client.subscribe((count) => states.push(count));

    await client.get("/customers");
    unsubscribe();

    expect(states[0]).toBeGreaterThan(0);
    expect(states[states.length - 1]).toBe(0);
  });

  it("applies request and response interceptors", async () => {
    const client = createHttpClient("https://api.test.local");
    client.addRequestInterceptor((config) => ({
      ...config,
      headers: { ...(config.headers || {}), "x-test": "ok" },
    }));
    client.addResponseInterceptor((response) => ({
      ...response,
      data: Array.isArray(response.data)
        ? response.data.map((c) => ({ ...c, tagged: true }))
        : response.data,
    }));

    const response = await client.get<Array<{ id: string; tagged: boolean }>>("/customers");

    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    expect(response.data.every((c) => c.tagged)).toBe(true);
  });

  it("retries on transient errors", async () => {
    const result = await apiClient.get<{ ok: boolean; attempts: number }>("/unstable", {
      retries: 2,
      retryDelayMs: 5,
    });

    expect(result.data.ok).toBe(true);
    expect(result.data.attempts).toBeGreaterThanOrEqual(2);
  });

  it("supports cancellation", async () => {
    const controller = new AbortController();
    const promise = apiClient.get("/slow", { signal: controller.signal, timeoutMs: 25 });
    controller.abort();
    await expect(promise).rejects.toThrowError();
  });

  it("throws ApiError on non-2xx responses", async () => {
    await expect(apiClient.get("/unstable", { retries: 1 })).rejects.toBeInstanceOf(ApiError);
  });
});
