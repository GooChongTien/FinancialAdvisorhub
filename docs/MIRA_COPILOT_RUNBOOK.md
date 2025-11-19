# MIRA Co-Pilot Operations Runbook

**Version**: 1.0
**Last Updated**: 2025-01-14
**Owner**: Platform Team
**On-Call Escalation**: #mira-platform Slack channel → PagerDuty

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Common Operations](#common-operations)
4. [Incident Response](#incident-response)
5. [Troubleshooting Guides](#troubleshooting-guides)
6. [Feature Flag Management](#feature-flag-management)
7. [Performance Tuning](#performance-tuning)
8. [Deployment Procedures](#deployment-procedures)
9. [Database Operations](#database-operations)
10. [Monitoring & Alerts](#monitoring--alerts)

---

## System Overview

### What is MIRA Co-Pilot?

MIRA (Modular Intelligent Recommendation Assistant) Co-Pilot is an AI-powered assistant that helps insurance advisors with daily tasks through three interaction modes:

- **Command Mode**: Chat interface for direct questions and commands
- **Copilot Mode**: Inline contextual suggestions based on current page/activity
- **Insight Mode**: Proactive insights and recommendations

### Key Components

1. **Intent Router** (`intent-router.ts`)
   - Classifies user messages into intents
   - Routes to appropriate specialized agent
   - Confidence scoring and clarification handling

2. **Specialized Agents** (7 agents)
   - CustomerAgent: Customer record management
   - NewBusinessAgent: Proposal and quote workflows
   - ProductAgent: Product search and comparison
   - AnalyticsAgent: Performance metrics and reports
   - TodoAgent: Task and calendar management
   - BroadcastAgent: Campaign management
   - VisualizerAgent: Data visualization

3. **Feature Flags** (`feature-flags.ts`)
   - Runtime toggles for features, modes, and agents
   - Gradual rollout support
   - Advisor-specific overrides

4. **Security Layer** (`input-validation.ts`)
   - XSS and injection prevention
   - Rate limiting (60 req/min per advisor)
   - Input sanitization

### Dependencies

- **OpenAI API**: LLM for intent classification and fallback responses
- **Supabase**: Database, auth, edge functions
- **PostgreSQL**: Data storage

### Service Endpoints

- **Agent Chat**: `/functions/v1/agent-chat`
- **Feature Flags**: `/functions/v1/feature-flags`
- **Agent Tools**: `/functions/v1/agent-tools`

---

## Architecture

### Request Flow

```
User → Frontend → agent-chat endpoint
                      ↓
                 Input Validation
                      ↓
                 Rate Limiting
                      ↓
                 Feature Flag Check
                      ↓
                 Intent Classification (with caching)
                      ↓
                 Agent Selection
                      ↓
                 Agent Execution
                      ↓
                 Response (SSE or JSON)
```

### Data Flow

```
1. User message → Sanitization → Validation
2. Context extraction (module, page, pageData)
3. Intent classification (cached for 5 min)
4. Agent selection based on classification
5. Agent executes and returns MiraResponse
6. Frontend processes ui_actions and displays reply
```

### Caching Strategy

- **Intent Cache**: 5-minute TTL, max 1000 entries
- **Cache Key**: `message:module:page` (normalized)
- **Eviction**: FIFO when max size reached

---

## Common Operations

### Check System Health

```bash
# Check agent-chat endpoint
curl -X POST https://advisorhub.com/functions/v1/agent-chat \
  -H "Content-Type: application/json" \
  -d '{"mode":"health"}'

# Expected: {"status": "ok"}
```

### View Real-Time Logs

```bash
# All functions
npx supabase functions logs

# Specific function with filters
npx supabase functions logs agent-chat --filter "error"

# Follow logs in real-time
npx supabase functions logs agent-chat --tail
```

### Check Feature Flags

```bash
# Get all flags
curl https://advisorhub.com/functions/v1/feature-flags

# Get flags for specific advisor
curl https://advisorhub.com/functions/v1/feature-flags?advisorId=<uuid>

# Get detailed config (debug mode)
curl https://advisorhub.com/functions/v1/feature-flags?debug=true
```

### Clear Intent Cache

The intent cache is in-memory and clears automatically. To force clear:

1. Restart the edge function:
   ```bash
   npx supabase functions deploy agent-chat
   ```

2. Or wait for natural expiration (5 minutes TTL)

### Check Metrics

Access Grafana dashboards:
- Overview: `https://grafana.advisorhub.com/d/mira-overview`
- Performance: `https://grafana.advisorhub.com/d/mira-performance`
- Classification: `https://grafana.advisorhub.com/d/mira-classification`

---

## Incident Response

### On-Call Rotation & Escalation

| Role | Schedule | Contact |
|------|----------|---------|
| Primary (AI Squad) | Weekly rotation | PagerDuty schedule `MIRA-AI-SQUAD`, Slack `@mira-ai-oncall` |
| Secondary (Platform) | Weekly rotation | PagerDuty schedule `PLATFORM-EDGE`, Slack `@platform-oncall` |
| Management escalation | Engineering Manager → Product Director | PagerDuty manual escalate + Slack DM |

**Escalation flow**
1. PagerDuty alert fires → primary acknowledges within **5 minutes**.
2. If no ack, PagerDuty auto-pages secondary.
3. Secondary may escalate to EM/Product Director for P0/P1 incidents via PagerDuty override and `#mira-incidents`.

### Severity Levels

- **P0 (Critical)**: Complete outage, >50% error rate, data loss risk
- **P1 (High)**: Degraded performance, >10% error rate, major feature broken
- **P2 (Medium)**: Minor feature broken, <10% error rate
- **P3 (Low)**: Cosmetic issues, enhancement requests

### Response Procedures

#### P0 - Critical Incident

1. **Immediate Actions** (< 5 min)
   - Acknowledge alert in PagerDuty
   - Post in #mira-incidents Slack channel
   - Check Grafana for system status
   - Check Supabase status page

2. **Assessment** (< 10 min)
   - Identify affected components
   - Estimate impact (% of users affected)
   - Check recent deployments
   - Review error logs

3. **Mitigation** (< 30 min)
   - If recent deployment: Rollback immediately
   - If OpenAI API issue: Check API status, verify key
   - If database issue: Check connection pool, query performance
   - If high traffic: Scale edge functions

4. **Communication**
   - Post status update every 15 minutes
   - Notify stakeholders if customer-facing impact
   - Update status page if applicable

5. **Resolution**
   - Implement fix
   - Deploy to staging → production
   - Monitor for 30 minutes
   - Close incident

6. **Post-Mortem** (within 48 hours)
   - Root cause analysis
   - Timeline documentation
   - Action items to prevent recurrence

#### P1 - High Severity

1. Follow P0 procedures but with relaxed timelines (15/30/60 min)
2. Escalate to P0 if impact increases

#### P2/P3 - Medium/Low Severity

1. Create Jira ticket
2. Assign to appropriate team
3. Fix in next sprint

---

## Troubleshooting Guides

### Common Issues & Resolutions

| Issue | Symptoms | Investigation | Resolution |
|-------|----------|---------------|------------|
| Intent misclassification | Advisors complain Mira “doesn’t understand” or wrong module triggered | Inspect `mira_intent_logs` for low confidence, check Grafana “Misclassification by Module” | Add examples to `docs/mira_topics.json`, run `npm run test:unit -- router.intent-accuracy`, redeploy `agent-chat` |
| Action execution failure | Toast shows success but UI/API doesn’t change | Compare `mira_action_attempt_total` vs `mira_action_error_total`, inspect tool logs under `supabase/functions/_shared/services/tools` | Confirm downstream APIs, ensure confirmation dialog ran, update tool handler + redeploy `agent-tools` |
| High latency | p95 > 3s, streaming stalls | Grafana “Response Latency” + OpenAI status, check Supabase query logs | Fail over to cached intents, switch `MIRA_PRIMARY_MODEL` env var, scale Supabase pool, optimize slow queries |
| LLM provider outage | All requests 5xx with provider error | Vendor status page, Grafana “LLM provider usage” (flatline) | Flip feature flag to secondary provider, disable streaming temporarily, notify advisors via in-app banner |

### Alert: High Error Rate (> 5%)

**Symptoms**: Error rate exceeds 5% for 5+ minutes

**Investigation Steps**:

1. **Check recent deployments**
   ```bash
   # View recent function deployments
   npx supabase functions list
   ```

2. **Check error logs**
   ```bash
   npx supabase functions logs agent-chat --filter "error" | tail -100
   ```

3. **Check OpenAI API status**
   - Visit https://status.openai.com
   - Check API key validity
   - Verify rate limits not exceeded

4. **Check database health**
   ```sql
   -- Check active connections
   SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

   -- Check slow queries
   SELECT query, query_start, state
   FROM pg_stat_activity
   WHERE state != 'idle'
   AND query_start < NOW() - INTERVAL '5 seconds';
   ```

**Common Causes**:
- OpenAI API outage or rate limit
- Database connection exhaustion
- Recent bad deployment
- Invalid input causing validation errors

**Resolution**:
- If OpenAI: Wait for recovery or switch to fallback
- If database: Restart connections, check indexes
- If deployment: Rollback to previous version
- If validation: Review recent input patterns

---

### Alert: High Latency (p95 > 3s)

**Symptoms**: 95th percentile latency exceeds 3 seconds

**Investigation Steps**:

1. **Check OpenAI API latency**
   ```bash
   # Review logs for slow OpenAI calls
   grep "openai_api_duration" logs/*.log | sort -n
   ```

2. **Check database query performance**
   ```sql
   -- Top 10 slowest queries
   SELECT query, mean_exec_time, calls
   FROM pg_stat_statements
   ORDER BY mean_exec_time DESC
   LIMIT 10;
   ```

3. **Check cache hit rate**
   - Navigate to Grafana caching dashboard
   - If hit rate < 30%, cache may need tuning

4. **Check network latency**
   ```bash
   # Ping OpenAI API
   curl -w "@curl-format.txt" -o /dev/null -s https://api.openai.com/v1/models
   ```

**Common Causes**:
- OpenAI API slow responses
- Missing database indexes
- Low cache hit rate
- Network issues

**Resolution**:
- Add missing indexes (see Database Operations)
- Increase cache TTL if hit rate low
- Scale edge function instances
- Optimize intent router prompts (reduce tokens)

---

### Alert: Low Confidence Spike (> 30%)

**Symptoms**: >30% of classifications have low confidence (<0.6)

**Investigation Steps**:

1. **Review recent classifications**
   ```sql
   SELECT
     metadata->>'intent' as intent,
     metadata->>'confidence' as confidence,
     metadata->>'user_message' as message
   FROM mira_telemetry
   WHERE event_name = 'mira.agent.intent.classified'
     AND (metadata->>'confidence')::float < 0.6
     AND timestamp > NOW() - INTERVAL '1 hour'
   ORDER BY timestamp DESC
   LIMIT 50;
   ```

2. **Check for ambiguous patterns**
   - Are messages genuinely ambiguous?
   - Are there new user behavior patterns?
   - Were prompts recently changed?

3. **Review clarification rate**
   ```sql
   SELECT COUNT(*)
   FROM mira_telemetry
   WHERE event_name = 'mira.agent.intent.clarification_requested'
     AND timestamp > NOW() - INTERVAL '1 hour';
   ```

**Common Causes**:
- Users asking ambiguous questions
- New domains/intents not covered by router
- Recent prompt changes degrading classification
- Context information missing

**Resolution**:
- Add training examples to intent router prompts
- Create new intents for common patterns
- Improve clarification messages
- Add more context to pageData

---

### Alert: OpenAI API Failures

**Symptoms**: OpenAI API error rate > 0.1/sec

**Investigation Steps**:

1. **Check OpenAI status**
   - https://status.openai.com

2. **Check API key**
   ```bash
   # Verify key is set
   echo $OPENAI_API_KEY | head -c 10

   # Test key validity
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```

3. **Check rate limits**
   - Review OpenAI dashboard for quota usage
   - Check for 429 errors in logs

4. **Check error types**
   ```bash
   grep "openai.*error" logs/*.log | \
     awk '{print $NF}' | sort | uniq -c | sort -rn
   ```

**Common Causes**:
- OpenAI service outage
- API key expired or invalid
- Rate limit exceeded
- Model deprecated or unavailable

**Resolution**:
- If outage: Enable fallback mode, notify users
- If key issue: Rotate API key
- If rate limit: Increase quota or reduce traffic
- If model issue: Update to supported model

---

### Alert: Rate Limit Exceeded Frequently

**Symptoms**: >0.5 advisors/sec hitting rate limits

**Investigation Steps**:

1. **Identify top consumers**
   ```sql
   SELECT
     metadata->>'advisorId' as advisor_id,
     COUNT(*) as rate_limit_hits
   FROM mira_telemetry
   WHERE event_name = 'mira.agent.rate_limit.exceeded'
     AND timestamp > NOW() - INTERVAL '1 hour'
   GROUP BY advisor_id
   ORDER BY rate_limit_hits DESC
   LIMIT 10;
   ```

2. **Check for abuse patterns**
   - Are these legitimate users?
   - Are they using automation/bots?
   - Is there a runaway process?

3. **Review rate limit settings**
   - Current: 60 requests/min per advisor
   - Consider adjusting based on usage patterns

**Common Causes**:
- Legitimate power users
- Frontend bug causing request loops
- Automated scripts/bots
- Rate limit too aggressive

**Resolution**:
- If legitimate: Increase limit for specific advisors
- If bug: Fix frontend, clear cache
- If abuse: Block advisor, investigate
- If too aggressive: Increase global limit

---

## Feature Flag Management

| Flag | Purpose | Default | Notes |
|------|---------|---------|-------|
| `MIRA_COPILOT_ENABLED` | Master kill switch | false | Disable to fall back to legacy chat |
| `MIRA_MODE_COMMAND_ENABLED` | Allow command mode | true | Toggle per tenant if needed |
| `MIRA_MODE_COPILOT_ENABLED` | Allow inline suggestions | true | Good for staged rollouts |
| `MIRA_MODE_INSIGHT_ENABLED` | Enable insights feed | false | Keep off until dashboards monitored |
| `MIRA_<MODULE>_AGENT_ENABLED` | Enable specific agents (customer, broadcast, etc.) | false | Turn on per module once data ready |
| `MIRA_ROUTER_CACHE_ENABLED` | Intent cache toggle | true | Disable when debugging routing |

### Viewing Current Flags

```bash
# All flags
curl https://advisorhub.com/functions/v1/feature-flags?debug=true

# Specific advisor
curl https://advisorhub.com/functions/v1/feature-flags?advisorId=<uuid>&debug=true
```

### Enabling/Disabling Features

Feature flags are controlled via environment variables:

```bash
# Format: MIRA_FF_[FLAG_NAME]=[true|false|percentage]

# Enable for all users
export MIRA_FF_MIRA_COPILOT_ENABLED=true

# Disable for all users
export MIRA_FF_MIRA_COPILOT_ENABLED=false

# Enable for 50% of users (gradual rollout)
export MIRA_FF_MIRA_COPILOT_ENABLED=50

# Disable specific agent
export MIRA_FF_MIRA_AGENT_BROADCAST=false
```

After changing environment variables, redeploy:

```bash
npx supabase functions deploy agent-chat
```

### Gradual Rollout Procedure

**Scenario**: Rolling out new Broadcast Agent to production

1. **Start with 10% rollout**
   ```bash
   export MIRA_FF_MIRA_AGENT_BROADCAST=10
   npx supabase functions deploy agent-chat
   ```

2. **Monitor for 24 hours**
   - Check error rate
   - Review user feedback
   - Monitor latency impact

3. **Increase to 25%**
   ```bash
   export MIRA_FF_MIRA_AGENT_BROADCAST=25
   npx supabase functions deploy agent-chat
   ```

4. **Monitor for 48 hours**

5. **Increase to 50%**
   ```bash
   export MIRA_FF_MIRA_AGENT_BROADCAST=50
   npx supabase functions deploy agent-chat
   ```

6. **Monitor for 72 hours**

7. **Full rollout (100%)**
   ```bash
   export MIRA_FF_MIRA_AGENT_BROADCAST=100
   npx supabase functions deploy agent-chat
   ```

### Emergency Kill Switch

To immediately disable MIRA for all users:

```bash
export MIRA_FF_MIRA_COPILOT_ENABLED=false
npx supabase functions deploy agent-chat
```

### Tenant / Advisor Overrides

- Add overrides in `supabase/functions/_shared/services/feature-flags.ts` under `ADVISOR_OVERRIDES`.
- Redeploy `feature-flags` and `agent-chat` so both share the same config.
- Document overrides in the implementation plan (Phase 7 section) and notify `#mira-platform` with expected impact + rollback plan.

---

## Performance Tuning

### Optimizing Intent Cache

**Current Settings**:
- TTL: 5 minutes
- Max size: 1000 entries
- Eviction: FIFO

**Tuning**:

Edit `supabase/functions/_shared/services/router/intent-cache.ts`:

```typescript
// Increase TTL for more caching
const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Increase max size for higher hit rate
const DEFAULT_MAX_SIZE = 5000;
```

**When to tune**:
- If cache hit rate < 30%
- If high latency on repeated queries
- If OpenAI token usage too high

### Database Index Optimization

**Check missing indexes**:

```sql
SELECT
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
  AND n_distinct > 100
ORDER BY n_distinct DESC;
```

**Add recommended indexes** (already created in migration):

```sql
-- See: supabase/migrations/20251113_create_performance_indexes.sql
```

### Reducing Token Usage

**Optimize prompts** in `intent-router.ts`:

1. Reduce system prompt verbosity
2. Use fewer examples
3. Limit context size in pageData

**Monitor token usage**:

```sql
SELECT
  DATE_TRUNC('hour', timestamp) as hour,
  SUM((metadata->>'tokensUsed')::int) as total_tokens
FROM mira_telemetry
WHERE event_name LIKE '%openai%'
  AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour;
```

---

## Deployment Procedures

### Pre-Deployment Checklist

- [ ] All tests passing (unit, integration, E2E)
- [ ] Code review approved
- [ ] Feature flags configured for gradual rollout
- [ ] Runbook updated if needed
- [ ] Monitoring dashboards reviewed
- [ ] Rollback plan documented

### Deployment Steps

1. **Deploy to Staging**
   ```bash
   # Set staging environment
   npx supabase link --project-ref staging-project-id

   # Deploy functions
   npx supabase functions deploy agent-chat
   npx supabase functions deploy feature-flags

   # Run smoke tests
   npm run test:e2e:staging
   ```

2. **Verify Staging**
   - Test all 3 modes (Command, Copilot, Insight)
   - Test all 7 agents
   - Verify feature flags working
   - Check metrics dashboards

3. **Deploy to Production**
   ```bash
   # Switch to production
   npx supabase link --project-ref prod-project-id

   # Deploy with feature flags (start at 10%)
   export MIRA_FF_NEW_FEATURE=10
   npx supabase functions deploy agent-chat
   ```

4. **Monitor Deployment**
   - Watch Grafana for 15 minutes
   - Check error rate, latency, confidence
   - Review real-time logs

5. **Gradual Rollout**
   - Follow gradual rollout procedure (see Feature Flags section)
   - Increase percentage over days/weeks

### Rollback Procedure

**Quick Rollback** (if immediate issues detected):

```bash
# Revert to previous function version
npx supabase functions deploy agent-chat --no-verify-jwt

# Or disable via feature flag
export MIRA_FF_MIRA_COPILOT_ENABLED=false
npx supabase functions deploy agent-chat
```

**Database Rollback** (if migration issues):

```bash
# List migrations
npx supabase migration list

# Rollback to specific migration
npx supabase migration repair <timestamp>
```

---

## Database Operations

### Running Migrations

```bash
# Create new migration
npx supabase migration new <name>

# Apply migrations locally
npx supabase migration up

# Apply to production
npx supabase db push
```

### Backup and Restore

```bash
# Create backup
npx supabase db dump -f backup.sql

# Restore from backup
npx supabase db restore backup.sql
```

### Performance Queries

**Check table sizes**:

```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

**Check index usage**:

```sql
SELECT
  indexrelname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY idx_scan;
```

---

## Monitoring & Alerts

### Key Metrics to Watch

**Health Metrics**:
- Request rate (req/sec)
- Error rate (%)
- P50, P95, P99 latency (seconds)
- Availability (%)

**Business Metrics**:
- Active advisors (daily/monthly)
- Adoption rate (%)
- Top intents usage
- Mode distribution (Command/Copilot/Insight)

**AI Metrics**:
- Classification confidence distribution
- Clarification rate (%)
- Cache hit rate (%)
- OpenAI token usage

### Alert Response Times

- **Critical** (P0): Acknowledge < 5 min, resolve < 30 min
- **Warning** (P1): Acknowledge < 15 min, resolve < 2 hours
- **Info** (P2): Review within 24 hours

### Escalation Path

1. On-call engineer (PagerDuty)
2. Platform team lead
3. Engineering manager
4. CTO (for P0 only)

---

## Contact Information

- **Slack Channels**:
  - #mira-platform (general questions)
  - #mira-incidents (active incidents)
  - #mira-ai (AI/ML questions)

- **PagerDuty**: MIRA Co-Pilot Service

- **Documentation**:
  - Implementation Plan: `/docs/MIRA_CONSOLIDATED_IMPLEMENTATION_PLAN.md`
  - Monitoring Setup: `/docs/monitoring/MONITORING_SETUP.md`
  - User Guide: `/docs/MIRA_COPILOT_USER_GUIDE.md`

---

**End of Runbook**

*This document should be updated after each major incident or system change.*
