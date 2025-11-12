import React from "react";

export function Progress({ value = 0, className = "", label, max = 100 }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className={`w-full ${className}`}>
      {label ? (
        <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
          <span>{label}</span>
          <span>{pct.toFixed(0)}%</span>
        </div>
      ) : null}
      <div className="h-2 w-full rounded bg-slate-200" role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={pct}>
        <div
          className="h-2 rounded bg-primary-600 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default Progress;

