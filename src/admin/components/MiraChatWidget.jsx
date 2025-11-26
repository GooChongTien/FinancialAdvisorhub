/**
 * Floating Mira Chat Widget (native)
 * Shows a floating button that routes to the Chat page.
 */

import { useState } from "react";
import { Bot, X, Columns2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/admin/utils";
import { useMiraMode } from "@/admin/state/useMiraMode";

export default function MiraChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { openSplit, conversationId } = useMiraMode();

  const openChat = () => {
    const from = encodeURIComponent(location.pathname + location.search);
    navigate(`${createPageUrl("ChatMira")}?from=${from}`);
  };

  const openSplitView = () => {
    setIsOpen(false);
    openSplit(conversationId);
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={openSplitView}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-[#003366] to-[#0055AA] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50 hover:scale-110 group"
          aria-label="Open Mira Chat (Split View)"
          onContextMenu={(e) => {
            e.preventDefault();
            setIsOpen(true);
          }}
        >
          <Bot className="w-6 h-6" />
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Columns2 className="w-3 h-3 text-white" />
          </div>
        </button>
      )}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 rounded-lg shadow-2xl bg-white z-50">
          <div className="flex items-center justify-between px-4 py-3 rounded-t-lg bg-gradient-to-r from-[#003366] to-[#0055AA] text-white">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <div>
                <h3 className="font-semibold text-sm">Mira</h3>
                <p className="text-xs text-blue-100">AI Insurance Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 text-sm text-slate-700">
            <p className="mb-3 text-xs">Choose how you want to chat with Mira:</p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-100 transition-colors"
                onClick={openSplitView}
              >
                <Columns2 className="w-4 h-4" />
                <div className="flex-1 text-left">
                  <div className="font-semibold">Split View</div>
                  <div className="text-xs font-normal">Chat while browsing</div>
                </div>
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs font-mono bg-white border border-blue-300 rounded">⌘K</kbd>
              </button>
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
                onClick={openChat}
              >
                <Bot className="w-4 h-4" />
                <div className="flex-1 text-left">
                  <div className="font-semibold">Full Screen</div>
                  <div className="text-xs font-normal">Focused chat experience</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
