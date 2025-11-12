import { intentLabel } from "@/lib/mira/intentLabels.ts";

export function ClarificationPrompt({ prompt, onConfirm, onCancel }) {
  if (!prompt) return null;
  const label = intentLabel(prompt.metadata?.intent);
  const confidenceTier = prompt.metadata?.confidenceTier || prompt.metadata?.confidence_tier || "low";
  const isMedium = confidenceTier === "medium";

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm">
      <div className="font-semibold mb-1">Mira wants to be sure</div>
      <p className="mb-3">
        {isMedium
          ? `Just to confirm — would you like me to ${label}?`
          : prompt.assistantText || "I want to make sure I get this right — could you tell me a bit more about what you’d like to do?"}
      </p>
      <div className="flex flex-wrap gap-2">
        {isMedium && (
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center rounded bg-amber-600 px-3 py-1 text-sm font-medium text-white hover:bg-amber-700"
          >
            Yes, go ahead
          </button>
        )}
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center rounded border border-amber-300 px-3 py-1 text-sm font-medium text-amber-900 hover:bg-white"
        >
          {isMedium ? "No, I’ll change it" : "Okay, I’ll clarify"}
        </button>
      </div>
    </div>
  );
}

export default ClarificationPrompt;
