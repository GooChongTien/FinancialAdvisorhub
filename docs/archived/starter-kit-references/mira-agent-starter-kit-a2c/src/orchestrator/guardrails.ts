export async function run(stage: "input"|"toolcall"|"output", payload: any) {
  // Stub: always allow; extend later with moderation/PII checks.
  return { decision: "allow" as const, reason: null, redacted: null };
}

