import { registerExecutor, unregisterExecutor } from "./executor.js";
import { getIntentSchema } from "./catalog.js";
import { adviseUAdminApi } from "@/admin/api/adviseUAdminApi";
import { createPageUrl } from "@/admin/utils";

const DEFAULT_FETCH_LEADS = async () =>
  adviseUAdminApi.entities.Lead.list("-updated_at", 100);

let registrationCount = 0;
let activeExecutor = null;

function detectComplianceCandidates(leads = []) {
  const now = Date.now();
  return (leads ?? []).map((lead) => {
    const status = String(lead?.status ?? "").toLowerCase();
    const updated = lead?.updated_at ?? lead?.updated_date ?? null;
    const updatedTime = updated ? new Date(updated).getTime() : null;
    const ageDays =
      updatedTime && Number.isFinite(updatedTime)
        ? Math.round((now - updatedTime) / (1000 * 60 * 60 * 24))
        : null;
    const score =
      (status.includes("compliance") ? 0.6 : 0) +
      (status.includes("proposal") ? 0.3 : 0) +
      (ageDays && ageDays > 14 ? 0.2 : 0);
    return { lead, score, ageDays };
  });
}

function makeExecutor({ fetchLeads, createDestination }) {
  return async (intent, environment = {}) => {
    const leads =
      Array.isArray(environment.leadDirectory) && environment.leadDirectory.length > 0
        ? environment.leadDirectory
        : await fetchLeads();

    const candidates = detectComplianceCandidates(leads)
      .filter((candidate) => candidate.score > 0.4)
      .sort((a, b) => b.score - a.score);

    if (!candidates.length) {
      return {
        status: "clear",
        message: "No compliance alerts detected at the moment.",
      };
    }

    const destination =
      environment.createPageUrl?.("SmartPlan") ?? createDestination("SmartPlan");

    if (environment.navigate) {
      environment.navigate(destination);
    }

    return {
      status: "alert",
      alerts: candidates.slice(0, 5).map(({ lead, score, ageDays }) => ({
        id: lead.id,
        name: lead.name,
        status: lead.status,
        ageDays,
        confidence: score,
      })),
      navigationUrl: destination,
    };
  };
}

export function registerComplianceAlertExecutor(options = {}) {
  registrationCount += 1;
  if (registrationCount === 1) {
    const executor = makeExecutor({
      fetchLeads: options.fetchLeads ?? DEFAULT_FETCH_LEADS,
      createDestination:
        options.createDestination ??
        ((path) => createPageUrl(path)),
    });
    activeExecutor = executor;
    registerExecutor("compliance.alert", executor);
  }

  return () => {
    registrationCount = Math.max(0, registrationCount - 1);
    if (registrationCount === 0 && activeExecutor) {
      unregisterExecutor("compliance.alert");
      activeExecutor = null;
    }
  };
}

export function detectComplianceIntentFromPrompt(text) {
  if (!text) return false;
  const lc = text.toLowerCase();
  return (
    lc.includes("compliance") ||
    lc.includes("audit") ||
    lc.includes("suitability") ||
    lc.includes("policy breach")
  );
}

export function buildComplianceIntent(prompt) {
  const schema = getIntentSchema("compliance.alert");
  return {
    name: "compliance.alert",
    confidence: 0.75,
    schema,
    context: { prompt },
  };
}
