import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/admin/components/ui/card";
import { cn } from "@/lib/utils";

const baseTheme = {
  cardBorder: "border-slate-200",
  markerBorder: "border-l-slate-300",
  headerBg: "bg-slate-50",
  iconBg: "bg-slate-200",
  iconColor: "text-slate-600",
};

const stageThemes = {
  "fact-finding": {
    cardBorder: "border-indigo-200",
    markerBorder: "border-l-indigo-500",
    headerBg: "bg-gradient-to-r from-indigo-50 via-indigo-50/70 to-white",
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
  },
  "financial-planning": {
    cardBorder: "border-emerald-200",
    markerBorder: "border-l-emerald-500",
    headerBg: "bg-gradient-to-r from-emerald-50 via-emerald-50/70 to-white",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  recommendation: {
    cardBorder: "border-amber-200",
    markerBorder: "border-l-amber-500",
    headerBg: "bg-gradient-to-r from-amber-50 via-amber-50/70 to-white",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  quotation: {
    cardBorder: "border-sky-200",
    markerBorder: "border-l-sky-500",
    headerBg: "bg-gradient-to-r from-sky-50 via-sky-50/70 to-white",
    iconBg: "bg-sky-100",
    iconColor: "text-sky-600",
  },
  application: {
    cardBorder: "border-violet-200",
    markerBorder: "border-l-violet-500",
    headerBg: "bg-gradient-to-r from-violet-50 via-violet-50/70 to-white",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
  },
};

const resolveTheme = (stage) => ({
  ...baseTheme,
  ...(stageThemes[stage] ?? {}),
});

/**
 * SectionCard enforces a consistent shell for proposal forms.
 *
 * Example:
 * <SectionCard
 *   stage="fact-finding"
 *   icon={GraduationCap}
 *   title="Customer Knowledge & Experience"
 *   description="Optional helper copy"
 *   badge={<Badge>Outcome</Badge>}
 *   actions={<Button>Secondary action</Button>}
 * >
 *   {content}
 * </SectionCard>
 */
function SectionCard({
  stage = "neutral",
  icon: Icon,
  title,
  description,
  badge,
  actions,
  children,
  className,
  contentClassName,
  headerClassName,
}) {
  const theme = resolveTheme(stage);

  return (
    <Card
      className={cn(
        "border-l-4 shadow-lg",
        theme.cardBorder,
        theme.markerBorder,
        className,
      )}
    >
      <CardHeader
        className={cn(
          "flex flex-col gap-4 border-b md:flex-row md:items-center md:justify-between",
          theme.headerBg,
          headerClassName,
        )}
      >
        <div className="flex flex-1 items-start gap-3">
          {Icon ? (
            <span
              className={cn(
                "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full",
                theme.iconBg,
              )}
            >
              <Icon className={cn("h-5 w-5", theme.iconColor)} />
            </span>
          ) : null}
          <div className="space-y-1">
            <CardTitle className="text-xl font-semibold text-slate-900">
              {title}
            </CardTitle>
            {description ? (
              <p className="text-sm leading-relaxed text-slate-600">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {(badge || actions) && (
          <div className="flex flex-wrap items-center justify-end gap-3">
            {badge}
            {actions}
          </div>
        )}
      </CardHeader>
      <CardContent className={cn("space-y-6 p-6", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}

export { SectionCard };
