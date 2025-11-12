import { registerExecutor, unregisterExecutor } from "./executor.js";
import { getIntentSchema } from "./catalog.js";
import { adviseUAdminApi } from "@/admin/api/adviseUAdminApi";
import { createPageUrl } from "@/admin/utils";

const LEAD_CACHE_TTL_MS = 60_000;
let leadCache = { timestamp: 0, data: [] };

async function fetchLeadsWithCache(fetcher) {
  const now = Date.now();
  if (now - leadCache.timestamp < LEAD_CACHE_TTL_MS && leadCache.data.length) {
    return leadCache.data;
  }
  const leads = await fetcher();
  leadCache = { timestamp: now, data: leads ?? [] };
  return leadCache.data;
}

const DEFAULT_FETCH_LEADS = async () =>
  fetchLeadsWithCache(() => adviseUAdminApi.entities.Lead.list(200));
const DEFAULT_FETCH_PROPOSALS = async (leadId) =>
  adviseUAdminApi.entities.Proposal.filter({ lead_id: leadId });

let registrationCount = 0;
let activeExecutor = null;

function makeExecutor({ fetchLeads, fetchProposals, createDestination }) {
  return async (intent, environment = {}) => {
    const prompt =
      environment.event?.payload?.prompt ??
      intent?.context?.prompt ??
      "";
    const explicitLeadName =
      environment.event?.payload?.leadName ??
      intent?.context?.leadName ??
      extractLeadNameFromPrompt(prompt);

    if (!explicitLeadName) {
      return {
        status: "skipped",
        message: "Lead name could not be inferred from prompt.",
      };
    }

    const leadsSource =
      Array.isArray(environment.leadDirectory) &&
      environment.leadDirectory.length > 0
        ? environment.leadDirectory
        : await fetchLeads();
    const leads = Array.isArray(leadsSource) ? leadsSource : [];
    const match = matchLeadByName(leads, explicitLeadName);
    const matchedLead = match?.lead ?? null;

    if (!matchedLead) {
      return {
        status: "not_found",
        message: `No lead found matching "${explicitLeadName}".`,
        matchConfidence: match?.score ?? 0,
      };
    }

    const proposals = await fetchProposals(matchedLead.id);
    const proposal = proposals?.[0] ?? null;
    if (!proposal) {
      return {
        status: "not_found",
        message: `No proposal linked to ${matchedLead.name}.`,
        lead: { id: matchedLead.id, name: matchedLead.name },
        matchConfidence: match?.score ?? 0,
      };
    }

    const destination = createDestination(proposal.id);
    if (environment.navigate) {
      environment.navigate(destination);
    }

    return {
      status: "navigated",
      lead: {
        id: matchedLead.id,
        name: matchedLead.name,
      },
      proposal: {
        id: proposal.id,
        stage: proposal.stage,
        status: proposal.status,
      },
      matchConfidence: match?.score ?? 0,
      navigationUrl: destination,
    };
  };
}

export function registerLeadEnrichmentExecutor(options = {}) {
  registrationCount += 1;
  if (registrationCount === 1) {
    const executor = makeExecutor({
      fetchLeads: options.fetchLeads
        ? () => fetchLeadsWithCache(options.fetchLeads)
        : DEFAULT_FETCH_LEADS,
      fetchProposals: options.fetchProposals ?? DEFAULT_FETCH_PROPOSALS,
      createDestination:
        options.createDestination ??
        ((proposalId) => createPageUrl(`ProposalDetail?id=${proposalId}`)),
    });
    activeExecutor = executor;
    registerExecutor("lead.enrichment", executor);
  }

  return () => {
    registrationCount = Math.max(0, registrationCount - 1);
    if (registrationCount === 0 && activeExecutor) {
      unregisterExecutor("lead.enrichment");
      activeExecutor = null;
    }
  };
}

export function extractLeadNameFromPrompt(text) {
  if (!text) return null;
  const normalized = text.trim();

  const possessiveMatch = normalized.match(
    /search\s+([a-z\s]+?)(?:'s|\bproposal|\blead|\bstage|$)/i,
  );
  if (possessiveMatch && possessiveMatch[1]) {
    return titleCase(possessiveMatch[1].trim());
  }

  const genericMatch = normalized.match(/([a-z]+)\s*'s/i);
  if (genericMatch && genericMatch[1]) {
    return titleCase(genericMatch[1].trim());
  }

  const capitalized = normalized.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/);
  if (capitalized && capitalized[0]) {
    return capitalized[0].trim();
  }

  const words = normalized.split(/\s+/);
  return words.length > 0 ? titleCase(words[0]) : null;
}

export function detectLeadIntentFromPrompt(text) {
  if (!text) return "advisor.action.summary";
  const lc = text.toLowerCase();
  const looksLikeLeadSearch =
    lc.includes("proposal") &&
    (lc.includes("stage") || lc.includes("status") || lc.includes("progress"));
  const mentionsSearch =
    lc.includes("search") || lc.includes("find") || lc.includes("lookup");

  if (looksLikeLeadSearch || (mentionsSearch && lc.includes("'s"))) {
    return "lead.enrichment";
  }

  return "advisor.action.summary";
}

export function buildLeadIntent(prompt) {
  const schema = getIntentSchema("lead.enrichment");
  const leadName = extractLeadNameFromPrompt(prompt);
  if (!leadName) {
    return null;
  }
  return {
    name: "lead.enrichment",
    confidence: 0.8,
    schema,
    context: {
      leadName,
      prompt,
    },
  };
}

function titleCase(value) {
  return value
    .split(" ")
    .filter(Boolean)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join(" ");
}

function matchLeadByName(leads, candidate) {
  if (!candidate) return null;
  const target = candidate.toLowerCase();
  let best = null;
  for (const lead of Array.isArray(leads) ? leads : []) {
    const names = buildCandidateNames(lead);
    for (const name of names) {
      const score = scoreNameMatch(name, target);
      if (!best || score > best.score) {
        best = { lead, score, matchedName: name };
      }
    }
  }
  if (best && best.score >= 0.35) {
    return best;
  }
  return null;
}

function buildCandidateNames(lead) {
  const candidates = new Set();
  const push = (value) => {
    if (value) {
      candidates.add(String(value).trim().toLowerCase());
    }
  };

  push(lead?.name);
  push(lead?.preferred_name);
  push(lead?.nickname);
  push(lead?.display_name);
  push(lead?.first_name);

  const nameParts = String(lead?.name ?? "")
    .split(/\s+/)
    .filter(Boolean);
  nameParts.forEach((part) => push(part));

  if (lead?.email) {
    const local = String(lead.email).split("@")[0];
    push(local.replace(/[._]/g, " "));
  }

  return Array.from(candidates).filter(Boolean);
}

function scoreNameMatch(source, target) {
  if (!source || !target) return 0;
  if (source === target) return 1;
  if (source.startsWith(target) || target.startsWith(source)) return 0.85;
  if (source.includes(target) || target.includes(source)) return 0.75;

  const sourceTokens = source.split(/\s+/);
  const targetTokens = target.split(/\s+/);
  const sharedTokens = sourceTokens.filter((token) =>
    targetTokens.includes(token),
  );
  if (sharedTokens.length > 0) {
    return 0.65 + sharedTokens.length * 0.05;
  }

  const distance = levenshteinDistance(source, target);
  const maxLen = Math.max(source.length, target.length);
  const similarity = 1 - distance / Math.max(maxLen, 1);
  return similarity * 0.75;
}

function levenshteinDistance(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i += 1) dp[i][0] = i;
  for (let j = 0; j <= n; j += 1) dp[0][j] = j;

  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }

  return dp[m][n];
}
