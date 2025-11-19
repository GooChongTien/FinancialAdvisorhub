/**
 * Contextual Help System
 * Provides smart, context-aware help tooltips and guidance
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { HelpCircle, X, Lightbulb, BookOpen, Video } from "lucide-react";
import clsx from "clsx";

export interface ContextualHelpContent {
  title: string;
  description: string;
  tips?: string[];
  videoUrl?: string;
  docsUrl?: string;
  relatedActions?: Array<{
    label: string;
    action: () => void;
  }>;
}

export interface ContextualHelpProps {
  targetId: string;
  content: ContextualHelpContent;
  trigger?: "hover" | "click" | "focus";
  placement?: "top" | "bottom" | "left" | "right";
  delay?: number;
  autoShow?: boolean;
}

export function ContextualHelp({
  targetId,
  content,
  trigger = "hover",
  placement = "bottom",
  delay = 500,
  autoShow = false,
}: ContextualHelpProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const targetRef = useRef<HTMLElement | null>(null);

  // Find target element
  useEffect(() => {
    targetRef.current = document.getElementById(targetId);

    if (!targetRef.current) {
      console.warn(`[ContextualHelp] Target element not found: ${targetId}`);
    }
  }, [targetId]);

  // Auto-show if enabled
  useEffect(() => {
    if (autoShow && targetRef.current) {
      // Show after a delay
      const timer = setTimeout(() => {
        show();
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [autoShow, delay]);

  // Calculate position
  const calculatePosition = useCallback(() => {
    if (!targetRef.current) return { top: 0, left: 0 };

    const rect = targetRef.current.getBoundingClientRect();
    const helpWidth = 320; // Approximate width of help panel
    const helpHeight = 200; // Approximate height
    const offset = 12; // Gap between target and help

    let top = 0;
    let left = 0;

    switch (placement) {
      case "top":
        top = rect.top - helpHeight - offset;
        left = rect.left + rect.width / 2 - helpWidth / 2;
        break;
      case "bottom":
        top = rect.bottom + offset;
        left = rect.left + rect.width / 2 - helpWidth / 2;
        break;
      case "left":
        top = rect.top + rect.height / 2 - helpHeight / 2;
        left = rect.left - helpWidth - offset;
        break;
      case "right":
        top = rect.top + rect.height / 2 - helpHeight / 2;
        left = rect.right + offset;
        break;
    }

    // Keep within viewport
    const maxLeft = window.innerWidth - helpWidth - 20;
    const maxTop = window.innerHeight - helpHeight - 20;

    left = Math.max(20, Math.min(left, maxLeft));
    top = Math.max(20, Math.min(top, maxTop));

    return { top, left };
  }, [placement]);

  const show = useCallback(() => {
    setPosition(calculatePosition());
    setIsVisible(true);
  }, [calculatePosition]);

  const hide = useCallback(() => {
    setIsVisible(false);
  }, []);

  // Handle trigger events
  useEffect(() => {
    if (!targetRef.current) return;

    const handleMouseEnter = () => {
      if (trigger === "hover") {
        timeoutRef.current = setTimeout(show, delay);
      }
    };

    const handleMouseLeave = () => {
      if (trigger === "hover") {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        hide();
      }
    };

    const handleClick = () => {
      if (trigger === "click") {
        if (isVisible) {
          hide();
        } else {
          show();
        }
      }
    };

    const handleFocus = () => {
      if (trigger === "focus") {
        show();
      }
    };

    const handleBlur = () => {
      if (trigger === "focus") {
        hide();
      }
    };

    const target = targetRef.current;

    target.addEventListener("mouseenter", handleMouseEnter);
    target.addEventListener("mouseleave", handleMouseLeave);
    target.addEventListener("click", handleClick);
    target.addEventListener("focus", handleFocus);
    target.addEventListener("blur", handleBlur);

    return () => {
      target.removeEventListener("mouseenter", handleMouseEnter);
      target.removeEventListener("mouseleave", handleMouseLeave);
      target.removeEventListener("click", handleClick);
      target.removeEventListener("focus", handleFocus);
      target.removeEventListener("blur", handleBlur);
    };
  }, [trigger, delay, show, hide, isVisible]);

  // Update position on scroll/resize
  useEffect(() => {
    if (!isVisible) return;

    const handlePositionUpdate = () => {
      setPosition(calculatePosition());
    };

    window.addEventListener("scroll", handlePositionUpdate, true);
    window.addEventListener("resize", handlePositionUpdate);

    return () => {
      window.removeEventListener("scroll", handlePositionUpdate, true);
      window.removeEventListener("resize", handlePositionUpdate);
    };
  }, [isVisible, calculatePosition]);

  if (!isVisible) return null;

  return createPortal(
    <div
      className="fixed z-[100] w-80 animate-in fade-in slide-in-from-bottom-2 duration-200"
      style={{ top: position.top, left: position.left }}
      role="tooltip"
      aria-live="polite"
    >
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50">
              <Lightbulb className="h-4 w-4 text-primary-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">{content.title}</h3>
          </div>
          <button
            onClick={hide}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close help"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Description */}
        <p className="mt-3 text-sm text-slate-600">{content.description}</p>

        {/* Tips */}
        {content.tips && content.tips.length > 0 && (
          <div className="mt-4 space-y-2">
            {content.tips.map((tip, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
                <p className="text-xs text-slate-600">{tip}</p>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          {content.docsUrl && (
            <a
              href={content.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Documentation
            </a>
          )}
          {content.videoUrl && (
            <a
              href={content.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Video className="h-3.5 w-3.5" />
              Watch Tutorial
            </a>
          )}
        </div>

        {/* Related Actions */}
        {content.relatedActions && content.relatedActions.length > 0 && (
          <div className="mt-4 border-t border-slate-100 pt-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Quick Actions
            </p>
            <div className="space-y-1">
              {content.relatedActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => {
                    action.action();
                    hide();
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Arrow */}
        <div
          className={clsx(
            "absolute h-3 w-3 rotate-45 border bg-white",
            placement === "bottom" && "-top-1.5 left-1/2 -translate-x-1/2 border-b-0 border-r-0",
            placement === "top" && "-bottom-1.5 left-1/2 -translate-x-1/2 border-l-0 border-t-0",
            placement === "right" && "-left-1.5 top-1/2 -translate-y-1/2 border-b-0 border-l-0",
            placement === "left" && "-right-1.5 top-1/2 -translate-y-1/2 border-r-0 border-t-0"
          )}
        />
      </div>
    </div>,
    document.body
  );
}

/**
 * Contextual Help Icon
 * Small icon that triggers contextual help on click
 */
export function ContextualHelpIcon({
  content,
  className,
}: {
  content: ContextualHelpContent;
  className?: string;
}) {
  const [id] = useState(`help-icon-${Math.random().toString(36).substr(2, 9)}`);

  return (
    <>
      <button
        id={id}
        className={clsx(
          "inline-flex items-center justify-center rounded-full text-slate-400 transition hover:text-slate-600",
          className
        )}
        aria-label="Show help"
      >
        <HelpCircle className="h-4 w-4" />
      </button>
      <ContextualHelp targetId={id} content={content} trigger="click" />
    </>
  );
}
