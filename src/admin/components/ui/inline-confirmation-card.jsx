export default function InlineConfirmationCard({ title, description, onAllowOnce, onDontAllow, onAlwaysAllow }) {
  return (
    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
      <div className="font-semibold">{title || "Permission required"}</div>
      {description && <div className="mt-1 text-amber-800">{description}</div>}
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={onAllowOnce}
          className="rounded border border-amber-300 bg-white px-2 py-1 text-xs font-semibold text-amber-900 shadow-sm hover:bg-amber-100"
        >
          Allow once
        </button>
        <button
          type="button"
          onClick={onAlwaysAllow}
          className="rounded border border-amber-300 bg-white px-2 py-1 text-xs font-semibold text-amber-900 shadow-sm hover:bg-amber-100"
        >
          Always allow (session)
        </button>
        <button
          type="button"
          onClick={onDontAllow}
          className="rounded border border-amber-300 bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-200"
        >
          Don’t allow
        </button>
      </div>
    </div>
  );
}

