import { useId, useRef, useState } from "react";
import { Loader2, Paperclip, Mic, MicOff, Send } from "lucide-react";
import clsx from "clsx";

export function MiraCommandPanel({
  onSubmit,
  isRunning = false,
  placeholder = "Ask Mira anything...",
  isStreaming = false,
  onStopStreaming,
}) {
  const [value, setValue] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef(null);
  const isBusy = isRunning || isStreaming;
  const textareaId = useId();
  const trimmedValue = value.trim();

  const handleSubmit = (event) => {
    event.preventDefault();
    handleSend();
  };

  const handleStopStreaming = () => {
    if (typeof onStopStreaming === "function") {
      onStopStreaming();
    }
  };

  const handleSend = () => {
    if (isStreaming) {
      handleStopStreaming();
      return;
    }
    if (!trimmedValue) return;
    onSubmit?.(trimmedValue);
    setValue("");
    setUploadedFiles([]);
    setIsRecording(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleUploadClick = () => {
    if (isBusy) return;
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files ?? []);
    setUploadedFiles(files);
  };

  const toggleRecording = () => {
    if (isBusy) return;
    setIsRecording((prev) => !prev);
  };

  const hasUploads = uploadedFiles.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label htmlFor={textareaId} className="sr-only">
          Ask Mira anything
        </label>
        <div className="relative w-full">
          <textarea
            id={textareaId}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder ?? "Ask Mira anything..."}
            rows={1}
            className="max-h-[160px] w-full resize-none rounded-xl border border-slate-300 bg-white px-4 pb-10 pr-28 pt-3 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 disabled:border-slate-200 disabled:bg-slate-100"
            disabled={isBusy}
            aria-busy={isBusy}
            aria-describedby={`${textareaId}-description`}
          />
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            onChange={handleFileSelect}
            aria-hidden="true"
          />
          <div className="pointer-events-none absolute bottom-2 right-2 flex items-end gap-1">
            <button
              type="button"
              onClick={handleUploadClick}
              className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              title="Upload document"
              aria-label="Upload document"
              disabled={isBusy}
            >
              <Paperclip className="h-5 w-5" />
            </button>
            {isStreaming ? (
              <button
                type="button"
                onClick={handleStopStreaming}
                className="pointer-events-auto flex h-9 items-center justify-center rounded-full border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:text-slate-900"
              >
                Stop
              </button>
            ) : trimmedValue ? (
              <button
                type="button"
                onClick={handleSend}
                className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-white shadow-sm transition hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-400"
                disabled={isRunning}
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={toggleRecording}
                className={clsx(
                  "pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm transition hover:bg-slate-100 hover:text-slate-700",
                  isRecording &&
                    "bg-primary-50 text-primary-600 hover:bg-primary-100",
                  isBusy && "cursor-not-allowed opacity-50",
                )}
                title={isRecording ? "Stop voice input" : "Start voice input"}
                aria-label={
                  isRecording ? "Stop voice input" : "Start voice input"
                }
                disabled={isBusy}
              >
                {isRecording ? (
                  <MicOff className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </button>
            )}
          </div>
        </div>
        <p id={`${textareaId}-description`} className="sr-only">
          Ask Mira to run a command, look up records, or generate insights.
        </p>
        {hasUploads && (
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            {uploadedFiles.map((file, index) => (
              <span
                key={`${file.name}-${index}`}
                className="rounded-full bg-slate-100 px-3 py-1"
              >
                {file.name}
              </span>
            ))}
          </div>
        )}
        {isRecording && (
          <p className="text-xs text-primary-600">
            Voice capture active (placeholder functionality).
          </p>
        )}
        {!hasUploads && !isRecording && (
          <p className="sr-only">
            Upload documents or start voice input using the buttons provided.
          </p>
        )}
      </form>
    </div>
  );
}
