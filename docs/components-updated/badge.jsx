import { cn } from "@/lib/utils";

/**
 * Badge Component - AdvisorHub Design System
 *
 * Semantic variants following color system guidelines:
 * - default: General purpose tags - Primary Blue
 * - secondary: Neutral tags - Gray
 * - success: Positive status (Client, Active) - Green
 * - warning: Caution status (Pending, Hot Lead) - Orange
 * - destructive: Negative status (Expired, Rejected) - Red
 * - info: Information status - Yellow
 * - outline: Removable filter tags - White with border
 *
 * Status-specific badges:
 * - statusNotInitiated: Lead not yet contacted - Gray
 * - statusContacted: Lead contacted - Blue
 * - statusProposal: Proposal stage - Yellow
 *
 * @see docs/COLOR_SYSTEM_GUIDELINES.md for complete usage guidelines
 */

function Badge({ className, variant = "default", ...props }) {
  const variants = {
    // Default - Primary brand color for general tags
    default: "bg-primary-100 text-primary-700",

    // Neutral/secondary
    secondary: "bg-slate-100 text-slate-700",

    // Semantic variants
    success: "bg-green-100 text-green-700",      // Client, Active, Approved
    warning: "bg-orange-100 text-orange-700",     // Hot Lead, Pending, Attention Needed
    destructive: "bg-red-100 text-red-700",       // Expired, Rejected, Overdue
    info: "bg-yellow-100 text-yellow-700",        // Information, Tips

    // Outline for removable filters
    outline: "border border-slate-200 bg-white text-slate-700",

    // Status-specific variants for lead workflow
    statusNotInitiated: "bg-slate-100 text-slate-700",
    statusContacted: "bg-blue-100 text-blue-700",
    statusProposal: "bg-yellow-100 text-yellow-700",

    // Convenience aliases
    client: "bg-green-100 text-green-700",
    hotLead: "bg-orange-100 text-orange-700",
    active: "bg-green-100 text-green-700",
    pending: "bg-orange-100 text-orange-700",
    expired: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={cn(
        // Base styles: semibold font for all badges per design system
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variants[variant] ?? variants.default,
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
