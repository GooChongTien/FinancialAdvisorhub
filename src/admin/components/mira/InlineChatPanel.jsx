import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/admin/utils";
import { useAgentChatStore } from "@/admin/state/providers/AgentChatProvider.jsx";
import InlineConfirmationCard from "@/admin/components/ui/inline-confirmation-card.jsx";
import { ChatMessage as ChatBubble } from "@/admin/components/ui/chat-message.jsx";
import { ChatInput } from "@/admin/components/ui/chat-input.jsx";

export default function InlineChatPanel() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    messages,
    isStreaming,
    error,
    sendMessage,
    pendingAction,
    confirmPending,
    rejectPending,
    trustSkillInSession,
  } = useAgentChatStore();
  const handleOpen = () => {
    const from = encodeURIComponent(location.pathname + location.search);
    navigate(`${createPageUrl("ChatMira")}?from=${from}`);
  };
  return (
    <div className="flex h-full flex-col p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">Mira</p>
        <button
          type="button"
          className="rounded border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
          onClick={handleOpen}
        >
          Open full chat
        </button>
      </div>
      <div className="flex-1 overflow-auto rounded border border-slate-100 bg-white p-2">
        {messages.length === 0 && (
          <div className="p-2 text-xs text-slate-500">Ask a question to get started.</div>
        )}
        {messages.slice(-8).map((m) => (
          <ChatBubble key={m.id} message={m} streaming={Boolean(m.streaming)} />
        ))}
        {pendingAction && (
          <InlineConfirmationCard
            title={pendingAction.message || "Allow Mira to perform this action?"}
            description={pendingAction.tool ? `Requested: ${pendingAction.tool}` : undefined}
            onAllowOnce={confirmPending}
            onDontAllow={rejectPending}
            onAlwaysAllow={() => trustSkillInSession(pendingAction.tool)}
          />
        )}
        {error && (
          <div className="mt-2 rounded border border-red-300 bg-red-100 p-2 text-xs text-red-800">
            {String(error.message || error)}
          </div>
        )}
      </div>
      <div className="mt-2">
        <ChatInput onSend={({ message }) => sendMessage(message)} disabled={isStreaming} />
      </div>
    </div>
  );
}
