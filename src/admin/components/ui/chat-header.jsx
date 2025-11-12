/**
 * Chat header component for Mira chat interface
 * Displays branding, status, and actions
 */

import { Bot, MoreVertical, RefreshCw, X } from "lucide-react";
import { Button } from "./button.jsx";

/**
 * Chat header component
 * @param {Object} props
 * @param {boolean} [props.isStreaming] - Whether Agent is currently responding
 * @param {() => void} [props.onClear] - Clear messages callback
 * @param {() => void} [props.onAbort] - Abort streaming callback
 */
export function ChatHeader({ isStreaming = false, onClear, onAbort }) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
      {/* Left: Mira branding */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Mira</h2>
          <p className="text-xs text-gray-500">
            {isStreaming ? (
              <span className="flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Thinking...
              </span>
            ) : (
              "AI Insurance Assistant"
            )}
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {isStreaming && onAbort && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onAbort}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="w-4 h-4 mr-1" />
            Stop
          </Button>
        )}

        {!isStreaming && onClear && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-gray-600 hover:text-gray-700"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}

        <Button variant="ghost" size="sm" className="text-gray-600">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default ChatHeader;
