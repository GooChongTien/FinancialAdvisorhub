import { Card } from "@/admin/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Baby,
  Calendar,
  FileText,
  HandCoins,
  HeartHandshake,
  Shield,
  Sparkles
} from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";

// Helper to normalize date
function normalizeDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  const timestamp = parsed.getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

// Helper to sort milestones
function sortMilestones(milestones = []) {
  return [...milestones]
    .map((milestone, index) => ({
      milestone,
      index,
      timestamp: normalizeDate(milestone?.date) ?? Number.POSITIVE_INFINITY,
    }))
    .sort((a, b) => {
      if (a.timestamp === b.timestamp) {
        return a.index - b.index;
      }
      return a.timestamp - b.timestamp;
    })
    .map((entry) => entry.milestone);
}

// Icon and Color mapping based on event type/title
const getEventStyle = (title = "", category = "") => {
  const lowerTitle = title.toLowerCase();
  const lowerCat = category.toLowerCase();

  if (lowerTitle.includes("first policy") || lowerTitle.includes("welcome")) {
    return { icon: Shield, color: "text-blue-600", bg: "bg-blue-100", border: "border-blue-200" };
  }
  if (lowerTitle.includes("new policy") || lowerTitle.includes("added")) {
    return { icon: FileText, color: "text-indigo-600", bg: "bg-indigo-100", border: "border-indigo-200" };
  }
  if (lowerTitle.includes("married") || lowerTitle.includes("marriage") || lowerCat === "life_event") {
    return { icon: HeartHandshake, color: "text-amber-600", bg: "bg-amber-100", border: "border-amber-200" };
  }
  if (lowerTitle.includes("baby") || lowerTitle.includes("born") || lowerTitle.includes("child")) {
    return { icon: Baby, color: "text-pink-600", bg: "bg-pink-100", border: "border-pink-200" };
  }
  if (lowerTitle.includes("claim") || lowerCat === "claims") {
    return { icon: HandCoins, color: "text-red-600", bg: "bg-red-100", border: "border-red-200" };
  }

  return { icon: Sparkles, color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200" };
};

export function OurJourneyTimeline({
  milestones = [],
  activeId,
  onSelect,
  emptyMessage,
  className,
}) {
  const { t } = useTranslation();
  const scrollContainerRef = useRef(null);
  const sortedMilestones = useMemo(() => sortMilestones(milestones), [milestones]);

  // Scroll to active item
  useEffect(() => {
    if (activeId && scrollContainerRef.current) {
      const activeElement = scrollContainerRef.current.querySelector(`[data-id="${activeId}"]`);
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [activeId]);

  // Generate Mira Insight
  const miraInsight = useMemo(() => {
    if (!sortedMilestones.length) return null;

    const firstDate = new Date(sortedMilestones[0].date);
    const now = new Date();
    const days = Math.floor((now - firstDate) / (1000 * 60 * 60 * 24));
    const years = (days / 365).toFixed(1);

    const events = sortedMilestones.map(m => m.title.toLowerCase());
    const hasMarriage = events.some(e => e.includes("married") || e.includes("marriage"));
    const hasBaby = events.some(e => e.includes("baby") || e.includes("born"));
    const hasClaim = events.some(e => e.includes("claim"));

    let insight = `You have been journeying with this customer for ${days} days (${years} years). `;
    insight += `You have witnessed key moments including ${hasMarriage ? "marriage, " : ""}${hasBaby ? "new family members, " : ""}${hasClaim ? "supporting them through claims, " : ""}and building their financial security. `;
    insight += "Remember to celebrate their upcoming milestones!";

    return insight;
  }, [sortedMilestones]);

  if (!sortedMilestones.length) {
    return (
      <Card className={cn("p-6 text-center text-slate-600", className)}>
        {emptyMessage || "No milestones yet."}
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="relative">
        {/* Horizontal Scroll Container */}
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto pb-8 pt-4 px-4 hide-scrollbar flex gap-8 snap-x snap-mandatory"
          style={{ scrollBehavior: 'smooth' }}
        >
          {/* Central Line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 z-0 min-w-full" />

          {sortedMilestones.map((milestone, index) => {
            const style = getEventStyle(milestone.title, milestone.category);
            const Icon = style.icon;
            const isTop = index % 2 === 0;
            const isActive = activeId === milestone.id;

            return (
              <div
                key={milestone.id}
                data-id={milestone.id}
                className="relative flex-shrink-0 w-64 snap-center group"
                onClick={() => onSelect?.(milestone)}
              >
                {/* Connector Line */}
                <div
                  className={cn(
                    "absolute left-1/2 w-0.5 bg-slate-200 -translate-x-1/2 z-0 transition-all duration-300",
                    isTop ? "bottom-1/2 h-8 group-hover:h-12" : "top-1/2 h-8 group-hover:h-12",
                    isActive && "bg-primary-300 h-12"
                  )}
                />

                {/* Icon Node */}
                <div
                  className={cn(
                    "absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10",
                    "w-10 h-10 rounded-full border-4 border-white shadow-sm flex items-center justify-center transition-all duration-300",
                    style.bg,
                    style.color,
                    isActive ? "scale-125 ring-4 ring-primary-100" : "group-hover:scale-110"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>

                {/* Content Card */}
                <div
                  className={cn(
                    "relative z-10 transition-all duration-300 transform",
                    isTop ? "-mt-32 mb-12" : "mt-12 -mb-32",
                    isActive ? "scale-105" : "group-hover:scale-105"
                  )}
                >
                  <Card
                    className={cn(
                      "p-3 cursor-pointer border-l-4 hover:shadow-lg transition-shadow",
                      style.border,
                      isActive ? "ring-2 ring-primary-200 shadow-lg" : "shadow-sm"
                    )}
                  >
                    <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(milestone.date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1 line-clamp-1" title={milestone.title}>
                      {milestone.title}
                    </h4>
                    {milestone.description && (
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {milestone.description}
                      </p>
                    )}
                  </Card>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mira Insight */}
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-xl p-4 border border-indigo-100 flex items-start gap-3">
        <div className="bg-white p-2 rounded-full shadow-sm">
          <Sparkles className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-indigo-900 mb-1">Mira Insight</h4>
          <p className="text-sm text-indigo-800 leading-relaxed">
            {miraInsight}
          </p>
        </div>
      </div>
    </div>
  );
}

export default OurJourneyTimeline;
