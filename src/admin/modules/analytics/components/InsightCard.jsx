import React from "react";
import { Button } from "@/admin/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";

export default function InsightCard({ icon: Icon, title, body, tone = "info", onUpvote, onDownvote, cta }) {
  const tones = {
    success: { ring: "ring-green-200", bg: "bg-green-50", icon: "text-green-600" },
    warning: { ring: "ring-yellow-200", bg: "bg-yellow-50", icon: "text-yellow-600" },
    danger: { ring: "ring-red-200", bg: "bg-red-50", icon: "text-red-600" },
    info: { ring: "ring-blue-200", bg: "bg-blue-50", icon: "text-blue-600" },
  }[tone] || { ring: "ring-slate-200", bg: "bg-slate-50", icon: "text-slate-600" };

  return (
    <div className={`flex items-start justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ${tones.ring}`}>
      <div className="flex items-start gap-3">
        {Icon ? <Icon className={`mt-0.5 h-5 w-5 ${tones.icon}`} /> : null}
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-700">{body}</p>
          {cta}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" aria-label="Insight helpful" onClick={onUpvote}>
          <ThumbsUp className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" aria-label="Insight not helpful" onClick={onDownvote}>
          <ThumbsDown className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

