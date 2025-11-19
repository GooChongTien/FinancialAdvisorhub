# MIRA Co-Pilot Monitoring Setup Guide

This guide covers setting up monitoring and alerting for MIRA Co-Pilot in production.

## Overview

MIRA Co-Pilot monitoring consists of:
- **Metrics Collection**: Prometheus/Grafana metrics
- **Log Aggregation**: Centralized logging (Supabase logs, CloudWatch, etc.)
- **Alerting**: Real-time alerts for critical issues
- **Dashboards**: Visual monitoring and debugging

## Metrics Collection

### Prometheus Metrics

MIRA emits the following metric types:

#### Request Metrics
```
mira_agent_requests_total{mode, module, agent}
mira_agent_request_duration_seconds{mode, module}
mira_agent_errors_total{error_type, agent}
```

#### Intent Classification Metrics
```
mira_intent_classifications_total{confidence_tier, topic, intent}
mira_intent_clarifications_total{reason}
mira_intent_cache_hits_total
mira_intent_cache_misses_total
```

#### Agent Performance Metrics
```
mira_agent_execution_duration_seconds{agent, intent}
mira_agent_execution_errors_total{agent, error_type}
mira_ui_actions_total{action_type}
mira_ui_actions_failed_total{action_type, reason}
```

#### Security Metrics
```
mira_rate_limit_exceeded_total{identifier_type}
mira_validation_errors_total{validation_type}
mira_validation_warnings_total{warning_type}
```

#### External Dependencies
```
mira_openai_api_calls_total{model, status}
mira_openai_api_errors_total{error_type}
mira_openai_tokens_used_total{model}
mira_openai_api_duration_seconds{model}
```

### Instrumentation

Metrics are emitted via the telemetry service in `supabase/functions/_shared/services/telemetry.ts`.

To add new metrics:

```typescript
import { logAgentEvent } from '../services/agent/logger.ts';

// Increment counter
await logAgentEvent('mira.agent.my_metric.increment', {
  label1: 'value1',
  label2: 'value2'
});

// Track duration
const startTime = Date.now();
// ... operation ...
const duration = Date.now() - startTime;
await logAgentEvent('mira.agent.my_operation.duration', {
  duration_ms: duration
});
```

## Alert Configuration

### Setup AlertManager

1. **Install AlertManager**
   ```bash
   # Using Docker
   docker run -d -p 9093:9093 \
     -v /path/to/mira-alerts.yaml:/etc/alertmanager/config.yml \
     prom/alertmanager
   ```

2. **Configure Notification Channels**

   Edit `docs/monitoring/mira-alerts.yaml` and set environment variables:
   ```bash
   export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
   export PAGERDUTY_SERVICE_KEY="your-pagerduty-key"
   export SMTP_USERNAME="alerts@advisorhub.com"
   export SMTP_PASSWORD="your-smtp-password"
   ```

3. **Test Alerts**
   ```bash
   # Send test alert
   curl -X POST http://localhost:9093/api/v1/alerts -d '[{
     "labels": {
       "alertname": "TestAlert",
       "severity": "info"
     },
     "annotations": {
       "summary": "Test alert"
     }
   }]'
   ```

### Critical Alerts to Monitor

1. **High Error Rate** (> 5%)
   - Check: Recent deployments, OpenAI API status, database health
   - Runbook: `/docs/runbooks/mira-high-error-rate.md`

2. **High Latency** (p95 > 3s)
   - Check: Database query performance, OpenAI API latency, network issues
   - Runbook: `/docs/runbooks/mira-high-latency.md`

3. **OpenAI API Failures**
   - Check: API key validity, rate limits, service status
   - Runbook: `/docs/runbooks/mira-openai-failures.md`

4. **Low Confidence Spike** (> 30%)
   - Check: Intent router configuration, recent prompt changes
   - Runbook: `/docs/runbooks/mira-low-confidence.md`

## Grafana Dashboard Setup

### Import Dashboards

1. **Navigate to Grafana**
   - Open Grafana UI
   - Go to Dashboards → Import

2. **Import Dashboard JSON**
   - Copy content from `docs/monitoring/grafana-dashboard-overview.json`
   - Paste into import dialog
   - Select Prometheus data source
   - Click "Import"

3. **Available Dashboards**
   - **Overview**: `grafana-dashboard-overview.json`
   - High-level metrics, request rates, error rates
   - **Performance**: Custom dashboard for latency analysis
   - **Classification**: Intent routing and confidence metrics
   - **Agents**: Per-agent performance breakdown

### Dashboard URLs

Once imported, dashboards will be available at:
- Overview: `https://grafana.advisorhub.com/d/mira-overview`
- Performance: `https://grafana.advisorhub.com/d/mira-performance`
- Classification: `https://grafana.advisorhub.com/d/mira-classification`
- Agents: `https://grafana.advisorhub.com/d/mira-agents`

## Log Aggregation

### Supabase Edge Functions Logs

MIRA logs are available via Supabase CLI:

```bash
# View real-time logs
supabase functions serve --debug

# View logs for specific function
npx supabase functions logs agent-chat

# View logs with filters
npx supabase functions logs agent-chat --filter "error"
```

### Log Levels

```
INFO:  Normal operations, intent classifications
WARN:  Validation warnings, low confidence, clarifications
ERROR: API failures, execution errors, exceptions
```

### Key Log Events

Search for these events in logs:

- `mira.agent.request.received` - All incoming requests
- `mira.agent.intent.classified` - Intent classification results
- `mira.agent.validation.message_blocked` - Security blocks
- `mira.agent.rate_limit.exceeded` - Rate limiting
- `mira.agent.*.error` - All error events

### Log Queries

#### High Error Rate Investigation
```sql
SELECT
  timestamp,
  metadata->>'intent' as intent,
  metadata->>'error_type' as error_type,
  metadata->>'agent' as agent
FROM mira_telemetry
WHERE event_name LIKE '%.error'
  AND timestamp > NOW() - INTERVAL '1 hour'
ORDER BY timestamp DESC
LIMIT 100;
```

#### Low Confidence Analysis
```sql
SELECT
  metadata->>'intent' as intent,
  metadata->>'confidence' as confidence,
  COUNT(*) as count
FROM mira_telemetry
WHERE event_name = 'mira.agent.intent.classified'
  AND (metadata->>'confidence')::float < 0.6
  AND timestamp > NOW() - INTERVAL '1 day'
GROUP BY intent, confidence
ORDER BY count DESC;
```

## Feature Flag Monitoring

Monitor feature flag usage:

```bash
# Get current flag status
curl https://advisorhub.com/functions/v1/feature-flags?debug=true

# Monitor flag changes in logs
grep "mira.feature_flag" logs/*.log
```

## Health Checks

### Endpoint Health
```bash
# Check agent-chat endpoint
curl -X POST https://advisorhub.com/functions/v1/agent-chat \
  -H "Content-Type: application/json" \
  -d '{"mode":"health"}'
```

### Expected Response
```json
{
  "status": "ok"  // or "degraded" if OpenAI API key missing
}
```

### Monitoring Checklist

Daily:
- [ ] Review error rate trends
- [ ] Check latency percentiles
- [ ] Review low confidence classifications
- [ ] Check OpenAI token usage

Weekly:
- [ ] Review adoption metrics
- [ ] Analyze top intents
- [ ] Review UI action success rates
- [ ] Check cache hit rates

Monthly:
- [ ] Review alert thresholds
- [ ] Update runbooks with new learnings
- [ ] Analyze cost trends (OpenAI tokens)
- [ ] Review feature flag rollouts

## Troubleshooting

### High Memory Usage
```bash
# Check Deno memory
deno run --v8-flags=--max-old-space-size=512 ...
```

### Slow Responses
1. Check OpenAI API latency
2. Review database query performance (check indexes)
3. Check intent cache hit rate
4. Review network latency

### Classification Issues
1. Review recent prompt changes
2. Check confidence distribution
3. Analyze clarification rate
4. Review agent selection logic

## Support Contacts

- **Platform Issues**: #mira-platform on Slack
- **AI/ML Issues**: #mira-ai on Slack
- **Security Issues**: security@advisorhub.com
- **PagerDuty**: Escalate critical alerts to on-call engineer

## References

- [MIRA Co-Pilot Runbook](../MIRA_COPILOT_RUNBOOK.md)
- [Alert Configuration](./mira-alerts.yaml)
- [Grafana Dashboards](./grafana-dashboard-overview.json)
- [Supabase Monitoring](https://supabase.com/docs/guides/platform/metrics)
