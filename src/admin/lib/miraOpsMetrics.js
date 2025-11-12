export const DEFAULT_ALERT_THRESHOLD = 0.05;
export const DEFAULT_MIN_ALERT_EVENTS = 20;

export function buildAlertState(events = [], threshold = DEFAULT_ALERT_THRESHOLD, minEvents = DEFAULT_MIN_ALERT_EVENTS) {
  const total = Array.isArray(events) ? events.length : 0;
  if (total === 0 || total < minEvents) {
    return { active: false, rate: 0, total };
  }
  const failures = events.filter((event) => event && event.success === false).length;
  const rate = failures / total;
  return {
    active: rate > threshold,
    rate,
    total,
  };
}

export function computeTopFailingActions(events = [], limit = 3) {
  if (!Array.isArray(events) || events.length === 0) return [];
  const failures = new Map();
  events.forEach((event) => {
    if (!event || event.success !== false) {
      return;
    }
    const actionName =
      event.actions?.[0]?.action_type ||
      event.skill_name ||
      event.metadata?.action_type ||
      "action";
    const entry = failures.get(actionName) || { action: actionName, failures: 0, lastFailureAt: null };
    entry.failures += 1;
    entry.lastFailureAt = event.created_at || entry.lastFailureAt;
    failures.set(actionName, entry);
  });
  return Array.from(failures.values()).sort((a, b) => b.failures - a.failures).slice(0, limit);
}

