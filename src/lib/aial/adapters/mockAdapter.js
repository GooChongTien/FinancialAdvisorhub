const SAMPLE_RESPONSES = [
  {
    headline: "Pipeline risks surfaced",
    summary:
      "Top three lead pipelines show stagnant follow-ups. Recommend scheduling outreach to high value prospects within 48 hours.",
    suggestions: [
      "Send summary email to client service team.",
      "Schedule call for dormant policy reviews.",
      "Generate quick quote for highest churn risk lead.",
    ],
    latencyMs: 120,
    tokensUsed: 128,
  },
  {
    headline: "Client meeting prep",
    summary:
      "Client Jane Smith meets tomorrow. Mira prepared talking points covering life policy adjustments and investment portfolio performance.",
    suggestions: [
      "Review compliance checklist before meeting.",
      "Highlight new retirement plan contribution calculators.",
      "Queue personalized follow-up email template.",
    ],
    latencyMs: 180,
    tokensUsed: 164,
  },
  {
    headline: "Compliance reminder",
    summary:
      "Detected pending compliance action for advisor Lucas Reed regarding late suitability documentation.",
    suggestions: [
      "Open compliance task manager.",
      "Notify supervisor via Slack.",
      "Attach documentation to CRM record.",
    ],
    latencyMs: 95,
    tokensUsed: 110,
  },
];

function pickResponse(counter) {
  const index = counter % SAMPLE_RESPONSES.length;
  return SAMPLE_RESPONSES[index];
}

export class MockAdapter {
  constructor(options = {}) {
    this.id = options.id ?? "mock-adapter";
    this.model = options.model ?? "mock-mira-v1";
    this.counter = 0;
  }

  async health() {
    return true;
  }

  async execute(event) {
    const { headline, summary, suggestions, latencyMs, tokensUsed } = pickResponse(this.counter++);
    const prompt = event?.payload?.prompt ?? "Summarize latest advisor activity.";

    return {
      content: [
        `**${headline}**`,
        "",
        summary,
        "",
        `Prompt: ${prompt}`,
      ].join("\n"),
      tokensUsed,
      latencyMs,
      intentCandidates: [
        { id: "advisor.action.summary", score: 0.76 },
        { id: "lead.enrichment", score: 0.42 },
      ],
      suggestions,
    };
  }
}

export function createMockAdapter(options) {
  return new MockAdapter(options);
}
