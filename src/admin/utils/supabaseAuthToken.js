// Utility to read the Supabase auth token from localStorage for client-side fetches.
// Keeps UI components decoupled from Supabase client internals while allowing
// authenticated calls to backend preference endpoints.
export function resolveSupabaseAuthToken() {
  const extractToken = (value) => {
    if (!value) return null;
    const candidates = [
      value.access_token,
      value.currentSession?.access_token,
      value.currentSession?.accessToken,
      value.session?.access_token,
      value.session?.accessToken,
    ];
    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate.trim();
      }
    }
    return null;
  };

  const deriveKeyFromEnv = () => {
    try {
      const envUrl =
        (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) ||
        (typeof process !== "undefined" && process?.env?.VITE_SUPABASE_URL);
      if (!envUrl) return null;
      const match = String(envUrl).match(/https?:\/\/([^.]+)\.supabase\.co/i);
      if (!match?.[1]) return null;
      return `sb-${match[1]}-auth-token`;
    } catch {
      return null;
    }
  };

  try {
    const keysToCheck = [];
    const envKey = deriveKeyFromEnv();
    if (envKey) keysToCheck.push(envKey);
    if (typeof localStorage !== "undefined" && typeof localStorage.length === "number") {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
          keysToCheck.push(key);
        }
      }
    }
    for (const key of keysToCheck) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        const token = Array.isArray(parsed)
          ? extractToken(parsed[0]) || extractToken(parsed[1]) || extractToken(parsed.find(Boolean))
          : extractToken(parsed);
        if (token) return token;
      } catch {
        // ignore malformed auth cache
      }
    }
  } catch {
    // ignore access errors (e.g., Safari private mode)
  }
  return null;
}
