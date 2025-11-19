import clsx from "clsx";

const modes = [
  {
    id: "command",
    label: "Command",
    description: "Ask or instruct Mira directly.",
  },
  {
    id: "copilot",
    label: "Co-pilot",
    description: "Review guided actions and automations.",
  },
  {
    id: "insight",
    label: "Insights",
    description: "Monitor alerts and context summaries.",
  },
];

export function MiraInteractionModes({
  mode,
  onModeChange,
  availableModes = ["command", "copilot", "insight"],
}) {
  const activeModes = modes.filter((item) => availableModes.includes(item.id));
  const description =
    activeModes.find((item) => item.id === mode)?.description ??
    activeModes[0]?.description ??
    "Switch between modes.";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {activeModes.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onModeChange?.(item.id)}
            className={clsx(
              "rounded-full border px-4 py-2 text-sm font-semibold transition",
              mode === item.id
                ? "border-primary-500 bg-primary-50 text-primary-700 shadow-sm"
                : "border-slate-200 bg-white text-slate-600 hover:border-primary-200 hover:text-primary-600",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-500">{description}</p>
    </div>
  );
}
