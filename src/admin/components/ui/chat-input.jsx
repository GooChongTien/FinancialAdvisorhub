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

  return (
    <div className={clsx("rounded-2xl border border-slate-200 bg-white shadow-lg", className)}>
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 border-b border-slate-100 p-3">
          {attachments.map((att) => {
            const Icon = getFileIcon(att.type);
            return (
              <div
                key={att.id}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              >
                <Icon className="h-4 w-4 text-slate-500" />
                <span className="max-w-[150px] truncate text-slate-700">{att.name}</span>
                <button
                  onClick={() => removeAttachment(att.id)}
                  className="ml-1 text-slate-400 hover:text-slate-600"
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
            className="h-9 w-9 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700"
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
        placeholder={placeholder}
        rows={1}
        className="max-h-[200px] min-h-[40px] flex-1 resize-none rounded-xl border-0 bg-transparent px-4 py-2 text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0 disabled:text-slate-400 disabled:cursor-not-allowed"
        style={{ lineHeight: "1.5" }}
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
              "h-9 w-9 rounded-full hover:bg-slate-100",
              isRecording
                ? "bg-red-50 text-red-600 hover:bg-red-100"
                : "text-slate-500 hover:text-slate-700"
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
            disabled={disabled || (!currentMessage.trim() && attachments.length === 0)}
            className="h-9 w-9 rounded-full bg-primary-600 text-white hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-400"
            title="Send message"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
