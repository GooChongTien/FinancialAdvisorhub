## Mira Intent Logging Runbook

### 1. Enable Feature Flag

Intent persistence is gated behind the `MIRA_INTENT_LOG_ENABLED` flag so local/test runs stay lightweight. In any Supabase environment where you want to record data:

```bash
supabase secrets set MIRA_INTENT_LOG_ENABLED=true
```

If you manage environment variables via the dashboard or Terraform, set the same key/value on the `agent-chat` Edge Function.

### 2. Apply Pending Migrations

Run all migrations (including the Phase 0 files created on 2025-11-11) against the target project:

```bash
supabase db push
# or, if you need to run only the new files:
psql $SUPABASE_DB_URL -f supabase/migrations/20251111_create_mira_topics.sql
psql $SUPABASE_DB_URL -f supabase/migrations/20251111_create_mira_intents.sql
psql $SUPABASE_DB_URL -f supabase/migrations/20251111_create_mira_agent_configs.sql
psql $SUPABASE_DB_URL -f supabase/migrations/20251111_update_mira_conversations.sql
psql $SUPABASE_DB_URL -f supabase/migrations/20251111_create_mira_intent_logs.sql
```

Verify the tables/columns exist:

```sql
\d+ public.mira_intent_logs;
```

### 3. Smoke Test Logging

With the feature flag on, issue a chat request (CLI, Postman, or the UI). Then run:

```sql
select topic, intent_name, confidence, selected_agent, selected_skill, created_at
from public.mira_intent_logs
order by created_at desc
limit 10;
```

You should see rows matching the requests you just sent. If no data appears, check function logs for `[IntentLog]` messages—these include insert errors when the flag is on.

### 4. Observability Checklist

- Grafana / Supabase Logs: filter on `mira.agent.intent` events to ensure classifications fire.
- CloudWatch (if applicable): confirm the `needs_clarification` metadata surfaces when router confidence is `medium` or `low`.
- Frontend: make sure responses include the `metadata` object with keys `topic`, `subtopic`, `intent`, `confidence`, `confidenceTier`, and `needs_clarification` when applicable.

### 5. Automated Smoke Script

- Run `npx ts-node tools/smoke-mira-intent-logging.ts` (loads `.env.local`)
- The script sends sample agent-chat requests (customer + analytics) and then prints the latest rows from `mira_intent_logs`.
- Expected output: rows matching the smoke messages with populated `topic`, `intent_name`, `confidence`, `selected_agent`, and `selected_skill`.
- If the script prints “No intent logs found”, double-check that migrations ran and the feature flag is set to `true`, then rerun.

### 6. Rollback Plan

If intent logging causes issues:

1. Set `MIRA_INTENT_LOG_ENABLED=false` to short-circuit DB writes.
2. Inspect `supabase/functions/_shared/services/router/intent-logger.ts` for fallback console logging.
3. Drop or truncate the table only after confirming no downstream processes rely on the data.
