import React from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/admin/components/ui/card";
import { Badge } from "@/admin/components/ui/badge";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  AlertCircle,
  Shield,
  Heart,
  TrendingUp,
  Headset,
  Users,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_LABEL_KEY = {
  policy: "milestones.policyMilestone",
  life_event: "milestones.lifeEvent",
  financial_goal: "milestones.financialGoal",
  service: "milestones.service",
  relationship: "milestones.relationship",
  general: "milestones.general",
};

const CATEGORY_ICON = {
  policy: Shield,
  life_event: Heart,
  financial_goal: TrendingUp,
  service: Headset,
  relationship: Users,
  general: Sparkles,
};

const STATUS_CONFIG = {
  completed: { label: "Completed", variant: "success", Icon: CheckCircle2 },
  in_progress: { label: "In Progress", variant: "warning", Icon: Clock3 },
  upcoming: { label: "Upcoming", variant: "secondary", Icon: CalendarClock },
  delayed: { label: "Delayed", variant: "destructive", Icon: AlertCircle },
};

function formatDate(value) {
  if (!value) return "Date not provided";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function MilestoneCard({ milestone = {}, onClick, active = false, className }) {
  const { t } = useTranslation();
  const {
    title,
    description,
    date,
    category = "general",
    status = "upcoming",
    icon: CustomIcon,
    celebrated,
    celebrationMethod,
  } = milestone;

  const CategoryIcon = CustomIcon || CATEGORY_ICON[category] || CATEGORY_ICON.general;
  const categoryLabel = t(CATEGORY_LABEL_KEY[category] ?? CATEGORY_LABEL_KEY.general, {
    defaultValue: (category && category.toString().replace(/_/g, " ")) || "General",
  });
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.upcoming;
  const StatusIcon = statusConfig.Icon ?? CalendarClock;
  const iconName =
    (CustomIcon && (CustomIcon.displayName || CustomIcon.name)) ||
    (CategoryIcon && (CategoryIcon.displayName || CategoryIcon.name)) ||
    undefined;

  const handleKeyDown = (event) => {
    if (!onClick) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick(event);
    }
  };

  return (
    <Card
      data-testid="milestone-card"
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "border border-slate-200 shadow-sm transition hover:shadow-md",
        onClick && "cursor-pointer",
        active && "ring-2 ring-primary-200 bg-primary-50/40",
        className,
      )}
    >
      <div className="flex gap-3 p-4">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-50 text-primary-700"
          data-testid="milestone-icon"
          data-icon-name={iconName?.toLowerCase()}
        >
          <CategoryIcon className="h-5 w-5" aria-hidden="true" data-icon-name={iconName?.toLowerCase()} />
        </div>

        <div className="flex-1 space-y-2 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <h3 className="text-base font-semibold text-slate-900 truncate" title={title}>
                {title || "Untitled milestone"}
              </h3>
              <p className="text-sm text-slate-600 line-clamp-2">
                {description || "No description provided"}
              </p>
            </div>
            <Badge variant={statusConfig.variant} data-testid="milestone-status" className="whitespace-nowrap">
              <span className="inline-flex items-center gap-1">
                <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {statusConfig.label}
              </span>
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <div className="inline-flex items-center gap-1">
              <CalendarClock className="h-4 w-4" aria-hidden="true" />
              <span data-testid="milestone-date">{formatDate(date)}</span>
            </div>

            <Badge variant="outline" data-testid="milestone-category">
              {categoryLabel}
            </Badge>

            {celebrated && (
              <Badge variant="success" data-testid="milestone-celebrated">
                {t("milestones.celebrated", { defaultValue: "Celebrated" })}
              </Badge>
            )}
          </div>

          {celebrationMethod && (
            <div className="text-xs text-slate-500" data-testid="milestone-celebration-method">
              {t("milestones.celebrationMethod", { defaultValue: "Celebration Method" })}: {celebrationMethod}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default MilestoneCard;
