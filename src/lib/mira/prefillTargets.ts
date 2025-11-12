const normalize = (value?: string | null) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

export const MIRA_PREFILL_TARGETS = {
  NEW_LEAD_FORM: "customers.new_lead_form",
} as const;

export type MiraPrefillTarget = (typeof MIRA_PREFILL_TARGETS)[keyof typeof MIRA_PREFILL_TARGETS];

export function resolvePrefillTarget(action: { target?: string | null; payload?: Record<string, unknown> } | null | undefined) {
  if (!action) return "";
  const candidate =
    action.target ||
    (typeof action.payload === "object" && action.payload !== null
      ? (action.payload["target"] as string) || (action.payload["form"] as string) || (action.payload["prefill_target"] as string)
      : undefined);
  return typeof candidate === "string" ? candidate : "";
}

export function matchesPrefillTarget(candidate: string | null | undefined, expected: MiraPrefillTarget | MiraPrefillTarget[]) {
  const normalizedCandidate = normalize(candidate);
  if (Array.isArray(expected)) {
    return expected.some((item) => normalize(item) === normalizedCandidate);
  }
  return normalize(expected) === normalizedCandidate;
}

