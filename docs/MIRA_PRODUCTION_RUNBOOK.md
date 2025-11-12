# Mira Co-Pilot Production Runbook

## Table of Contents

1. [On-Call Rotation](#on-call-rotation)
2. [Common Issues](#common-issues)
3. [Troubleshooting Procedures](#troubleshooting-procedures)
4. [Rollback Procedures](#rollback-procedures)
5. [Feature Flag Management](#feature-flag-management)
6. [Emergency Contacts](#emergency-contacts)

---

## 1. On-Call Rotation

### Schedule

- **Primary On-Call:** AI Squad (rotate weekly, Monday 9 AM)
- **Secondary On-Call:** Backend Team
- **Escalation:** Engineering Manager

### Responsibilities

- Monitor `#mira-copilot-alerts` Slack channel
- Respond to PagerDuty alerts within 15 minutes
- Investigate and resolve critical issues within 1 hour SLA
- Document incidents in post-mortem template

### Handoff Checklist

- [ ] Review open incidents from previous week
- [ ] Check system health dashboards
- [ ] Verify all alerts are functioning
- [ ] Test PagerDuty integration
- [ ] Review this runbook for updates

---

## 2. Common Issues

### Issue 1: Intent Misclassification

**Symptoms:**
- Users report Mira doesn't understand their requests
- Low confidence scores (< 0.5) appearing frequently
- Wrong agent selected for user intent

**Investigation Steps:**

1. Check recent intent logs:
```sql
SELECT *
FROM mira_intent_logs
WHERE confidence < 0.5
  AND created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 20;
```

2. Look for patterns:
   - Are specific phrases causing issues?
   - Is one module affected more than others?
   - Has user behavior changed (new use cases)?

3. Review intent classification prompt:
```bash
# Check current classification prompt
cat supabase/functions/_shared/services/router/intent-router.ts
```

**Resolution:**

**Short-term:**
- Add problematic phrases to intent examples
- Update confidence thresholds temporarily
- Enable fallback to general agent

**Long-term:**
- Re-train intent classifier with new examples
- Update `mira_topics.json` with new intents
- Run A/B test with updated classification

**Code Example:**
```typescript
// Add to supabase/functions/_shared/services/router/intent-router.ts
const INTENT_EXAMPLES = {
  ...existingExamples,
  "customer.search_lead": [
    "find Kim",
    "search for customer named Amanda",
    "look up lead by phone 91234567", // New example
  ],
};
```

---

### Issue 2: Action Execution Failures

**Symptoms:**
- Mira says "action completed" but nothing happens
- Toast notifications show errors
- UI doesn't navigate or prefill as expected

**Investigation Steps:**

1. Check action execution logs:
```sql
SELECT
  action_type,
  module,
  error_message,
  COUNT(*) as failure_count
FROM mira_events
WHERE event_type = 'action_execution'
  AND success = false
  AND created_at >= NOW() - INTERVAL '10 minutes'
GROUP BY action_type, module, error_message
ORDER BY failure_count DESC;
```

2. Verify action executor is working:
```bash
# Test action executor locally
npm run test -- src/lib/mira/action-executor.test.ts
```

3. Check for API endpoint issues:
```sql
-- Check if tool executions are failing
SELECT tool_name, error_message, COUNT(*)
FROM mira_events
WHERE event_type = 'tool_execution_error'
  AND created_at >= NOW() - INTERVAL '10 minutes'
GROUP BY tool_name, error_message;
```

**Resolution:**

**If tool/API errors:**
- Check Supabase connection and RLS policies
- Verify API endpoints are responding
- Check authentication headers

**If executor errors:**
- Check browser console for JavaScript errors
- Verify `MiraContextProvider` is mounted
- Check action payload format

**Emergency Fix:**
```typescript
// Disable auto-execution temporarily
// In src/admin/hooks/useAgentChat.js
const AUTO_EXECUTE_ENABLED = false; // Disable until fixed
```

---

### Issue 3: High Latency

**Symptoms:**
- Response times > 3 seconds
- Users report "slow responses"
- Timeouts occurring

**Investigation Steps:**

1. Check current latency:
```sql
SELECT
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY latency_ms) as p50,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) as p95,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY latency_ms) as p99
FROM mira_events
WHERE event_type = 'agent_response'
  AND created_at >= NOW() - INTERVAL '5 minutes';
```

2. Identify bottleneck:
   - **LLM Provider:** Check OpenAI/Anthropic status
   - **Database:** Check Supabase dashboard for slow queries
   - **Network:** Check edge function cold starts

3. Check LLM provider health:
```bash
curl -X POST https://api.openai.com/v1/health
# Or check status page: https://status.openai.com
```

**Resolution:**

**If LLM provider slow:**
- Switch to secondary provider (Anthropic)
- Reduce max_tokens temporarily
- Enable intent caching (if not enabled)

**If database slow:**
- Check for missing indexes
- Optimize slow queries
- Scale Supabase instance if needed

**If edge function cold:**
- Increase min instances in Supabase config
- Pre-warm functions during deploy

**Quick Fix - Enable Caching:**
```typescript
// In agent-chat/index.ts
import { getIntentCache } from "../_shared/services/cache/intent-cache.ts";

const cache = getIntentCache();
const cached = cache.get(userMessage, context.module, context.page);
if (cached && cached.confidence >= 0.8) {
  // Use cached classification
  return cached;
}
```

---

### Issue 4: LLM Provider Outage

**Symptoms:**
- All requests failing with LLM errors
- 503 Service Unavailable responses
- No successful classifications

**Investigation Steps:**

1. Check provider status:
   - OpenAI: https://status.openai.com
   - Anthropic: https://status.anthropic.com

2. Verify API key validity:
```bash
# Test OpenAI connection
curl -X POST https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4o-mini", "messages": [{"role": "user", "content": "test"}]}'
```

3. Check circuit breaker state:
```sql
SELECT *
FROM mira_events
WHERE event_type = 'circuit_breaker_opened'
  AND created_at >= NOW() - INTERVAL '10 minutes';
```

**Resolution:**

**Immediate - Trigger Fallback:**
```typescript
// Update environment variable to switch provider
// In Supabase dashboard → Settings → Edge Functions
OPENAI_BASE_URL=https://api.anthropic.com/v1
OPENAI_MODEL=claude-3-haiku-20240307
```

**Manual Failover:**
1. Update `OPENAI_BASE_URL` env var
2. Restart edge functions
3. Verify requests are succeeding
4. Post update in `#incidents` channel

**Rollback:**
1. Revert env var changes
2. Restart edge functions
3. Monitor error rates

---

## 3. Troubleshooting Procedures

### Procedure: Investigate High Error Rate

1. **Identify Scope**
```sql
-- Get error breakdown by type
SELECT
  error_code,
  COUNT(*) as count,
  ARRAY_AGG(DISTINCT error_message) as messages
FROM mira_events
WHERE event_type = 'error'
  AND created_at >= NOW() - INTERVAL '10 minutes'
GROUP BY error_code
ORDER BY count DESC;
```

2. **Check Recent Deployments**
```bash
# List recent deployments
supabase functions list --project-ref <project-ref>

# Check deployment logs
supabase functions logs agent-chat --tail 100
```

3. **Review Configuration Changes**
   - Check `#deployments` Slack channel
   - Review recent PRs merged to main
   - Check feature flag changes

4. **Test Locally**
```bash
# Run edge function locally
supabase functions serve agent-chat

# Test with curl
curl -X POST http://localhost:54321/functions/v1/agent-chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "test"}], "mode": "stream"}'
```

---

### Procedure: Debug Classification Issues

1. **Enable Debug Mode**
```typescript
// Add to agent-chat/index.ts temporarily
const DEBUG_MODE = true;

if (DEBUG_MODE) {
  console.log("[DEBUG] Classification input:", {
    userMessage,
    context,
    prompts,
  });
  console.log("[DEBUG] Classification output:", classification);
}
```

2. **Test Classification**
```bash
# Create test script
cat > test-classification.ts << 'EOF'
import { intentRouter } from "./supabase/functions/_shared/services/router/intent-router.ts";

const result = await intentRouter.classifyIntent(
  "show me my hot leads",
  { module: "customer", page: "/customer", pageData: {} }
);

console.log(JSON.stringify(result, null, 2));
EOF

# Run with Deno
deno run --allow-net --allow-env test-classification.ts
```

3. **Compare with Expected**
- Check `mira_topics.json` for expected intent
- Verify examples match user's phrase
- Check confidence threshold

---

## 4. Rollback Procedures

### Step 1: Disable Feature Flag

```bash
# In Supabase dashboard or via CLI
supabase secrets set MIRA_COPILOT_ENABLED=false --project-ref <project-ref>
```

**Expected Result:** Users see old chat interface, no Mira features

**Verification:**
1. Load AdvisorHub in browser
2. Navigate to Chat page
3. Confirm Mira UI is hidden
4. Test old chat still works

---

### Step 2: Rollback Edge Function

```bash
# List function versions
supabase functions list --project-ref <project-ref>

# Deploy previous version
git checkout <previous-commit-hash>
supabase functions deploy agent-chat --project-ref <project-ref>

# Verify deployment
curl https://<project-ref>.supabase.co/functions/v1/agent-chat \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"mode": "health"}'
```

**Expected Result:** `{"status": "ok"}`

---

### Step 3: Rollback Database Migration

```bash
# List migrations
supabase migrations list --project-ref <project-ref>

# Rollback last migration
supabase db reset --project-ref <project-ref> --version <previous-version>
```

**⚠️ Warning:** Database rollbacks can cause data loss. Always check with DBA first.

---

### Step 4: Re-enable Gradually

1. Enable for internal team only (10 users)
2. Monitor for 30 minutes
3. If stable, enable for 10% of users
4. Continue phased rollout

```typescript
// Feature flag with user allowlist
const MIRA_ENABLED_USERS = new Set([
  "user1@example.com",
  "user2@example.com",
]);

function isMiraEnabled(userEmail: string): boolean {
  const globalFlag = Deno.env.get("MIRA_COPILOT_ENABLED") === "true";
  const isAllowlisted = MIRA_ENABLED_USERS.has(userEmail);

  return globalFlag || isAllowlisted;
}
```

---

## 5. Feature Flag Management

### Available Flags

| Flag | Default | Purpose |
|------|---------|---------|
| `MIRA_COPILOT_ENABLED` | false | Global on/off |
| `MIRA_MODE_COMMAND_ENABLED` | true | Command mode toggle |
| `MIRA_MODE_COPILOT_ENABLED` | false | Copilot mode toggle |
| `MIRA_MODE_INSIGHT_ENABLED` | false | Insight mode toggle |
| `MIRA_CUSTOMER_AGENT_ENABLED` | false | Customer agent |
| `MIRA_ANALYTICS_AGENT_ENABLED` | false | Analytics agent |
| `MIRA_AUTO_EXECUTE_ENABLED` | true | Auto-execute actions |

### How to Toggle Flags

**Via Supabase Dashboard:**
1. Go to Project Settings → Edge Functions
2. Find "Secrets" section
3. Add/update secret with flag name and value
4. Save changes

**Via CLI:**
```bash
# Set flag
supabase secrets set MIRA_COPILOT_ENABLED=true --project-ref <project-ref>

# Unset flag
supabase secrets unset MIRA_COPILOT_ENABLED --project-ref <project-ref>

# List all secrets
supabase secrets list --project-ref <project-ref>
```

**Testing Flags in Staging:**
```bash
# Set flag in staging environment
supabase secrets set MIRA_COPILOT_ENABLED=true --project-ref <staging-project-ref>

# Test in staging
curl https://<staging-project-ref>.supabase.co/functions/v1/agent-chat \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"mode": "health"}'
```

---

## 6. Emergency Contacts

### Primary On-Call

**AI Squad Lead:**
- Name: [TBD]
- Slack: @ai-squad-lead
- PagerDuty: [TBD]
- Email: ai-squad@company.com

### Secondary On-Call

**Backend Team Lead:**
- Name: [TBD]
- Slack: @backend-lead
- PagerDuty: [TBD]
- Email: backend@company.com

### Escalation

**Engineering Manager:**
- Name: [TBD]
- Slack: @engineering-manager
- Phone: [TBD]
- Email: eng-manager@company.com

### Vendor Contacts

**Supabase Support:**
- Dashboard: https://app.supabase.com/support
- Email: support@supabase.io
- Priority Support: [Enterprise only]

**OpenAI Support:**
- Email: support@openai.com
- Status: https://status.openai.com

---

## Appendix A: Useful Queries

### Get Recent Errors
```sql
SELECT *
FROM mira_events
WHERE event_type = 'error'
  AND created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 50;
```

### Get Active Conversations
```sql
SELECT
  conversation_id,
  mode,
  advisor_id,
  created_at,
  updated_at,
  EXTRACT(EPOCH FROM (updated_at - created_at)) / 60 as duration_minutes
FROM mira_conversations
WHERE status = 'active'
  AND updated_at >= NOW() - INTERVAL '1 hour'
ORDER BY updated_at DESC;
```

### Get Slow Queries
```sql
SELECT
  query_text,
  AVG(execution_time_ms) as avg_time,
  COUNT(*) as count
FROM mira_query_logs
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY query_text
HAVING AVG(execution_time_ms) > 1000
ORDER BY avg_time DESC;
```

---

## Appendix B: Health Check Commands

```bash
# Check edge function health
curl https://<project-ref>.supabase.co/functions/v1/agent-chat \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"mode": "health"}'

# Expected: {"status": "ok"} or {"status": "degraded"}

# Check database connectivity
psql $DATABASE_URL -c "SELECT 1;"

# Check LLM provider
curl -X POST https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4o-mini", "messages": [{"role": "user", "content": "test"}], "max_tokens": 5}'
```

---

**Last Updated:** 2025-11-12
**Version:** 1.0
**Owner:** AI Squad
