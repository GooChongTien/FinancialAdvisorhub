import React, { useRef, useState } from "react";
import { Send, Paperclip, Mic, MicOff, Image, FileText } from "lucide-react";
import { Button } from "@/admin/components/ui/button";
import clsx from "clsx";

export function ChatInput({
  onSend,
  placeholder = "Ask Mira anything...",
  className,
  value,
  onChange,
  onKeyPress,
  disabled = false,
}) {
  const isControlled = value !== undefined;
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const currentMessage = isControlled ? value ?? "" : message;

  const handleSend = () => {
    const trimmed = currentMessage.trim();
    if (!trimmed && attachments.length === 0) return;

    onSend?.({
      message: trimmed,
      attachments,
      timestamp: new Date().toISOString(),
    });

    if (!isControlled) {
      setMessage("");
    }
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e) => {
    onKeyPress?.(e);
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const newAttachments = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type,
      size: file.size,
      file,
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const removeAttachment = (id) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id));
  };

  const handleTextareaChange = (e) => {
    if (!isControlled) {
      setMessage(e.target.value);
    }

    onChange?.(e);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
  };

  const toggleRecording = () => {
    setIsRecording((prev) => !prev);
    // TODO: Implement actual voice recording
  };

  const getFileIcon = (type) => {
    if (type.startsWith("image/")) return Image;
    return FileText;
  };

  const canSend = !disabled && (currentMessage.trim() || attachments.length > 0);

  return (
    <div
      className={clsx(
        "rounded-2xl border-2 bg-white shadow-sm transition-all duration-200",
        isFocused
          ? "border-primary-500 shadow-lg shadow-primary-100"
          : "border-neutral-200 hover:border-neutral-300",
        className
      )}
    >
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 border-b border-neutral-100 p-3 bg-neutral-50">
          {attachments.map((att) => {
            const Icon = getFileIcon(att.type);
            return (
              <div
                key={att.id}
                className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm transition-all hover:shadow"
              >
                <Icon className="h-4 w-4 text-neutral-500" />
                <span className="max-w-[150px] truncate text-neutral-700 font-medium">{att.name}</span>
                <button
                  onClick={() => removeAttachment(att.id)}
                  className="ml-1 text-neutral-400 hover:text-red-600 transition-colors font-semibold"
                  aria-label={`Remove ${att.name}`}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2 p-3">
        {/* Action Buttons - Left */}
        <div className="flex gap-1 pb-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.txt"
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="h-9 w-9 rounded-xl text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-all"
            title="Attach file"
            disabled={disabled}
          >
            <Paperclip className="h-5 w-5" />
          </Button>
        </div>

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          value={currentMessage}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          rows={1}
          className="max-h-[200px] min-h-[40px] flex-1 resize-none rounded-xl border-0 bg-transparent px-4 py-2.5 text-[15px] leading-relaxed text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-0 disabled:text-neutral-400 disabled:cursor-not-allowed"
          disabled={disabled}
        />

        {/* Action Buttons - Right */}
        <div className="flex gap-1 pb-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleRecording}
            className={clsx(
              "h-9 w-9 rounded-xl transition-all",
              isRecording
                ? "bg-red-50 text-red-600 hover:bg-red-100"
                : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
            )}
            title={isRecording ? "Stop recording" : "Start voice input"}
            disabled={disabled}
          >
            {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>

          <Button
            type="button"
            size="icon"
            onClick={handleSend}
            disabled={!canSend}
            className={clsx(
              "h-9 w-9 rounded-xl transition-all",
              canSend
                ? "bg-gradient-to-br from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 shadow-md hover:shadow-lg active:scale-95"
                : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
            )}
            title="Send message"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
