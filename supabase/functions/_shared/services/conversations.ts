import { createServiceClient } from "../supabase.ts";
import type { MiraContext } from "../types.ts";

export interface ConversationBootstrap {
  conversationId?: string | null;
  advisorId?: string | null;
  advisorEmail?: string | null;
  tenantId?: string | null;
  channel?: string | null;
  status?: string | null;
  mode?: string | null;
  context?: MiraContext;
  metadata?: Record<string, unknown>;
}

function sanitizeMetadata(input?: Record<string, unknown> | null) {
  if (!input || typeof input !== "object") return null;
  try {
    return JSON.parse(JSON.stringify(input));
  } catch {
    return null;
  }
}

function contextColumns(context?: MiraContext) {
  if (!context) return {};
  return {
    context_module: context.module ?? null,
    context_page: context.page ?? null,
    context_data: context.pageData ?? null,
  };
}

export async function ensureConversationRecord(
  bootstrap: ConversationBootstrap,
): Promise<{ id: string; created: boolean }> {
  const supabase = createServiceClient();
  const now = new Date().toISOString();
  const metadataPayload = sanitizeMetadata(bootstrap.metadata ?? null);
  const baseUpdate = {
    advisor_id: bootstrap.advisorId ?? null,
    advisor_email: bootstrap.advisorEmail ?? null,
    tenant_id: bootstrap.tenantId ?? null,
    channel: bootstrap.channel ?? null,
    status: bootstrap.status ?? "active",
    mode: bootstrap.mode ?? null,
    last_message_at: now,
    updated_at: now,
    metadata: metadataPayload,
    ...contextColumns(bootstrap.context),
  };

  if (bootstrap.conversationId) {
    const { data, error } = await supabase
      .from("mira_conversations")
      .select("id")
      .eq("id", bootstrap.conversationId)
      .maybeSingle();
    if (!error && data?.id) {
      await supabase.from("mira_conversations").update(baseUpdate).eq("id", data.id);
      return { id: data.id, created: false };
    }
  }

  const insertPayload = {
    ...baseUpdate,
    created_at: now,
  };

  const { data, error } = await supabase
    .from("mira_conversations")
    .insert([insertPayload])
    .select("id")
    .single();
  if (error || !data?.id) {
    throw error ?? new Error("Failed to insert mira_conversations row");
  }
  return { id: data.id, created: true };
}
