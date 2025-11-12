import supabase from "@/admin/api/supabaseClient.js";
import { getEnvVar } from "../config.js";

const DEFAULT_BASE_URL = "/api";
const DEFAULT_PATH = "/agent-chat";

function resolveBaseUrl(baseUrl) {
  if (!baseUrl) return DEFAULT_BASE_URL;
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

function resolvePath(path) {
  if (!path || path === "/") return DEFAULT_PATH;
  return path.startsWith("/") ? path : `/${path}`;
}

async function buildAuthHeaders(includeCredentials = true) {
  const headers = new Headers({ "Content-Type": "application/json" });
  const anonKey = getEnvVar("SUPABASE_ANON_KEY");

  if (anonKey) {
    headers.set("apikey", anonKey);
  }

  if (!includeCredentials) {
    return Object.fromEntries(headers.entries());
  }

  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token ?? null;

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    } else if (anonKey) {
      headers.set("Authorization", `Bearer ${anonKey}`);
    }
  } catch {
    if (anonKey) {
      headers.set("Authorization", `Bearer ${anonKey}`);
    }
  }

  return Object.fromEntries(headers.entries());
}

export class SupabaseAgentAdapter {
  constructor(options = {}) {
    this.id = options.id ?? "supabase-agent";
    this.model = options.model ?? "openai-proxy";
    this.baseUrl = resolveBaseUrl(
      options.baseUrl ?? getEnvVar("AGENT_API_URL") ?? DEFAULT_BASE_URL,
    );
    this.path = resolvePath(options.path ?? DEFAULT_PATH);
    this.includeCredentials = options.includeCredentials ?? true;
  }

  async health() {
    try {
      const headers = await buildAuthHeaders(this.includeCredentials);
      const response = await fetch(`${this.baseUrl}${this.path}`, {
        method: "POST",
        headers,
        body: JSON.stringify({ mode: "health" }),
      });
      if (!response.ok) {
        return false;
      }
      const payload = await response.json();
      return payload?.status === "ok";
    } catch (error) {
      console.warn("[SupabaseAgentAdapter] Health check failed", error);
      return false;
    }
  }

  async execute(event) {
    const headers = await buildAuthHeaders(this.includeCredentials);
    const response = await fetch(`${this.baseUrl}${this.path}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ mode: "aial", event }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Supabase agent returned ${response.status} ${response.statusText}: ${text}`,
      );
    }

    return await response.json();
  }
}

export function createSupabaseAgentAdapter(options = {}) {
  return new SupabaseAgentAdapter(options);
}
