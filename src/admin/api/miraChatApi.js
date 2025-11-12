import supabase from "./supabaseClient.js";

const DEFAULT_PROFILE_ID = "advisor-001";

function resolveOverrideAdvisorId() {
  if (typeof process !== "undefined" && process?.env) {
    return process.env.E2E_ADVISOR_ID || process.env.DEFAULT_ADVISOR_ID || null;
  }
  return null;
}

function normalizeDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

function mapThread(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title || "Untitled chat",
    advisorId: row.advisor_id || null,
    lastMessagePreview: row.last_message_preview || "",
    lastMessageRole: row.last_message_role || "user",
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || row.last_activity_at || row.created_at || null,
    metadata: row.metadata || null,
  };
}

async function currentAdvisorId() {
  const override = resolveOverrideAdvisorId();
  if (override) return override;
  try {
    const { data } = await supabase.auth.getUser();
    if (data?.user?.id) {
      return data.user.id;
    }
  } catch {}
  return DEFAULT_PROFILE_ID;
}

async function baseQuery() {
  const advisorId = await currentAdvisorId();
  if (!advisorId) {
    return supabase.from("mira_chat_threads").select("*");
  }
  return supabase.from("mira_chat_threads").select("*").eq("advisor_id", advisorId);
}

function applySearch(query, search) {
  if (!search) return query;
  const safeTerm = search.replace(/[%_]/g, "\\$&");
  const like = `%${safeTerm}%`;
  return query.or(
    `title.ilike.${like},last_message_preview.ilike.${like}`,
    { foreignTable: undefined },
  );
}

function applySort(query, sort = "recent") {
  switch (sort) {
    case "oldest":
      return query.order("updated_at", { ascending: true, nullsFirst: false });
    case "alpha":
      return query.order("title", { ascending: true, nullsFirst: true });
    default:
      return query.order("updated_at", { ascending: false, nullsFirst: true });
  }
}

export async function listRecentThreads(limit = 20) {
  const query = await baseQuery();
  const { data, error } = await applySort(query, "recent").limit(limit);
  if (error) {
    console.error("[MiraChatApi] listRecentThreads error", error);
    throw error;
  }
  return (data ?? []).map(mapThread);
}

export async function searchThreads({ search, sort = "recent", limit, offset } = {}) {
  let query = await baseQuery();
  query = applySort(applySearch(query, search), sort);
  if (typeof offset === "number" && offset > 0) {
    query = query.range(offset, offset + (typeof limit === "number" ? limit : 100) - 1);
  } else if (typeof limit === "number") {
    query = query.limit(limit);
  }
  const { data, error } = await query;
  if (error) {
    console.error("[MiraChatApi] searchThreads error", error);
    throw error;
  }
  return (data ?? []).map(mapThread);
}

export async function getThreadById(threadId) {
  if (!threadId) return null;
  const query = await baseQuery();
  const { data, error } = await query.eq("id", threadId).maybeSingle();
  if (error) {
    console.error("[MiraChatApi] getThreadById error", error);
    throw error;
  }
  return mapThread(data);
}

export async function touchThread(threadId, payload = {}) {
  if (!threadId) return null;
  const advisorId = await currentAdvisorId();
  const now = normalizeDate(payload.updatedAt ?? new Date());
  const upsertPayload = {
    id: threadId,
    advisor_id: advisorId,
    updated_at: now,
  };

  if (payload.title) {
    upsertPayload.title = String(payload.title).trim();
  }
  if (payload.lastMessagePreview !== undefined) {
    upsertPayload.last_message_preview = payload.lastMessagePreview;
  }
  if (payload.lastMessageRole) {
    const role = String(payload.lastMessageRole).toLowerCase();
    upsertPayload.last_message_role =
      role === "assistant" || role === "system" || role === "user"
        ? role
        : payload.lastMessageRole;
  }
  if (payload.metadata) {
    upsertPayload.metadata = payload.metadata;
  }
  if (payload.createdAt) {
    upsertPayload.created_at = normalizeDate(payload.createdAt);
  }
  if (payload.lastActivityAt) {
    upsertPayload.last_activity_at = normalizeDate(payload.lastActivityAt);
  }

  const { data, error } = await supabase
    .from("mira_chat_threads")
    .upsert(upsertPayload, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    console.error("[MiraChatApi] touchThread error", error);
    throw error;
  }
  return mapThread(data);
}

export async function renameThread(threadId, title) {
  if (!threadId || !title) return null;
  const advisorId = await currentAdvisorId();
  const { data, error } = await supabase
    .from("mira_chat_threads")
    .update({
      title,
      updated_at: new Date().toISOString(),
    })
    .eq("id", threadId)
    .eq("advisor_id", advisorId)
    .select()
    .single();
  if (error) {
    console.error("[MiraChatApi] renameThread error", error);
    throw error;
  }
  return mapThread(data);
}

export async function deleteThread(threadId) {
  if (!threadId) return null;
  const advisorId = await currentAdvisorId();
  const { error } = await supabase
    .from("mira_chat_threads")
    .delete()
    .eq("id", threadId)
    .eq("advisor_id", advisorId);
  if (error) {
    console.error("[MiraChatApi] deleteThread error", error);
    throw error;
  }
  return true;
}

export const miraChatApi = {
  listRecentThreads,
  searchThreads,
  getThreadById,
  touchThread,
  renameThread,
  deleteThread,
};

export default miraChatApi;
