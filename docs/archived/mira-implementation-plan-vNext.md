# Mira Implementation Plan & Developer To‑Do

This document is the single source of truth for Mira. Always read the latest progress first, continue development, tick completed tasks, and add a “Latest Update” entry with date/time and tasks completed.

---

## How To Use
- Start here: skim “Current Progress” to align with the latest direction and decisions.
- Continue development: pick items from the checklists below (by phase) and implement.
- Tick completion: mark finished tasks with `[x]` in this file.
- Provide update: append a new entry under “Latest Updates” with date/time and the tasks you completed.

Template for updates:
- [YYYY‑MM‑DD HH:mm SG] Tasks completed: <short bullets or IDs>

---

## Current Progress and Key Decisions
- Direction change: Removed OpenAI AgentBuilder/ChatKit integration. All chat flows now use a native agent design with modes: `health`, `aial`, `stream`, `batch`. Native modes are the source of truth.
- Frontend
  - Replaced ChatMira page to use the native Agent hook and UI.
    - `src/admin/pages/ChatMira.jsx`: uses `useAgentChat`, `ChatInput`, and `ChatMessage`; auto‑sends `?prompt=`; robust `from` decode.
  - Home router uses live adapters by default (no forced mock).
    - `src/admin/pages/Home.jsx`
  - Product: “Ask Mira” button links to native Chat page with query params.
    - `src/admin/pages/Product.jsx`
  - Fixed XState crash for missing event payloads.
    - `src/admin/state/machines/miraCommandMachine.js`
  - Fixed overdue tasks sort/logic to use `tasks.date` (fallback to `due_date` if present).
    - `src/admin/layout/AdminLayout.jsx`
- Backend (Supabase Edge)
  - Supabase Edge Function for `agent-chat` is native (no AgentBuilder, no client secret).
    - `supabase/functions/agent-chat/index.ts`: supports `POST` mode: `health`, `aial`, `stream` (SSE), `batch` (JSON).
    - Requires `OPENAI_API_KEY`; `OPENAI_MODEL/BASE_URL` optional.
- Data/Migrations
  - Added `mira_chat_threads` table.
    - `supabase/migrations/202411070001_create_mira_chat_threads.sql`
  - Added per‑tenant model config table (for future use).
    - `supabase/migrations/20241109_create_mira_model_configs.sql`
- Tests
  - Adapter health fallback and API mode smoke tests in progress.
- Documentation
  - This plan is ChatKit‑free. Any “get_client_secret/ChatKit” references are removed; native modes are the source of truth.

---

---

## Phase 0 – Foundations & Test Harnesses

**Objectives**
- Translate regulatory/knowledge documents into acceptance criteria.
- Establish shared test fixtures, mocks, and guardrail harnesses to enable TDD across all squads.

**Key Tasks (Checklist)**
- [ ] **Requirements extraction**
   - [ ] Parse the following sources and create a structured requirements matrix (store in Supabase and export to Markdown for review):
     - `docs/Advisor Sale Process Executive Summary.docx`
     - `docs/Insurance Advisor Training “Espresso Brain” – Singapore & Malaysia.docx`
     - `docs/Insurance Agent Balanced Scorecard Systems in Malaysia and Singapore.docx`
     - `docs/# Phase 4 – Expert Brain with examples.txt`
   - [ ] For each requirement, assign:
      - [ ] `REQ_ID` (e.g., `BSC.FACT_FIND.COMPLETE`, `SCENARIO.D1.S2`, `TRAINING.CMFAS.RES5`)
      - [ ] Description + citation (line or section reference)
      - [ ] Acceptance criteria in Given/When/Then format
- [ ] **Test utilities**
   - [x] Build a Jest/Vitest helper to spin up mock Supabase responses (fact-find records, leads, proposals).
   - [x] Create an SSE stream simulator to feed scripted `message.delta`, `tool_call.created`, `error`, and `done` events.
   - [x] Package guardrail helpers (PII scrubber, toxicity filter stubs) so unit tests can assert blocking behavior.

**Tests to Author First (Checklist)**
- [x] Contract tests for `/agent-chat` that verify rejection of payloads missing `messages` or `mode`.
- [x] Snapshot tests ensuring knowledge‑atom fixtures match the source text hash (fail if docs change without re‑ingestion).

---

## Phase 1 – Platform Layer (Supabase Edge + Adapter Library)

**Objectives**
- Rebuild the agent proxy so all conversational traffic (native streaming, dashboards, AIAL) flows through the same, robust gateway.
- Implement pluggable adapters (OpenAI, Anthropic, Custom REST) with health checks and telemetry.

**Key Tasks (Checklist)**
- [x] **Recreate `backend/services/agent/client.ts`**
   - [x] Provide `createAgentClient({ adapter })` returning `chat()` and `streamChat()` methods.
   - [x] Add retry/backoff, timeout, and tool-call handling (collect tool calls and expose them to the caller).
- [x] **Enhance `/agent-chat` endpoint (`backend/api/agent-chat.ts`)**
   - [x] Accept `mode` and branch logic before message validation:
     - `health` → respond `{status:"ok"}`.
     - `aial` → accept `{event}` payload and forward to adapter router.
     - `stream` / `batch` → existing logic (with improved logging + metrics).
   - [x] Emit structured logs (request id, advisor id, latency, token usage).
- [ ] **Adapter registry**
   - [ ] Implement `src/lib/aial/createRouter.js` to accept explicit adapters. Provide configuration for:
     - [x] OpenAI (`OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_BASE_URL`).
     - [x] Anthropic (new env vars).
     - [x] Custom REST (internal LLM gateway).
    - [x] Health-check each adapter and auto-fallback when unhealthy.
 - [ ] **Config storage**
   - [x] Store per-tenant model settings in Supabase (`mira_model_configs` table).
   - [ ] Add admin UI to manage provider priority order, temperature, max tokens.

**Tests (TDD) – Checklist**
- [ ] Unit — `createAgentClient.streamChat` yields the correct sequence of SSE events for mocked provider responses (including tool calls and errors).
- [ ] API Contract — Supabase edge tests verifying:
  - [x] `mode:"health"` returns 200 w/ `{status:"ok"}`.
  - [x] `mode:"stream"` streams SSE events (delta → completed → done).
  - [x] `mode:"batch"` returns JSON `{ message }`.
  - [x] `mode:"aial"` accepts payload without `messages`.
- [ ] Integration — Simulated native streaming session streams tokens, handles abort, and logs telemetry; failure path when env vars missing returns 503 + error SSE.
Notes:
- Unit – `createAgentClient.streamChat` yields the correct SSE event sequence (including tool calls and errors).
- API Contract – Verify `health/stream/batch/aial` modes.

---

## Phase 2 – Shared Front-End Agent Service

**Objectives**
- Ensure ChatMira and the Home dashboard use the same service, state machine, and adapter configuration.
- Introduce a shared “pending actions” queue so advisors approve/discard Mira’s UI actions before execution.

**Key Tasks (Checklist)**
 - [x] **Router integration**
   - [x] Update `src/admin/pages/Home.jsx` to instantiate `createAialRouter` with live adapters (`createSupabaseAgentAdapter`, `createOpenAiAdapter`) and fallback to mock only when both fail.
   - [x] Remove temporary `includeMockAdapter: true` default.
- [ ] **Unify experiences**
   - [x] Refactor ChatMira to use `useAgentChat` hook instead of directly calling native streaming APIs OR ensure native streaming also talks to `/agent-chat` via the rebuilt secret mode.
   - [x] Share message history, streaming state, and tool-result handling between surfaces.
- [ ] **Inline confirmation**
  - [x] Replace queue with single `pendingAction` inline confirmation in chat.
  - [x] Add events: `SET_PENDING_ACTION`, `CONFIRM_PENDING_ACTION`, `REJECT_PENDING_ACTION`, `TRUST_SKILL_IN_SESSION`, `CLEAR_PENDING_ACTION`.
  - [x] Auto-clear on new prompt; ignoring the card is implicit reject.
- [ ] **Guardrails**
   - [x] Insert guardrail middleware (input sanitization, PII masking) before sending prompts downstream; log blocked events.

**Tests (TDD)**
Checklist (tick when done)
- [x] Hook tests — `useAgentChat` handles streaming, abort, tool-call injection, and error fallback.
- [ ] UI tests (Playwright) — Advisor submits command + sees streaming text + inline confirmation appears + action executes after allow.
- [ ] Regression — Chat history persists between ChatMira and Home; offline mode falls back to mock adapter with user-visible banner.
1. **Hook tests** – `useAgentChat` handles streaming, abort, tool-call injection, and error fallback.
2. **UI tests (Playwright)** – Advisor submits command → sees streaming text → pending actions appear → approving actions triggers mocked Supabase updates.
3. **Regression** – Chat history persists between ChatMira and Home; offline mode falls back to mock adapter with user-visible banner.

---

## Phase 3 – Knowledge & Compliance Enablement

**Objectives**
- Operationalize regulatory knowledge and training material into “knowledge atoms” accessible by the agent.
- Enable compliance guardrails (Balanced Scorecard KPIs, vulnerable client safeguards, documentation prompts).

**Key Tasks**
- [ ] **Knowledge ingestion pipeline**
   - [x] Create Supabase tables: `knowledge_atoms`, `knowledge_sources`, `scenario_triggers`.
   - [x] Write CLI ingestor to parse txt files, chunk content, assign `ATOM_ID`, derive basic `trigger_phrases`, and upsert rows (`scripts/ingest_knowledge.mjs`).
- [ ] **Lookup tool**
   - [ ] Expose an agent tool `knowledge.lookup({ atom_id? topic? scenario? })` returning structured payload (summary, compliance note, recommended action).
- [ ] **Compliance guardrails**
   - [ ] Implement `risk_nudge` skill with live logic:
      - [ ] Premium vs income thresholds (e.g., >20%).
      - [ ] Missing fact-find sections.
      - [ ] Vulnerable client detection (age, literacy flags).
   - [ ] Reference Balanced Scorecard metrics (fact-find completion, persistency, complaints, CPD hours).
- [ ] **Audit trails**
   - [ ] Every nudge/action must embed `ATOM_ID`, `REQ_ID`, and source citation for audits.

**Tests (TDD)**
Checklist (tick when done)
- [ ] Data migration tests — After running ingestion scripts, verify row counts and content hashes match expected values (fail if source docs change).
- [ ] Lookup unit tests — Searching "premium 25% income" returns `KA-ETH-04`; verifying scenario triggers map to correct atoms.
- [ ] Skill tests — Feed synthetic client data (budget, coverage gaps) and assert `risk_nudge` output includes KPI references and citations.
1. **Data migration tests** – After running ingestion scripts, verify row counts and content hashes match expected values (fail if source docs change).
2. **Lookup unit tests** – Searching “premium 25% income” returns `KA-ETH-04`; verifying scenario triggers map to correct atoms.
3. **Skill tests** – Feed synthetic client data (budget, coverage gaps) and assert `risk_nudge` output includes KPI references and citations.

---

## Phase 4 – Skill Wiring & Intent Executors

**Objectives**
- Connect all starter-kit skills to real data/services.
- Ensure intent executors trigger navigation, meeting prep, compliance alerts, and capture telemetry.

### Agent & Skill Topology
<!-- vNext Addition: multi-agent, multi-skill routing for multi-agent workflows -->

We run **multiple agents in a single workflow**, and each agent owns its own skills/tools.
To avoid ambiguity and keep routing predictable, we define the following topology:

#### Router agent

- A dedicated router (e.g. `mira_router`) decides which downstream agent + skill to use for each user request.
- The router **never executes business logic**; it only returns a routing decision:
  ```jsonc
  {
    "next_agent": "mira_fna_advisor_agent",
    "next_skill": "fna__generate_recommendation"
  }
  ```
- The workflow branches based on `next_agent`, then invokes the chosen skill.

#### Domain agents (examples)

- `mira_fna_advisor_agent` – fact-finding, needs analysis, plan design.
- `mira_knowledge_brain_agent` – training content, regulatory knowledge, scenario playbooks.
- `mira_ops_task_agent` – tasks, follow-ups, navigation, note logging, operational updates.

#### Skill naming & ownership

- Skills are **namespaced by domain** and belong to exactly one agent:
  - FNA: `fna__generate_recommendation`, `fna__summarize_cashflow_gap`
  - Knowledge: `kb__lookup_atom`, `kb__list_scenarios`
  - Ops: `ops__create_task`, `ops__update_task_status`, `ops__log_note`
- A skill **must not be registered under multiple agents**.
- Implementation files must live under the corresponding agent folder, for example:
  - `src/agents/fna/skills/fna__generate_recommendation.ts`
  - `src/agents/knowledge/skills/kb__lookup_atom.ts`
  - `src/agents/ops/skills/ops__create_task.ts`

#### Workflow rules

- All requests **go through the router first**.
- The router selects **exactly one** `{ next_agent, next_skill }` per turn (no fan-out to multiple agents in a single step).
- Front-end or dashboard clients do not call domain agents directly; they go through the router (or a thin backend wrapper that enforces the same contract).

#### Telemetry & debugging

- Each skill execution should log at least:
  - `agent_name`, `skill_name`
  - `journey_type` (e.g. `A2C`, `D2C`, `Ops`)
  - `channel` (e.g. `home-inline`, `chat-fullscreen`, `dashboard-widget`)
- These metadata fields support runtime tracing and routing-accuracy analytics.

**Key Tasks**
- [x] **Skill integration**
  - [x] `capture_update_data`: connect via wrapped A2C skill (server-side skill, content response; mutations to be enabled later).
  - [x] `case_overview`: connect via wrapped A2C skill (server-side skill, content response).
  - [x] `prepare_meeting`: connect via wrapped A2C skill (server-side skill, content response).
  - [x] `post_meeting_wrap`: connect via wrapped A2C skill (server-side skill, content response).
- [ ] **Intent executors**
   - [ ] Optimize lead enrichment / meeting prep / compliance alert executors to use cached lead directories and tasks.
   - [ ] Provide telemetry (latency, match confidence) for each execution.
- [ ] **Tool compliance**
   - [ ] Ensure tool schema definitions (navigate/update/task/log_note) match front-end action executor expectations.
   - [ ] Add circuit-breakers when actions would violate permissions (e.g., missing `data:update`).

### Agent & Skill Mapping
<!-- vNext Addition: canonical mapping between agents, namespaced skills, and implementations -->

This section documents the canonical mapping between:

- logical agents (router-facing),
- namespaced skills (as used by `mira_router`), and
- underlying implementation functions (starter-kit skills and backend services).

This mapping is the source of truth and MUST stay in sync with:

- `backend/services/skills/index.ts`
- `backend/services/router/mira-router.ts`
- `docs/mira-agent-starter-kit-a2c/src/skills/*` (for wrapped A2C skills)

#### Knowledge / Training Agent – `mira_knowledge_brain_agent`

Primarily responsible for knowledge retrieval, risk nudges, and explicit sales coaching.

- `kb__knowledge_lookup`
  - Agent: `mira_knowledge_brain_agent`
  - Implementation: `backend/services/knowledge/lookup.ts` → `knowledgeLookup`
  - Purpose: lookup knowledge atoms by topic/scenario (uses `knowledge_atoms` + `scenario_triggers`).
- `kb__risk_nudge`
  - Agent: `mira_knowledge_brain_agent`
  - Implementation: `docs/mira-agent-starter-kit-a2c/src/skills/risk_nudge.ts` → `risk_nudge`
  - Purpose: provide risk / compliance nudges (e.g. premium vs income) based on A2C context.
- `kb__sales_help_explicit`
  - Agent: `mira_knowledge_brain_agent`
  - Implementation: `docs/mira-agent-starter-kit-a2c/src/skills/sales_help_explicit.ts` → `sales_help_explicit`
  - Purpose: explicit sales coaching only when the advisor clearly asks for sales help/script.

#### FNA / Advisor Agent – `mira_fna_advisor_agent`

Owns financial needs analysis, case summarisation, and (later) tailored recommendations.

- `fna__capture_update_data`
  - Agent: `mira_fna_advisor_agent`
  - Implementation: `docs/mira-agent-starter-kit-a2c/src/skills/capture_update_data.ts` → `capture_update_data`
  - Purpose: capture or update client fact-find / KYC data (A2C starter-kit semantics).
- `fna__case_overview`
  - Agent: `mira_fna_advisor_agent`
  - Implementation: `docs/mira-agent-starter-kit-a2c/src/skills/case_overview.ts` → `case_overview`
  - Purpose: generate a consolidated view of the client’s case (coverage, gaps, key facts).
- `fna__generate_recommendation`
  - Agent: `mira_fna_advisor_agent`
  - Implementation: server stub in `backend/services/skills/index.ts`
  - Purpose: **vNext** – will eventually generate tailored FNA recommendations using A2C context + knowledge atoms.

#### Ops / Flow Agent – `mira_ops_task_agent`

Handles navigation, meeting flows, and operational follow-ups.

- `ops__system_help`
  - Agent: `mira_ops_task_agent`
  - Implementation: `docs/mira-agent-starter-kit-a2c/src/skills/system_help.ts` → `system_help`
  - Purpose: in-app navigation and “how do I do X in this system?” flows.
- `ops__prepare_meeting`
  - Agent: `mira_ops_task_agent`
  - Implementation: `docs/mira-agent-starter-kit-a2c/src/skills/prepare_meeting.ts` → `prepare_meeting`
  - Purpose: pre-meeting preparation (agenda, talking points, checks) based on client + journey context.
- `ops__post_meeting_wrap`
  - Agent: `mira_ops_task_agent`
  - Implementation: `docs/mira-agent-starter-kit-a2c/src/skills/post_meeting_wrap.ts` → `post_meeting_wrap`
  - Purpose: post-meeting wrap-up and follow-up summary.
- `ops__create_task`
  - Agent: `mira_ops_task_agent`
  - Implementation: placeholder stub (documented in `src/agents/ops/skills/ops__create_task.ts`)
  - Purpose: **vNext** – create operational tasks (e.g. internal todos, follow-ups) once task storage is wired.

#### Router-only Hint Skill

These skills are used as routing hints and are *not* implemented in the server-side registry.

- `ops__agent_passthrough`
  - Agent: `mira_ops_task_agent`
  - Purpose: router hint meaning “no server-side skill; fall back to existing Agent client behaviour”.
  - Implementation: **none** in `backend/services/skills/index.ts` by design.

#### Notes

- All namespaced skills above are registered in `backend/services/skills/index.ts` via a central registry:
  - `hasSkill(name)` → existence
  - `executeSkill(name, ctx)` → execution
  - `getAgentForSkill(name)` → owning agent
- `mira_router` (`backend/services/router/mira-router.ts`) chooses `{ next_agent, next_skill }` per turn using:
  - metadata hints (e.g. `nextSkill`, `journey_type`),
  - user message content (e.g. `kb: ...`, “knowledge lookup”, “needs analysis”, “task/follow-up”).
- Telemetry for each skill execution is emitted via `logSkillExecution` with:
  - `agent_name`, `skill_name`, `journey_type`, `channel`, `requestId`, `tenantId`.

Any future skill additions or renames MUST update:

1. This mapping section (documentation)
2. `backend/services/skills/index.ts` (registry)
3. `backend/services/router/mira-router.ts` (routing heuristics and/or metadata hints)
4. Tests under `tests/backend/skills.*.test.ts` and `tests/backend/router.mira-router.test.ts`


**Tests (TDD)**
Checklist (tick when done)
- [ ] API integration tests — Mock Supabase responses; verify skills update correct tables/fields and handle failures gracefully.
- [ ] Executor tests — Prompt variations should resolve to correct intent, navigate to expected URLs, and produce toasts with match confidence.
- [ ] Permission tests — Attempting to invoke restricted actions without permissions should yield `confirm` dialogs or errors, never silent failures.
1. **API integration tests** – Mock Supabase responses; verify skills update correct tables/fields and handle failures gracefully.
2. **Executor tests** – Prompt variations should resolve to correct intent, navigate to expected URLs, and produce toasts with match confidence.
3. **Permission tests** – Attempting to invoke restricted actions without permissions should yield `confirm` dialogs or errors, never silent failures.

---

## Phase 5 – Balanced Scorecard Telemetry & Advisor Feedback Loop (Paused)

**Objectives**
- PAUSED: Analytics will be redefined. Mira should route to the Analytics module and explain metrics rather than compute them.

**Key Tasks**
- [ ] (Paused) Telemetry schema/dashboards
- [x] Add routing skill to Analytics module: `ops__analytics_explain` (navigates to `/analytics`, provides interpretation guidance).
- [x] Gate any telemetry writes behind `MIRA_TELEMETRY_ENABLED=false` by default.
- [x] Note: No in-app "guided by Mira" badge added on Analytics. We rely on navigation and inline explanation only.
- [ ] **Dashboards**
   - [ ] Build aggregated views showing advisor BSC scores (persistency, complaints, CPD hours) fed by Mira interactions.
- [ ] **CPD nudges**
   - [ ] When telemetry reveals repeated gaps (e.g., skipping disclosure steps), trigger Espresso Brain micro-learning suggestions with tracking.

**Tests (TDD)**
Checklist (tick when done)
- [x] Router test – Queries like “analytics”, “premium this month” route to `ops__analytics_explain`.
- [ ] (Paused) Telemetry unit/integration tests.
1. **Telemetry unit tests** – Ensure every interaction writes rows with proper KPI flags and references.
2. **Analytics integration tests** – Validate aggregated BSC scores match sample data (persistency %, complaint counts).
3. **Feedback loop tests** – Submit advisor thumbs-up/down; ensure follow-up adjustments recorded and visible in dashboards.

---

## Phase 6 – Adaptive UI & Release Readiness

**Objectives**
- Deliver dynamic UI modes aligned with the Adaptive Assistant spec.
- Enforce a rigorous release checklist for every Mira deploy.

**Key Tasks**
- [x] **Adaptive layout**
  - [x] Implement automatic mode switching:
    - Fullscreen chat for long-form queries.
    - Split “co-pilot” when actions/confirmations present (auto-switch on tool intent).
    - Insight sidebar component wired (placeholder feed until Phase 3 guardrails land).
  - [x] Animate transitions; persist user overrides (`mira:mode`).
- [ ] **Release automation**
   - [ ] Update `MIRA_AGENT_RELEASE_CHECKLIST.md` with new tests, telemetry verification, rollback plan.
   - [ ] CI pipeline must block deployment unless:
      - [ ] Unit/integration/e2e tests pass.
      - [ ] Guardrail suite passes (toxicity/PII/injection).
      - [ ] Health checks for all adapters succeed.
- [ ] **Load/perf testing**
   - [ ] Run k6/Locust scripts to simulate N advisors streaming concurrently; ensure SSE latency within SLA.

**Tests (TDD + Release) – Checklist**
- [ ] Visual regression tests — Validate layout changes when switching modes and routes.
- [ ] Performance tests — Automated load test artifacts stored with each release; fail pipeline if latency > threshold or error rate spikes.
- [ ] Release gating — CI job verifying every checklist item is checked off (signed artefacts, env var diff, telemetry dashboards green).
Notes:
- Visual regression tests – Validate layout changes when switching modes and routes.
- Performance tests – Load‑test artifacts per release; fail pipeline if latency > thresholds.
- Release gating – CI verifies checklist, env parity, and dashboards are green.

---

## Latest Updates
- [2025‑11‑10 13:45 SG] Tasks completed:
  - Data: Created knowledge tables (`knowledge_sources`, `knowledge_atoms`, `scenario_triggers`).
  - DX: Added `scripts/ingest_knowledge.mjs` (dry-run if Supabase env missing; upserts when provided).
  - App: Hooked guardrails into `useAgentChat` (PII scrub + toxicity) and ticked Guardrails in Phase 2.

- [2025‑11‑10 12:32 SG] Tasks completed:
  - FE: InlineChatPanel now uses shared AgentChatProvider; messages/streaming unified across surfaces.
  - FE: Replaced pending actions queue with single inline confirmation state (`pendingAction`) and events (`SET_/CLEAR_/CONFIRM_/REJECT_`, `TRUST_SKILL_IN_SESSION`).
  - Tests: Added `tests/frontend/useAgentChat.test.ts` covering streaming, abort, and tool-call attachment.
- [2025‑11‑10 12:05 SG] Tasks completed:
  - Tests: Added batch mode contract test verifying `{ message }` JSON response (`tests/backend/agent-chat.batch.contract.test.ts`).
  - FE: Implemented shared `AgentChatProvider` to persist chat messages and streaming state across surfaces.
  - FE: Wrapped layout with `AgentChatProvider`; ChatMira now consumes shared store (no per-page reset).
  - FE: Extended `miraCommandMachine` with `pendingActions[]` plus add/remove/clear/undo events.
  - Plan: Ticked Phase 1 API Contract for `mode:"batch"`; Phase 2 shared state; action queue context.
- [2025‑11‑10 10:25 SG] Tasks completed:
  - FE: ChatMira now uses native agent hook (`useAgentChat`); auto‑send `?prompt=…`; robust `from` decoding.
  - FE: Home routes command input to `/chat` with query params.
  - FE: Product “Ask Mira” routes to `/chat` with prompt.
  - FE: Fixed XState crash on missing event payload (`SET_MODE` defensive assign).
  - FE: Sidebar overdue count now sorts by `tasks.date` with fallback to `due_date` when present.
  - BE: Supabase `agent-chat` function supports `health`, `aial`, `stream`, `batch` (no ChatKit).
  - Data: Created `mira_chat_threads` table; verified REST access.

- [2025‑11‑10 11:30 SG] Tasks completed:
  - BE: Redeployed `agent-chat` Edge Function to the native implementation (no ChatKit); verified modes and OpenAI key usage.
  - FE: Removed ChatKit web component from `index.html`; app no longer loads ChatKit.
  - FE: Ensured inline/chat widgets route to native `/chat` page; ChatMira streams via `useAgentChat`.
  - DX: Updated `.env.example` and `.env.local.example` to reflect native setup; clarified not to expose real OpenAI keys in FE.
  - Infra: Verified `mira_chat_threads` and `tasks` usage via Supabase MCP; resolved prior 400/404s; end‑to‑end chat now working.
  - Next focus: add API contract test for `mode:"batch"`, implement shared chat history across Home/Chat, and wire guardrails + action queue.


---

## General Development & Testing Guidelines

- **TDD First**: Every feature starts with failing tests tied to `REQ_ID`/`ATOM_ID`. Only write code to make tests pass; refactor with green tests.
- **Traceability**: Include requirement IDs in PR descriptions and test names (e.g., `it("BSC.FACT_FIND.COMPLETE – blocks missing data")`).
- **Documentation**: Update this file whenever scope shifts; include new phases or tasks with owners and due dates.
- **Telemetry**: Instrument everything. If it isn’t measured (latency, tokens, guardrail decisions, KPI hits), it doesn’t exist.
- **Security & Compliance**: Never bypass guardrails for expedience. Any temporary override must be documented with expiry and approval.

## Latest Updates

- [2025-11-10 14:00 SG] Tasks completed:
  - Phase 4: wired skills into Supabase Edge registry (`kb__knowledge_lookup`, `kb__risk_nudge`, `kb__sales_help_explicit`, `fna__capture_update_data`, `fna__case_overview`, `fna__generate_recommendation` stub, `ops__prepare_meeting`, `ops__post_meeting_wrap`).
  - Agent router unchanged; server-side skills now handle responses with LLM fallback when unknown.
  - Added synthesized tool-call for actionable skills (navigate/update/task/log_note) in streaming path. Front-end confirms and calls `agent-tools`.
  - Extended `agent-tools` with stub handlers: `ops__navigate`, `ops__create_task`, `ops__log_note`, `fna__update_field`, `fna__prefill_form`.
  - Wired `agent-tools` to real DB where available: uses authed Supabase client (JWT from browser) to insert into `tasks` and `lead_edit_history` with fallbacks when tables/columns differ between environments.
  - Added Playwright test for chat tool-call confirmation (`tests/frontend/chat-tool-confirmation.spec.ts`).

- [2025-11-10 15:10 SG] Tasks completed:
  - Phase 5: created telemetry tables `mira_events`, `mira_kpi_flags`, `mira_feedback` and indexes.
  - Instrumented Edge: `logSkillExecution` now writes to `mira_events` with agent/skill/journey/channel/advisor_id/intent/actions.
  - Hooked agent-chat to send telemetry on skill execution (stream/batch paths).

---

### Current Owners (update as needed)
- Platform / Supabase Edge: `@PlatformSquad`
- Front-End Experience: `@ExperienceSquad`
- Knowledge & Compliance: `@KnowledgeSquad`
- Analytics & BSC Telemetry: `@DataSquad`

Keep this document aligned with reality; future contributors rely on it as the single source of truth for Mira’s roadmap and obligations.
