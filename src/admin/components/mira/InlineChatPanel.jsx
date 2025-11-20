import { Button } from "@/admin/components/ui/button.jsx";
import { ChatInput } from "@/admin/components/ui/chat-input.jsx";
import { ChatMessage as ChatBubble } from "@/admin/components/ui/chat-message.jsx";
import InlineConfirmationCard from "@/admin/components/ui/inline-confirmation-card.jsx";
import { Skeleton } from "@/admin/components/ui/skeleton.jsx";
import { useAgentChatStore } from "@/admin/state/providers/AgentChatProvider.jsx";
import { createPageUrl } from "@/admin/utils";
import { AlertCircle, Maximize2, RefreshCw } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export default function InlineChatPanel({ showHeader = true }) {
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
    <div
      className="flex h-full flex-col bg-white"
      role="region"
      aria-label="Mira Chat Assistant"
    >
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 bg-gradient-to-r from-white to-neutral-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-700 via-neutral-800 to-neutral-900 flex items-center justify-center shadow-md">
              <span className="text-white text-xs font-bold">M</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900" id="mira-chat-title">
                Mira
              </p>
              <p className="text-[10px] text-neutral-500">AI Assistant</p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 hover:border-neutral-400 transition-all flex items-center gap-1.5"
            onClick={handleOpen}
            aria-label="Open full chat interface"
          >
            <Maximize2 className="w-3 h-3" />
            Expand
          </button>
        </div>
      )}

      {/* Messages Area */}
      <div
        className="flex-1 overflow-auto chat-scroll-container bg-gradient-to-b from-white to-neutral-50"
        role="log"
        aria-live="polite"
        aria-atomic="false"
        aria-label="Chat conversation"
      >
        {messages.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center" role="status">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg mb-3">
              <span className="text-white text-lg font-bold">M</span>
            </div>
            <p className="text-sm font-semibold text-neutral-900 mb-1">Ask Mira anything</p>
            <p className="text-xs text-neutral-500">Get help with customers, analytics, tasks, and more</p>
          </div>
        )}
        <div className="py-2">
          {messages.slice(-8).map((m) => (
            <ChatBubble key={m.id} message={m} streaming={Boolean(m.streaming)} />
          ))}
        </div>
        {isStreaming && messages.length > 0 && !messages[messages.length - 1]?.streaming && (
          <div className="px-4 pb-4 space-y-2" role="status" aria-label="Mira is typing">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <span className="sr-only">Mira is typing a response</span>
          </div>
        )}
        {pendingAction && (
          <div className="px-4 pb-4">
            <InlineConfirmationCard
              title={pendingAction.message || "Allow Mira to perform this action?"}
              description={pendingAction.tool ? `Requested: ${pendingAction.tool}` : undefined}
              onAllowOnce={confirmPending}
              onDontAllow={rejectPending}
              onAlwaysAllow={() => trustSkillInSession(pendingAction.tool)}
            />
          </div>
        )}
        {error && (
          <div
            className="mx-4 mb-4 rounded-xl border border-red-200 bg-red-50 p-3 shadow-sm"
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-start gap-2">
              <AlertCircle
                className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-red-900 mb-1">Something went wrong</p>
                <p className="text-xs text-red-700 break-words">
                  {String(error.message || error)}
                </p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800"
                onClick={() => {
                  const lastUserMsg = messages.findLast(m => m.role === 'user');
                  if (lastUserMsg?.content) {
                    sendMessage(lastUserMsg.content);
                  }
                }}
                disabled={isStreaming}
                aria-label="Retry sending the last message"
              >
                <RefreshCw className="h-3 w-3 mr-1" aria-hidden="true" />
                Retry
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-neutral-200 bg-white">
        <ChatInput onSend={({ message }) => sendMessage(message)} disabled={isStreaming} />
      </div>
    </div>
  );
}
