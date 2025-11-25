// AdviseU Admin portal composite client that wraps Supabase queries.
import supabase from "./supabaseClient.js";
import { calculateCustomerTemperature } from "@/lib/customer-temperature";
import { miraChatApi } from "./miraChatApi.js";

const DEFAULT_PROFILE_ID = "advisor-001";

function resolveOverrideAdvisorId() {
  if (typeof process !== "undefined" && process?.env) {
    return process.env.E2E_ADVISOR_ID || process.env.DEFAULT_ADVISOR_ID || null;
  }
  return null;
}

async function currentUserId() {
  const override = resolveOverrideAdvisorId();
  try {
    const { data } = await supabase.auth.getUser();
    return data?.user?.id || override || DEFAULT_PROFILE_ID;
  } catch {
    return override || DEFAULT_PROFILE_ID;
  }
}

async function ensureProfileForUser() {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const uid = authData?.user?.id;
    const email = authData?.user?.email || "";
    if (!uid) return null;
    const found = await supabase.from("profiles").select("*").eq("id", uid).single();
    if (!found.error && found.data) return found.data;
    // Create minimal profile if missing
    const guessName = email ? String(email).split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()) : "Advisor";
    const insert = {
      id: uid,
      full_name: guessName,
      email,
      role: "Advisor",
      account_status: "Active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const created = await supabase.from("profiles").insert([insert]).select().single();
    return readSingle(created, "create missing profile");
  } catch (_) {
    return null;
  }
}

const COLUMN_ALIASES = {
  updated_date: "updated_at",
  updated_at: "updated_at",
  last_updated: "last_updated",
  created_date: "created_at",
  created_at: "created_at",
  last_contacted: "last_contacted",
  published_date: "published_date",
  proposal_number: "proposal_number",
  completion_percentage: "completion_percentage",
  premium_amount: "premium_amount",
  sum_assured: "sum_assured",
  coverage_amount: "coverage_amount",
  total_premium: "total_premium",
  linked_lead_id: "linked_lead_id",
  lead_id: "lead_id",
  date: "date",
  time: "time",
  changed_at: "changed_at",
};

function mapColumn(key) {
  return COLUMN_ALIASES[key] ?? key;
}

function ensureListArgs(orderOrLimit, limit) {
  if (typeof orderOrLimit === "number" && limit === undefined) {
    return { orderBy: undefined, limit: orderOrLimit };
  }
  return { orderBy: orderOrLimit, limit };
}

function parseOrder(order, fallback) {
  if (!order) {
    return fallback;
  }
  const ascending = !String(order).startsWith("-");
  const columnKey = ascending ? String(order) : String(order).slice(1);
  return {
    column: mapColumn(columnKey),
    ascending,
  };
}

function applyFilters(query, criteria = {}) {
  return Object.entries(criteria).reduce((acc, [key, value]) => {
    const column = mapColumn(key);
    if (value === undefined) {
      return acc;
    }
    if (Array.isArray(value)) {
      return acc.in(column, value);
    }
    if (value === null) {
      return acc.is(column, null);
    }
    return acc.eq(column, value);
  }, query);
}

function readData(response, context) {
  const { data, error } = response;
  if (error) {
    console.error(`[Supabase] ${context}`, error);
    throw new Error(error.message ?? `Failed to ${context}`);
  }
  return data ?? [];
}

function readSingle(response, context) {
  const { data, error } = response;
  if (error) {
    console.error(`[Supabase] ${context}`, error);
    throw new Error(error.message ?? `Failed to ${context}`);
  }
  return data;
}

function parseNumeric(value, fallback = 0) {
  if (value === null || value === undefined) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

async function recordLeadActivity(leadId, activityType = "activity", context = {}) {
  if (!leadId) return null;
  try {
    const now = new Date().toISOString();
    const temperature = calculateCustomerTemperature({
      lastInteractionAt: now,
      activeProposals: context.activeProposals ?? 0,
      openServiceRequests: context.openServiceRequests ?? 0,
    }).bucket;
    const { data, error } = await supabase
      .from("leads")
      .update({
        last_contacted: now,
        last_activity_type: activityType,
        temperature_bucket: temperature,
        temperature,
      })
      .eq("id", leadId)
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (e) {
    console.warn("[LeadActivity] Unable to record activity", e?.message || e);
    return null;
  }
}

function mapBroadcast(row) {
  if (!row) return row;
  const published =
    row.published_date ||
    row.published_at ||
    row.created_at ||
    row.updated_at ||
    null;
  const pinned = row.pinned ?? row.is_pinned ?? false;
  return {
    ...row,
    published_date: published,
    is_pinned: Boolean(pinned),
    pinned: Boolean(pinned),
    category: row.category ?? row.type ?? "Announcement",
  };
}

async function fetchLeadMetrics(leadIds) {
  if (!leadIds.length) {
    return new Map();
  }
  const { data, error } = await supabase
    .from("lead_metrics")
    .select("lead_id, active_policies_count, total_premium")
    .in("lead_id", leadIds);
  const rows = readData({ data, error }, "load lead metrics");
  return new Map(rows.map((row) => [row.lead_id, row]));
}

function mapLead(row, metricsRow) {
  const metrics = metricsRow ?? {};
  return {
    ...row,
    updated_date: row.updated_at,
    active_policies_count: metrics.active_policies_count ?? 0,
    total_premium: parseNumeric(metrics.total_premium, 0),
  };
}

async function attachLeadMetrics(leads) {
  if (!leads.length) {
    return [];
  }
  const metricsMap = await fetchLeadMetrics(leads.map((lead) => lead.id));
  return leads.map((lead) => mapLead(lead, metricsMap.get(lead.id)));
}

// Best-effort wrapper so create/update flows never hang or fail due to metrics view access
async function tryAttachLeadMetrics(leads) {
  try {
    return await attachLeadMetrics(leads);
  } catch (e) {
    console.warn('[Lead metrics] Skipping metrics enrichment:', e?.message || e);
    return leads.map((lead) => mapLead(lead, null));
  }
}

function mapPolicy(row) {
  if (!row) return row;
  return {
    ...row,
    coverage_amount: parseNumeric(row.coverage_amount, null),
    sum_assured: parseNumeric(row.sum_assured, null),
    premium_amount: parseNumeric(row.premium_amount, 0),
  };
}

function mapProposal(row) {
  if (!row) return row;
  return {
    ...row,
    updated_date: row.last_updated ?? row.updated_at,
    completion_percentage: parseNumeric(row.completion_percentage, 0),
    fact_finding_data: row.fact_finding_data ?? {},
    fna_data: row.fna_data ?? {},
    recommendation_data: row.recommendation_data ?? {},
    quotation_data: row.quotation_data ?? {},
    application_data: row.application_data ?? {},
  };
}

function mapProduct(row) {
  if (!row) return row;
  return {
    ...row,
    min_age: row.min_age ?? null,
    max_age: row.max_age ?? null,
    recommended_sum_assured: parseNumeric(row.recommended_sum_assured, null),
    features: row.features ?? [],
    premium_modes: row.premium_modes ?? [],
  };
}

async function loadLeads({ orderBy, limit, criteria }) {
  const fallbackOrder = { column: "updated_at", ascending: false };
  const primaryOrder = parseOrder(orderBy, fallbackOrder);
  let query = supabase.from("leads").select("*");
  query = applyFilters(query, criteria);
  query = query.order(primaryOrder.column, {
    ascending: primaryOrder.ascending,
    nullsFirst: primaryOrder.ascending,
  });
  if (typeof limit === "number") {
    query = query.limit(limit);
  }
  const { data, error } = await query;
  const rows = readData({ data, error }, "load leads");
  // Be tolerant to environments where the metrics view may not exist
  return tryAttachLeadMetrics(rows);
}

async function fetchPolicies({ orderBy, limit, criteria }) {
  const fallbackOrder = { column: "created_at", ascending: false };
  const primaryOrder = parseOrder(orderBy, fallbackOrder);
  let query = supabase.from("policies").select("*");
  query = applyFilters(query, criteria);
  query = query.order(primaryOrder.column, {
    ascending: primaryOrder.ascending,
    nullsFirst: primaryOrder.ascending,
  });
  if (typeof limit === "number") {
    query = query.limit(limit);
  }
  const { data, error } = await query;
  const rows = readData({ data, error }, "load policies");
  return rows.map(mapPolicy);
}

// Lead status history entity (tolerant to missing table in older environments)
const LeadStatusHistoryEntity = {
  async listByLead(leadId, limit = 20) {
    try {
      let query = supabase
        .from("lead_status_history")
        .select("*")
        .eq("lead_id", leadId)
        .order("changed_at", { ascending: false });
      if (typeof limit === "number") query = query.limit(limit);
      const { data, error } = await query;
      return readData({ data, error }, "load lead status history");
    } catch (e) {
      console.warn("lead_status_history not available:", e?.message ?? e);
      return [];
    }
  },
  async create(payload) {
    try {
      const { data, error } = await supabase
        .from("lead_status_history")
        .insert([{ ...payload }])
        .select()
        .single();
      return readSingle({ data, error }, "create lead status history");
    } catch (e) {
      console.warn("lead_status_history create failed:", e?.message ?? e);
      return null;
    }
  },
};

// Lead edit history entity (tolerant to missing table)
const LeadEditHistoryEntity = {
  async listByLead(leadId, limit = 20) {
    try {
      let query = supabase
        .from("lead_edit_history")
        .select("*")
        .eq("lead_id", leadId)
        .order("changed_at", { ascending: false });
      if (typeof limit === "number") query = query.limit(limit);
      const { data, error } = await query;
      return readData({ data, error }, "load lead edit history");
    } catch (e) {
      console.warn("lead_edit_history not available:", e?.message ?? e);
      return [];
    }
  },
  async create(payload) {
    try {
      const { data, error } = await supabase
        .from("lead_edit_history")
        .insert([{ ...payload }])
        .select()
        .single();
      return readSingle({ data, error }, "create lead edit history");
    } catch (e) {
      console.warn("lead_edit_history create failed:", e?.message ?? e);
      return null;
    }
  },
};

async function fetchProposals({ orderBy, limit, criteria }) {
  const fallbackOrder = { column: "last_updated", ascending: false };
  const primaryOrder = parseOrder(orderBy, fallbackOrder);
  let query = supabase.from("proposals").select("*");
  query = applyFilters(query, criteria);
  query = query.order(primaryOrder.column, {
    ascending: primaryOrder.ascending,
    nullsFirst: primaryOrder.ascending,
  });
  if (typeof limit === "number") {
    query = query.limit(limit);
  }
  const { data, error } = await query;
  const rows = readData({ data, error }, "load proposals");
  return rows.map(mapProposal);
}

const auth = {
  async me() {
    const ensured = await ensureProfileForUser();
    if (ensured) return ensured;
    const { data, error } = await supabase.from("profiles").select("*").eq("id", DEFAULT_PROFILE_ID).single();
    return readSingle({ data, error }, "load fallback profile");
  },
  async updateMe(updates) {
    const { data: authData } = await supabase.auth.getUser();
    const uid = authData?.user?.id ?? DEFAULT_PROFILE_ID;
    const { data, error } = await supabase
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", uid)
      .select()
      .single();
    return readSingle({ data, error }, "update profile");
  },
  async changePassword({ currentPassword, newPassword }) {
    if (!newPassword || String(newPassword).length < 8) {
      throw new Error("New password must be at least 8 characters");
    }
    // 1) Re-authenticate with Supabase Auth using current credentials
    const prof = await this.me();
    const email = prof?.email;
    if (!email) throw new Error("No email on file for current user");
    const signIn = await supabase.auth.signInWithPassword({ email, password: currentPassword });
    if (signIn.error) {
      throw new Error(signIn.error.message || "Current password is incorrect");
    }
    // 2) Update password via Auth
    const upd = await supabase.auth.updateUser({ password: newPassword });
    if (upd.error) {
      throw new Error(upd.error.message || "Unable to update password");
    }
    // 3) Stamp profile metadata for audit
    try {
      const { data: authData2 } = await supabase.auth.getUser();
      const uid2 = authData2?.user?.id ?? DEFAULT_PROFILE_ID;
      const upd2 = await supabase
        .from("profiles")
        .update({ password_last_changed: new Date().toISOString() })
        .eq("id", uid2)
        .select()
        .single();
      readSingle(upd2, "change password stamp");
    } catch {}
    // 4) Queue email notification
    try {
      if (email) {
        await supabase.from("email_outbox").insert([
          {
            to_email: email,
            subject: "Your AdvisorHub password was changed",
            body: `Hi ${prof.full_name || "Advisor"},\n\nThis is a confirmation that your password was changed on ${new Date().toLocaleString()}. If you did not perform this action, please contact support immediately.`,
            template: "password_changed",
            created_at: new Date().toISOString(),
            status: "queued",
          },
        ]);
      }
    } catch (e) {
      console.warn("email_outbox insert failed:", e?.message || e);
    }
    // 5) Sign out to force re-login
    await supabase.auth.signOut();
    return true;
  },
  async logout() {
    await supabase.auth.signOut();
    return true;
  },
};

const LeadEntity = {
  async list(orderBy, limit) {
    const { orderBy: order, limit: size } = ensureListArgs(orderBy, limit);
    return loadLeads({ orderBy: order, limit: size, criteria: undefined });
  },
  async filter(criteria) {
    return loadLeads({ orderBy: undefined, limit: undefined, criteria });
  },
  async create(payload) {
    const uid = await currentUserId();
    // Map UI label to DB-allowed value
    const mapLeadStatus = (s) => {
      const raw = String(s || '').trim();
      // Normalize common labels to DB-safe values
      const normalized = raw === 'Not Contacted' ? 'Not Initiated' : raw;
      // Safety net: default to 'Proposal' which exists in both schema variants
      const fallback = 'Proposal';
      if (!normalized) return fallback;
      const allowed = new Set([
        'Not Initiated','Contacted','Proposal',
        'Not Contacted','Qualified','Negotiation','Won','Lost',
      ]);
      return allowed.has(normalized) ? normalized : fallback;
    };
    const { data, error } = await supabase
      .from("leads")
      .insert([
        {
          ...payload,
          status: mapLeadStatus(payload?.status),
          // Keep a safe default for lead_source if UI omitted it
          lead_source: payload?.lead_source ?? 'Referral',
          advisor_id: uid,
        },
      ])
      .select()
      .single();
    const created = readSingle({ data, error }, "create lead");
    const [withMetrics] = await tryAttachLeadMetrics([created]);
    return withMetrics;
  },
  async update(id, updates) {
    const uid = await currentUserId();
    const { data, error } = await supabase
      .from("leads")
      .update({ ...updates, advisor_id: uid })
      .eq("id", id)
      .select()
      .single();
    const updated = readSingle({ data, error }, "update lead");
    const [withMetrics] = await tryAttachLeadMetrics([updated]);
    return withMetrics;
  },
};

const TaskEntity = {
  async list(orderBy, limit) {
    const { orderBy: order, limit: size } = ensureListArgs(orderBy, limit);
    const fallbackOrder = { column: "date", ascending: false };
    const primaryOrder = parseOrder(order, fallbackOrder);

    // Attempt with preferred column, then gracefully fallback across common schemas
    const tryQuery = async (col) => {
      let q = supabase.from("tasks").select("*");
      if (col) {
        q = q.order(col, {
          ascending: primaryOrder.ascending,
          nullsFirst: primaryOrder.ascending,
        });
      }
      if (typeof size === "number") q = q.limit(size);
      // First attempt: include time ordering
      let { data, error } = await q.order("time", { ascending: true, nullsFirst: true });
      if (error) {
        // Retry without time ordering (older schemas may not have time)
        const { data: data2, error: err2 } = await (col
          ? supabase.from("tasks").select("*").order(col, { ascending: primaryOrder.ascending, nullsFirst: primaryOrder.ascending }).limit(typeof size === "number" ? size : undefined)
          : supabase.from("tasks").select("*").limit(typeof size === "number" ? size : undefined)
        );
        if (err2) throw err2;
        return data2 ?? [];
      }
      return data ?? [];
    };

    try {
      return await tryQuery(primaryOrder.column);
    } catch (_e1) {
      // Avoid legacy fallback that may 400 on missing columns; prefer created_at or unordered
      try {
        return await tryQuery("created_at");
      } catch (_e2) {
        const { data, error } = await supabase.from("tasks").select("*").limit(typeof size === "number" ? size : 100);
        return readData({ data, error }, "load tasks (unordered)");
      }
    }
  },
  async filter(criteria) {
    const run = async (crit) => {
      let q = supabase.from("tasks").select("*");
      q = applyFilters(q, crit);
      let { data, error } = await q.order("time", { ascending: true, nullsFirst: true });
      if (error) {
        const { data: data2, error: err2 } = await supabase.from("tasks").select("*");
        if (err2) throw err2;
        data = data2;
      }
      const rows = data ?? [];
      return rows.sort((a, b) => {
        if (!a.time && !b.time) return 0;
        if (!a.time) return 1;
        if (!b.time) return -1;
        return String(a.time).localeCompare(String(b.time));
      });
    };
    try {
      return await run(criteria || {});
    } catch (e1) {
      // Fallback: translate date -> due_date if schema uses legacy column
      if (criteria && Object.prototype.hasOwnProperty.call(criteria, 'date')) {
        const alt = { ...criteria };
        alt.due_date = alt.date;
        delete alt.date;
        try { return await run(alt); } catch (_) {}
      }
      // Last resort: no filter
      return await run({});
    }
  },
  async create(payload) {
    // Convert empty string to null for UUID fields (PostgreSQL compatibility)
    const cleanedPayload = { ...payload };
    if (cleanedPayload.linked_lead_id === "") {
      cleanedPayload.linked_lead_id = null;
    }
    const { data, error } = await supabase
      .from("tasks")
      .insert([{ ...cleanedPayload, advisor_id: await currentUserId() }])
      .select()
      .single();
    const created = readSingle({ data, error }, "create task");
    if (created?.linked_lead_id) {
      recordLeadActivity(created.linked_lead_id, "task", { activeProposals: 0, openServiceRequests: 0 });
    }
    return created;
  },
  async update(id, updates) {
    // Convert empty string to null for UUID fields (PostgreSQL compatibility)
    const cleanedUpdates = { ...updates };
    if (cleanedUpdates.linked_lead_id === "") {
      cleanedUpdates.linked_lead_id = null;
    }
    const { data, error } = await supabase
      .from("tasks")
      .update({ ...cleanedUpdates, advisor_id: await currentUserId() })
      .eq("id", id)
      .select()
      .single();
    return readSingle({ data, error }, "update task");
  },
};

const BroadcastEntity = {
  async list(orderBy, limit) {
    const { orderBy: order, limit: size } = ensureListArgs(orderBy, limit);
    const fallbackOrder = { column: "published_date", ascending: false };
    const primaryOrder = parseOrder(order, fallbackOrder);
    let query = supabase.from("broadcasts").select("*");
    query = query.order(primaryOrder.column, {
      ascending: primaryOrder.ascending,
      nullsFirst: primaryOrder.ascending,
    });
    if (typeof size === "number") {
      query = query.limit(size);
    }
    const { data, error } = await query;
    return readData({ data, error }, "load broadcasts").map(mapBroadcast);
  },
  async filter(criteria) {
    let query = supabase.from("broadcasts").select("*");
    query = applyFilters(query, criteria);
    const { data, error } = await query;
    return readData({ data, error }, "filter broadcasts").map(mapBroadcast);
  },
  async create(payload) {
    const advisorId = await currentUserId();
    const now = new Date().toISOString();
    const record = {
      title: payload.title ?? "Untitled broadcast",
      content: payload.content ?? payload.message ?? "",
      audience: payload.audience ?? "All Advisors",
      category: payload.category ?? payload.type ?? "Announcement",
      is_pinned: Boolean(payload.is_pinned ?? payload.pinned),
      pinned: Boolean(payload.pinned ?? payload.is_pinned),
      status: payload.status ?? "draft",
      published_date: payload.published_date ?? now,
      advisor_id: advisorId,
    };
    const { data, error } = await supabase.from("broadcasts").insert([record]).select().single();
    return mapBroadcast(readSingle({ data, error }, "create broadcast"));
  },
  async update(id, updates) {
    const payload = {
      ...updates,
      is_pinned: updates?.is_pinned ?? updates?.pinned,
      pinned: updates?.pinned ?? updates?.is_pinned,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from("broadcasts")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    return mapBroadcast(readSingle({ data, error }, "update broadcast"));
  },
};

const PolicyEntity = {
  async list(orderBy, limit) {
    const { orderBy: order, limit: size } = ensureListArgs(orderBy, limit);
    return fetchPolicies({ orderBy: order, limit: size, criteria: undefined });
  },
  async filter(criteria) {
    return fetchPolicies({ orderBy: undefined, limit: undefined, criteria });
  },
};

const ProposalEntity = {
  async list(orderBy, limit) {
    const { orderBy: order, limit: size } = ensureListArgs(orderBy, limit);
    return fetchProposals({
      orderBy: order,
      limit: size,
      criteria: undefined,
    });
  },
  async filter(criteria) {
    return fetchProposals({ orderBy: undefined, limit: undefined, criteria });
  },
  async create(payload) {
    const now = new Date().toISOString();
    const proposal = {
      stage: "Fact Finding",
      status: "In Progress",
      completion_percentage: 0,
      fact_finding_data: {},
      fna_data: {},
      recommendation_data: {},
      quotation_data: {},
      application_data: {},
      last_updated: now,
      ...payload,
      advisor_id: await currentUserId(),
    };
    if (!proposal.proposal_number) {
      proposal.proposal_number = `PRO-${Date.now()}`;
    }
    const { data, error } = await supabase
      .from("proposals")
      .insert([proposal])
      .select()
      .single();
    const created = readSingle({ data, error }, "create proposal");
    return mapProposal(created);
  },
  async update(id, updates) {
    const payload = {
      ...updates,
      last_updated: new Date().toISOString(),
    };
    console.log("Proposal.update payload keys", Object.keys(payload));
    const { data, error } = await supabase
      .from("proposals")
      .update({ ...payload, advisor_id: await currentUserId() })
      .eq("id", id)
      .select()
      .single();
    const updated = readSingle({ data, error }, "update proposal");
    return mapProposal(updated);
  },
};

const ProductEntity = {
  async list(orderBy, limit) {
    const { orderBy: order, limit: size } = ensureListArgs(orderBy, limit);
    const fallbackOrder = { column: "product_name", ascending: true };
    const primaryOrder = parseOrder(order, fallbackOrder);
    let query = supabase.from("products").select("*");
    query = query.order(primaryOrder.column, {
      ascending: primaryOrder.ascending,
      nullsFirst: primaryOrder.ascending,
    });
    if (typeof size === "number") {
      query = query.limit(size);
    }
    const { data, error } = await query;
    const rows = readData({ data, error }, "load products");
    return rows.map(mapProduct);
  },
};

const ServiceRequestEntity = {
  async list(criteria) {
    let query = supabase.from("service_requests").select("*");
    query = applyFilters(query, criteria);
    query = query.order("created_at", { ascending: false });
    const { data, error } = await query;
    return readData({ data, error }, "load service requests");
  },
  async getById(id) {
    const { data, error } = await supabase
      .from("service_requests")
      .select("*")
      .eq("id", id)
      .single();
    return readSingle({ data, error }, "get service request");
  },
  async create(payload) {
    const now = new Date().toISOString();
    const historyEntry = { status: payload?.status ?? "pending", changed_at: now };
    const { data, error } = await supabase
      .from("service_requests")
      .insert([{
        ...payload,
        payload: { ...(payload?.payload ?? {}), status_history: [historyEntry] },
        advisor_id: await currentUserId(),
      }])
      .select()
      .single();
    const created = readSingle({ data, error }, "create service request");
    if (created?.lead_id) {
      recordLeadActivity(created.lead_id, "service_request", { openServiceRequests: 1 });
    }
    return created;
  },
  async update(id, updates) {
    const prevPayload = updates?.payload ?? {};
    const history = Array.isArray(prevPayload.status_history) ? prevPayload.status_history : [];
    if (updates?.status) {
      history.push({ status: updates.status, changed_at: new Date().toISOString() });
    }
    const { data, error } = await supabase
      .from("service_requests")
      .update({
        ...updates,
        payload: { ...prevPayload, status_history: history },
        updated_at: new Date().toISOString(),
        advisor_id: await currentUserId(),
      })
      .eq("id", id)
      .select()
      .single();
    return readSingle({ data, error }, "update service request");
  },
  async delete(id) {
    const { data, error } = await supabase
      .from("service_requests")
      .delete()
      .eq("id", id)
      .select()
      .single();
    return readSingle({ data, error }, "delete service request");
  },
};

const EntityCustomerEntity = {
  async list(criteria = {}) {
    const rows = await loadLeads({
      orderBy: "-updated_at",
      limit: undefined,
      criteria: { ...criteria, customer_type: "Entity" },
    });
    return rows;
  },
  async getById(id) {
    const rows = await loadLeads({
      orderBy: undefined,
      limit: undefined,
      criteria: { id, customer_type: "Entity" },
    });
    return rows[0] ?? null;
  },
  async create(payload) {
    const defaults = {
      customer_type: "Entity",
      is_client: payload?.is_client ?? true,
    };
    return LeadEntity.create({ ...payload, ...defaults });
  },
  async update(id, updates) {
    return LeadEntity.update(id, {
      ...updates,
      customer_type: "Entity",
    });
  },
  async delete(id) {
    const { data, error } = await supabase
      .from("leads")
      .delete()
      .eq("id", id)
      .eq("customer_type", "Entity")
      .select()
      .single();
    return readSingle({ data, error }, "delete entity customer");
  },
};

const MilestoneEntity = {
  async list(criteria) {
    let query = supabase.from("customer_milestones").select("*");
    query = applyFilters(query, criteria);
    query = query.order("milestone_date", { ascending: false });
    const { data, error } = await query;
    return readData({ data, error }, "load milestones");
  },
  async getById(id) {
    const { data, error } = await supabase
      .from("customer_milestones")
      .select("*")
      .eq("id", id)
      .single();
    return readSingle({ data, error }, "get milestone");
  },
  async create(payload) {
    const { data, error } = await supabase
      .from("customer_milestones")
      .insert([payload])
      .select()
      .single();
    return readSingle({ data, error }, "create milestone");
  },
  async update(id, updates) {
    const { data, error } = await supabase
      .from("customer_milestones")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    return readSingle({ data, error }, "update milestone");
  },
  async delete(id) {
    const { data, error } = await supabase
      .from("customer_milestones")
      .delete()
      .eq("id", id)
      .select()
      .single();
    return readSingle({ data, error }, "delete milestone");
  },
};

const MiraChatEntity = {
  async listRecent(limit = 20) {
    return miraChatApi.listRecentThreads(limit);
  },
  async search(options = {}) {
    return miraChatApi.searchThreads(options);
  },
  async get(threadId) {
    return miraChatApi.getThreadById(threadId);
  },
  async touch(threadId, payload) {
    return miraChatApi.touchThread(threadId, payload);
  },
  async rename(threadId, title) {
    return miraChatApi.renameThread(threadId, title);
  },
  async delete(threadId) {
    return miraChatApi.deleteThread(threadId);
  },
};
export const adviseUAdminApi = {
  auth,
  entities: {
    Lead: LeadEntity,
    Task: TaskEntity,
    Broadcast: BroadcastEntity,
    Policy: PolicyEntity,
    Proposal: ProposalEntity,
    Product: ProductEntity,
    ServiceRequest: ServiceRequestEntity,
    LeadStatusHistory: LeadStatusHistoryEntity,
    LeadEditHistory: LeadEditHistoryEntity,
    MiraChat: MiraChatEntity,
    EntityCustomer: EntityCustomerEntity,
    Milestone: MilestoneEntity,
  },
};

export default adviseUAdminApi;

