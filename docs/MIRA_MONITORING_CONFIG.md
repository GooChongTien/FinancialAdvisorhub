# Mira Co-Pilot Monitoring Configuration

## Overview

This document provides configuration for monitoring Mira AI Assistant in production. It includes Grafana dashboards, alerts, and SLA definitions.

## Grafana Dashboards

### Dashboard 1: Intent Classification Accuracy

**Purpose:** Monitor the accuracy and confidence of intent classification

**Metrics:**
- Intent classification accuracy (% of intents classified correctly)
- Confidence score distribution (histogram)
- Top 10 intents by frequency (bar chart)
- Misclassification rate by module (heatmap)

**Queries:**
```sql
-- Intent Classification Accuracy (last 24h)
SELECT
  COUNT(*) FILTER (WHERE confidence >= 0.8) * 100.0 / COUNT(*) as accuracy_percentage
FROM mira_intent_logs
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- Confidence Distribution
SELECT
  CASE
    WHEN confidence >= 0.9 THEN 'Very High (0.9-1.0)'
    WHEN confidence >= 0.8 THEN 'High (0.8-0.9)'
    WHEN confidence >= 0.6 THEN 'Medium (0.6-0.8)'
    ELSE 'Low (<0.6)'
  END as confidence_tier,
  COUNT(*) as count
FROM mira_intent_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY confidence_tier
ORDER BY MIN(confidence) DESC;

-- Top 10 Intents
SELECT
  intent,
  COUNT(*) as frequency,
  AVG(confidence) as avg_confidence
FROM mira_intent_logs
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY intent
ORDER BY frequency DESC
LIMIT 10;

-- Misclassification by Module
SELECT
  module,
  COUNT(*) FILTER (WHERE confidence < 0.6) * 100.0 / COUNT(*) as misclassification_rate
FROM mira_intent_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY module
ORDER BY misclassification_rate DESC;
```

**Grafana Panel Config:**
```json
{
  "dashboard": {
    "title": "Mira Intent Classification",
    "panels": [
      {
        "title": "Overall Accuracy (24h)",
        "type": "stat",
        "targets": [{ "query": "...", "refId": "A" }],
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "thresholds": {
              "mode": "absolute",
              "steps": [
                { "value": 0, "color": "red" },
                { "value": 80, "color": "yellow" },
                { "value": 90, "color": "green" }
              ]
            }
          }
        }
      }
    ]
  }
}
```

---

### Dashboard 2: Action Execution Success Rate

**Purpose:** Monitor UI action execution reliability

**Metrics:**
- Action execution success rate (%)
- Action execution by type (navigate, prefill, execute)
- Top 10 failing actions (table)
- Error rate over time (time series)

**Queries:**
```sql
-- Success Rate (last 24h)
SELECT
  COUNT(*) FILTER (WHERE success = true) * 100.0 / COUNT(*) as success_rate
FROM mira_events
WHERE event_type = 'action_execution'
  AND created_at >= NOW() - INTERVAL '24 hours';

-- Actions by Type
SELECT
  action_type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE success = true) as successful,
  COUNT(*) FILTER (WHERE success = false) as failed
FROM mira_events
WHERE event_type = 'action_execution'
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY action_type;

-- Top Failing Actions
SELECT
  action_type,
  module,
  error_message,
  COUNT(*) as failure_count
FROM mira_events
WHERE event_type = 'action_execution'
  AND success = false
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY action_type, module, error_message
ORDER BY failure_count DESC
LIMIT 10;

-- Error Rate Over Time (hourly)
SELECT
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) FILTER (WHERE success = false) * 100.0 / COUNT(*) as error_rate
FROM mira_events
WHERE event_type = 'action_execution'
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour;
```

---

### Dashboard 3: Mode Usage Distribution

**Purpose:** Track how users interact with different Mira modes

**Metrics:**
- Mode usage by count (pie chart: command, copilot, insight)
- Time spent in each mode (bar chart)
- Mode switches per session (histogram)
- Most popular suggestions/insights (table)

**Queries:**
```sql
-- Mode Usage Distribution
SELECT
  mode,
  COUNT(*) as sessions
FROM mira_conversations
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY mode;

-- Average Time per Mode
SELECT
  mode,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) / 60 as avg_minutes
FROM mira_conversations
WHERE created_at >= NOW() - INTERVAL '7 days'
  AND updated_at IS NOT NULL
GROUP BY mode;

-- Mode Switches per Session
SELECT
  conversation_id,
  COUNT(DISTINCT mode) as modes_used
FROM mira_events
WHERE event_type = 'mode_change'
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY conversation_id;
```

---

### Dashboard 4: Performance Metrics

**Purpose:** Monitor system performance and latency

**Metrics:**
- Response latency (p50, p95, p99) time series
- API error rate (%)
- LLM provider usage (OpenAI vs Anthropic)
- Database query latency (p95)
- Concurrent users (gauge)

**Queries:**
```sql
-- Response Latency Percentiles
SELECT
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY latency_ms) as p50,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) as p95,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY latency_ms) as p99
FROM mira_events
WHERE event_type = 'agent_response'
  AND created_at >= NOW() - INTERVAL '1 hour';

-- Error Rate
SELECT
  COUNT(*) FILTER (WHERE error IS NOT NULL) * 100.0 / COUNT(*) as error_rate
FROM mira_events
WHERE created_at >= NOW() - INTERVAL '1 hour';

-- LLM Provider Usage
SELECT
  provider,
  COUNT(*) as requests,
  AVG(tokens_used) as avg_tokens
FROM mira_events
WHERE event_type = 'llm_request'
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY provider;
```

---

## Alerts Configuration

### Alert 1: Low Confidence Spike

**Condition:** > 20% of requests have confidence < 0.5 in 5-minute window

**Query:**
```sql
SELECT
  COUNT(*) FILTER (WHERE confidence < 0.5) * 100.0 / COUNT(*) as low_confidence_rate
FROM mira_intent_logs
WHERE created_at >= NOW() - INTERVAL '5 minutes';
```

**Threshold:** `low_confidence_rate > 20`

**Severity:** Warning

**Action:** Notify AI Squad Lead via Slack `#mira-copilot-alerts`

**Message:**
```
⚠️ Mira Low Confidence Alert

{{ low_confidence_rate }}% of intents in last 5 minutes had confidence < 0.5

Threshold: 20%
Current: {{ low_confidence_rate }}%

Action Required:
- Review recent user queries in logs
- Check if intent catalog needs updates
- Verify LLM provider health
```

---

### Alert 2: High Action Failure Rate

**Condition:** > 5% action execution failures in 10-minute window

**Query:**
```sql
SELECT
  COUNT(*) FILTER (WHERE success = false) * 100.0 / COUNT(*) as failure_rate
FROM mira_events
WHERE event_type = 'action_execution'
  AND created_at >= NOW() - INTERVAL '10 minutes';
```

**Threshold:** `failure_rate > 5`

**Severity:** Critical

**Action:** Page on-call engineer via PagerDuty

**Runbook:** See `MIRA_AGENT_RUNBOOK.md` → "High Action Failure Rate"

---

### Alert 3: High API Latency

**Condition:** p95 response latency > 3 seconds in 5-minute window

**Query:**
```sql
SELECT
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) as p95_latency
FROM mira_events
WHERE event_type = 'agent_response'
  AND created_at >= NOW() - INTERVAL '5 minutes';
```

**Threshold:** `p95_latency > 3000`

**Severity:** Warning

**Action:** Notify backend team via Slack

---

### Alert 4: LLM Provider Down

**Condition:** All LLM requests failing

**Query:**
```sql
SELECT
  COUNT(*) FILTER (WHERE error IS NOT NULL) as error_count,
  COUNT(*) as total_count
FROM mira_events
WHERE event_type = 'llm_request'
  AND created_at >= NOW() - INTERVAL '2 minutes';
```

**Threshold:** `error_count = total_count AND total_count > 0`

**Severity:** Critical

**Action:**
1. Page on-call engineer
2. Auto-trigger fallback to secondary LLM provider
3. Post incident in `#incidents` channel

---

## SLA Definitions

### Availability SLA

**Target:** 99.5% uptime (monthly)

**Measurement:**
- Successful requests / Total requests
- Excludes: Scheduled maintenance, client errors (4xx)

**Monitoring:**
```sql
-- Monthly Availability
SELECT
  (COUNT(*) FILTER (WHERE status_code < 500) * 100.0 / COUNT(*)) as availability
FROM mira_request_logs
WHERE created_at >= DATE_TRUNC('month', NOW());
```

---

### Response Latency SLA

**Target:** p95 < 2.5 seconds

**Measurement:**
- Time from request received to response completed
- Measured at edge function level

**Monitoring:**
```sql
-- P95 Latency (last 24h)
SELECT
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) / 1000.0 as p95_seconds
FROM mira_events
WHERE event_type = 'agent_response'
  AND created_at >= NOW() - INTERVAL '24 hours';
```

---

### Intent Accuracy SLA

**Target:** ≥ 90% accuracy

**Measurement:**
- Intents with confidence ≥ 0.8 / Total intents
- Based on automated confidence scoring

**Monitoring:**
```sql
-- Intent Accuracy (last 7 days)
SELECT
  COUNT(*) FILTER (WHERE confidence >= 0.8) * 100.0 / COUNT(*) as accuracy
FROM mira_intent_logs
WHERE created_at >= NOW() - INTERVAL '7 days';
```

---

## Logging Configuration

### Log Levels

- **ERROR:** System errors, failed operations
- **WARN:** Degraded performance, low confidence
- **INFO:** Normal operations, successful requests
- **DEBUG:** Detailed traces (disabled in production)

### Log Retention

- **mira_intent_logs:** 90 days
- **mira_events:** 90 days
- **mira_conversations:** 1 year
- **Application logs:** 30 days

### Log Sampling

- **Sample Rate:** 10% for INFO logs
- **Always Log:** ERROR, WARN, confidence < 0.5

---

## Runbook Links

- **High Action Failure Rate:** See `MIRA_AGENT_RUNBOOK.md` § 3.2
- **Low Confidence Issues:** See `MIRA_AGENT_RUNBOOK.md` § 3.1
- **Database Performance:** See `MIRA_AGENT_RUNBOOK.md` § 3.3
- **LLM Provider Issues:** See `MIRA_AGENT_RUNBOOK.md` § 3.4

---

## Contact Information

**Primary On-Call:** AI Squad (rotate weekly)
**Secondary:** Backend Team
**Escalation:** Engineering Manager

**Channels:**
- Alerts: `#mira-copilot-alerts`
- Incidents: `#incidents`
- General: `#mira-copilot`
