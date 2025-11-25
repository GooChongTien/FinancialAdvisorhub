const normalize = (value?: string | null) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

export const MIRA_POPUP_TARGETS = {
  NEW_LEAD_FORM: "customers.new_lead_form",
  SMART_PLAN_NEW_TASK: "smart_plan.new_task_dialog",
  // Legacy alias for backward compatibility
  TODO_NEW_TASK: "smart_plan.new_task_dialog",
  BROADCAST_COMPOSER: "broadcast.compose_dialog",
  PROPOSAL_SUBMIT_CONFIRM: "new_business.proposal_submit_confirm",
} as const;

export type MiraPopupTarget = (typeof MIRA_POPUP_TARGETS)[keyof typeof MIRA_POPUP_TARGETS];

export function matchesPopupTarget(
  candidate: string | null | undefined,
  expected: MiraPopupTarget | MiraPopupTarget[],
) {
  const normalizedCandidate = normalize(candidate);
  if (!normalizedCandidate) return false;
  if (Array.isArray(expected)) {
    return expected.some((item) => normalize(item) === normalizedCandidate);
  }
  return normalize(expected) === normalizedCandidate;
}
