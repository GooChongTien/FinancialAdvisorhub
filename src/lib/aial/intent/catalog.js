export const intentCatalog = [
  {
    name: "advisor.action.summary",
    title: "Advisor Action Summary",
    description: "Summarize advisor activity and highlight next best actions.",
    required: ["advisorId"],
    optional: ["timeframe", "channel"],
  },
  {
    name: "lead.enrichment",
    title: "Lead Enrichment",
    description: "Augment lead details with risk indicators and contact strategy.",
    required: ["leadId"],
    optional: ["segment", "priorityScore"],
  },
  {
    name: "compliance.alert",
    title: "Compliance Alert",
    description: "Escalate compliance related events and recommended handling.",
    required: ["alertId"],
    optional: ["severity", "dueDate"],
  },
  {
    name: "meeting.prep",
    title: "Meeting Preparation",
    description: "Generate agenda and talking points for upcoming client meeting.",
    required: ["clientId", "meetingId"],
    optional: ["advisorId", "products"],
  },
  {
    name: "insurance.policy.lookup",
    title: "Policy Lookup",
    description: "Retrieve current policy information and highlight coverage gaps.",
    required: ["policyNumber"],
    optional: ["customerId"],
  },
];

export function getIntentSchema(name) {
  return intentCatalog.find((intent) => intent.name === name) ?? null;
}

export function listIntentNames() {
  return intentCatalog.map((intent) => intent.name);
}
