import supabase from "@/admin/api/supabaseClient.js";

const API_BASE = (import.meta.env.VITE_AGENT_API_URL || "/api").replace(/\/+$/, "");

function buildQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });
  return search.toString();
}

async function buildAuthHeaders() {
  const headers = {
    "Content-Type": "application/json",
  };
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (anonKey) {
    headers.apikey = anonKey;
  }
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else if (anonKey) {
      headers.Authorization = `Bearer ${anonKey}`;
    }
  } catch {
    if (anonKey && !headers.Authorization) {
      headers.Authorization = `Bearer ${anonKey}`;
    }
  }
  return headers;
}

export async function fetchMiraEvents(params = {}) {
  const path = `${API_BASE}/mira-events`;
  const query = buildQuery(params);
  const url = query ? `${path}?${query}` : path;
  const headers = await buildAuthHeaders();
  const response = await fetch(url, {
    method: "GET",
    headers,
  });
  if (response.status === 401 || response.status === 403) {
    const message = await response.json().catch(() => ({ error: "Unauthorized" }));
    throw new Error(message.error || "Mira Ops access requires elevated permissions.");
  }
  if (!response.ok) {
    const message = await response
      .json()
      .catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(message.error || "Failed to load Mira events");
  }
  return response.json();
}

export const miraOpsApi = {
  fetchMiraEvents,
};

export { buildQuery as serializeMiraEventFilters };
