import { useState, useCallback, useRef, useEffect } from "react";
import { X, GripVertical, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/admin/components/ui/button";
import InlineChatPanel from "@/admin/components/mira/InlineChatPanel.jsx";
import { useChatPanelMode } from "@/admin/state/useChatPanelMode.ts";

const MIN_CHAT_WIDTH = 300;
const MAX_CHAT_WIDTH = 800;

export default function ChatPanelOverlay() {
  const { mode, chatWidthPercent, setChatWidth, openFull, openSplit, close } = useChatPanelMode();
  const [isDragging, setIsDragging] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const containerRef = useRef(null);

  // Track sidebar collapse state
  useEffect(() => {
    const checkSidebarState = () => {
      if (typeof document !== 'undefined') {
        setSidebarCollapsed(document.body.classList.contains('sidebar-collapsed'));
      }
    };

    // Check initial state
    checkSidebarState();

    // Listen for changes
    const observer = new MutationObserver(checkSidebarState);
    if (typeof document !== 'undefined') {
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['class']
      });
    }

    return () => observer.disconnect();
  }, []);

  // Listen for split view trigger from action executor
  useEffect(() => {
    const handleOpenSplitView = () => {
      openSplit();
    };
    window.addEventListener("mira:open-split-view", handleOpenSplitView);
    return () => window.removeEventListener("mira:open-split-view", handleOpenSplitView);
  }, [openSplit]);

  // Apply body class for split view mode and auto-collapse sidebar
  useEffect(() => {
    if (mode === 'split') {
      document.body.classList.add('chat-split-view');
      document.body.style.setProperty('--chat-panel-width', `${chatWidthPercent}%`);

      // Auto-collapse sidebar when chat opens
      window.dispatchEvent(new CustomEvent('mira:auto-collapse-sidebar'));
    } else {
      document.body.classList.remove('chat-split-view');
    }
    return () => {
      document.body.classList.remove('chat-split-view');
    };
  }, [mode, chatWidthPercent]);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging || !containerRef.current) return;

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const mouseX = e.clientX - containerRect.left;

      // Calculate percentage
      const newWidthPercent = (mouseX / containerWidth) * 100;

      // Calculate pixel equivalents for min/max
      const minPercent = (MIN_CHAT_WIDTH / containerWidth) * 100;
      const maxPercent = (MAX_CHAT_WIDTH / containerWidth) * 100;

      // Clamp the value
      const clampedPercent = Math.max(minPercent, Math.min(maxPercent, newWidthPercent));
      setChatWidth(clampedPercent);
    },
    [isDragging, setChatWidth]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Hidden mode - don't render anything
  if (mode === 'hidden') {
    return null;
  }

  // Full mode - overlay entire screen
  if (mode === 'full') {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-white">
          <h2 className="text-sm font-semibold text-slate-700">Mira Chat</h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={openSplit}
              className="h-8 w-8"
              title="Exit fullscreen"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={close}
              className="h-8 w-8"
              title="Close chat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <InlineChatPanel />
        </div>
      </div>
    );
  }

  // Calculate sidebar width based on collapsed state
  const sidebarWidth = sidebarCollapsed ? 74 : 256;

  // Split mode - show chat next to sidebar, main content shifts right
  return (
    <>
      {/* Chat Panel - Fixed next to sidebar */}
      <div
        ref={containerRef}
        className="fixed top-0 bottom-0 z-40 flex flex-col border-r-2 border-neutral-200 bg-white shadow-xl transition-all duration-300"
        style={{
          left: `${sidebarWidth}px`,
          width: `${chatWidthPercent}%`,
          minWidth: `${MIN_CHAT_WIDTH}px`
        }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 bg-gradient-to-r from-white to-neutral-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-700 via-neutral-800 to-neutral-900 flex items-center justify-center shadow-md">
              <span className="text-white text-xs font-bold">M</span>
            </div>
            <h2 className="text-sm font-semibold text-neutral-900">Mira Chat</h2>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={openFull}
              className="h-8 w-8 hover:bg-neutral-100 rounded-lg transition-colors"
              title="Fullscreen"
            >
              <Maximize2 className="h-4 w-4 text-neutral-600" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={close}
              className="h-8 w-8 hover:bg-neutral-100 rounded-lg transition-colors"
              title="Close chat"
            >
              <X className="h-4 w-4 text-neutral-600" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <InlineChatPanel />
        </div>
      </div>

      {/* Draggable Divider */}
      <div
        className="fixed top-0 bottom-0 z-40 w-1 bg-neutral-300 hover:bg-primary-500 cursor-col-resize flex items-center justify-center group transition-all duration-300"
        style={{ left: `calc(${sidebarWidth}px + ${chatWidthPercent}%)` }}
        onMouseDown={handleMouseDown}
      >
        <div className="absolute inset-y-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="h-6 w-6 text-white drop-shadow" />
        </div>
      </div>
    </>
  );
}
