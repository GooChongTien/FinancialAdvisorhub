/**
 * Typing Indicator Component
 * 3-dot pulsing animation to show Mira is typing
 */

export function TypingIndicator({ className = "" }) {
  return (
    <div className={`flex items-center space-x-1.5 ${className}`}>
      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" />
    </div>
  );
}

/**
 * Typing Indicator Message
 * Full message bubble with Mira avatar + typing animation
 */
export function TypingIndicatorMessage() {
  return (
    <div className="flex justify-start mb-6 px-4 animate-fade-in">
      <div className="max-w-[85%] md:max-w-[70%]">
        <div className="flex items-start gap-3">
          {/* Mira Avatar */}
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-neutral-700 via-neutral-800 to-neutral-900 flex items-center justify-center shadow-md ring-2 ring-neutral-200">
            <span className="text-white text-xs font-bold">M</span>
          </div>

          {/* Typing Bubble */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold text-neutral-900">Mira</span>
              <span className="text-[11px] text-primary-600">Typing...</span>
            </div>
            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl rounded-tl-md px-4 py-4 shadow-sm">
              <TypingIndicator />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
