import React, { useMemo } from "react";
import { calculateCustomerTemperature } from "@/lib/customer-temperature";
import { cn } from "@/lib/utils";

const BUCKET_STYLES = {
  hot: "bg-red-100 text-red-800 border-red-200",
  warm: "bg-amber-100 text-amber-800 border-amber-200",
  cold: "bg-blue-100 text-blue-800 border-blue-200",
};

const BUCKET_LABELS = {
  hot: "Hot",
  warm: "Warm",
  cold: "Cold",
};

export function TemperatureBadge({
  bucket,
  score,
  input,
  className,
  showScore = true,
  "data-testid": dataTestId,
}) {
  const computed = useMemo(() => {
    if (bucket) {
      return { bucket, score: typeof score === "number" ? Math.max(0, Math.min(1, score)) : undefined };
    }
    return calculateCustomerTemperature(input);
  }, [bucket, score, input]);

  const style = BUCKET_STYLES[computed.bucket] || BUCKET_STYLES.cold;
  const label = BUCKET_LABELS[computed.bucket] || BUCKET_LABELS.cold;
  const displayScore =
    typeof computed.score === "number" && !Number.isNaN(computed.score)
      ? `${Math.round(computed.score * 100)}%`
      : null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold",
        style,
        className,
      )}
      aria-label={`Customer temperature: ${label}`}
      data-testid={dataTestId ?? "temperature-badge"}
    >
      <span>{label}</span>
      {/* Score percentage display removed per user requirement */}
    </span>
  );
}

export default TemperatureBadge;
