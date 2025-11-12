# Mira Agent Release Checklist

Purpose: ensure every deployment satisfies Phase 6 launch-readiness requirements (runbooks, load/chaos validation, stakeholder comms).

---

## 1. Pre-launch validation

### 1.1 Configuration audit
- [ ] `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` set for target environment.
- [ ] `VITE_MIRA_TELEMETRY_WRITE_KEY` populated with service-role key.
- [ ] Supabase function secrets include `OPENAI_API_KEY`, `AGENT_WORKFLOW_ID`, `SUPABASE_SERVICE_ROLE_KEY`, `AGENT_TIMEOUT`, `AGENT_MAX_RETRIES`.
- [ ] Feature flag `VITE_MIRA_AIAL_ENABLED` set accordingly (off for maintenance toggle).

### 1.2 Migration status
- [ ] Apply latest Supabase migrations (including `mira_telemetry_events` and views).
- [ ] Verify `supabase/functions/agent-chat` deployed with current build (`supabase functions deploy agent-chat`).
- [ ] Run smoke script: `npm run build` then `npm run preview` (or CI equivalent).

---

## 2. Load & chaos validation

### 2.1 Load test (k6 example)
1. Install k6 (`https://k6.io`).
2. Use the snippet below (`scripts/k6-mira-load.js` recommended):
   ```javascript
   import http from 'k6/http';
   import { check, sleep } from 'k6';

   export const options = {
     vus: 25,
     duration: '5m',
     thresholds: {
       http_req_duration: ['p(95)<3000'],
       http_req_failed: ['rate<0.02'],
     },
   };

   const BASE_URL = __ENV.MIRA_AGENT_URL;
   const PAYLOAD = JSON.stringify({
     messages: [{ role: 'user', content: 'Summarize today’s hot leads.' }],
     mode: 'stream',
     metadata: { source: 'load-test', persona: 'advisor' },
   });

   export default function () {
     const res = http.post(BASE_URL, PAYLOAD, {
       headers: {
         'Content-Type': 'application/json',
         Authorization: `Bearer ${__ENV.MIRA_AGENT_TOKEN}`,
       },
     });
     check(res, { 'status is 200': (r) => r.status === 200 });
     sleep(1);
   }
   ```
3. Environment variables:
   - `MIRA_AGENT_URL=https://<project>.functions.supabase.co/agent-chat`
   - `MIRA_AGENT_TOKEN=<service-role key or signed JWT>`
4. Capture metrics and ensure thresholds are satisfied.

### 2.2 Chaos drill
- [ ] Simulate OpenAI failure (disable key or use fault-injection) and confirm retries + graceful fallback message.
- [ ] Simulate Supabase outage (throttle network) and verify feature flag or maintenance message engages within 5 minutes.
- [ ] Validate `mira.agent.retry.exhausted` alert fires and on-call procedures (see runbook) are exercised.

---

## 3. Observability checklist
- [ ] Dashboards updated with `mira_telemetry_daily_metrics` data.
- [ ] Alerts configured for:
  - Retry exhaustion
  - Latency threshold breach
  - Stream failure spike
- [ ] Log retention policy reviewed (30 days minimum).

---

## 4. Stakeholder comms
- [ ] PM sign-off on release notes.
- [ ] CS/Enablement briefed (FAQ + demo).
- [ ] Status page updated (if public).
- [ ] Schedule Go/No-Go meeting with AI squad & leadership.

---

## 5. Post-deploy
- [ ] Verify live deploy via command center (sanity command).
- [ ] Monitor telemetry for first 24 hours; respond to anomalies.
- [ ] Archive load test report and update incident tracker (even if no incident).
- [ ] Mark Phase 6 checklist item in `AI_INTEGRATION_INDEX.md`.

---

Maintainer: AI Reliability Lead  
Updates: log substantial process changes in PR descriptions referencing this document.

---

Release Checklist Addendum (vNext)

- Configuration
  - Use `MIRA_TELEMETRY_ENABLED=false` by default until analytics is redefined.
  - Functions: set `OPENAI_API_KEY`, optional `OPENAI_MODEL`, `OPENAI_BASE_URL`, `OPENAI_TEMPERATURE`, `OPENAI_MAX_TOKENS`.
- Migrations
  - Normalize `tasks.date` (add + backfill from `due_date`).
  - Telemetry tables (`mira_events`, `mira_kpi_flags`, `mira_feedback`) are optional while analytics is paused.
- Smoke
  - `npm run ci:verify` (vitest + `scripts/agent_smoke.mjs`).
- CI
  - Gate deploy on build + smoke success.
