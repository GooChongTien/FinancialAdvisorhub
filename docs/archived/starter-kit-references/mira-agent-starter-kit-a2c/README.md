# Mira Agent Starter Kit (A2C Assistant Edition)

This starter kit scaffolds **Mira**, your advisor-facing AI assistant inside SmartPOS.

Design principles:
- A2C only (Agent-to-Customer journeys). Mira never replaces the advisor.
- Mira is a humble system assistant, not a sales coach by default.
- She focuses on:
  - System navigation (SmartPOS routes / modules).
  - Capturing & updating data at the UI layer (when consent is given).
  - Running analysis (e.g. FNA, gap insights) and surfacing neutral nudges.
- Only when the advisor explicitly asks ("give me a script", "how to position") does Mira provide sales/communication help.

## Quick start

```bash
npm install            # or pnpm i
cp .env.example .env   # fill in env vars
psql < infra/supabase/migrations/001_init.sql
npm run dev
npm run test:golden
```

## Included A2C skills

1. system_help – "Where do I…?" navigation & how-to for SmartPOS.
2. capture_update_data – turn natural language into field updates (KYC, FNA).
3. case_overview – neutral snapshot of client + gaps (stubbed in code; wire to your APIs).
4. risk_nudge – placeholder for compliance nudges (affordability, missing FNA, etc.).
5. prepare_meeting – quick agenda + key checks before a review.
6. post_meeting_wrap – summarise meeting + create follow-up tasks.
7. sales_help_explicit – only when advisor clearly asks for sales/script help.

## Response envelope

The backend always returns a single envelope:

```ts
type Envelope = {
  message: string;
  actions?: Action[];
  confirm?: { summary: string; on_approve: Action[] } | null;
  telemetry?: { intent: string; confidence: number; notes?: string };
};
```

Your SmartPOS frontend should render `message` and then execute `actions`
(`navigate`, `update_field`, `create_task`, etc.).

