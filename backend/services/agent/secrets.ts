export interface ClientSecretPayload {
  secret: string;
  updatedAt: string;
  source: "env" | "adapter";
}

export function loadClientSecretFromEnv(): string | null {
  return (
    Deno.env.get("CHATKIT_CLIENT_SECRET") ??
    Deno.env.get("CHATKIT_SECRET") ??
    Deno.env.get("MIRA_CHATKIT_SECRET") ??
    null
  );
}

export async function getClientSecretFromAdapter(
  adapterGetter: () => Promise<string> | string
): Promise<ClientSecretPayload> {
  const maybeSecret = await adapterGetter();
  if (!maybeSecret) {
    throw new Error("Adapter did not return a client secret");
  }
  return {
    secret: maybeSecret,
    updatedAt: new Date().toISOString(),
    source: "adapter",
  };
}

export async function getClientSecret(): Promise<ClientSecretPayload> {
  const fromEnv = loadClientSecretFromEnv();
  if (fromEnv) {
    return {
      secret: fromEnv,
      updatedAt: new Date().toISOString(),
      source: "env",
    };
  }

  throw new Error("CHATKIT_CLIENT_SECRET env variable is not set");
}
