import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/admin/utils";

/**
 * Global keyboard shortcuts for Mira
 * - Ctrl/Cmd+K: Open command mode (navigate to ChatMira)
 * - ESC: Close/minimize (go back from ChatMira)
 */
export function useGlobalKeyboardShortcuts() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ctrl/Cmd+K: Open command mode
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();

        // Don't re-navigate if already on ChatMira
        if (!location.pathname.includes("/chat-mira")) {
          const chatUrl = createPageUrl("ChatMira");
          const fromParam = encodeURIComponent(location.pathname + location.search);
          navigate(`${chatUrl}?from=${fromParam}`);
        }
        return;
      }

      // ESC: Close/minimize (only when on ChatMira page)
      if (event.key === "Escape" && location.pathname.includes("/chat-mira")) {
        // Check if there's a 'from' parameter to go back to
        const params = new URLSearchParams(location.search);
        const from = params.get("from");

        if (from) {
          try {
            const decodedFrom = decodeURIComponent(from);
            navigate(decodedFrom, { replace: true });
          } catch {
            navigate(createPageUrl("Home"), { replace: true });
          }
        } else {
          navigate(createPageUrl("Home"), { replace: true });
        }
        return;
      }
    };

    // Only add listener if not in an input/textarea/contenteditable
    const handleKeyDownWithContext = (event) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target;
      const tagName = target.tagName?.toLowerCase();
      const isEditable = target.isContentEditable;

      // Allow ESC to work even in inputs (to close/blur)
      if (event.key === "Escape") {
        if (tagName === "input" || tagName === "textarea" || isEditable) {
          target.blur(); // Blur the input first
        }
        handleKeyDown(event);
        return;
      }

      // For other shortcuts, skip if in editable element
      if (tagName === "input" || tagName === "textarea" || isEditable) {
        return;
      }

      handleKeyDown(event);
    };

    window.addEventListener("keydown", handleKeyDownWithContext);

    return () => {
      window.removeEventListener("keydown", handleKeyDownWithContext);
    };
  }, [navigate, location]);
}
