// Shared persona configuration for Mira command interfaces.
export const MIRA_PERSONA_OPTIONS = [
  { id: "advisor", label: "Advisor" },
  { id: "compliance", label: "Compliance Officer" },
  { id: "sales", label: "Sales Ops" },
];

export const MIRA_PERSONA_SUGGESTIONS = {
  advisor: [
    "Search Sarah's proposal stage",
    "Summarize today's reminders",
    "Highlight warm leads needing follow-up",
  ],
  compliance: [
    "Check compliance alerts this week",
    "List clients awaiting suitability forms",
    "Summarize pending compliance tasks",
  ],
  sales: [
    "Prepare agenda for tomorrow's meeting",
    "Show pipeline health for Q4",
    "Identify stalled proposals over 14 days",
  ],
};

export function getPersonaSuggestions(personaId) {
  return MIRA_PERSONA_SUGGESTIONS[personaId] ?? MIRA_PERSONA_SUGGESTIONS.advisor;
}
