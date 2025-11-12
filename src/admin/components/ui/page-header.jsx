import * as React from "react";
import { cn } from "@/lib/utils";

// Standard page header for consistent titles, subtitles and actions
// Usage:
// <PageHeader title="Customers" subtitle="Manage your pipeline" icon={Users} actions={<Button/>} />
export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  actions,
  className,
}) {
  return (
    <div className={cn("mb-6 flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center", className)}>
      <div className="flex items-start gap-3">
        {Icon ? (
          <div className="mt-1 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-primary-500 shadow-lg">
            <Icon className="h-6 w-6 text-white" />
          </div>
        ) : null}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
          {subtitle ? (
            <p className="mt-1 text-slate-600">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="w-full lg:w-auto">{actions}</div> : null}
    </div>
  );
}

export default PageHeader;

