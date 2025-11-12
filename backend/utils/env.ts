export function readEnv(key: string): string | null {
  if (typeof Deno !== "undefined" && typeof Deno?.env?.get === "function") {
    const value = Deno.env.get(key);
    if (typeof value === "string") {
      return value;
    }
  }
  if (typeof process !== "undefined" && process.env) {
    const value = process.env[key];
    if (typeof value === "string") {
      return value;
    }
  }
  return null;
}

export function readEnvNumber(key: string): number | undefined {
  const value = readEnv(key);
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
