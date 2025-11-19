# ADR-003: Custom Feature Flag Service for Mira Co-Pilot

- **Status:** Accepted – 2025-11-15
- **Context:** Phase 7 (Production Readiness)

## Context

Mira Co-Pilot requires gradual rollouts, per-module gating, and tenant/advisor overrides. Third-party flag providers (LaunchDarkly, ConfigCat) add latency and cost for every Supabase edge invocation, and we need deterministic hashing to keep the same advisor on the same treatment bucket.

## Decision

We built a lightweight feature flag service that runs inside the Supabase Edge runtime:

- **Flag registry:** `supabase/functions/_shared/services/feature-flags.ts` loads statically defined flags plus environment overrides (`MIRA_MODE_COMMAND_ENABLED`, etc.).
- **Consistent hashing:** Advisors are bucketed with murmurhash -> percentage comparison, ensuring sticky exposure when `rolloutPercentage` < 100.
- **Overrides:** Flags support allow/deny lists for tenants or specific advisor IDs.
- **API endpoint:** `supabase/functions/feature-flags/index.ts` exposes GET `/feature-flags?flag=MIRA_COPILOT_ENABLED` so frontend surfaces can probe flag status without shipping all logic to the client.
- **Telemetry hooks:** Every flag evaluation emits `mira.feature_flag.evaluated` events consumed by Grafana dashboards in `docs/monitoring/mira-alerts.yaml`.

## Consequences

- **Zero external latency:** Flag checks happen in-process, so routing decisions remain sub-50 ms.
- **Deterministic rollouts:** Advisors consistently stay in the same bucket during staged rollouts.
- **Operational ownership:** AI Squad can update environment variables for emergency disables without relying on third parties.
- **Maintenance:** New flags require code changes (schema + config). We documented the process in `docs/MIRA_COPILOT_RUNBOOK.md`.

## References

- Flag service: `supabase/functions/_shared/services/feature-flags.ts`
- REST endpoint: `supabase/functions/feature-flags/index.ts`
- Monitoring: `docs/monitoring/mira-alerts.yaml`
