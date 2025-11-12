# Mira Agent Runbook

Last updated: 2025-11-06  
Owner: AdvisorHub AI Squad  
Contact: `#advisorhub-ai-oncall` (Slack) / `ai-oncall@advisorhub.io`

---

## 1. Service Overview

| Component | Description |
|-----------|-------------|
| Frontend  | React/Vite app (AdvisorHub) embedding the Mira Command Center and Quickstart sandbox. |
| Backend   | Supabase Edge Function `agent-chat` (Deno) that routes to server-side skills and can fall back to OpenAI Chat Completions, with retry/backoff orchestration. |
| Data      | Supabase Postgres storing `mira_telemetry_events`, `mira_telemetry_daily_metrics`, `mira_telemetry_recent_events`. |
| Integrations | OpenAI API (`OPENAI_API_KEY`, optional `OPENAI_MODEL`/`OPENAI_BASE_URL`). |

### Environments

| Env | URL | Notes |
|-----|-----|-------|
| `dev` | Local `npm run dev` | Uses sandbox keys, Supabase dev project, telemetry writes if `VITE_MIRA_TELEMETRY_WRITE_KEY` present. |
| `staging` | https://staging.advisorhub.io | Mirrors production with staging Supabase project & OpenAI keys. |
| `prod` | https://app.advisorhub.io | Production workload, 24x7 on-call coverage. |

Supabase configuration for Edge Function (`agent-chat`) must include:

- `OPENAI_API_KEY` (required), optional: `OPENAI_MODEL`, `OPENAI_BASE_URL`, `OPENAI_TEMPERATURE`, `OPENAI_MAX_TOKENS`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (for agent-tools DB writes)

Frontend build requires:

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- `VITE_MIRA_AIAL_ENABLED=true`
- `MIRA_TELEMETRY_ENABLED=false` (leave disabled while analytics is redefined)

---

## 2. SLAs & SLOs

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Availability | ≥ 99.5% monthly | Error rate > 2% for 5 min |
| Median Response Latency | ≤ 1.5s | p95 > 4s or median > 2s for 5 min |
| Command Success Rate | ≥ 95% | Completion < 90% for 10 min |
| Streaming Dropout | ≤ 1% | More than 3 stream failures in 5 min |

**Observation sources**

- Supabase `mira_telemetry_daily_metrics` (scheduled to Influx or Grafana)
- Edge runtime logs (Supabase / Vercel / Fly logs)
- Frontend telemetry (Segment/Amplitude, if configured)

---

## 3. Monitoring & Alerting

1. **Supabase Log Explorer**  
   - Filter by function `agent-chat` for runtime errors (`mira.agent.request.error`, `mira.agent.retry.exhausted`).
2. **Telemetry Views**  
   ```sql
   select * from public.mira_telemetry_daily_metrics
   where day >= date_trunc('day', now() - interval '1 day')
   order by day desc;
   ```
3. **Suggested alerts**
   - Count of `mira.agent.retry.exhausted` > 0 within 5 minutes.
   - Avg latency (calculated via `mira.agent.openai.metrics`) > 3s for 5 minutes.
   - Supabase Edge Function error rate > 5% (built-in metrics).

---

## 4. On-call Procedures

1. **Page received (Opsgenie/PagerDuty)**  
   - Acknowledge within 5 minutes.  
   - Reference the alert payload: environment, timestamp, triggering metric.

2. **Initial triage (10 minutes)**
   - Check Supabase logs for recent `mira.agent.request.error` entries.
   - Review telemetry view for spike in failures/latency.
   - Validate OpenAI status (https://status.openai.com) if errors indicate upstream issues.

3. **Mitigation**
   - Upstream outage: flip feature flag `VITE_MIRA_AIAL_ENABLED=false` (hotfix config) or route to fallback provider if available.
   - Supabase outage: failover to backup region (if configured), otherwise degrade gracefully (disable command center, show maintenance message).
   - Configuration issue: verify environment variables; redeploy Edge Function with corrected secrets.

4. **Communication**
   - Post incident start and updates in `#advisorhub-status`.
   - If customer-visible, notify CS/PM within 30 minutes.

5. **Resolution**
   - Document remedial actions in incident ticket.
   - Capture timeline, root cause, follow-up tasks.

---

## 5. Runbook Recipes

### 5.1 Restart Edge Function
```bash
# Supabase CLI (requires login):
supabase functions deploy agent-chat
```

### 5.2 Rotate OpenAI Credentials
1. Generate new API key in OpenAI console.
2. Update Supabase function secrets:
   ```
   supabase secrets set OPENAI_API_KEY=sk-...
   supabase secrets set AGENT_WORKFLOW_ID=wf_...
   ```
3. Redeploy `agent-chat`.
4. Update frontend environment (`VITE_OPENAI_API_KEY`) if required.

### 5.3 Seeding telemetry for QA
```sql
insert into public.mira_telemetry_events (event_name, payload)
values
  ('mira.command_submitted', '{"persona":"advisor","mode":"command"}'),
  ('mira.command_completed', '{"persona":"advisor","mode":"command","durationMs":1200}');
```

---

## 6. Troubleshooting Guide

| Symptom | Likely Cause | Action |
|---------|--------------|--------|
| `aial_provider_error` responses | OpenAI credentials invalid or hitting rate limits | Check OpenAI usage; rotate key; verify retries in logs. |
| Streams closing immediately | Client abort, network issue, or upstream adapter issue | Inspect logs for `mira.agent.stream.error`; retry; verify upstream model health. |
| Telemetry missing | `VITE_MIRA_TELEMETRY_WRITE_KEY` or service-role key not set | Verify environment variables in frontend and Supabase function. |
| High latency (>4s) | OpenAI degradation or Supabase cold start | Check OpenAI status, consider raising concurrency, warm functions. |
| Repeated `retry.exhausted` | Persistent upstream failure | Escalate to L2 (AI Eng), consider disabling feature flag. |

---

## 7. Post-incident Checklist

- [ ] Document root cause and remediation in incident tracker.
- [ ] Update this runbook with any new scenarios.
- [ ] Add automated alert or dashboard if needed to detect earlier.
- [ ] Schedule post-incident review within 3 business days.

---

## 8. Appendix

- **Dashboards**: `Grafana > Mira Agent` (latency & success), `Supabase > Log Explorer`.
- **Load test**: See `docs/MIRA_AGENT_RELEASE_CHECKLIST.md` for k6 profile and chaos drill steps.
- **Related docs**: `AI_INTEGRATION_IMPLEMENTATION_PLAN.md`, `MIRA_AGENT_RELEASE_CHECKLIST.md`.
