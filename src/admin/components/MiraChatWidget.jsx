/**
 * Floating Mira Chat Widget (native)
 * Shows a floating button that routes to the Chat page.
 */

import { useState } from "react";
import { Bot, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/admin/utils";

export default function MiraChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const openChat = () => {
    const from = encodeURIComponent(location.pathname + location.search);
    navigate(`${createPageUrl("ChatMira")}?from=${from}`);
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-[#003366] to-[#0055AA] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50 hover:scale-110"
          aria-label="Open Mira Chat"
        >
          <Bot className="w-6 h-6" />
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
            <p className="mb-3">Open the full chat experience.</p>
            <button
              type="button"
              className="rounded border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              onClick={openChat}
            >
              Go to Mira Chat
            </button>
          </div>
        </div>
      )}
    </>
  );
}
