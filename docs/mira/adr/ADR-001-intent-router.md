# ADR-001: Deterministic Intent Router Service

- **Status:** Accepted – 2025-11-15
- **Context:** Mira Co-Pilot Phase 1 (Intent Router)

## Context

We need a deterministic intent router that can run entirely inside Supabase Edge functions without round-tripping to an LLM for every user utterance. The router must:

- Classify user utterances across 38 intents spanning 7 AdvisorHub modules.
- Provide confidence tiers so the UI can branch between automatic execution and clarification prompts.
- Remember recent classifications so repeated prompts from the same module do not incur latency penalties.
- Surface candidate agents so downstream skill selection and tool invocation are deterministic and testable.

## Decision

We implemented `IntentRouterService` in `supabase/functions/_shared/services/router/intent-router.ts` with the following design:

- **Taxonomy-driven scoring:** Every intent entry is hydrated from `docs/mira_topics.json` and scored via `scoreIntent`. Context boosts (+0.15) are applied when the current module matches the candidate topic.
- **Confidence tiers:** `applyThresholds` maps scores into high (`≥0.70`), medium (`0.40-0.69`), and low (`<0.40`) brackets. Medium/low tiers trigger clarifications at the API layer.
- **Topic switching detection:** `detectTopicSwitch` compares `previousTopic` against the most recent classification and attaches `shouldSwitchTopic` flags and transition copy.
- **Caching:** `IntentCache` memoizes classifications using message+context keys for five minutes to keep p95 latency below 500 ms even under 50 parallel requests.
- **Integration tests:** `tests/backend/router.integration.test.ts` exercises classification → agent selection → skill routing, topic switching, fallback, and 50-way concurrency to guard the full pipeline.

## Consequences

- **Predictable latency:** Classification no longer depends on LLM calls, making it safe for inline Copilot suggestions as well as streaming chat.
- **Offline testing:** Vitest can run router tests without mocking OpenAI because the scoring logic is deterministic and taxonomy-driven.
- **Extensibility:** Adding a new intent only requires updating `mira_topics.json`; schema validation + UI action templates are generated automatically.
- **Maintenance cost:** Confidence thresholds and boosts live in code, so tuning requires a redeploy. Future work can load these values from `mira_agent_configs`.

## References

- Implementation: `supabase/functions/_shared/services/router/intent-router.ts`
- Topic taxonomy: `docs/mira_topics.json`
- Integration tests: `tests/backend/router.integration.test.ts`
- Clarification logic: `supabase/functions/_shared/services/router/clarification.ts`
